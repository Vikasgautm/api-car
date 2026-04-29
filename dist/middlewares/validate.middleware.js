"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptional = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const app_error_util_1 = require("../shared/utils/app-error.util");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(app_error_util_1.AppError.validation('Validation failed', errors));
            }
            return next(error);
        }
    };
};
exports.validate = validate;
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(app_error_util_1.AppError.validation('Request body validation failed', errors));
            }
            return next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.query);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(app_error_util_1.AppError.validation('Query parameters validation failed', errors));
            }
            return next(error);
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.params);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(app_error_util_1.AppError.validation('URL parameters validation failed', errors));
            }
            return next(error);
        }
    };
};
exports.validateParams = validateParams;
const validateOptional = (schema) => {
    return async (req, res, next) => {
        try {
            const dataToValidate = {};
            if (Object.keys(req.body).length > 0) {
                dataToValidate.body = req.body;
            }
            if (Object.keys(req.query).length > 0) {
                dataToValidate.query = req.query;
            }
            if (Object.keys(req.params).length > 0) {
                dataToValidate.params = req.params;
            }
            if (Object.keys(dataToValidate).length > 0) {
                await schema.parseAsync(dataToValidate);
            }
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                return next(app_error_util_1.AppError.validation('Optional validation failed', errors));
            }
            return next(error);
        }
    };
};
exports.validateOptional = validateOptional;
//# sourceMappingURL=validate.middleware.js.map