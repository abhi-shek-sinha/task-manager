import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  resetOtpHash?: string;
  resetOtpExpiry?: Date;
  avatar?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    resetOtpHash: { type: String },
    resetOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
