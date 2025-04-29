import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import InstructorSessions from '@/components/InstructorSessions';
import CourseCreationModal from '@/components/CourseCreationModal';
import ExamCreationModal from '@/components/ExamCreationModal';
import InstructorCourses from '@/components/InstructorCourses';
import prisma from '@/lib/prismadb';
import { Card, CardHeader, CardFooter, CardContent, CardTitle } from '@/components/ui/card';
import ExamEditModal from '@/components/ExamEditModal';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Instructor Dashboard',
  description: 'Manage your quiz proctoring sessions',
};

export default async function InstructorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/auth/signin');
  }
  const role = session.user.role;
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    return redirect('/dashboard/student');
  }

  // @ts-ignore Prisma client needs regeneration for Exam model
  const examsList = await (prisma as any).exam.findMany({ where: { instructorId: session.user.id } });

  return (
    <>
      <Navbar title="Instructor Dashboard" />
      <div className="max-w-4xl mx-auto mt-20 space-y-10">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">My Courses</h1>
            <div className="flex space-x-2">
              <CourseCreationModal />
              <ExamCreationModal />
            </div>
          </div>
          <InstructorCourses instructorId={session.user.id} />
        </section>
        
        <section>
          <h1 className="text-2xl font-semibold">Quiz Proctoring Sessions</h1>
          <InstructorSessions />
        </section>

        <section>
          <h1 className="text-2xl font-semibold">My Exams</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examsList.map((exam: any) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                </CardHeader>
                {exam.description && (
                  <CardContent>{exam.description}</CardContent>
                )}
                <CardFooter>
                  <ExamEditModal examId={exam.id} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
