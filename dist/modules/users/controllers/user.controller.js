"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const user_model_1 = require("../../../models/user.model");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class UserController {
    static getProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const user = await user_model_1.User.findOne({ user_id: userId }).select("-password");
        if (!user) {
            throw new error_middleware_1.AppError("User not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { user },
        });
    });
    static updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { user_name, phone } = req.body;
        let updateData = {};
        if (user_name)
            updateData.user_name = user_name;
        if (phone)
            updateData.phone = phone;
        if (req.file) {
            updateData.profile_pic = req.file.path;
        }
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId }, updateData, {
            new: true,
        }).select("-password");
        if (!user) {
            throw new error_middleware_1.AppError("User not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { user },
        });
    });
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map