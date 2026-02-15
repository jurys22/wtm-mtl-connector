import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  event: {
    date: '2026-04-18',
    displayDate: 'April 18th, 2026'
  }
};
