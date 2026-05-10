"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyTypeController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_body_type_dto_1 = require("../dto/create-body-type.dto");
const update_body_type_dto_1 = require("../dto/update-body-type.dto");
const bodyType_service_1 = require("../services/bodyType.service");
class BodyTypeController {
    // Public routes
    static getAllPublicBodyTypes = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await bodyType_service_1.BodyTypeService.getAllBodyTypes(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
    });
    static getPublicBodyTypeBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.getBodyTypeBySlug(req.params.slug);
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: {
                    field: 'slug',
                    reason: 'The body type does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
    });
    // Admin routes
    static getAllAdminBodyTypes = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await bodyType_service_1.BodyTypeService.getAllBodyTypes(req.query, true);
        return response_util_1.ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
    });
    static getAdminBodyTypeById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.getBodyTypeById(req.params.id);
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found for body_type_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: {
                    field: 'body_type_id',
                    reason: 'The body type does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
    });
    static createBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            name: req.body.name,
            description: req.body.description,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
            logo_url: req.body.logo_url,
            logo_title: req.body.logo_title,
        };
        const validation = create_body_type_dto_1.CreateBodyTypeDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const bodyType = await bodyType_service_1.BodyTypeService.createBodyType(createDto);
        return response_util_1.ResponseUtil.created(res, bodyType, "Body type created successfully");
    });
    static updateBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            name: req.body.name,
            description: req.body.description,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
            logo_url: req.body.logo_url,
            logo_title: req.body.logo_title,
        };
        const validation = update_body_type_dto_1.UpdateBodyTypeDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400, {
                userMessage: errorMessages_1.USER_MESSAGES.VALIDATION_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.VALIDATION_ERROR,
                details: {
                    fields: validation.errors,
                },
            });
        }
        const bodyType = await bodyType_service_1.BodyTypeService.updateBodyType(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, bodyType, "Body type updated successfully");
    });
    static deleteBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        await bodyType_service_1.BodyTypeService.deleteBodyType(req.params.id);
        return response_util_1.ResponseUtil.success(res, null, "Body type deleted successfully");
    });
    static restoreBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.restoreBodyType(req.params.id);
        return response_util_1.ResponseUtil.success(res, bodyType, "Body type restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bodyType = await bodyType_service_1.BodyTypeService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, bodyType, "Body type publish status updated successfully");
    });
}
exports.BodyTypeController = BodyTypeController;
//# sourceMappingURL=bodyType.controller.js.map