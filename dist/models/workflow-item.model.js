"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowItem = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.WorkflowItem = new BaseModel_1.BaseModel('WorkflowItems', 'item_id', ['history']);
