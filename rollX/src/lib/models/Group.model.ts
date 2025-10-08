import mongoose, { Schema, Document, models, Model, Types } from "mongoose";

export interface ISchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IGroupLean {
  _id: mongoose.Types.ObjectId;
  groupName: string;
  groupType: string;
  description?: string;
  joinCode: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  capacity: number;
  schedules?: ISchedule[];
  eventTime?: {
    start: Date;
    end: Date;
  };
  lastSessionStartedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Document {
  groupName: string;
  joinCode: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  capacity: number;
  groupType: string;
  description?: string;
  schedules?: ISchedule[];
  eventTime?: {
    start: Date;
    end: Date;
  };
  lastSessionStartedAt?: Date;
}

// Schedule Schema 
const ScheduleSchema: Schema<ISchedule> = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
); // _id: false is important for sub-documents in an array

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
    description: {
      type: String,
      trim: true,
      maxlength: [250, "Description cannot be more than 250 characters."],
    },
    groupType: {
      type: String,
      enum: ["Class","Lab" ,"Event"],
      required: true,
    },
    schedules: {
      type: [ScheduleSchema],
      default: undefined,
    },
    eventTime: {
      start: Date,
      end: Date,
    },
    lastSessionStartedAt: {
      type: Date,
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
