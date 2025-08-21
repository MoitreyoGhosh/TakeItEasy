import { NextAuthOptions } from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User.model";
import { connectToDatabase } from "@/lib/db";

interface Credentials {
  email: string;
  password: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Credentials | undefined
      ): Promise<NextAuthUser | null> {
        if (!credentials) return null;

        await connectToDatabase();

        // 1. Find the user and explicitly request the password field.
        const user = await UserModel.findOne({
          email: credentials.email,
        })
          .select("+password")
          .populate("profile");

        if (!user) {
          throw new Error("No user found with this email.");
        }

        // 2. Check if a password is set for this account.
        if (!user.password) {
          // This is a pure Google account. Throw a specific error key
          // for the frontend to catch and display a custom UI.
          throw new Error("GOOGLE_ACCOUNT_NO_PASSWORD");
        }

        // 3. If a password exists, proceed with the comparison, regardless of the provider.
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password.");
        }

        // 4. If password is correct, the user is authenticated.
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.profile?.fullName || user.email, // Add a fallback for name
          role: user.role,
          profileComplete: user.profileComplete,
        } as unknown as NextAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        await connectToDatabase();
        if (account.provider === "google") {
          let dbUser = await UserModel.findOne({ email: user.email });
          if (!dbUser) {
            dbUser = await new UserModel({
              email: user.email,
              provider: "google",
              role: null,
              profileComplete: false,
            }).save({ validateBeforeSave: false });
          }
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.profileComplete = dbUser.profileComplete;
        } else if (account.provider === "credentials") {
          if (user._id) {
            token.id = user._id.toString();
          }
          token.role = user.role;
          token.profileComplete = user.profileComplete;
        }
      }

      if (token?.id) {
        const dbUser = await UserModel.findById(token.id);
        if (dbUser) {
          token.role = dbUser.role;
          token.profileComplete = dbUser.profileComplete;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "Student" | "Host" | null;
        session.user.profileComplete = token.profileComplete as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signIn",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
