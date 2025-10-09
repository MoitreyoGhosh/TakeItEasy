import mongoose from "mongoose";
import UserModel from "@/lib/models/User.model";
import StudentModel from "@/lib/models/Student.model";
import HostModel from "@/lib/models/Host.model";
import { signUpSchema } from "@/lib/validations/auth";
import { connectToDatabase } from "../db";
import bcrypt from "bcryptjs";

// This function handles the entire registration process
export async function registerUser(userData: unknown) {
  // 1. Validate the incoming data against our Zod schema
  const validationResult = signUpSchema.safeParse(userData);
  if (!validationResult.success) {
    const errorMessages = Object.values(
      validationResult.error.flatten().fieldErrors
    ).join(", ");
    throw new Error(`Validation failed: ${errorMessages}`);
  }
  const validatedData = validationResult.data;

  // 2. Connect to the database
  await connectToDatabase();

  const { email, password, role, universityRollNo, ...profileData } =
    validatedData;

  // 3. Start a database session for a transaction
  const session = await mongoose.startSession();

  try {
    // Start the transaction
    session.startTransaction();

    // 4. Check for existing users (email and roll number)
    const existingUserByEmail = await UserModel.findOne({ email }).session(
      session
    );
    if (existingUserByEmail) {
      throw new Error("A user with this email already exists.");
    }
    if (role === "Student" && universityRollNo) {
      const existingStudentByRollNo = await StudentModel.findOne({
        universityRollNo,
      }).session(session);
      if (existingStudentByRollNo) {
        throw new Error(
          "A student with this University Roll No. already exists."
        );
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const profileModel: "Student" | "Host" = role;
    let newProfile;

    // 5. Create the role-specific profile document
    if (role === "Student") {
      newProfile = new StudentModel({
        ...profileData,
        universityName: validatedData.universityName,
        universityRollNo: validatedData.universityRollNo,
        classRollNo: validatedData.classRollNo,
      });
    } else {
      // Role is 'Host'
      newProfile = new HostModel({
        ...profileData,
        organizationName: validatedData.organizationName,
        organizationId: validatedData.organizationId,
      });
    }

    // 6. Create the User document, passing the PLAINTEXT password.
    //    The pre('save') hook in the User model will handle the hashing.
    const newUser = new UserModel({
      email,
      password: hashedPassword,
      role,
      provider: "credentials",
      profileComplete: true,
      profile: newProfile._id,
      profileModel: profileModel,
    });

    // 7. Complete the two-way link in memory
    newProfile.user = newUser._id;

    // 8. Now, save both documents within the transaction session
    await newProfile.save({ session });
    await newUser.save({ session }); // The pre-save hook fires here

    // 9. If all succeeds, commit the transaction
    await session.commitTransaction();

    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    return {
      success: true,
      message: "User registered successfully.",
      user: userToReturn,
    };
  } catch (error: unknown) {
    await session.abortTransaction();
    if (error instanceof Error) {
      throw new Error(error.message || "Error registering user.");
    } else {
      throw new Error("Unknown error occurred.");
    }
  } finally {
    // 10. End the session
    await session.endSession();
  }
}
