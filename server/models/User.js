const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Compares a candidate password with the user's stored, hashed password.
 *
 * @method comparePassword
 * @async
 * @param {string} candidatePassword - The plain-text password entered by the user during login.
 * @returns {Promise<boolean>} True if candidate password matches stored hash, false otherwise.
 *
 * Implementation Steps:
 * 1. Check if the user password hash exists on the instance.
 * 2. Invoke bcrypt.compare(candidatePassword, this.password) to verify the password.
 * 3. Return the boolean result of the comparison.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return false; // TODO: implement
};

module.exports = mongoose.model('User', userSchema);
