import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.pathname.split('/').pop()!;
  const { newPassword } = await request.json();
  if (!newPassword) {
    return NextResponse.json({ message: "Missing new password" }, { status: 400 });
  }
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { hashedPassword: hashed } });
  await prisma.passwordResetToken.delete({ where: { id: record.id } });
  return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
}
