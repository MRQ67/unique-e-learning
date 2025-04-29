'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SecureQuizTaker from '@/components/SecureQuizTaker';
import { Suspense } from 'react';

export default function QuizSessionPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const sessionId = params.sessionId as string;
  
  // Fetch the current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      return res.json();
    },
  });

  // Fetch the session details to get the quiz ID
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['quiz-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/quizzes/session/${sessionId}`);
      return res.json();
    },
    enabled: !!sessionId,
  });

  if (isLoading || sessionLoading) {
    return <div className="container py-6">Loading quiz session...</div>;
  }

  if (!user) {
    return <div className="container py-6">Please log in to take this quiz.</div>;
  }

  if (!session) {
    return <div className="container py-6">Quiz session not found.</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Secure Quiz Session</h1>
      <Suspense fallback={<div>Loading quiz...</div>}>
        <SecureQuizTaker 
          quizId={session.contentId} 
          sessionId={sessionId} 
          studentId={user.id} 
        />
      </Suspense>
    </div>
  );
}