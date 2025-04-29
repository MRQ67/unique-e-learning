import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Clean up completed or expired sessions
  // First find sessions that need to be deleted
  const sessionsToDelete = await (prisma as any).examSession.findMany({
    where: {
      OR: [
        { completed: true },
        { endedAt: { not: null } },
        { startedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } }
      ]
    },
    select: { id: true }
  });
  
  // Delete related events first to avoid foreign key constraint errors
  if (sessionsToDelete.length > 0) {
    const sessionIds = sessionsToDelete.map((s: { id: string }) => s.id);
    
    // Delete related events first
    await (prisma as any).examSessionEvent.deleteMany({
      where: { sessionId: { in: sessionIds } }
    });
    
    // Then delete the sessions
    await (prisma as any).examSession.deleteMany({
      where: { id: { in: sessionIds } }
    });
  }
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const examId = searchParams.get('examId');
  
  if (sessionId) {
    const examSession = await (prisma as any).examSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { include: { questions: true } },
        events: true
      },
    });
    return NextResponse.json(examSession);
  }
  
  if (examId) {
    // Get sessions for a specific exam for the current user
    const examSessions = await (prisma as any).examSession.findMany({
      where: { 
        examId,
        userId: session.user.id
      },
      include: {
        exam: { select: { id: true, title: true } }
      },
    });
    return NextResponse.json(examSessions);
  }
  const where = session.user.role === 'INSTRUCTOR'
    ? { exam: { instructorId: session.user.id } }
    : { userId: session.user.id };
  const sessions = await (prisma as any).examSession.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      exam: { select: { id: true, title: true } },
      events: true
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const { examId } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Delete older session(s) for same exam & user
  // First find sessions to delete
  const oldSessions = await (prisma as any).examSession.findMany({ 
    where: { examId, userId: session.user.id },
    select: { id: true }
  });
  
  if (oldSessions.length > 0) {
    const sessionIds = oldSessions.map((s: { id: string }) => s.id);
    
    // Delete related events first
    await (prisma as any).examSessionEvent.deleteMany({
      where: { sessionId: { in: sessionIds } }
    });
    
    // Then delete the sessions
    await (prisma as any).examSession.deleteMany({
      where: { id: { in: sessionIds } }
    });
  }
  const examSession = await (prisma as any).examSession.create({
    data: {
      examId,
      userId: session.user.id,
      requiresProctoring: true,
      proctoringActive: false,
    },
  });
  return NextResponse.json(examSession);
}

export async function PATCH(req: Request) {
  const { sessionId, proctoringActive } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data: any = { proctoringActive };
  if (!proctoringActive) {
    data.endedAt = new Date();
    // Get exam session to check completion
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: true
      }
    }) as (Prisma.ExamSessionGetPayload<{ include: { exam: true } }> & { completed: boolean }) | null;
    if (examSession && examSession.completed === true) {
      // Clean up completed session
      // First delete related events to avoid foreign key constraint errors
      await prisma.examSessionEvent.deleteMany({
        where: { sessionId: sessionId }
      });
      
      // Then delete the session
      await prisma.examSession.delete({
        where: { id: sessionId }
      });
    }
  } else {
    data.endedAt = null;
  }
  const updated = await (prisma as any).examSession.update({
    where: { id: sessionId },
    data,
    include: {
      exam: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });
  return NextResponse.json(updated);
}
