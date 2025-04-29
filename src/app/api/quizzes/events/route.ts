import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { sessionId, type } = await req.json();
  if (!sessionId || !type) {
    return NextResponse.json({ error: 'sessionId and type required' }, { status: 400 });
  }
  const event = await (prisma as any).quizEvent.create({
    data: { sessionId, type }
  });
  return NextResponse.json(event);
}
