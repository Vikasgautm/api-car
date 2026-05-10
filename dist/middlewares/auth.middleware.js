"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.restrictToEditorOrAbove = exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const user_model_1 = require("../models/user.model");
const app_error_util_1 = require("../shared/utils/app-error.util");
const protect = async (req, res, next) => {
    // Skip authentication in development mode
    // if (config.env === 'development') {
    //   return next();
    // }
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(app_error_util_1.AppError.unauthorized('You are not logged in! Please log in to get access.'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt_secret);
        req.user = decoded;
        // Check if user still exists and is not deleted
        const currentUser = await user_model_1.User.findOne({
            user_id: decoded.user_id || decoded.id,
            is_deleted: false,
        });
        if (!currentUser) {
            return next(app_error_util_1.AppError.unauthorized('The user belonging to this token no longer exists or has been deleted.'));
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(app_error_util_1.AppError.tokenInvalid());
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(app_error_util_1.AppError.tokenExpired());
        }
        return next(app_error_util_1.AppError.unauthorized('Invalid token or expired. Please log in again.'));
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Skip role check in development mode
        // if (config.env === 'development') {
        //   return next();
        // }
        if (!req.user) {
            return next(new app_error_util_1.AppError('You are not logged in!', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new app_error_util_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
const restrictToEditorOrAbove = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new app_error_util_1.AppError('You are not logged in!', 401));
        }
        const allowedRoles = ['editor', 'admin', 'super_admin', ...roles];
        if (!allowedRoles.includes(req.user.role)) {
            return next(new app_error_util_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictToEditorOrAbove = restrictToEditorOrAbove;
const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt_secret);
            req.user = decoded;
        }
        catch (error) {
            // Ignore token errors for optional auth
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map