import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: true },
  });
  if (!exam) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return NextResponse.json(exam);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { title, description, questions } = await req.json();
  const { id } = await params;
  const updated = await prisma.exam.update({
    where: { id },
    data: {
      title,
      description,
      questions: {
        deleteMany: {},
        create: questions.map((q: any) => ({
          prompt: q.prompt,
          options: q.options,
          correctOption: q.correctOption,
        })),
      },
    },
    include: { questions: true },
  });
  return NextResponse.json(updated);
}
