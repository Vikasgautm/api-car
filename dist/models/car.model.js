"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Car = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.Car = new BaseModel_1.BaseModel('Cars', 'car_id', [
    'slug_history', 'fuel_types', 'price_range', 'key_specifications', 'aggregates_cache', 'spec_keys_cache',
    'thumbnail', 'images', 'completeness_misses', 'entity_status_history', 'seo_history', 'variant_history', 'change_history'
]);
