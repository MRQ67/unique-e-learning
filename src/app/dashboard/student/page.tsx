import prisma from "@/lib/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CourseCatalogue, { CourseWithInstructor } from "@/components/CourseCatalogue";

import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import StartExamButton from './StartExamButton';

export const revalidate = 60;
export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Student Dashboard",
  description: "Browse courses",
};

import DashboardLayout from '../layout';
import { NavItem } from '@/components/ui/types';

const studentNavItems: NavItem[] = [
  { href: "/dashboard/student", label: "Dashboard" },
  { href: "/dashboard/student/results", label: "Results" },
  { href: "/courses", label: "Courses" },
  { href: "/exams", label: "Exams" },
];

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  const courses = await (prisma as any).course.findMany({
    include: { instructor: { select: { name: true } } },
  }) as CourseWithInstructor[];
  // @ts-ignore Prisma client regen needed for Exam and ExamSession models
  const examsList = await (prisma as any).exam.findMany();
  const examSessions = await (prisma as any).examSession.findMany({
    where: { userId: session.user.id },
    include: { exam: { select: { title: true } }, events: true },
  });
  const waitingSessions = examSessions.filter((s: any) => s.requiresProctoring && !s.proctoringActive);
  const activeSessions = examSessions.filter((s: any) => s.proctoringActive);

  return (
    <DashboardLayout navItems={studentNavItems}>
      <div className="max-w-3xl mx-auto mt-20 px-4 space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-4">Course Catalogue</h1>
          <CourseCatalogue courses={courses} userRole="STUDENT" />
        </section>
        <section>
          <h1 className="text-3xl font-bold mb-4">Available Exams</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examsList.map((exam: any) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                </CardHeader>
                {exam.description && <CardContent>{exam.description}</CardContent>}
                <CardFooter>
                  <StartExamButton examId={exam.id} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">My Exam Sessions</h1>
            <Link href="/dashboard/student/results">
              <Button variant="outline" className="flex items-center gap-2">
                View Results <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold">Waiting for Proctoring ({waitingSessions.length})</h2>
              {waitingSessions.length === 0 ? (
                <p>No exam sessions awaiting proctoring</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {waitingSessions.map((s: any) => (
                    <Card key={s.id}>
                      <CardHeader>
                        <CardTitle>{s.exam.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Waiting for your instructor to start proctoring.</p>
                        <p className="text-sm text-gray-500">Session ID: {s.id}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Active Proctoring Sessions ({activeSessions.length})</h2>
              {activeSessions.length === 0 ? (
                <p>No active exam sessions</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSessions.map((s: any) => (
                    <Card key={s.id} className={s.events.length > 0 ? 'border-red-300' : ''}>
                      <CardHeader>
                        <CardTitle>{s.exam.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {s.events.length > 0 && (
                          <p className="text-red-600">Security warnings: {s.events.length}</p>
                        )}
                        <p className="text-sm text-green-700">Proctoring Active</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
