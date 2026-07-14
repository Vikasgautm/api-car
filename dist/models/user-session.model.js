"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.UserSession = new BaseModel_1.BaseModel('UserSessions', 'session_id');
