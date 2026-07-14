"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollection = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.SeoCollection = new BaseModel_1.BaseModel('SeoCollections', 'collection_id', ['filter_criteria']);
