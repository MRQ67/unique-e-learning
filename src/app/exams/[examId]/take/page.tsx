import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SecureExamTaker from '@/components/SecureExamTaker';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { examId: string };
}

export default async function TakeExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const { examId } = await params;
  return <SecureExamTaker examId={examId} studentId={session.user.id} />;
}
