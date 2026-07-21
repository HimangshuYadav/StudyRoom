const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database using the URI specified in environment variables.
 * Logs success or failure message and exits the process on failure.
 *
 * @function connectDB
 * @async
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined.');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;