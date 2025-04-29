import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  const courses = await (prisma as any).course.findMany({
    include: { instructor: { select: { name: true } } }
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const { title, description, duration, modules } = await req.json();
  
  // Get the authenticated user from the session
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('@/lib/auth');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Ensure the user is an instructor
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Only instructors can create courses" }, { status: 403 });
  }

  // Prepare modules data, only include contents if provided
  const modulesData = Array.isArray(modules)
    ? modules.map((mod: any) => {
        const filteredContents = Array.isArray(mod.contents)
          ? mod.contents.filter((ct: any) => ct.type && ct.title)
          : [];
        const moduleObj: any = { title: mod.title, order: mod.order };
        if (filteredContents.length > 0) {
          moduleObj.contents = {
            create: filteredContents.map((ct: any) => ({
              type: ct.type,
              title: ct.title,
              url: ct.url,
              order: ct.order,
              meetingId: ct.meetingId,
              joinUrl: ct.joinUrl,
              startTime: ct.startTime ? new Date(ct.startTime) : undefined,
              duration: ct.duration,
            })),
          };
        }
        return moduleObj;
      })
    : [];

  const course = await (prisma as any).course.create({
    data: {
      title,
      description,
      duration,
      instructorId: session.user.id,
      modules: { create: modulesData },
    },
    include: { modules: { include: { contents: true } } },
  });
  return NextResponse.json(course);
}
