import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import UserModel from "@/lib/models/User.model";
import StudentModel from "@/lib/models/Student.model";
import HostModel from "@/lib/models/Host.model";
import { profileCompletionSchema } from "@/lib/validations/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token || !token.id) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }
  if (token.profileComplete) {
    return NextResponse.json(
      { success: false, message: "Profile is already complete." },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const body = await request.json();

  const validationResult = profileCompletionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid data provided.",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  const { role, ...profileData } = validationResult.data;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await UserModel.findById(token.id).session(session);
    if (!user) {
      throw new Error("User not found.");
    }
    if (user.profileComplete) {
      throw new Error("Profile has already been completed.");
    }

    let newProfile;

    if (role === "Student") {
      const existingStudent = await StudentModel.findOne({
        universityRollNo: profileData.universityRollNo,
      }).session(session);

      if (existingStudent) {
        // If it exists, throw a clean, user-friendly error.
        throw new Error(
          "A student with this University Roll No. already exists."
        );
      }

      newProfile = new StudentModel({
        fullName: token.name,
        universityName: profileData.universityName,
        universityRollNo: profileData.universityRollNo,
        classRollNo: profileData.classRollNo,
        user: user._id,
      });
      await newProfile.save({ session });
      user.profileModel = "Student";
    } else if (role === "Host") {
      newProfile = new HostModel({
        fullName: token.name,
        organizationName: profileData.organizationName,
        organizationId: profileData.organizationId,
        user: user._id,
      });
      await newProfile.save({ session });
      user.profileModel = "Host";
    } else {
      throw new Error("Invalid role specified.");
    }

    user.role = role;
    user.profile = newProfile._id;
    user.profileComplete = true;

    await user.save({ session });
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully.",
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    if (error instanceof Error) {
      // This will now catch our user-friendly error and send it to the frontend.
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "An unknown error occurred" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
