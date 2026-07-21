const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the URI specified in environment variables.
 * Logs success or failure message and exits the process on failure.
 *
 * @function connectDB
 * @async
 * @param {void} - No parameters.
 * @returns {Promise<void>} - Resolves when the connection is established, or terminates process on failure.
 *
 * Implementation Steps:
 * 1. Retrieve the MongoDB URI from the process.env.MONGO_URI environment variable.
 * 2. Call mongoose.connect(mongoUri) to initiate connection.
 * 3. Listen for connection success, logging a confirmation message to console.
 * 4. Catch database connection failure, log the error, and terminate the server process using process.exit(1).
 */
async function connectDB() {
  // TODO: implement database connection with mongoose.connect(process.env.MONGO_URI)
}

module.exports = connectDB;
