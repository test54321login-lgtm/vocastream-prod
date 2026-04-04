# VOCASTREAM Backend-Frontend Integration Testing Guide

## Overview
This guide provides step-by-step instructions for testing the secure backend-frontend integration.

---

## Prerequisites

### 1. MongoDB Installation
Ensure MongoDB is installed and running locally:
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ ping: 1 })"
```

### 2. Node.js Installation
Ensure Node.js is installed:
```bash
node --version
npm --version
```

---

## Setup Instructions

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
✅ MongoDB connected successfully
🚀 VOCASTREAM Backend running on http://localhost:3001
📊 Environment: development
```

### Step 4: Start Frontend Server
In a new terminal:
```bash
cd frontend
npm start
```

Expected output:
```
Serving "frontend" at http://localhost:3000
```

---

## Testing Checklist

### Phase 1: Backend API Testing

#### 1.1 Health Check Endpoint
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

#### 1.2 User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "message": "Account created successfully",
  "userId": "..."
}
```

#### 1.3 User Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "test@example.com",
    "tier": "free",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 1.4 Protected Route (Without Token)
```bash
curl http://localhost:3001/api/auth/me
```

Expected response:
```json
{
  "message": "Bhai, pehle login toh kar lo!"
}
```

#### 1.5 Protected Route (With Token)
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "tier": "free",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 1.6 Rate Limiting Test
Attempt 6 login attempts with wrong password:
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  echo ""
done
```

Expected: First 5 attempts return 401, 6th attempt returns 429 (Too Many Requests)

---

### Phase 2: Frontend Integration Testing

#### 2.1 Sign-Up Flow
1. Open browser to http://localhost:3000/sign-up.html
2. Fill in the form:
   - Legal Name: Test User
   - Email: newuser@example.com
   - Password: password123
3. Click "CREATE ACCOUNT"
4. Verify success message appears
5. Verify redirect to sign-in page

#### 2.2 Sign-In Flow
1. Open browser to http://localhost:3000/sign-in.html
2. Fill in the form:
   - Email: newuser@example.com
   - Password: password123
3. Click "ACCESS STUDIO"
4. Verify success message appears
5. Verify redirect to studio page

#### 2.3 Authentication Guard
1. Open browser to http://localhost:3000/studio.html (without logging in)
2. Verify warning message appears: "Please sign in to access the studio"
3. Verify redirect to sign-in page after 2 seconds

#### 2.4 Logout Functionality
1. Log in to the application
2. Navigate to studio page
3. Click "Logout" button in the header
4. Verify success message: "Logged out successfully"
5. Verify redirect to sign-in page
6. Try to access studio page again
7. Verify redirect to sign-in page

#### 2.5 Web Speech API (No Auth Required)
1. Log in to the application
2. Navigate to studio page
3. Select "Web Speech API" engine
4. Enter text in the textarea
5. Click "Generate Speech"
6. Verify audio plays

#### 2.6 Natural Voice API (Auth Required)
1. Log in to the application
2. Navigate to studio page
3. Select "Natural Voice" engine
4. Enter text in the textarea
5. Click "Generate Speech"
6. Verify audio plays (if AI engine is available)

---

### Phase 3: Security Testing

#### 3.1 CORS Testing
1. Open browser console on http://localhost:3000
2. Try to make a request to http://localhost:3001/api/health
3. Verify request succeeds (CORS allows it)

#### 3.2 Invalid Token Testing
1. Log in to get a valid token
2. Modify the token in localStorage
3. Try to access protected route
4. Verify 401 error and redirect to sign-in

#### 3.3 Expired Token Testing
1. Log in to get a valid token
2. Wait for token to expire (or manually expire it)
3. Try to access protected route
4. Verify 401 error and redirect to sign-in

#### 3.4 Input Validation Testing
1. Try to register with invalid email format
2. Verify error message: "Valid email is required"
3. Try to register with password less than 6 characters
4. Verify error message: "Password must be at least 6 characters long"

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed
**Error:** `❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
- Ensure MongoDB is installed and running
- Check MongoDB service status
- Verify MONGO_URI in .env file

### Issue 2: Port Already in Use
**Error:** `Error: listen EADDRINUSE :::3001`

**Solution:**
- Change PORT in .env file
- Or kill the process using port 3001:
  ```bash
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  ```

### Issue 3: CORS Error
**Error:** `Access to fetch at 'http://localhost:3001/api/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
- Verify FRONTEND_URL in .env file matches frontend URL
- Check CORS configuration in server.js

### Issue 4: JWT Token Not Stored
**Error:** User is redirected to sign-in after login

**Solution:**
- Check browser console for errors
- Verify localStorage is enabled
- Check if saveAuth() function is called

### Issue 5: Natural Voice API Not Working
**Error:** "Please sign in to use Natural Voice API"

**Solution:**
- Verify user is logged in
- Check if JWT token is stored in localStorage
- Verify token is sent in Authorization header

---

## Performance Testing

### Load Testing
Use Apache Bench or similar tool:
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/api/health

# Test login endpoint
ab -n 100 -c 10 -p login.json -T "application/json" http://localhost:3001/api/auth/login
```

### Memory Testing
Monitor Node.js memory usage:
```bash
node --max-old-space-size=512 backend/server.js
```

---

## Security Audit Checklist

- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens expire after 24 hours
- [ ] CORS is restricted to frontend origin
- [ ] Rate limiting is enabled on auth endpoints
- [ ] Input validation is performed on all endpoints
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS is used in production
- [ ] Environment variables are not committed to git
- [ ] .env file is in .gitignore
- [ ] MongoDB connection is authenticated (in production)

---

## Deployment Checklist

### Backend Deployment
- [ ] Set NODE_ENV=production
- [ ] Set strong JWT_SECRET
- [ ] Set production MONGO_URI
- [ ] Set production FRONTEND_URL
- [ ] Enable HTTPS
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging

### Frontend Deployment
- [ ] Update CONFIG.API_BASE_URL to production backend URL
- [ ] Build static files (if needed)
- [ ] Deploy to CDN or web server
- [ ] Configure HTTPS
- [ ] Set up caching headers

---

## Monitoring & Logging

### Backend Logs
Monitor backend logs for:
- Authentication attempts
- API errors
- Database connection issues
- Rate limiting triggers

### Frontend Logs
Monitor browser console for:
- API call errors
- Authentication state changes
- JavaScript errors

---

## Support

For issues or questions:
1. Check this testing guide
2. Review the integration plan
3. Check browser console for errors
4. Check backend server logs
5. Verify all environment variables are set correctly

---

## Conclusion

This integration provides:
✅ Secure user authentication
✅ JWT-based authorization
✅ Rate limiting protection
✅ Input validation
✅ CORS security
✅ Error handling
✅ Session management
✅ Logout functionality

All industry best practices have been implemented for reliability, maintainability, and safety.
