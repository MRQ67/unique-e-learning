import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create a new secure quiz content item
export async function POST(req: Request) {
  const { moduleId, title, questions, requiresProctoring = true } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Create the secure quiz content item
    const content = await (prisma as any).content.create({
      data: { 
        moduleId, 
        title, 
        type: 'QUIZ',
        url: '',
        requiresProctoring,
        order: 1
      }
    });
    
    // Create each question
    if (questions && questions.length > 0) {
      for (const question of questions) {
        // Find the correct option
        const correctOptionIndex = question.options.findIndex((opt: { isCorrect: any; }) => opt.isCorrect);
        
        // Extract just the text from options for storage
        const optionTexts = question.options.map((opt: { text: any; }) => opt.text);
        
        await (prisma as any).quizQuestion.create({
          data: {
            contentId: content.id,
            prompt: question.question,
            options: optionTexts,
            correctOption: correctOptionIndex >= 0 ? correctOptionIndex : 0,
            points: question.points || 1,
            explanation: question.explanation || ''
          }
        });
      }
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error creating secure quiz:', error);
    return NextResponse.json({ error: "Failed to create secure quiz" }, { status: 500 });
  }
}

// Add a question to an existing secure quiz
export async function PATCH(req: Request) {
  const { contentId, question } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Verify the content exists and is a quiz
    const content = await (prisma as any).content.findUnique({
      where: { id: contentId },
      select: { type: true }
    });
    
    if (!content || content.type !== 'QUIZ') {
      return NextResponse.json({ error: "Content not found or not a quiz" }, { status: 404 });
    }
    
    // Find the correct option
    const correctOptionIndex = question.options.findIndex((opt: { isCorrect: any; }) => opt.isCorrect);
    
    // Extract just the text from options for storage
    const optionTexts = question.options.map((opt: { text: any; }) => opt.text);
    
    // Add the question
    const newQuestion = await (prisma as any).quizQuestion.create({
      data: {
        contentId,
        prompt: question.question,
        options: optionTexts,
        correctOption: correctOptionIndex >= 0 ? correctOptionIndex : 0,
        points: question.points || 1,
        explanation: question.explanation || ''
      }
    });
    
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error adding question to secure quiz:', error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}

// Get questions for a secure quiz
export async function GET(req: Request) {
  const url = new URL(req.url);
  const contentId = url.searchParams.get('contentId');
  
  if (!contentId) {
    return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
  }
  
  try {
    // Get the quiz content and questions
    const content = await (prisma as any).content.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        title: true,
        type: true,
        requiresProctoring: true,
        module: {
          select: {
            courseId: true
          }
        }
      }
    });
    
    if (!content) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    
    const questions = await (prisma as any).quizQuestion.findMany({
      where: { contentId }
    });
    
    // Transform questions to match our enhanced format
    const formattedQuestions = questions.map((q: { id: any; prompt: any; points: any; explanation: any; options: string[]; correctOption: number; }) => ({
      id: q.id,
      question: q.prompt,
      points: q.points || 1,
      explanation: q.explanation || '',
      options: q.options.map((opt: string, index: number) => ({
        id: `opt-${q.id}-${index}`,
        text: opt,
        isCorrect: index === q.correctOption
      }))
    }));
    
    return NextResponse.json({
      ...content,
      courseId: content.module?.courseId,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Error fetching secure quiz:', error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}