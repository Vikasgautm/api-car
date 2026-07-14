"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleRequest = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.LifecycleRequest = new BaseModel_1.BaseModel('LifecycleRequests', 'request_id', ['metadata']);
