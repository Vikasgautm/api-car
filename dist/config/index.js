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
    mongodb_db_name: process.env.MONGODB_DB_NAME || 'car-salahakar-2',
    jwt_secret: process.env.JWT_SECRET || 'your-secret-key',
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '24h', // 24 hours for admin sessions
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    env: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN || '*',
    app: {
        frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
    aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
    aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    aws_region: process.env.AWS_REGION || 'us-east-1',
    aws_bucket_name: process.env.AWS_BUCKET_NAME,
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
        otp_email_recipient: process.env.DELETION_OTP_EMAIL || 'kameshkumar511@gmail.com',
    },
    lifecycle_governance: {
        otp_ttl_seconds: Number(process.env.LIFECYCLE_OTP_TTL_SECONDS) || 600, // 10 min
        otp_max_attempts: Number(process.env.LIFECYCLE_OTP_MAX_ATTEMPTS) || 5,
        // Centralised approval inbox — all lifecycle OTPs go here.
        otp_email_recipient: process.env.LIFECYCLE_OTP_EMAIL || process.env.DELETION_OTP_EMAIL || 'kameshkumar511@gmail.com',
    },
};
// Production environment safety checks
if (process.env.NODE_ENV === 'production') {
    const missingVars = [];
    if (!process.env.MONGODB_URI)
        missingVars.push('MONGODB_URI');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key')
        missingVars.push('JWT_SECRET');
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key')
        missingVars.push('JWT_REFRESH_SECRET');
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
        missingVars.push('CORS_ORIGIN (must be a specific domain, not *)');
    }
    if (missingVars.length > 0) {
        console.error(`❌ CRITICAL SECURITY ERROR: Missing or insecure production environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }
}
