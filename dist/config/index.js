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
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
    env: process.env.NODE_ENV || 'development',
    cors_origin: process.env.CORS_ORIGIN || '*',
};
//# sourceMappingURL=index.js.map