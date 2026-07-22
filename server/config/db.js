const mongoose = require('mongoose');

/**
 * Connects to the MongoDB database.
 * Uses process.env.MONGO_URI or defaults to local MongoDB instance.
 *
 * @function connectDB
 * @async
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyroom';

    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI environment variable is not defined. Defaulting to local: mongodb://127.0.0.1:27017/studyroom');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;