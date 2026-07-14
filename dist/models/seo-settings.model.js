"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOSettings = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.SEOSettings = new BaseModel_1.BaseModel('SeoSettings', 'settings_id', ['schema_templates']);
