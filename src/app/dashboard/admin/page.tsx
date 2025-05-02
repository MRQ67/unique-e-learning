import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';


import DashboardLayout from '../layout';
import { NavItem } from '@/components/ui/types';

const adminNavItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard" },
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/settings", label: "Settings" },
  { href: "/courses", label: "Courses" },
  { href: "/exams", label: "Exams" },
];

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/auth/signin');
  if (session.user.role !== 'ADMIN') return redirect('/dashboard/student');

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="max-w-4xl mx-auto mt-20 space-y-8">
        <p>Welcome, Admin! Your features will appear here.</p>
      </div>
    </DashboardLayout>
  );
}
