"use client";

import { useEffect } from "react";
import { useGlobalSocket } from "@/providers/SocketProvider";
import { useNotifications } from "@/providers/NotificationProvider";

export function GlobalSocketListener() {
  const { socket } = useGlobalSocket();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    // --- Listen for Manual Attendance Requests ---
    // Note: The backend needs to send 'name' and 'rollNo' in this payload now,
    // otherwise the global notification won't know who requested it.
    const handleManualRequest = (data: {
      notificationId: string;
      studentId: string;
      sessionId: string;
      reason: string;
      name: string;
      rollNo: string;
      groupId: string;
    }) => {
      addNotification({
        id: `manual_${data.notificationId}`,
        databaseId: data.notificationId,
        type: "manual_request",
        createdAt: Date.now(),
        read: false,
        archived: false,
        visible: true,
        status: "pending",
        data: {
          sessionId: data.sessionId,
          groupId: data.groupId,
          studentId: data.studentId,
          name: data.name,
          rollNo: data.rollNo,
          reason: data.reason,
        },
      });
    };

    // --- Listen for Session Started (Student Notification) ---
    const handleSessionStarted = (data: {
      notificationId?: string; // Note: This might be undefined from the group broadcast
      sessionId: string;
      groupId: string;
      groupName?: string;
    }) => {
      // 🚨 GUARD CLAUSE: If there is no notificationId, this is the generic
      // group broadcast meant for UI navigation. Do NOT create a notification popup for it.
      if (!data.notificationId) {
        console.log(
          "Ignoring generic session_started broadcast for notifications.",
        );
        return;
      }

      addNotification({
        id: `session_${data.notificationId}`,
        databaseId: data.notificationId,
        type: "session_started",
        createdAt: Date.now(),
        read: false,
        archived: false,
        visible: true,
        popupSeen: false,
        data: {
          sessionId: data.sessionId,
          groupId: data.groupId,
          groupName: data.groupName,
        },
      });
    };

    // -- Listen for Session Ended (Student Notification) ---
    const handleSessionEnded = (data: {
      groupId: string;
      sessionId: string;
      groupName?: string;
    }) => {
      addNotification({
        id: `end_${data.sessionId}`,
        type: "session_ended",
        createdAt: Date.now(),
        read: false,
        archived: false,
        visible: true,
        data: {
          sessionId: data.sessionId,
          groupName: data.groupName,
          groupId: data.groupId,
        },
      });
    };

    socket.on("manual_attendance_request", handleManualRequest);
    socket.on("session_notification", handleSessionStarted);
    socket.on("session_ended", handleSessionEnded);

    return () => {
      // Prevent listener stacking
      socket.off("manual_attendance_request", handleManualRequest);
      socket.off("session_notification", handleSessionStarted);
      socket.off("session_ended", handleSessionEnded);
    };
  }, [socket, addNotification]);

  return null; // Invisible component
}
