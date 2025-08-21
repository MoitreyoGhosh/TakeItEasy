import "next-auth";
import "next-auth/jwt";

// Extending the built-in session and token types with our custom fields.
declare module "next-auth" {
  // Extends the built-in session type.
  interface Session {
    user: {
      id: string;
      role: "Student" | "Host" | null;
      profileComplete: boolean;
    } & DefaultSession["user"]; // This includes the default fields like name, email, image
  }

  // Extends the built-in user type.
  interface User {
    _id?: string;
    role: "Student" | "Host" | null;
    profileComplete: boolean;
    // This allows us to access the populated profile from the `authorize` function
    profile?: {
      fullName: string;
    };
  }
}

declare module "next-auth/jwt" {
  // Extends the built-in JWT token type.
  interface JWT {
    id: string;
    role: "Student" | "Host" | null;
    profileComplete: boolean;
    // Adding the user's name directly to the token for efficiency
    name: string;
  }
}
