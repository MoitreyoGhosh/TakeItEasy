import mongoose, { Schema, Document } from "mongoose";
import "@/lib/models/Student.model";
import "@/lib/models/Host.model";

// Interface for TypeScript type safety
export interface IUser extends Document {
  email: string;
  password?: string;
  role: "Student" | "Host";
  provider: "credentials" | "google";
  profileComplete: boolean;
  profile: mongoose.Schema.Types.ObjectId;
  profileModel: "Student" | "Host";
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    }, // Not required for OAuth
    role: {
      type: String,
      enum: ["Student", "Host"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      required: true,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // The polymorphic link to the specific profile
    profile: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "profileModel",
    },
    profileModel: { type: String, required: true, enum: ["Student", "Host"] },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
