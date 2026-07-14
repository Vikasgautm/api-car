"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorGuard = exports.adminGuard = exports.rolesGuard = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const rolesGuard = (allowedRoles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            response_util_1.ResponseUtil.error(res, 'Authentication required', 401);
            return;
        }
        if (!allowedRoles.includes(authReq.user.role)) {
            response_util_1.ResponseUtil.error(res, 'Insufficient permissions', 403);
            return;
        }
        next();
    };
};
exports.rolesGuard = rolesGuard;
exports.adminGuard = (0, exports.rolesGuard)(['super_admin', 'admin']);
exports.editorGuard = (0, exports.rolesGuard)(['super_admin', 'admin', 'editor']);
