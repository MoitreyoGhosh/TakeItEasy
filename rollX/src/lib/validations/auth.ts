import { z } from "zod";

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters long."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    role: z.enum(["Student", "Host"], { message: "A role must be selected." }),

    // Student-specific fields (optional at the top level)
    universityName: z.string().optional(),
    universityRollNo: z.string().optional(),
    classRollNo: z.string().optional(),

    // Host-specific fields (optional at the top level)
    organizationName: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .refine(
    (data) => {
      // If role is Student, the student-specific fields become required
      if (data.role === "Student") {
        return !!data.universityName && !!data.universityRollNo;
      }
      return true;
    },
    {
      message: "University Name and Roll No. are required for students.",
      path: ["universityRollNo"], // Path to show the error on
    }
  )
  .refine(
    (data) => {
      // If role is Host, the host-specific fields become required
      if (data.role === "Host") {
        return !!data.organizationName;
      }
      return true;
    },
    {
      message: "Organization Name is required for hosts.",
      path: ["organizationName"],
    }
  );

export const profileCompletionSchema = z
  .object({
    role: z.enum(["Student", "Host"], {
      message: "Role selection is required.",
    }),

    // Student-specific fields
    universityName: z.string().optional(),
    universityRollNo: z.string().optional(),
    classRollNo: z.string().optional(),

    // Host-specific fields
    organizationName: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .refine(
    (data) => {
      // If role is Student, the student-specific fields become required
      if (data.role === "Student") {
        return (
          !!data.universityName &&
          data.universityName.length > 1 &&
          !!data.universityRollNo &&
          data.universityRollNo.length > 1
        );
      }
      return true;
    },
    {
      message:
        "University Name and University Roll No. are required for students.",
      path: ["universityRollNo"], // Show error on this field
    }
  )
  .refine(
    (data) => {
      // If role is Host, the host-specific fields become required
      if (data.role === "Host") {
        return !!data.organizationName && data.organizationName.length > 1;
      }
      return true;
    },
    {
      message: "Organization Name is required for hosts.",
      path: ["organizationName"],
    }
  );
