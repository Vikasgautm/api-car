"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyTypeController = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const catchAsync_1 = require("../../../utils/catchAsync");
const bodyType_service_1 = require("../services/bodyType.service");
class BodyTypeController {
    static getAllBodyTypes = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await bodyType_service_1.BodyTypeService.getAllBodyTypes(req.query);
        res.status(200).json({
            status: "success",
            data: result,
        });
    });
    static getBodyTypeBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.getBodyTypeBySlug(req.params.slug);
        if (!bodyType) {
            throw new error_middleware_1.AppError("Body type not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { body_type: bodyType },
        });
    });
    static createBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        try {
            const bodyType = await bodyType_service_1.BodyTypeService.createBodyType(req.body);
            res.status(201).json({
                status: "success",
                data: { body_type: bodyType },
            });
        }
        catch (error) {
            console.log(error, "error");
        }
    });
    static updateBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let updateData = { ...req.body };
        if (updateData.is_published !== undefined) {
            // Handle both string "true"/"false" and boolean true/false
            if (typeof updateData.is_published === "string") {
                updateData.is_published = updateData.is_published === "true";
            }
            // If it's already a boolean, keep it as is
        }
        const bodyType = await bodyType_service_1.BodyTypeService.updateBodyType(req.params.id, updateData);
        if (!bodyType)
            throw new error_middleware_1.AppError("Body type not found", 404);
        res.status(200).json({
            status: "success",
            data: { body_type: bodyType },
        });
    });
    static deleteBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.deleteBodyType(req.params.id);
        if (!bodyType)
            throw new error_middleware_1.AppError("Body type not found", 404);
        res.status(200).json({
            status: "success",
            message: "Body type soft deleted successfully",
        });
    });
    static restoreBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.restoreBodyType(req.params.id);
        if (!bodyType)
            throw new error_middleware_1.AppError("Body type not found", 404);
        res.status(200).json({
            status: "success",
            message: "Body type restored successfully",
            data: { body_type: bodyType },
        });
    });
}
exports.BodyTypeController = BodyTypeController;
//# sourceMappingURL=bodyType.controller.js.map