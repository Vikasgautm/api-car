"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularCollection = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.PopularCollection = new BaseModel_1.BaseModel('PopularCollections', 'collection_id', ['filter_criteria', 'custom_sorting', 'aggregates_cache']);
