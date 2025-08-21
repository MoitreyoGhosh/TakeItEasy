import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/controllers/auth.controller";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Call the controller to handle all the business logic
    const newUser = await registerUser(body);

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
