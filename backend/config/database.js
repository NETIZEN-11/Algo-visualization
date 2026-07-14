import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    logger.error('MONGODB_URI is not set — aborting boot')
    if (process.env.NODE_ENV === 'production') process.exit(1)
    return
  }
  try {
    const conn = await mongoose.connect(uri, {
      // Pool tuning — 50 is the sweet spot for 100K-concurrent workloads on
      // a single backend replica. Raise for larger boxes; lower for less RAM.
      maxPoolSize: Number(process.env.MONGO_POOL_SIZE || 50),
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    })
    logger.info({ host: conn.connection.host }, '✅ MongoDB connected')

    mongoose.connection.on('error', (err) => {
      logger.error({ err: err?.message }, 'MongoDB connection error')
    })
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })
  } catch (err) {
    logger.error({ err: err.message }, 'MongoDB connect failed')
    if (process.env.NODE_ENV === 'production') process.exit(1)
  }
}

export default connectDB
