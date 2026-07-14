"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.Brand = new BaseModel_1.BaseModel('Brands', 'brand_id', ['slug_history', 'logo', 'brand_media', 'aggregates_cache']);
