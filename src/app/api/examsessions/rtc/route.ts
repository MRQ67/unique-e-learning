import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// This endpoint handles WebRTC signaling for video streaming
// between students taking exams and instructors proctoring them

// GET method for polling for WebRTC signals
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type');
    
    if (!sessionId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true } },
        exam: { select: { instructorId: true } }
      }
    });

    if (!examSession) {
      return NextResponse.json(
        { error: 'Exam session not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would retrieve the latest signal from a database or cache
    // For this example, we'll return a mock response
    // This would be replaced with actual signal retrieval logic
    
    // Retrieve the latest signal from the database based on type
    const latestSignal = await prisma.examSessionEvent.findFirst({
      where: {
        sessionId,
        type: `rtc-${type}`,
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 1
    });
    
    // Extract signal data from the event metadata if available
    const signalData = latestSignal?.metadata ? JSON.parse(JSON.stringify(latestSignal.metadata)).signal : null;
    
    return NextResponse.json({
      success: true,
      sessionId,
      type,
      signal: signalData,
      userId: session.user.id,
      isInstructor: session.user.id === examSession.exam.instructorId,
      isStudent: session.user.id === examSession.user.id
    });
  } catch (error) {
    console.error('Error retrieving WebRTC signal:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve WebRTC signal' },
      { status: 500 }
    );
  }
}

// POST method for sending WebRTC signals
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, signal, type } = await req.json();
    
    if (!sessionId || !signal || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the exam session exists
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true } },
        exam: { select: { instructorId: true } }
      }
    });

    if (!examSession) {
      return NextResponse.json(
        { error: 'Exam session not found' },
        { status: 404 }
      );
    }

    // Store the WebRTC signal in the database or use a real-time service
    // For simplicity, we'll just echo it back in this example
    // In a real implementation, you would use WebSockets or a service like Pusher
    
    // Store the WebRTC signal in the database with metadata
    await prisma.examSessionEvent.create({
      data: {
        sessionId,
        type: `rtc-${type}`,
        timestamp: new Date(),
        metadata: { signal } as any, // Store the signal in metadata
      },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      signal,
      type,
      // Include additional info based on signal type
      userId: session.user.id,
      isInstructor: session.user.id === examSession.exam.instructorId,
      isStudent: session.user.id === examSession.user.id
    });
  } catch (error) {
    console.error('Error handling WebRTC signal:', error);
    return NextResponse.json(
      { error: 'Failed to process WebRTC signal' },
      { status: 500 }
    );
  }
}