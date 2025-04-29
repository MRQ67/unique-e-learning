import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ProctorDashboard from '@/components/ProctorDashboard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { examId: string; sessionId: string };
}

export default async function ProctorPage({ params }: { params: Promise<{ examId: string; sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
    redirect('/dashboard/student');
  }

  const { sessionId } = await params;
  return <ProctorDashboard sessionId={sessionId} />;
}
