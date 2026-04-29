"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUuidIdParam = exports.validateCarIdParam = exports.validateSlugParam = exports.validateIdParam = void 0;
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Reusable param validation middleware
exports.validateIdParam = (0, validate_middleware_1.validateParams)(common_validation_schemas_1.idParamSchema);
exports.validateSlugParam = (0, validate_middleware_1.validateParams)(common_validation_schemas_1.slugParamSchema);
exports.validateCarIdParam = (0, validate_middleware_1.validateParams)(common_validation_schemas_1.carIdParamSchema);
exports.validateUuidIdParam = (0, validate_middleware_1.validateParams)(common_validation_schemas_1.uuidIdParamSchema);
//# sourceMappingURL=params-validation.middleware.js.map