/**
 * Input Validation Middleware
 * Validates email and password for authentication endpoints
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const complexityCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  return complexityCount >= 3;
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
      error: 'Password must be at least 8 characters with 3 of: uppercase, lowercase, number, special character',
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
