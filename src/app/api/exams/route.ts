import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let where = {};
  if (session.user.role === 'INSTRUCTOR') {
    where = { instructorId: session.user.id };
  }
  const exams = await (prisma as any).exam.findMany({
    where,
    include: { questions: true },
  });
  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  const { title, description, questions } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const exam = await (prisma as any).exam.create({
    data: {
      title,
      description,
      instructorId: session.user.id,
      questions: {
        create: questions.map((q: any) => {
          const opts = Array.isArray(q.choices) ? q.choices.map((c: any) => c.text) : [];
          const correct = Array.isArray(q.choices) ? q.choices.find((c: any) => c.correct) : undefined;
          
          // Find the index of the correct option
          const correctIndex = correct 
            ? opts.findIndex((opt: string) => opt === correct.text)
            : 0; // Default to first option if no correct answer specified
          
          return {
            prompt: q.label,
            options: opts,
            correctOption: correctIndex >= 0 ? correctIndex : 0, // Ensure it's a valid index
          };
        }),
      },
    },
    include: { questions: true },
  });
  return NextResponse.json(exam);
}
