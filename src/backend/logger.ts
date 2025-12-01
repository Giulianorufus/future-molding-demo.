import winston from 'winston';
import fs from 'fs';

// Ensure logs directory exists
try {
  fs.mkdirSync('logs', { recursive: true });
} catch (_) {}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // File transport with rotation parameters (max size and number of files)
    new winston.transports.File({ filename: 'logs/app.log', maxsize: 5 * 1024 * 1024, maxFiles: 7 }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

export default logger;
