"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportKeyMapping = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.ImportKeyMapping = new BaseModel_1.BaseModel('ImportKeyMappings', 'mapping_id', ['transformation_rule']);
