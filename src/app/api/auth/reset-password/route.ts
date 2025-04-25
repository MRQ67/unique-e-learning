import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ message: "Missing email" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond with success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "If that user exists, you'll receive an email" }, { status: 200 });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expires } });

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });

  return NextResponse.json({ message: "If that user exists, you'll receive an email" }, { status: 200 });
}
