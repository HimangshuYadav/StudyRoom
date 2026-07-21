const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route mapping for User Signup
// POST /api/auth/signup -> Calls signup controller to register user
router.post('/signup', authController.signup);

// Route mapping for User Login
// POST /api/auth/login -> Calls login controller to authenticate user
router.post('/login', authController.login);

module.exports = router;
