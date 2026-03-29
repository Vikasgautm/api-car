"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    profile_pic: { type: String },
    role: { type: String, default: 'user', required: true },
    is_email_verified: { type: Boolean, default: false },
    google_id: { type: String },
    is_deleted: { type: Boolean, default: false },
    theme: { type: String, default: "light" },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password'))
        return next();
    user.password = await bcrypt_1.default.hash(user.password, 12);
    //   next();
});
userSchema.methods.comparePassword = async function (password) {
    if (!this.password)
        return false;
    return await bcrypt_1.default.compare(password, this.password);
};
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map