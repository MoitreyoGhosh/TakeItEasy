import mongoose, { Schema, Document, models, Model, Types } from "mongoose";

export interface IGroupLean {
  _id: mongoose.Types.ObjectId;
  groupName: string;
  joinCode: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Document {
  groupName: string;
  joinCode: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  capacity: number;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    groupName: {
      type: String,
      required: [true, "Group name is required."],
      trim: true,
      maxlength: [100, "Group name cannot be more than 100 characters."],
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    capacity: {
      type: Number,
      required: [true, "Group capacity is required"],
      min: [1, "Capacity must be at least 1."],
      default: 65, // A sensible default
    },
  },
  {
    timestamps: true,
  }
);

// Use existing model if it exists, otherwise create a new one
const Group: Model<IGroup> =
  models.Group || mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
