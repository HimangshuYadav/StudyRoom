const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Creates a new user profile, hashes their password, registers them in MongoDB,
 * and issues a JWT token.
 *
 * @function signup
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.name - The plain name of the user.
 * @param {string} req.body.email - User email address.
 * @param {string} req.body.password - Desired plain password.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with JSON containing token and user object, or an error status code.
 *
 * Implementation Steps:
 * 1. Extract name, email, and password from req.body. Return 400 if any are missing.
 * 2. Check if a User already exists with the given email. If so, return 400 error.
 * 3. Generate salt and hash the password using bcrypt.hash.
 * 4. Create and save a new User document in MongoDB.
 * 5. Generate a JWT token signed with the new user's ID, email, and process.env.JWT_SECRET.
 * 6. Send response with status 201 containing { token, user: { id, name, email } }.
 */
async function signup(req, res) {
  // TODO: implement validate fields, check exists, bcrypt hash, create doc, generate JWT, return response
  return res.status(201).json({ token: 'mock-signup-jwt-token', user: { name: req.body.name || 'Mock User' } });
}

/**
 * Validates user credentials against the database and returns a signed JWT if credentials are correct.
 *
 * @function login
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload sent by client.
 * @param {string} req.body.email - The user's registered email address.
 * @param {string} req.body.password - The user's plain-text password.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with JSON containing JWT and user profile, or a 401 Unauthorized error.
 *
 * Implementation Steps:
 * 1. Extract email and password from req.body. Return 400 if missing.
 * 2. Find the User by email in MongoDB. If not found, return 401/404 error.
 * 3. Compare the request password with the hashed password in the DB using bcrypt.compare or schema method.
 * 4. If mismatched, return 401 Unauthorized.
 * 5. If matched, sign a JWT using the user's details and process.env.JWT_SECRET.
 * 6. Return a response containing { token, user: { id, name, email } }.
 */
async function login(req, res) {
  // TODO: implement find user, bcrypt compare, generate JWT, return response
  return res.json({ token: 'mock-login-jwt-token', user: { email: req.body.email || 'mock@example.com' } });
}

module.exports = {
  signup,
  login
};
