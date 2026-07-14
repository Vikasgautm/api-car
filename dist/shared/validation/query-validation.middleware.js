"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaginationQuery = void 0;
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Reusable query validation middleware for pagination
exports.validatePaginationQuery = (0, validate_middleware_1.validateQuery)(common_validation_schemas_1.paginationSchema);
