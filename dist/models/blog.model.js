"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.Blog = new BaseModel_1.BaseModel('Blogs', 'blog_id', ['tags', 'thumbnail', 'images', 'stale_flags', 'connected_cars', 'connected_variants', 'connected_brands', 'connected_body_types', 'connected_fuel_types', 'connected_comparisons', 'connected_collections']);
