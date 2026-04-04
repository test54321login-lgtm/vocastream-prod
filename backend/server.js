const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const protect = require('./middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('./middleware/validate');
const { authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration - Restrict to frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 1. DATABASE SCHEMA ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  tier: { type: String, default: 'free' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

// --- 2. AUTHENTICATION LOGIC ---

// User Registration
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await User.create({ 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });
    
    res.status(201).json({ 
      message: 'Account created successfully',
      userId: user._id 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// User Login
app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ 
      token,
      user: { 
        email: user.email, 
        tier: user.tier,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// --- 3. AI VOICE GENERATION (The Core) ---
app.post('/api/content/tts-voice', protect, async (req, res) => {
  try {
    const { text, lang } = req.body;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 5000 characters' });
    }
    
    const KAGGLE_URL = process.env.KAGGLE_URL || "https://your-ngrok-url.ngrok-free.dev/generate-internal";
    const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "SELLSHOUT_INTERNAL_SECRET_99";
    
    // Prepare form data for Kaggle
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('lang', lang || 'en');
    
    // Send request to Kaggle AI engine
    const response = await axios.post(KAGGLE_URL, formData, {
      responseType: 'arraybuffer',
      headers: { 
        'X-Internal-Key': INTERNAL_SECRET,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000 // 30 second timeout
    });
    
    // Send audio response to frontend
    res.set('Content-Type', 'audio/wav');
    res.send(response.data);
  } catch (error) {
    console.error("AI Error:", error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: "AI engine request timed out" });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: "AI engine returned an error" 
      });
    }
    
    res.status(500).json({ error: "AI engine is currently unavailable" });
  }
});

// --- 4. HEALTH CHECK ENDPOINT ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- 5. ERROR HANDLING MIDDLEWARE ---

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- STATIC FILE SERVING (Optional - for same-origin deployment) ---
// Only serve static files if SERVE_FRONTEND=true (not needed for Vercel + Railway)
if (process.env.SERVE_FRONTEND === 'true') {
  console.log('📦 Serving frontend from backend (same-origin mode)');
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
} else {
  console.log('🎯 API-only mode (for Vercel + Railway/Render deployment)');
}

// --- 6. DATABASE CONNECTION & SERVER START ---
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 VOCASTREAM Production: http://localhost:${PORT}`);
      } else {
        console.log(`🚀 VOCASTREAM Dev Backend: http://localhost:${PORT}`);
      }
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
