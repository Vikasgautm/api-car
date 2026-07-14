"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTELLIGENCE_MODEL = exports.CHATBOT_MODEL = void 0;
exports.getCerebrasClient = getCerebrasClient;
const cerebras_cloud_sdk_1 = __importDefault(require("@cerebras/cerebras_cloud_sdk"));
const app_error_util_1 = require("../utils/app-error.util");
let cachedClient = null;
function getCerebrasClient() {
    if (!cachedClient) {
        if (!process.env.CEREBRAS_API_KEY) {
            throw app_error_util_1.AppError.serviceUnavailable('CEREBRAS_API_KEY is not set.', 'AI service is currently unavailable. Please contact the administrator.');
        }
        cachedClient = new cerebras_cloud_sdk_1.default({ apiKey: process.env.CEREBRAS_API_KEY });
    }
    return cachedClient;
}
exports.CHATBOT_MODEL = process.env.CEREBRAS_CHATBOT_MODEL || process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
exports.INTELLIGENCE_MODEL = process.env.CEREBRAS_INTELLIGENCE_MODEL || 'gpt-oss-120b';
