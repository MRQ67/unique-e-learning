import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "User already exists" }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, hashedPassword, name },
  });
  return NextResponse.json({ message: "User created" }, { status: 201 });
}
