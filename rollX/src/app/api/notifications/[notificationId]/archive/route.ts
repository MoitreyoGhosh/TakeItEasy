import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/authOptions";

import { archiveNotification } from "@/lib/services/notification.service";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      notificationId: string;
    }>;
  },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await context.params;

    await archiveNotification(notificationId, session.user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[Archive Notification Error]", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
