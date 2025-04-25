import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function POST(req: Request) {
  const { title, description, duration, modules } = await req.json();
  // Temporarily allow any user: assign to first INSTRUCTOR
  const instructor = await (prisma as any).user.findFirst({
    where: { role: "INSTRUCTOR" },
    select: { id: true },
  });
  if (!instructor) {
    return NextResponse.json({ error: "No instructor user found" }, { status: 400 });
  }
  const course = await (prisma as any).course.create({
    data: {
      title,
      description,
      duration,
      instructorId: instructor.id,
      modules: {
        create: modules.map((mod: any) => ({
          title: mod.title,
          order: mod.order,
          contents: {
            create: mod.contents.map((ct: any) => ({
              type: ct.type,
              title: ct.title,
              url: ct.url,
              order: ct.order,
              meetingId: ct.meetingId,
              joinUrl: ct.joinUrl,
              startTime: ct.startTime ? new Date(ct.startTime) : undefined,
              duration: ct.duration,
            })),
          },
        })),
      },
    },
    include: { modules: { include: { contents: true } } },
  });
  return NextResponse.json(course);
}
