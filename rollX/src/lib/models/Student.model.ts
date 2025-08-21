import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  user: mongoose.Schema.Types.ObjectId;
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
    classRollNo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
