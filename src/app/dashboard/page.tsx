import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Removed CourseCreationForm import to hide top form; using modal trigger instead

export const revalidate = 60;
export const dynamic = 'force-dynamic';
export const metadata = {
  title: "Dashboard",
  description: "Browse courses",
};

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/auth/signin');
  }
  const role = session.user.role;
  if (role === 'ADMIN') {
    return redirect('/dashboard/admin');
  } else if (role === 'INSTRUCTOR') {
    return redirect('/dashboard/instructor');
  } else {
    return redirect('/dashboard/student');
  }
}
