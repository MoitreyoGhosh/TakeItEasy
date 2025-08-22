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

// // Add this middleware to automatically hash the password before saving
// UserSchema.pre<IUser>("save", async function (next) {
//   // Check if the password was modified and is not already a hash
//   const isAlreadyHashed =
//     this.password &&
//     (this.password.startsWith("$2a$") || this.password.startsWith("$2b$"));

//   if (!this.isModified("password") || !this.password || isAlreadyHashed) {
//     return next();
//   }

//   // If we reach here, it's a new plaintext password that needs hashing.
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error: unknown) {
//     console.error("Error hashing password:", error);
//     console.error("--- [USER MODEL - HASHING ERROR] ---");
//     if (error instanceof Error) {
//       next(error);
//     } else {
//       next(new Error("Unknown error occurred."));
//     }
//   }
// });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
