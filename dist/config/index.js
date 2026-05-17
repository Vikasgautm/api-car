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
    app: {
        frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
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
    whatsapp: {
        // Kept around for one release in case we need to fall back. Deletion OTP
        // now ships over SMTP — see `email` below.
        phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        access_token: process.env.WHATSAPP_ACCESS_TOKEN || '',
        otp_template_name: process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'delete_otp_v1',
        otp_template_language: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || 'en_US',
        api_version: process.env.WHATSAPP_API_VERSION || 'v18.0',
    },
    email: {
        // SMTP config for transactional email (delete-approval OTP).
        // When any of host/user/pass are missing the EmailService falls back to a
        // server-console log in development; production refuses to start the workflow.
        smtp_host: process.env.SMTP_HOST || '',
        smtp_port: Number(process.env.SMTP_PORT || 587),
        smtp_secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/STARTTLS
        smtp_user: process.env.SMTP_USER || '',
        smtp_pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'CarSalahakar <no-reply@carsalahakar.com>',
    },
    deletion_workflow: {
        otp_ttl_seconds: Number(process.env.DELETION_OTP_TTL_SECONDS) || 600, // 10 min
        otp_max_attempts: Number(process.env.DELETION_OTP_MAX_ATTEMPTS) || 5,
        // Per-action approval recipient. Centralised here so we don't scatter the
        // OTP email across user records — every deletion goes to this inbox.
        otp_email_recipient: process.env.DELETION_OTP_EMAIL || 'kameshkumar511@gmail.com',
    },
};
//# sourceMappingURL=index.js.map