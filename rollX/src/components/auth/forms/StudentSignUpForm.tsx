"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function StudentSignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [universityRollNo, setUniversityRollNo] = useState("");
  const [classRollNo, setClassRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Student",
          fullName,
          universityName,
          universityRollNo,
          classRollNo,
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "An unexpected error occurred.");
      }
      router.push("/signIn");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-center text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isLoading}
          placeholder="John Doe"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="universityName">University Name</Label>
          <Input
            id="universityName"
            type="text"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            required
            disabled={isLoading}
            placeholder="State University"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="universityRollNo">University Roll No.</Label>
          <Input
            id="universityRollNo"
            type="text"
            value={universityRollNo}
            onChange={(e) => setUniversityRollNo(e.target.value)}
            required
            disabled={isLoading}
            placeholder="SU/CS/2021/001"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="classRollNo">Class Roll No. (Optional)</Label>
        <Input
          id="classRollNo"
          type="text"
          value={classRollNo}
          onChange={(e) => setClassRollNo(e.target.value)}
          disabled={isLoading}
          placeholder="25"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder="john.doe@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
            placeholder="********"
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
