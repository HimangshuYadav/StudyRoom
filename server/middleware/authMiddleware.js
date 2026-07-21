const jwt = require('jsonwebtoken');

/**
 * Express middleware to verify the JWT authorization token.
 * Validates the token and attaches the decoded payload to the request object.
 *
 * @function verifyToken
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check for Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized. No token provided.'
    });
  }

  // Extract token
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to request
    req.user = decoded;

    // Continue to next middleware
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired token.'
    });
  }
}

module.exports = {
  verifyToken
};