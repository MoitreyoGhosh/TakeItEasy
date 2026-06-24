import mongoose, { Schema, Document, models, Model } from "mongoose";

// Define the shape of the data for TypeScript
export interface IAttendanceSession extends Document {
  group: mongoose.Schema.Types.ObjectId;
  host: mongoose.Schema.Types.ObjectId;
  shortCode: string;
  status: "active" | "completed" | "expired";
  expiresAt: Date;
  presentMembers: mongoose.Schema.Types.ObjectId[];
  absentMembers: mongoose.Schema.Types.ObjectId[];

  manualRequests: {
    notificationId: mongoose.Schema.Types.ObjectId;
    student: mongoose.Schema.Types.ObjectId;
    reason?: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: mongoose.Schema.Types.ObjectId;
  }[];
}

const AttendanceSessionSchema: Schema<IAttendanceSession> = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
      // Automatically remove expired/abandoned sessions from the DB after 24 hours
      // This is great for database hygiene.
      expires: "24h",
    },
    presentMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    absentMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    manualRequests: [
      {
        notificationId: {
          type: Schema.Types.ObjectId,
          ref: "Notification",
          required: true,
          index: true,
        },
        student: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true,
        },
        reason: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
          index: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        processedAt: {
          type: Date,
        },
        processedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

AttendanceSessionSchema.index({
  group: 1,
  status: 1,
  createdAt: -1,
});

AttendanceSessionSchema.index(
  { group: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

const AttendanceSession: Model<IAttendanceSession> =
  models.AttendanceSession ||
  mongoose.model<IAttendanceSession>(
    "AttendanceSession",
    AttendanceSessionSchema,
  );

export default AttendanceSession;
