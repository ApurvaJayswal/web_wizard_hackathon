const { v4: uuidv4 } = require('uuid');

/**
 * Session middleware for guest users
 * Creates or retrieves session ID for cart management
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sessionMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (req.user) {
      // Authenticated user doesn't need session ID
      req.sessionId = null;
      return next();
    }

    // Check for existing session ID in cookie
    let sessionId = req.cookies.sessionId;

    // If no session ID exists, create a new one
    if (!sessionId) {
      sessionId = uuidv4();
      
      // Set session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
    }

    // Attach session ID to request
    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    req.sessionId = uuidv4(); // Fallback to new session ID
    next();
  }
};

/**
 * Clear session cookie
 * @param {Object} res - Express response object
 */
const clearSessionCookie = (res) => {
  res.cookie('sessionId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/'
  });
};

module.exports = {
  sessionMiddleware,
  clearSessionCookie
};