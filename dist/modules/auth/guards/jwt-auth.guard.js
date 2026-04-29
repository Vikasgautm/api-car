"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../../config");
const response_util_1 = require("../../../shared/utils/response.util");
const jwtAuthGuard = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            response_util_1.ResponseUtil.error(res, 'Access token is required', 401);
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt_secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        response_util_1.ResponseUtil.error(res, 'Invalid or expired token', 401);
    }
};
exports.jwtAuthGuard = jwtAuthGuard;
//# sourceMappingURL=jwt-auth.guard.js.map