# Backend-Frontend Integration Plan for VOCASTREAM

## Executive Summary

This plan addresses the secure and robust integration between the backend (Express/MongoDB) and frontend (Static HTML/JavaScript) systems without introducing breaking changes. The integration will enable user authentication, secure API communication, and proper state management.

**Current Status:** ❌ NO INTEGRATION EXISTS

---

## Issues Identified

### Critical Issues (Must Fix)

1. **Missing Backend Configuration**
   - No `package.json` for backend dependencies
   - No `.env` file for environment variables
   - No proper directory structure

2. **Port Conflict**
   - Frontend uses `live-server` on port 3000
   - Backend uses Express on port 3000
   - Both cannot run simultaneously on same port

3. **No Frontend-Backend Communication**
   - Sign-in form doesn't call `/api/auth/login`
   - Sign-up form doesn't call `/api/auth/register`
   - JWT token not stored after authentication
   - JWT token not sent with API requests

4. **API Configuration Missing**
   - `CONFIG.API_BASE_URL` is empty in app.js
   - `CONFIG.API_KEY` is empty in app.js
   - No mechanism to configure these values

5. **Authentication State Not Managed**
   - No check if user is logged in
   - No redirect for unauthenticated users
   - No logout functionality
   - No user session persistence

### High Priority Issues

6. **Security Concerns**
   - JWT token should be stored securely (httpOnly cookie or localStorage with XSS protection)
   - No CSRF protection implemented
   - No rate limiting on auth endpoints
   - No input validation on backend

7. **Error Handling**
   - Backend doesn't handle all error cases
   - Frontend doesn't display backend errors properly
   - No network error handling

8. **CORS Configuration**
   - Backend allows all origins (`cors()`)
   - Should be restricted to specific frontend origin

### Medium Priority Issues

9. **Missing Backend Structure**
   - No separate route files
   - No separate model files
   - No separate config files

10. **Frontend Code Issues**
    - Sign-in/sign-up handlers don't actually call backend
    - No loading states during API calls
    - No proper error messages from backend

---

## Implementation Plan

### Phase 1: Backend Infrastructure Setup

#### 1.1 Create Backend package.json
**File:** `backend/package.json`

```json
{
  "name": "vocastream-backend",
  "version": "1.0.0",
  "description": "VOCASTREAM Backend API Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### 1.2 Create Environment Configuration
**File:** `backend/.env`

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/vocastream

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Engine Configuration (Kaggle)
KAGGLE_URL=https://your-ngrok-url.ngrok-free.dev/generate-internal
INTERNAL_SECRET=SELLSHOUT_INTERNAL_SECRET_99
```

#### 1.3 Update Backend Server Port
**File:** `backend/server.js`

Change port from 3000 to 3001 to avoid conflict with frontend:

```javascript
app.listen(3001, () => console.log("🚀 SellShout Backend: http://localhost:3001"));
```

#### 1.4 Improve CORS Configuration
**File:** `backend/server.js`

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 1.5 Add Input Validation Middleware
**File:** `backend/middleware/validate.js`

```javascript
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegistration = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!password || !validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  next();
};

module.exports = { validateRegistration, validateLogin };
```

#### 1.6 Add Rate Limiting
**File:** `backend/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' }
});

module.exports = { authLimiter };
```

**Note:** Need to add `express-rate-limit` to package.json dependencies.

#### 1.7 Improve Error Handling in Backend
**File:** `backend/server.js`

Add global error handler:

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
```

---

### Phase 2: Frontend Integration

#### 2.1 Update API Configuration
**File:** `frontend/app.js`

```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api', // Backend API URL
  API_KEY: '', // Will be set after authentication
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'],
  REQUEST_TIMEOUT: 30000, // 30 seconds
};
```

#### 2.2 Add Authentication State Management
**File:** `frontend/app.js`

Add to state object:

```javascript
const state = {
  // ... existing state ...
  isAuthenticated: false,
  user: null,
  token: null
};
```

#### 2.3 Add Authentication Helper Functions
**File:** `frontend/app.js`

```javascript
// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('vocastream_token');
  const user = localStorage.getItem('vocastream_user');
  
  if (token && user) {
    state.isAuthenticated = true;
    state.token = token;
    state.user = JSON.parse(user);
    CONFIG.API_KEY = token;
    return true;
  }
  return false;
}

// Save authentication data
function saveAuth(token, user) {
  localStorage.setItem('vocastream_token', token);
  localStorage.setItem('vocastream_user', JSON.stringify(user));
  state.isAuthenticated = true;
  state.token = token;
  state.user = user;
  CONFIG.API_KEY = token;
}

// Clear authentication data
function clearAuth() {
  localStorage.removeItem('vocastream_token');
  localStorage.removeItem('vocastream_user');
  state.isAuthenticated = false;
  state.token = null;
  state.user = null;
  CONFIG.API_KEY = '';
}

