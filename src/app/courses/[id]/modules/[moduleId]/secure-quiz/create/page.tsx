'use client';

import { useParams } from 'next/navigation';
import SecureQuizCreator from '@/components/SecureQuizCreator';
import { Suspense } from 'react';

export default function CreateSecureQuizPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create Secure Quiz</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SecureQuizCreator 
          moduleId={moduleId} 
          courseId={courseId} 
        />
      </Suspense>
    </div>
  );
}