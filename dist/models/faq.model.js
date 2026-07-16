"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.FAQ = new BaseModel_1.BaseModel('FAQs', 'faq_id', [
    'related_cars',
    'related_brands',
    'related_blogs',
    'tags',
    'target_page_types',
    'related_entities',
]);
