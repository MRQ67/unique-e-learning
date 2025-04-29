import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ExamResults from '@/components/ExamResults';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Exam Results',
  description: 'View your exam results and performance',
};

export default async function ExamResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect('/auth/signin');
  }
  
  return (
    <>
      <Navbar title="Exam Results" />
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <ExamResults />
      </div>
    </>
  );
}