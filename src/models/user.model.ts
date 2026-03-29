import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  user_id: string;
  user_name: string;
  email: string;
  password?: string;
  phone?: string;
  profile_pic?: string;
  role: string;
  is_email_verified: boolean;
  google_id?: string;
  is_deleted: boolean;
  theme?: string;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next: any) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  user.password = await bcrypt.hash(user.password!, 12);
//   next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);
