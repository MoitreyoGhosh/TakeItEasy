import mongoose, { Schema, Document, Model, models, Types } from "mongoose";

export type NotificationType =
  | "manual_request"
  | "announcement"
  | "session_started"
  | "session_ended";

export type NotificationPriority = "low" | "medium" | "high";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  persistent: boolean;
  data: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "manual_request",
        "announcement",
        "session_started",
        "session_ended",
      ],
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    archived: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Cleanup handled by TTL index on expiresAt
    persistent: {
      type: Boolean,
      default: true,
    },

    data: {
      type: Schema.Types.Mixed,
      required: true,
    },

    expiresAt: {
      type: Date,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to optimize queries for active notifications
NotificationSchema.index({
  recipient: 1,
  read: 1,
  archived: 1,
  createdAt: -1,
});

NotificationSchema.index({
  recipient: 1,
  type: 1,
  createdAt: -1,
});

const Notification: Model<INotification> =
  models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
