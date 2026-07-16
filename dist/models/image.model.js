"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const BaseModel_1 = require("../sql/common/BaseModel");
exports.Image = new BaseModel_1.BaseModel('Images', 'image_id', ['tags', 'metadata']);
