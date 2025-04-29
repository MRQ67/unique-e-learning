'use client';

import { useParams } from 'next/navigation';
import ProctoringDashboard from '@/components/ProctoringDashboard';
import { Suspense } from 'react';

export default function ProctoringSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Quiz Proctoring Session</h1>
      <Suspense fallback={<div>Loading proctoring dashboard...</div>}>
        <ProctoringDashboard sessionId={sessionId} />
      </Suspense>
    </div>
  );
}