import nodemailer from "nodemailer";

// Define the transport configuration using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Sends a password reset email to a user.
 * @param to The recipient's email address.
 * @param token The unique, un-hashed password reset token.
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM, // e.g., '"takeiteasy" <no-reply@yourdomain.com>'
    to: to,
    subject: "Reset Your Password for takeiteasy",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the button below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>This link is valid for 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully.");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email.");
  }
}

/**
 * Sends an email to a Google user to create a password for their account.
 * @param to The recipient's email address.
 * @param token The unique, un-hashed token.
 */
export async function sendCreatePasswordEmail(to: string, token: string) {
  const createUrl = `${process.env.NEXTAUTH_URL}/create-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: "Create a Password for your takeiteasy Account",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Create a Password</h2>
        <p>You are receiving this email because you requested to add password sign-in to your Google-based account.</p>
        <p>Please click on the button below to set a new password:</p>
        <a href="${createUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Create Password</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link is valid for 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Create password email sent successfully.");
  } catch (error) {
    console.error("Error sending create password email:", error);
    throw new Error("Failed to send create password email.");
  }
}
