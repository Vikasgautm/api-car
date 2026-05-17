import bcrypt from 'bcrypt';
import { Document, Schema, model } from 'mongoose';

export enum UserRole {
  USER = 'user',
  EDITOR = 'editor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface IUser extends Document {
  user_id: string;
  user_name: string;
  email: string;
  password?: string;
  phone?: string;
  whatsapp_phone?: string;
  whatsapp_opt_in?: boolean;
  profile_pic?: string;
  role: UserRole;
  is_email_verified: boolean;
  google_id?: string;
  is_deleted: boolean;
  theme?: string;
  is_active?: boolean;
  last_login_at?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
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
    password_reset_token: { type: String, select: false },
    password_reset_expires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  const user = this as IUser;
  if (!user.isModified('password')) return;
  user.password = await bcrypt.hash(user.password!, 12);
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.index({ google_id: 1 });
userSchema.index({ is_deleted: 1 });
userSchema.index({ is_email_verified: 1 });
userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);
