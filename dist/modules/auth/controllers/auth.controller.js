"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const catchAsync_1 = require("../../../utils/catchAsync");
class AuthController {
    static signup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user, token } = await auth_service_1.AuthService.signup(req.body);
        res.status(201).json({
            status: 'success',
            token,
            data: { user },
        });
    });
    static login = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user, token } = await auth_service_1.AuthService.login(req.body);
        res.status(200).json({
            status: 'success',
            token,
            data: { user },
        });
    });
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map