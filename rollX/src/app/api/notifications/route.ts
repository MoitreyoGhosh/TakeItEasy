export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/authOptions";

import {
  getUserNotifications,
  markAllNotificationsAsRead,
  LeanNotification,
} from "@/lib/services/notification.service";

// Hydrated frontend notification shape
interface HydratedNotification extends Omit<LeanNotification, "createdAt"> {
  id: string;
  databaseId: string;
  createdAt: number;
}

// Get User Notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const unreadOnly = searchParams.get("unread") === "true";
    const archived = searchParams.get("archived") === "true";

    // Validate and sanitize limit parameter
    const limitParam = Number(searchParams.get("limit") || "20");

    const limit = Math.min(Math.max(limitParam, 1), 50);

    const notifications = await getUserNotifications(session.user.id, {
      unreadOnly,
      archived,
      limit,
    });

    const normalizedNotifications: HydratedNotification[] = notifications.map(
      (notification) => ({
        ...notification,

        createdAt: new Date(notification.createdAt).getTime(),

        id:
          notification.type === "manual_request"
            ? `manual_${notification._id.toString()}`
            : notification.type === "session_started"
              ? `session_${notification._id.toString()}`
              : notification.type === "session_ended"
                ? `ended_${notification._id.toString()}`
                : notification._id.toString(),

        databaseId: notification._id.toString(),
      }),
    );

    return NextResponse.json({
      success: true,
      notifications: normalizedNotifications,
    });
  } catch (error) {
    console.error("[Notifications GET Error]", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

// Mark All Notifications as Read
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    await markAllNotificationsAsRead(session.user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[Notifications PATCH Error]", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
