import mongoose from 'mongoose'

/**
 * Connect to MongoDB using Mongoose.
 * Sanitizes URI to prevent logging sensitive credentials.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined in environment variables. Please check your .env configuration.'
    )
  }

  try {
    const conn = await mongoose.connect(uri)

    // Mask user/password credentials for secure logging
    const safeHost = conn.connection.host || 'unknown-host'
    const dbName = conn.connection.name || 'unknown-db'
    console.log(`[MongoDB] Connected successfully to host: ${safeHost}, database: ${dbName}`)

    return conn
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`)
    throw error
  }
}

