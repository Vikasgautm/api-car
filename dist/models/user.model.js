"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["EDITOR"] = "editor";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
const userSchema = new mongoose_1.Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
    },
    phone: {
        type: String,
        trim: true,
    },
    whatsapp_phone: {
        type: String,
        trim: true,
    },
    whatsapp_opt_in: { type: Boolean, default: false },
    profile_pic: { type: String },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER,
        required: true,
    },
    is_email_verified: { type: Boolean, default: false },
    google_id: { type: String },
    is_deleted: { type: Boolean, default: false, select: false },
    theme: { type: String, default: "light" },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date },
}, { timestamps: true });
userSchema.pre('save', async function () {
    const user = this;
    if (!user.isModified('password'))
        return;
    user.password = await bcrypt_1.default.hash(user.password, 12);
});
userSchema.methods.comparePassword = async function (password) {
    if (!this.password)
        return false;
    return await bcrypt_1.default.compare(password, this.password);
};
userSchema.index({ google_id: 1 });
userSchema.index({ is_deleted: 1 });
userSchema.index({ is_email_verified: 1 });
userSchema.index({ role: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map