"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  CalendarClock,
  FlaskConical,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { daysOfWeekValues } from "@/lib/utils/constants";
import { generateTimeOptions, validateTimeOrder } from "@/lib/utils/time";
import { ISchedule } from "@/lib/models/Group.model";

const timeOptions = generateTimeOptions(40);

export function CreateGroupDialog() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [capacity, setCapacity] = useState(65);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupType, setGroupType] = useState<"Class" | "Lab" | "Event">(
    "Class"
  );
  const [schedules, setSchedules] = useState<ISchedule[]>([
    { dayOfWeek: 1, startTime: "10:00", endTime: "10:40" },
  ]);
  const [eventTime, setEventTime] = useState({ start: "", end: "" });
  const [error, setError] = useState("");

  const handleAddSchedule = () => {
    setSchedules([
      ...schedules,
      { dayOfWeek: 1, startTime: "10:00", endTime: "10:40" },
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ISchedule,
    value: string | number
  ) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required.");
      setIsSubmitting(false);
      return;
    }
    if (capacity < 1) {
      setError("Capacity must be at least 1.");
      setIsSubmitting(false);
      return;
    }
    if (groupType === "Class" || groupType === "Lab") {
      if (schedules.length === 0) {
        setError("At least one schedule is required for a class or lab.");
        setIsSubmitting(false);
        return;
      }
      for (const s of schedules) {
        if (!validateTimeOrder(s.startTime, s.endTime)) {
          setError(
            `Invalid time for ${
              daysOfWeekValues[s.dayOfWeek]?.label
            }. End time must be after start time.`
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    if (groupType === "Event") {
      if (!eventTime.start) {
        setError("Event start time is required.");
        setIsSubmitting(false);
        return;
      }
      if (!eventTime.end) {
        setError("Event end time is required.");
        setIsSubmitting(false);
        return;
      }
      if (new Date(eventTime.end) <= new Date(eventTime.start)) {
        setError("Event end time must be after the start time.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload: {
      groupName: string;
      description: string;
      capacity: number;
      groupType: "Class" | "Lab" | "Event";
      schedules?: ISchedule[];
      eventTime?: { start: string; end: string };
    } = {
      groupName,
      description,
      capacity,
      groupType,
    };
    if (groupType === "Class" || groupType === "Lab") {
      payload.schedules = schedules;
    } else {
      payload.eventTime = eventTime;
    }
    console.log("Payload for update:", payload);
    try {
      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success(`Group "${data.group.groupName}" has been created.`);

      setOpen(false);
      setGroupName("");
      setDescription("");
      setCapacity(65);
      setGroupType("Class");
      setSchedules([{ dayOfWeek: 1, startTime: "10:00", endTime: "10:40" }]);
      setEventTime({ start: "", end: "" });
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
      toast.error((err as Error).message || "Failed to create group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription>
              Choose a group type and fill in the details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[65vh] overflow-y-auto pr-4 scrollbar-hide">
            {/* --- GROUP TYPE SELECTION --- */}
            <div className="space-y-2">
              <Label>Group Type</Label>
              <RadioGroup
                value={groupType}
                onValueChange={(value) =>
                  setGroupType(value as "Class" | "Lab" | "Event")
                }
                className="grid grid-cols-3 md:gap-4 gap-2 text-center"
              >
                <div>
                  <RadioGroupItem
                    value="Class"
                    id="class"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="class"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-5 w-5" />
                      <span>Class</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      Recurring schedule
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="Lab"
                    id="lab"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="lab"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-1">
                      <FlaskConical className="h-5 w-5" />
                      <span>Lab</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      Recurring schedule
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="Event"
                    id="event"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="event"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex items-center gap-1">
                      <CalendarClock className="h-5 w-5" />
                      <span>Event</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      One-time occurrence
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., CS101 - Fall Semester"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Section B, Main Auditorium"
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min="1"
                disabled={isSubmitting}
              />
            </div>

            {/* --- CONDITIONAL SCHEDULE INPUTS --- */}
            {groupType === "Class" || groupType === "Lab" ? (
              <div className="space-y-4">
                <Label>Weekly Schedule</Label>
                {schedules.map((s, index) => (
                  <div
                    key={index}
                    className="flex flex-row items-center gap-2 "
                  >
                    <Select
                      value={String(s.dayOfWeek)}
                      onValueChange={(value) =>
                        handleScheduleChange(index, "dayOfWeek", Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeekValues.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={s.startTime}
                      onValueChange={(value) =>
                        handleScheduleChange(index, "startTime", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={s.endTime}
                      onValueChange={(value) =>
                        handleScheduleChange(index, "endTime", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {schedules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSchedule(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSchedule}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventStart">Start Time</Label>
                  <Input
                    id="eventStart"
                    type="datetime-local"
                    value={eventTime.start}
                    onChange={(e) =>
                      setEventTime({ ...eventTime, start: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventEnd">End Time</Label>
                  <Input
                    id="eventEnd"
                    type="datetime-local"
                    value={eventTime.end}
                    onChange={(e) =>
                      setEventTime({ ...eventTime, end: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center mb-4">{error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-[40%]">
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
