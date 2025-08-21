import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";
import { sendCreatePasswordEmail } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({ email });

    // Security Checks:
    // 1. User must exist.
    // 2. User must be a 'google' provider account.
    // 3. User must NOT already have a password set.
    if (user && user.provider === "google" && !user.password) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.resetPasswordToken = passwordResetToken;
      user.resetPasswordExpires = passwordResetExpires;
      await user.save();

      await sendCreatePasswordEmail(user.email, resetToken);
    }

    // Always return a generic success message for security
    return NextResponse.json({
      message:
        "If your account was created with Google, a link to create a password has been sent to your email.",
    });
  } catch (error: unknown) {
    console.error("Generate Create Password Link Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
