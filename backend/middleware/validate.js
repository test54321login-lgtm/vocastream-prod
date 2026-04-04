/**
 * Input Validation Middleware
 * Validates email and password for authentication endpoints
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && typeof password === 'string' && password.length >= 6;
};

/**
 * Validate registration input
 * Checks for valid email and password length
 */
const validateRegistration = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: 'Valid email is required',
      field: 'email'
    });
  }
  
  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters long',
      field: 'password'
    });
  }
  
  // Sanitize email
  req.body.email = email.trim().toLowerCase();
  
  next();
};

/**
 * Validate login input
 * Checks for email and password presence
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required'
    });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ 
      error: 'Valid email is required',
      field: 'email'
    });
  }
  
  // Sanitize email
  req.body.email = email.trim().toLowerCase();
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePassword
};
