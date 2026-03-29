"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const user_model_1 = require("../../../models/user.model");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class SettingsController {
    static updateTheme = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { theme } = req.body;
        if (!theme) {
            throw new error_middleware_1.AppError("Theme is required", 400);
        }
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId }, { theme }, { new: true });
        if (!user) {
            throw new error_middleware_1.AppError("User not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { theme: user.theme },
        });
    });
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map