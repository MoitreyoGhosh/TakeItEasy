import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";

//Checks the status of an email account to determine its type and if it has a password.
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

    // Use .lean() for performance, as we only need to read data.
    const user = await UserModel.findOne<{
      provider: string;
      password?: string;
    }>({ email })
      .select("provider password")
      .lean();

    if (!user) {
      // User does not exist, but we send a generic response for security.
      return NextResponse.json({ hasPassword: true });
    }

    // Respond with a clear status:
    return NextResponse.json({
      provider: user.provider,
      hasPassword: !!user.password, // Convert the password field to a boolean
    });
  } catch (error) {
    console.error("Account Status Check Error:", error);
    // In case of an error, default to the standard sign-in flow.
    return NextResponse.json({ hasPassword: true }, { status: 500 });
  }
}
