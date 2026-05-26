import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './index.js';
import logger from '../utils/logger.js';

// Use public DNS when system resolver blocks MongoDB Atlas SRV lookups (common on Windows)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export default connectDB;
