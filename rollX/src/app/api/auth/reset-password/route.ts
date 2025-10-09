import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { token, password: newPassword } = await request.json();

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid token and a password of at least 8 characters are required.",
        },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      throw new Error("Password reset token is invalid or has expired.");
    }

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new Error(
          "Your new password cannot be the same as your old password."
        );
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    // Assign the hashed password. Let the model handle the hashing.
    // This makes the controller simple and relies on our single source of truth.
    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); // Save the updated user document

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
