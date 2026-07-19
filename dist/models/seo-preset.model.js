"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoPreset = void 0;
/**
 * Named SEO landing page derived from a fixed set of discovery filters.
 * `query_params` matches `DiscoveryFilters` (csv strings on plural keys).
 */
const BaseModel_1 = require("../sql/common/BaseModel");
exports.SeoPreset = new BaseModel_1.BaseModel('SeoPresets', 'preset_id');
