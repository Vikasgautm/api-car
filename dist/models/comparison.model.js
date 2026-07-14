"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comparison = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.Comparison = new BaseModel_1.BaseModel('Comparisons', 'comparison_id', ['relatedComparisons', 'seoFAQSchema']);
