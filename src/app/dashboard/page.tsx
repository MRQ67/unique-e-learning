import prisma from "@/lib/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CourseCatalogue, { CourseWithInstructor } from "@/components/CourseCatalogue";
import Navbar from "@/components/Navbar";

// Removed CourseCreationForm import to hide top form; using modal trigger instead

export const revalidate = 60;
export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Dashboard",
  description: "Browse courses",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let isInstructor = false;
  if (session?.user?.email) {
    const dbUser = await (prisma as any).user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });
    isInstructor = dbUser && (dbUser.role === "INSTRUCTOR" || dbUser.role === "ADMIN");
  }
  const courses = await (prisma as any).course.findMany({
    include: { instructor: { select: { name: true } } },
  }) as CourseWithInstructor[];

  return (
    <>
      <Navbar title="Dashboard" />
      <div className="max-w-3xl mx-auto mt-20 px-4 space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-4">Course Catalogue</h1>
          <CourseCatalogue courses={courses} />
        </section>
      </div>
    </>
  );
}
