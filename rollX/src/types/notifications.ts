export type NotificationType =
  | "manual_request"
  | "announcement"
  | "session_started"
  | "session_ended";

export type NotificationStatus = "pending" | "approved" | "rejected";

export interface BaseNotification {
  id: string;
  databaseId?: string;
  type: NotificationType;
  createdAt: number;
  read?: boolean;
  archived?: boolean;
  status?: NotificationStatus;
  visible?: boolean;
  popupSeen?: boolean;
}

export interface ManualRequestNotification extends BaseNotification {
  type: "manual_request";
  data: {
    sessionId: string;
    groupId: string;
    studentId: string;
    name: string;
    rollNo?: string;
    reason?: string;
    groupName?: string;
  };
}

export interface AnnouncementNotification extends BaseNotification {
  type: "announcement";
  data: {
    groupId: string;
    title: string;
    message: string;
  };
}

export interface SessionStartedNotification extends BaseNotification {
  type: "session_started";
  data: {
    groupId: string;
    sessionId: string;
    groupName?: string;
  };
}

export interface SessionEndedNotification extends BaseNotification {
  type: "session_ended";
  data: {
    groupId: string;
    sessionId: string;
    groupName?: string;
  };
}

export type AppNotification =
  | SessionStartedNotification
  | SessionEndedNotification
  | ManualRequestNotification
  | AnnouncementNotification;
