import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const courseId = params.id;
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const course = await (prisma as any).course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            contents: { orderBy: { order: 'asc' } }
          }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    // For instructors, return full course details
    if (session.user.role === 'INSTRUCTOR' || session.user.role === 'ADMIN') {
      // If instructor is the course owner or an admin, return full details
      if (course.instructor.id === session.user.id || session.user.role === 'ADMIN') {
        return NextResponse.json(course);
      }
    }
    
    // For students or other instructors, return course without sensitive data
    return NextResponse.json({
      ...course,
      // Remove any sensitive information if needed
    });
    
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const courseId = params.id;
  const { title, description, duration, modules } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Verify course ownership
  const course = await (prisma as any).course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });
  
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  // Only allow the instructor who created the course or an admin to update it
  if (course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Not authorized to update this course" }, { status: 403 });
  }
  
  try {
    const updatedCourse = await (prisma as any).course.update({
      where: { id: courseId },
      data: { title, description, duration },
      include: { modules: { include: { contents: true } } }
    });
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const courseId = params.id;
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Verify course ownership
  const course = await (prisma as any).course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });
  
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  // Only allow the instructor who created the course or an admin to delete it
  if (course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Not authorized to delete this course" }, { status: 403 });
  }
  
  try {
    // First, find all modules and contents associated with this course
    const courseWithModules = await (prisma as any).course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            contents: {
              include: {
                quizSessions: {
                  include: {
                    events: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!courseWithModules) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Delete all related records in the correct order to avoid foreign key constraint violations
    // First, delete all quiz events for all sessions
    for (const module of courseWithModules.modules) {
      for (const content of module.contents) {
        if (content.quizSessions && content.quizSessions.length > 0) {
          // Delete all quiz events first
          await (prisma as any).quizEvent.deleteMany({
            where: {
              sessionId: {
                in: content.quizSessions.map((session: any) => session.id)
              }
            }
          });
          
          // Then delete the quiz sessions
          await (prisma as any).quizSession.deleteMany({
            where: {
              contentId: content.id
            }
          });
        }
      }
    }
    
    // Now delete all contents for each module
    for (const module of courseWithModules.modules) {
      await (prisma as any).content.deleteMany({
        where: {
          moduleId: module.id
        }
      });
    }
    
    // Delete all modules
    await (prisma as any).module.deleteMany({
      where: {
        courseId: courseId
      }
    });
    
    // Finally delete the course
    await (prisma as any).course.delete({
      where: { id: courseId }
    });
    
    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}