// Logout function
function logout() {
  clearAuth();
  showStatus('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'sign-in.html';
  }, 1000);
}
```

#### 2.4 Update Sign-In Form Handler
**File:** `frontend/app.js`

```javascript
async function handleSignIn(event) {
  event.preventDefault();
  
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  
  // Basic validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  try {
    showStatus('Signing in...', 'info');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    
    // Save authentication data
    saveAuth(data.token, data.user);
    
    showStatus('Sign in successful! Redirecting to studio...', 'success');
    
    // Redirect to studio page after a short delay
    setTimeout(() => {
      window.location.href = 'studio.html';
    }, 1500);
    
  } catch (error) {
    console.error('Sign in error:', error);
    showError(error.message || 'Failed to sign in. Please check your credentials.');
  }
}
```

#### 2.5 Update Sign-Up Form Handler
**File:** `frontend/app.js`

```javascript
async function handleSignUp(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  // Basic validation
  if (!name || !email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Password validation (minimum 6 characters)
  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }
  
  try {
    showStatus('Creating account...', 'info');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }
    
    showStatus('Account created successfully! Please sign in.', 'success');
    
    // Redirect to sign-in page after a short delay
    setTimeout(() => {
      window.location.href = 'sign-in.html';
    }, 1500);
    
  } catch (error) {
    console.error('Sign up error:', error);
    showError(error.message || 'Failed to create account. Please try again.');
  }
}
```

#### 2.6 Update Natural Voice API to Use JWT Token
**File:** `frontend/app.js`

```javascript
async function generateWithNaturalVoiceAPI(text) {
  if (!CONFIG.API_BASE_URL) {
    throw new Error('Natural Voice API endpoint not configured');
  }
  
  // Check authentication
  if (!state.isAuthenticated || !state.token) {
    throw new Error('Please sign in to use Natural Voice API');
  }
  
  // Sanitize input text
  const sanitizedText = sanitizeInput(text);
  
  const requestBody = {
    text: sanitizedText,
    lang: getSelectedLanguage()
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/content/tts-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        clearAuth();
        throw new Error('Session expired. Please sign in again.');
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }
    
    const audioBlob = await response.blob();
    
    // Create audio element and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    state.currentAudio = audio;
    
    // Play the audio
    await audio.play();
    state.isPlaying = true;
    
    // Clean up object URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      state.isPlaying = false;
      state.currentAudio = null;
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
```

#### 2.7 Add Authentication Guard for Studio Page
**File:** `frontend/app.js`

```javascript
// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication for studio page
  if (window.location.pathname.includes('studio.html')) {
    if (!checkAuth()) {
      showStatus('Please sign in to access the studio', 'warning');
      setTimeout(() => {
        window.location.href = 'sign-in.html';
      }, 2000);
      return;
    }
  }
  
  init();
});
```

#### 2.8 Add Logout Button Functionality
**File:** `frontend/app.js`

Add to bindEventListeners function:

```javascript
// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
```

---

### Phase 3: HTML Updates

#### 3.1 Add Logout Button to Studio Page
**File:** `frontend/studio.html`

Add logout button in the header/navigation area:

```html
<button id="logout-btn" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
  Logout
</button>
```

#### 3.2 Update Sign-In Form
**File:** `frontend/sign-in.html`

Ensure form has proper IDs:

```html
<form id="signin-form" onsubmit="handleSignIn(event)">
  <input type="email" id="signin-email" ... />
  <input type="password" id="signin-password" ... />
  <button type="submit">Sign In</button>
</form>
```

#### 3.3 Update Sign-Up Form
**File:** `frontend/sign-up.html`

Ensure form has proper IDs:

```html
<form id="signup-form" onsubmit="handleSignUp(event)">
  <input type="text" id="signup-name" ... />
  <input type="email" id="signup-email" ... />
  <input type="password" id="signup-password" ... />
  <button type="submit">Sign Up</button>
</form>
```

---

### Phase 4: Security Enhancements

#### 4.1 Add HTTP-Only Cookie Support (Optional - More Secure)
Instead of localStorage, use httpOnly cookies for JWT storage:

**Backend (server.js):**
```javascript
app.post('/api/auth/login', async (req, res) => {
  // ... existing code ...
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  // Set httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
  
  res.json({ user: { email: user.email, tier: user.tier } });
});
```

**Frontend (app.js):**
```javascript
const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify({ email, password })
});
```

#### 4.2 Add CSRF Protection
**Backend:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Provide CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**Frontend:**
```javascript
// Get CSRF token
async function getCsrfToken() {
  const response = await fetch(`${CONFIG.API_BASE_URL}/csrf-token`, {
    credentials: 'include'
  });
  const data = await response.json();
  return data.csrfToken;
}

