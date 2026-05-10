"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 4500,
    mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/car-salahakar',
    jwt_secret: process.env.JWT_SECRET || 'your-secret-key',
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '24h', // 24 hours for admin sessions
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    env: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN || '*',
    cloudinary_cloud_name: process.env.CLOUDINARY_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
    super_admin: {
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@carsalhakar.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin@123',
        name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
        phone: process.env.SUPER_ADMIN_PHONE || '+1234567890',
    },
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
};
//# sourceMappingURL=index.js.map