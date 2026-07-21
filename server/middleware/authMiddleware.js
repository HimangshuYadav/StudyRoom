const jwt = require('jsonwebtoken');

/**
 * Express middleware to verify the JWT authorization token.
 * Validates the token and attaches the decoded payload to the request object.
 *
 * @function verifyToken
 * @param {Object} req - Express request object.
 * @param {Object} req.headers - Headers of the incoming request.
 * @param {string} [req.headers.authorization] - The Authorization header, expected to be in "Bearer <token>" format.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void} Calls next() on success, or sends a 401 response on failure.
 *
 * Implementation Steps:
 * 1. Read the authorization header from req.headers.authorization.
 * 2. If missing or doesn't start with "Bearer ", return a 401 Unauthorized JSON response.
 * 3. Extract the token string.
 * 4. Call jwt.verify using the token and process.env.JWT_SECRET.
 * 5. If verification succeeds, assign the decoded payload (e.g. { id, email }) to req.user.
 * 6. Invoke next() to pass control to the subsequent route handler.
 * 7. If verification fails, return a 401 Unauthorized JSON response.
 */
function verifyToken(req, res, next) {
  // TODO: implement token extraction, jwt.verify, and attaching decodings to req.user
  next();
}

module.exports = {
  verifyToken
};
