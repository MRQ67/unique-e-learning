'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import QuizEngine, { type QuizQuestion } from '@/components/QuizEngine';

export default function CourseQuizPage() {
  const params = useParams() as { courseId: string };
  const { courseId } = params;
  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  // Create quiz session when contentId is available
  useEffect(() => {
    if (!sessionId && contentId) {
      fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, requiresProctoring: true, proctoringActive: false }),
      })
        .then(res => res.json())
        .then(data => setSessionId(data.id))
        .catch(err => console.error('Failed to start quiz session', err));
    }
  }, [contentId, sessionId]);

  // Poll session status until instructor starts proctoring
  useQuery({
    queryKey: ['quiz-session', sessionId],
    queryFn: () =>
      sessionId
        ? fetch(`/api/quizzes?sessionId=${sessionId}`).then(res => res.json())
        : Promise.resolve(null),
    enabled: !!sessionId && !sessionActive,
    refetchInterval: sessionActive ? false : 2000,
    select: (data: { proctoringActive?: boolean }) => {
      if (data?.proctoringActive) setSessionActive(true);
      return data;
    },
  });

  // Fetch course once proctoring has started to load questions
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetch(`/api/courses/${courseId}`).then(res => res.json()),
    enabled: sessionActive,
  });

  if (!contentId) {
    return <div className="p-4 text-red-600">Invalid content ID</div>;
  }
  if (!sessionActive) {
    return <div className="p-4">Waiting for the Instructor to start the Quiz...</div>;
  }
  if (!course) {
    return <div className="p-4">Loading Quiz...</div>;
  }

  // Extract quiz questions from course data
  const content = course.modules
    .flatMap((mod: { contents: any; }) => mod.contents)
    .find((ct: { id: string; }) => ct.id === contentId);
  if (!content || !content.questions) {
    return <div className="p-4">Quiz content not found.</div>;
  }
  const questions: QuizQuestion[] = content.questions.map((q: { id: any; prompt: any; options: { [x: string]: any; }; correctOption: string | number; }) => ({
    id: q.id,
    type: 'multiple-choice',
    question: q.prompt,
    options: q.options,
    answer: q.options[q.correctOption],
    timeLimit: 60,
  }));

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <QuizEngine questions={questions} />
    </div>
  );
}
