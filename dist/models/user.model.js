"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.GovernanceRole = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["EDITOR"] = "editor";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var GovernanceRole;
(function (GovernanceRole) {
    GovernanceRole["SUPER_ADMIN"] = "super_admin";
    GovernanceRole["OPERATIONS_ADMIN"] = "operations_admin";
    GovernanceRole["CONTENT_EDITOR"] = "content_editor";
    GovernanceRole["REVIEWER"] = "reviewer";
    GovernanceRole["PUBLISHER"] = "publisher";
    GovernanceRole["SEO_MANAGER"] = "seo_manager";
    GovernanceRole["IMPORT_OPERATOR"] = "import_operator";
    GovernanceRole["MEDIA_MANAGER"] = "media_manager";
})(GovernanceRole || (exports.GovernanceRole = GovernanceRole = {}));
const BaseModel_1 = require("../sql/common/BaseModel");
exports.User = new BaseModel_1.BaseModel('Users', 'user_id', ['permissions', 'assigned_brands', 'assigned_domains', 'workflow_rights', 'security']);
