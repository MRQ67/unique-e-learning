import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { moduleId, title, type, requiresProctoring, questions, url, order } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Create the content item
    const content = await (prisma as any).content.create({
      data: { 
        moduleId, 
        title, 
        type,
        url: url || '',
        order: order || 1
      }
    });
    
    // If this is a quiz with questions, create the questions
    if (type === 'QUIZ' && questions && questions.length > 0) {
      // Create each question
      for (const question of questions) {
        await (prisma as any).quizQuestion.create({
          data: {
            contentId: content.id,
            prompt: question.question,
            options: question.options,
            correctOption: question.options.indexOf(question.answer)
          }
        });
      }
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const contentId = url.searchParams.get('contentId');
  
  if (!contentId) {
    return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
  }
  
  try {
    const content = await (prisma as any).content.findUnique({
      where: { id: contentId },
      include: {
        questions: true
      }
    });
    
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}