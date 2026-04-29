"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
const app_error_util_1 = require("./app-error.util");
class ResponseUtil {
    static success(res, data, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            statusCode,
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, code, errors) {
        const response = {
            success: false,
            message,
            error: code,
            errors,
            statusCode,
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, pagination, message = 'Success', statusCode = 200) {
        const response = {
            data,
            pagination,
        };
        return ResponseUtil.success(res, response, message, statusCode);
    }
    static created(res, data, message = 'Resource created successfully') {
        return ResponseUtil.success(res, data, message, 201);
    }
    static noContent(res, message = 'Success') {
        return ResponseUtil.success(res, null, message, 204);
    }
    static badRequest(res, message = 'Bad request', code, errors) {
        return ResponseUtil.error(res, message, 400, code || app_error_util_1.ErrorCode.INVALID_INPUT, errors);
    }
    static unauthorized(res, message = 'Unauthorized', code) {
        return ResponseUtil.error(res, message, 401, code || app_error_util_1.ErrorCode.UNAUTHORIZED);
    }
    static forbidden(res, message = 'Forbidden', code) {
        return ResponseUtil.error(res, message, 403, code || app_error_util_1.ErrorCode.FORBIDDEN);
    }
    static notFound(res, message = 'Resource not found', code) {
        return ResponseUtil.error(res, message, 404, code || app_error_util_1.ErrorCode.NOT_FOUND);
    }
    static conflict(res, message = 'Resource conflict', code) {
        return ResponseUtil.error(res, message, 409, code || app_error_util_1.ErrorCode.CONFLICT);
    }
    static validationError(res, message = 'Validation failed', errors) {
        return ResponseUtil.error(res, message, 400, app_error_util_1.ErrorCode.VALIDATION_ERROR, errors);
    }
    static accepted(res, data, message = 'Request accepted') {
        return ResponseUtil.success(res, data, message, 202);
    }
    static updated(res, data, message = 'Resource updated successfully') {
        return ResponseUtil.success(res, data, message, 200);
    }
    static deleted(res, message = 'Resource deleted successfully') {
        return ResponseUtil.success(res, null, message, 200);
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.util.js.map