import { ISchedule } from "../models/Group.model";

export interface ScheduleStatus {
  status: "Live" | "Upcoming" | "None";
  schedule: ISchedule | null;
  remainingSchedules: number;
}

/**
 * Converts a 24-hour time string ("HH:MM") to a 12-hour format ("h:mm A").
 */
const format24HourTo12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hours, minutes] = time24.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

/**
 * The "brain" function to determine the current state of a class schedule.
 * It checks for live sessions first, then for the next upcoming session.
 */
export const getScheduleStatus = (schedules?: ISchedule[]): ScheduleStatus => {
  if (!schedules || schedules.length === 0) {
    return { status: "None", schedule: null, remainingSchedules: 0 };
  }

  const now = new Date();
  const currentDay = now.getDay(); // Sunday = 0, Monday = 1, etc.
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  // Priority 1: Check if any session is currently live.
  for (const s of schedules) {
    if (
      s.dayOfWeek === currentDay &&
      currentTime >= s.startTime &&
      currentTime < s.endTime
    ) {
      return {
        status: "Live",
        schedule: s,
        remainingSchedules: schedules.length - 1,
      };
    }
  }

  // Priority 2: Find the next upcoming session this week.
  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  for (const s of sortedSchedules) {
    if (
      s.dayOfWeek > currentDay ||
      (s.dayOfWeek === currentDay && s.startTime > currentTime)
    ) {
      return {
        status: "Upcoming",
        schedule: s,
        remainingSchedules: schedules.length - 1,
      };
    }
  }

  // Priority 3: If no upcoming session is left this week, the next one is the first one next week.
  if (sortedSchedules.length > 0) {
    return {
      status: "Upcoming",
      schedule: sortedSchedules[0],
      remainingSchedules: schedules.length - 1,
    };
  }

  // Fallback (should be unreachable but is good practice).
  return { status: "None", schedule: null, remainingSchedules: 0 };
};

/**
 * Generates an array of time options for a dropdown.
 * This function remains unchanged as it deals with machine-readable 24-hour values.
 */
export const generateTimeOptions = (intervalInMinutes: number): string[] => {
  const options: string[] = [];
  const totalMinutesInDay = 24 * 60;
  for (let i = 0; i < totalMinutesInDay; i += intervalInMinutes) {
    const hours = Math.floor(i / 60);
    const minutes = i % 60;
    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
    options.push(formattedTime);
  }
  return options;
};

/**
 * Validates that an end time is strictly after a start time.
 * This function remains unchanged as it performs logic on 24h format.
 */
export const validateTimeOrder = (
  startTime: string,
  endTime: string
): boolean => {
  return endTime > startTime;
};

/**
 * Formats a Date object or string for <input type="datetime-local">.
 * This function remains unchanged.
 */
export const toDateTimeLocal = (date: Date | string | undefined): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats a schedule object into a short, readable string with AM/PM.
 * @returns A formatted string like "Mon 10:00 AM".
 */
export const formatScheduleTime = (
  schedule: { dayOfWeek: number; startTime: string },
  daysOfWeek: string[]
): string => {
  return `${daysOfWeek[schedule.dayOfWeek]} ${format24HourTo12Hour(
    schedule.startTime
  )}`;
};

/**
 * Formats an event time object into a short, readable string.
 * This function remains unchanged as toLocaleString already handles AM/PM.
 */
export const formatEventDisplayTime = (eventTime?: {
  start?: Date | string;
}): string => {
  if (!eventTime?.start) return "Date TBD";
  return new Date(eventTime.start).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Formats a full schedule object for detailed views with AM/PM.
 * @returns A formatted string like "Mon: 10:00 AM - 10:40 AM".
 */
export const formatFullSchedule = (
  schedule: { dayOfWeek: number; startTime: string; endTime: string },
  daysOfWeek: string[]
): string => {
  const startTime12 = format24HourTo12Hour(schedule.startTime);
  const endTime12 = format24HourTo12Hour(schedule.endTime);
  return `${daysOfWeek[schedule.dayOfWeek]}: ${startTime12} - ${endTime12}`;
};

/**
 * Formats a full event time object for detailed views.
 * This function remains unchanged.
 */
export const formatFullEventTime = (eventTime?: {
  start?: Date | string;
  end?: Date | string;
}): string => {
  if (!eventTime?.start || !eventTime.end)
    return "Date and time have not been set.";
  const start = new Date(eventTime.start);
  const end = new Date(eventTime.end);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })} from ${start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} to ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
  return `${start.toLocaleString(undefined, options)} to ${end.toLocaleString(
    undefined,
    options
  )}`;
};
