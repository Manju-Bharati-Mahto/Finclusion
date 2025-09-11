import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
    // Server configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB configuration
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finclusion',

    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

    // CORS configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3060',

    // File upload configuration
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
};

export default config;
