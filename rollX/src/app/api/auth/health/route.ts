import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connection = await connectToDatabase();

    if (connection.readyState === 1) {
      return NextResponse.json({ status: "ok", message: "Database connected" });
    } else {
      return NextResponse.json(
        { status: "error", message: "Database not connected" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Health Check Error:", error);
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}
