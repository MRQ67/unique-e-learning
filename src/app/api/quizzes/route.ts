import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { contentId, requiresProctoring, proctoringActive } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Create the quiz session
  const quizSession = await (prisma as any).quizSession.create({
    data: { 
      contentId, 
      userId: session.user.id, 
      requiresProctoring,
      proctoringActive: proctoringActive || false
    }
  });
  
  return NextResponse.json(quizSession);
}

export async function PATCH(req: Request) {
  const { sessionId, proctoringActive } = await req.json();
  const session = await (prisma as any).quizSession.update({
    where: { id: sessionId },
    data: { proctoringActive }
  });
  return NextResponse.json(session);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  if (sessionId) {
    const session = await (prisma as any).quizSession.findUnique({
      where: { id: sessionId },
      include: { events: true }
    });
    return NextResponse.json(session);
  }
  // List all sessions
  const sessions = await (prisma as any).quizSession.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      events: true
    }
  });
  return NextResponse.json(sessions);
}

export async function DELETE(req: Request) {
  const { sessionId } = await req.json();
  await (prisma as any).quizEvent.deleteMany({ where: { sessionId } });
  await (prisma as any).quizSession.delete({ where: { id: sessionId } });
  return NextResponse.json({});
}
