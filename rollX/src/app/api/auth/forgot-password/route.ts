import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 },
      );
    }

    // Explicitly select the 'password' field to check for its existence.
    const user = await UserModel.findOne({ email }).select("+password");
    // If the user does not exist or does not have a password, we do not proceed.
    // The condition is now: the user must exist AND they must have a password set.
    if (user && user.password) {
      // This will now correctly include "hybrid" Google users who have created a password.
      const resetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.resetPasswordToken = passwordResetToken;
      user.resetPasswordExpires = passwordResetExpires;
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        console.error("Reset password email error:", emailError);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new Error("Could not send reset email. Please try again later.");
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists and has a password, a reset link has been sent.",
    });
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
