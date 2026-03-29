"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_model_1 = require("../../../models/user.model");
const config_1 = require("../../../config");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class AuthService {
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({ id: user.user_id, role: user.role, email: user.email }, config_1.config.jwt_secret, { expiresIn: config_1.config.jwt_expires_in });
    }
    static async signup(userData) {
        const existingUser = await user_model_1.User.findOne({ email: userData.email });
        if (existingUser) {
            throw new error_middleware_1.AppError('Email already exists', 400);
        }
        const newUser = await user_model_1.User.create({
            ...userData,
            user_id: (0, uuid_1.v4)(),
        });
        const token = this.generateToken(newUser);
        return { user: newUser, token };
    }
    static async login(loginData) {
        const user = await user_model_1.User.findOne({ email: loginData.email }).select('+password');
        if (!user || !(await user.comparePassword(loginData.password))) {
            throw new error_middleware_1.AppError('Incorrect email or password', 401);
        }
        const token = this.generateToken(user);
        return { user, token };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map