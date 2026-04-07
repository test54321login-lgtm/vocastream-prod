const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const pdfParse = require('@mattjohnpowell/pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const protect = require('./middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('./middleware/validate');
const { authLimiter, ttsLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security headers
app.use(helmet());

// Request logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

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
  name: { type: String, trim: true, default: '' },
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
    const { email, password, name } = req.body;
    
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
      name: name ? name.trim() : '',
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
        name: user.name,
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
app.post('/api/content/tts-voice', protect, ttsLimiter, async (req, res) => {
  try {
    const { text, lang } = req.body;
    
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Sanitize input - remove potentially dangerous characters
    const sanitizedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    if (sanitizedText.length > 5000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 5000 characters' });
    }
    
    if (!process.env.KAGGLE_URL) {
      return res.status(500).json({ error: 'AI engine not configured' });
    }
    if (!process.env.INTERNAL_SECRET) {
      return res.status(500).json({ error: 'Internal server misconfiguration' });
    }
    
    // Prepare form data for Kaggle
    const formData = new URLSearchParams();
    formData.append('text', sanitizedText);
    formData.append('lang', lang || 'en');
    
    // Send request to Kaggle AI engine
    const response = await axios.post(process.env.KAGGLE_URL, formData, {
      responseType: 'arraybuffer',
      headers: { 
        'X-Internal-Key': process.env.INTERNAL_SECRET,
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

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- FILE EXTRACTION ENDPOINTS ---

// Extract text from PDF
app.post('/api/content/extract-pdf', protect, ttsLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
});

// Extract text from DOCX
app.post('/api/content/extract-docx', protect, ttsLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No DOCX file provided' });
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word.document.macroEnabled'
    ];
    
    if (!validTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File must be a DOCX' });
    }

    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    res.json({ text: result.value });
  } catch (error) {
    console.error('DOCX extraction error:', error.message);
    res.status(500).json({ error: 'Failed to extract text from DOCX' });
  }
});

// Proxy URL fetch to bypass CORS
app.post('/api/content/fetch-url', protect, ttsLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL to prevent SSRF
    let validatedUrl;
    try {
      validatedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow http and https
    if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
    }

    // SSRF protection: Check for private/localhost IPs
    const hostname = validatedUrl.hostname;
    const isPrivateIP = /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';
    
    if (isPrivateIP) {
      return res.status(400).json({ error: 'Access to private/localhost addresses is not allowed' });
    }

    const response = await axios.get(url, { 
      timeout: 30000,
      responseType: 'text',
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    res.json({ text: response.data });
  } catch (error) {
    console.error('URL fetch error:', error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out' });
    }
    if (error.code === 'ENOTFOUND') {
      return res.status(502).json({ error: 'DNS lookup failed: Host not found' });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(502).json({ error: 'Connection refused: Server is not accepting requests' });
    }
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'Connection timed out' });
    }
    if (error.code === 'ERR_NETWORK') {
      return res.status(502).json({ error: 'Network error: ' + error.message });
    }
    if (error.response) {
      return res.status(error.response.status).json({ error: 'Remote server returned ' + error.response.status + ': ' + error.response.statusText });
    }
    res.status(500).json({ error: 'Failed to fetch URL: ' + error.message });
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
const PORT = process.env.PORT || 7860;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
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
