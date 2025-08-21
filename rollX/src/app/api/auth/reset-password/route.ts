import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { token, password } = await request.json();

    if (!token || !password || password.length < 8) {
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

    user.password = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); // The pre-save hook will now fire and hash the password correctly.

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
