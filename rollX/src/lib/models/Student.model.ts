import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  user: mongoose.Schema.Types.ObjectId;
  fullName: string;
  universityName: string;
  universityRollNo: string;
  classRollNo?: string;
}

const StudentSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    universityName: {
      type: String,
      required: [true, "University Name is required."],
      trim: true,
    },
    universityRollNo: {
      type: String,
      required: [true, "University Roll No. is required."],
      unique: true,
      trim: true,
    },
    classRollNo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
