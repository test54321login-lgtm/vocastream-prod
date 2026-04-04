# MongoDB Authentication Implementation Plan for VOCASTREAM

## Overview
This plan outlines the implementation of MongoDB-based authentication and database functionality for the VOCASTREAM text-to-speech platform.

## Current State Analysis
- **Frontend**: Static HTML files (sign-in.html, sign-up.html) with forms
- **Backend**: None (currently using live-server for static files)
- **Authentication**: No backend authentication implemented
- **Database**: No database integration

## Implementation Strategy

### Phase 1: Backend Infrastructure Setup

#### 1.1 Update package.json Dependencies
Add the following dependencies:
- `express` - Web framework for Node.js
- `mongoose` - MongoDB object modeling
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `cookie-parser` - Cookie parsing middleware

#### 1.2 Create Backend Server Structure
```
├── server.js              # Main Express server
├── config/
│   └── db.js             # MongoDB connection configuration
├── models/
│   └── User.js           # User model schema
├── routes/
│   └── auth.js           # Authentication routes
├── middleware/
│   └── auth.js           # JWT verification middleware
└── .env                  # Environment variables (gitignored)
```

### Phase 2: Database Implementation

#### 2.1 MongoDB Connection Configuration
- Create connection string configuration
- Implement connection error handling
- Add connection retry logic

#### 2.2 User Model Schema
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Phase 3: Authentication API

#### 3.1 Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user (protected)

#### 3.2 JWT Token Strategy
- Generate JWT on successful login/registration
- Store token in HTTP-only cookie for security
- Verify token on protected routes
- Token expiration: 24 hours

### Phase 4: Frontend Integration

#### 4.1 Update HTML Forms
- Modify sign-up.html form to submit to `/api/auth/register`
- Modify sign-in.html form to submit to `/api/auth/login`
- Add error/success message display
- Add loading states during API calls

#### 4.2 Client-Side Authentication
- Add authentication check on page load
- Redirect unauthenticated users from studio.html to sign-in
- Store user info in localStorage for UI display
- Add logout functionality

### Phase 5: Security Implementation

#### 5.1 Password Security
- Hash passwords using bcrypt (salt rounds: 10)
- Validate password strength (min 8 characters)
- Never store plain text passwords

#### 5.2 API Security
- Enable CORS with specific origins
- Use HTTP-only cookies for JWT storage
- Implement rate limiting (optional)
- Validate and sanitize all inputs

#### 5.3 Environment Variables
Create `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/vocastream
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

## File Changes Required

### New Files to Create
1. `server.js` - Main Express server
2. `config/db.js` - MongoDB connection
3. `models/User.js` - User model
4. `routes/auth.js` - Authentication routes
5. `middleware/auth.js` - JWT middleware
6. `.env` - Environment variables
7. `.gitignore` - Git ignore file

### Files to Modify
1. `package.json` - Add dependencies and scripts
2. `sign-up.html` - Update form submission
3. `sign-in.html` - Update form submission
4. `app.js` - Add authentication checks
5. `studio.html` - Add authentication guard

## Implementation Order
1. Update package.json with dependencies
2. Create backend server structure
3. Implement MongoDB connection
4. Create User model
5. Implement authentication routes
6. Update frontend forms
7. Add client-side authentication logic
8. Test all functionality
9. Fix any issues

## Testing Checklist
- [ ] User can register with valid credentials
- [ ] User cannot register with existing email
- [ ] User can login with valid credentials
- [ ] User cannot login with invalid credentials
- [ ] Password is properly hashed in database
- [ ] JWT token is generated and stored
- [ ] Protected routes require authentication
- [ ] Logout clears authentication
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## Dependencies to Install
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "cookie-parser": "^1.4.6"
  }
}
```

## Notes
- MongoDB must be installed and running locally, or use MongoDB Atlas
- JWT secret should be strong and unique in production
- All passwords are hashed before storage
- HTTP-only cookies prevent XSS attacks
- CORS configured for local development
