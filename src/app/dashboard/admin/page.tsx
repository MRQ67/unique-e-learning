import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect('/auth/signin');
  if (session.user.role !== 'ADMIN') return redirect('/dashboard/student');

  return (
    <>
      <Navbar title="Admin Dashboard" />
      <div className="max-w-4xl mx-auto mt-20 space-y-8">
        <p>Welcome, Admin! Your features will appear here.</p>
      </div>
    </>
  );
}
