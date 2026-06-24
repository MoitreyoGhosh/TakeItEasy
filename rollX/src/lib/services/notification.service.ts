import mongoose, { HydratedDocument, Types } from "mongoose";

import Notification, {
  NotificationPriority,
  NotificationType,
} from "@/lib/models/Notification.model";

import { connectToDatabase } from "@/lib/db";

// Create Notification Payload
interface CreateNotificationPayload {
  recipient: string;
  type: NotificationType;
  priority?: NotificationPriority;
  persistent?: boolean;
  data: Record<string, unknown>;
  expiresAt?: Date;
}

// Lean notification type
export interface LeanNotification {
  _id: Types.ObjectId;
  type: NotificationType;
  recipient: Types.ObjectId;
  read: boolean;
  archived: boolean;
  priority?: NotificationPriority;
  persistent?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  data: Record<string, unknown>;
}

// Create a new notification
export async function createNotification({
  recipient,
  type,
  priority = "medium",
  persistent = true,
  data,
  expiresAt,
}: CreateNotificationPayload) {
  await connectToDatabase();

  const notification = await Notification.create({
    recipient: new mongoose.Types.ObjectId(recipient),
    type,
    priority,
    persistent,
    data,
    expiresAt,
    read: false,
    archived: false,
  });

  return notification;
}

// Get notifications for a user with optional filters
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    archived?: boolean;
    limit?: number;
  },
): Promise<LeanNotification[]> {
  await connectToDatabase();

  const { unreadOnly = false, archived = false, limit = 20 } = options || {};

  // Validate and sanitize limit parameter
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const query: Record<string, unknown> = {
    recipient: new mongoose.Types.ObjectId(userId),
    archived,
  };

  if (unreadOnly) {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean<LeanNotification[]>();

  return notifications;
}

// Mark a Single Notification as Read
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  await connectToDatabase();

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: new mongoose.Types.ObjectId(userId),
    },
    {
      $set: {
        read: true,
      },
    },
    {
      new: true,
    },
  ).lean();
}

// Mark All Notifications as Read
export async function markAllNotificationsAsRead(userId: string) {
  await connectToDatabase();
  return Notification.updateMany(
    {
      recipient: new mongoose.Types.ObjectId(userId),
      read: false,
    },
    {
      $set: {
        read: true,
      },
    },
  );
}

// Archive a notification (soft delete)
export async function archiveNotification(
  notificationId: string,
  userId: string,
) {
  await connectToDatabase();
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: new mongoose.Types.ObjectId(userId),
    },
    {
      $set: {
        archived: true,
        read: true,
      },
    },
    {
      new: true,
    },
  ).lean();
}

// Delete a notification permanently
export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  await connectToDatabase();
  return Notification.findOneAndDelete({
    _id: notificationId,

    recipient: new mongoose.Types.ObjectId(userId),
  }).lean();
}