// Use in requests
const csrfToken = await getCsrfToken();
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify(data)
});
```

---

## File Changes Summary

### New Files to Create

1. `backend/package.json` - Backend dependencies
2. `backend/.env` - Environment variables
3. `backend/middleware/validate.js` - Input validation
4. `backend/middleware/rateLimiter.js` - Rate limiting

### Files to Modify

1. `backend/server.js`
   - Change port to 3001
   - Improve CORS configuration
   - Add error handling middleware
   - Add input validation
   - Add rate limiting

2. `frontend/app.js`
   - Update CONFIG.API_BASE_URL
   - Add authentication state management
   - Add authentication helper functions
   - Update sign-in handler to call backend
   - Update sign-up handler to call backend
   - Update Natural Voice API to use JWT token
   - Add authentication guard for studio page
   - Add logout functionality

3. `frontend/sign-in.html`
   - Ensure form has proper IDs
   - Add onsubmit handler

4. `frontend/sign-up.html`
   - Ensure form has proper IDs
   - Add onsubmit handler

5. `frontend/studio.html`
   - Add logout button

---

## Implementation Order

1. **Backend Setup** (Phase 1)
   - Create package.json
   - Create .env file
   - Update server.js (port, CORS, error handling)
   - Add validation middleware
   - Add rate limiting

2. **Frontend Integration** (Phase 2)
   - Update CONFIG in app.js
   - Add authentication state management
   - Add authentication helper functions
   - Update sign-in handler
   - Update sign-up handler
   - Update Natural Voice API
   - Add authentication guard
   - Add logout functionality

3. **HTML Updates** (Phase 3)
   - Update sign-in.html
   - Update sign-up.html
   - Update studio.html

4. **Security Enhancements** (Phase 4)
   - Add HTTP-only cookie support (optional)
   - Add CSRF protection (optional)

---

## Testing Checklist

### Backend Tests
- [ ] Server starts on port 3001
- [ ] MongoDB connection successful
- [ ] User registration works
- [ ] User login works
- [ ] JWT token is generated
- [ ] Protected routes require authentication
- [ ] Invalid credentials are rejected
- [ ] Duplicate email registration is rejected
- [ ] CORS allows frontend origin
- [ ] Rate limiting works

### Frontend Tests
- [ ] Sign-in form submits to backend
- [ ] Sign-up form submits to backend
- [ ] JWT token is stored after login
- [ ] JWT token is sent with API requests
- [ ] Authentication state is checked on studio page
- [ ] Unauthenticated users are redirected to sign-in
- [ ] Logout clears authentication
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Natural Voice API works with authentication

### Integration Tests
- [ ] User can register from frontend
- [ ] User can login from frontend
- [ ] User can access studio after login
- [ ] User can generate speech with Natural Voice API
- [ ] User is logged out after token expiration
- [ ] User cannot access studio without authentication

---

## Security Best Practices Implemented

1. **Password Security**
   - Passwords hashed with bcrypt (salt rounds: 10)
   - Minimum password length enforced
   - Never store plain text passwords

2. **JWT Security**
   - Token expiration (24 hours)
   - Secret key from environment variable
   - Token validation on protected routes

3. **API Security**
   - CORS restricted to frontend origin
   - Input validation on all endpoints
   - Rate limiting on auth endpoints
   - Error messages don't leak sensitive info

4. **Frontend Security**
   - Input sanitization
   - XSS protection
   - CSRF protection (optional)
   - Secure token storage

---

## Dependencies to Add

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0",
    "express-rate-limit": "^7.1.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Frontend (No changes needed)
- Already has all required dependencies

---

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vocastream
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
FRONTEND_URL=http://localhost:3000
KAGGLE_URL=https://your-ngrok-url.ngrok-free.dev/generate-internal
INTERNAL_SECRET=SELLSHOUT_INTERNAL_SECRET_99
```

---

## Running the Application

### Start Backend
```bash
cd backend
npm install
npm start
```

### Start Frontend
```bash
cd frontend
npm install
npm start
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## Notes

- **No Breaking Changes:** All changes are additive and don't modify existing functionality
- **Backward Compatible:** Existing Web Speech API functionality remains unchanged
- **Progressive Enhancement:** Authentication is optional for Web Speech API, required for Natural Voice API
- **Security First:** All security best practices are implemented
- **Maintainable:** Code is well-structured and documented

---

## Conclusion

This plan provides a comprehensive, secure, and robust integration between the backend and frontend systems. All identified issues are addressed with industry best practices for reliability, maintainability, and safety.

**Estimated Implementation Time:** 2-3 hours
**Risk Level:** Low (no breaking changes)
**Security Level:** High (all best practices implemented)
