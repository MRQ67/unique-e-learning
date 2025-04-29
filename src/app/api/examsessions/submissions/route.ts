import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { sessionId, answers } = await req.json();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify the session belongs to the user
  const examSession = await (prisma as any).examSession.findUnique({
    where: { id: sessionId },
    include: { exam: { include: { questions: true } } }
  });
  
  if (!examSession) {
    return NextResponse.json({ error: 'Exam session not found' }, { status: 404 });
  }
  
  if (examSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Calculate score
  const questions = examSession.exam.questions;
  let correctAnswers = 0;
  let totalQuestions = questions.length;
  
  for (const questionId in answers) {
    const question = questions.find((q: any) => q.id === questionId);
    if (question && question.correctOption === answers[questionId]) {
      correctAnswers++;
    }
  }
  
  const score = (correctAnswers / totalQuestions) * 100;
  
  // Update the exam session with submission data
  const updatedSession = await (prisma as any).examSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      proctoringActive: false,
      answers: answers,
      score: score,
      completed: true
    }
  });
  
  return NextResponse.json({
    sessionId: updatedSession.id,
    score: score,
    correctAnswers,
    totalQuestions
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!sessionId) {
    // Get all submissions for the user
    const submissions = await (prisma as any).examSession.findMany({
      where: {
        userId: session.user.id,
        completed: true
      },
      include: {
        exam: { select: { id: true, title: true } }
      }
    });
    return NextResponse.json(submissions);
  }
  
  // Get a specific submission
  const submission = await (prisma as any).examSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: { include: { questions: true } }
    }
  });
  
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }
  
  // Check if the user is authorized to view this submission
  if (submission.userId !== session.user.id && 
      session.user.role !== 'INSTRUCTOR' && 
      session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.json(submission);
}