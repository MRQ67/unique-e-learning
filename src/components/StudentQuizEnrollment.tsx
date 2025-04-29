'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  order: number;
  contents: Content[];
}

interface Content {
  id: string;
  type: string;
  title: string;
  requiresProctoring?: boolean;
  proctoringActive?: boolean;
}

interface QuizSession {
  id: string;
  contentId: string;
  status: 'waiting' | 'active' | 'completed' | 'terminated';
}

interface StudentQuizEnrollmentProps {
  studentId: string;
}

export default function StudentQuizEnrollment({ studentId }: StudentQuizEnrollmentProps) {
  const router = useRouter();
  const [enrolledSessions, setEnrolledSessions] = useState<QuizSession[]>([]);
  
  // Fetch available courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['available-courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      return res.json() as Promise<Course[]>;
    }
  });
  
  // Fetch student's enrolled quiz sessions
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['student-quiz-sessions', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/student/${studentId}`);
      return res.json() as Promise<QuizSession[]>;
    },
    refetchInterval: 10000 // Refresh every 10 seconds to check for status changes
  });
  
  useEffect(() => {
    if (sessions) {
      setEnrolledSessions(sessions);
    }
  }, [sessions]);

  const enrollInQuiz = async (contentId: string) => {
    try {
      const res = await fetch('/api/quizzes/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          contentId
        }),
      });
      
      if (res.ok) {
        const session = await res.json();
        setEnrolledSessions(prev => [...prev, session]);
        refetchSessions();
      }
    } catch (error) {
      console.error('Failed to enroll in quiz:', error);
    }
  };

  const startQuiz = (sessionId: string, courseId: string) => {
    router.push(`/courses/${courseId}/quiz/${sessionId}`);
  };

  if (coursesLoading || sessionsLoading) {
    return <div className="p-4">Loading available quizzes...</div>;
  }

  // Find all secure quizzes from available courses
  const secureQuizzes = courses?.flatMap(course => {
    return course.modules.flatMap(module => {
      return module.contents
        .filter(content => content.type === 'QUIZ' && content.requiresProctoring)
        .map(content => ({
          courseId: course.id,
          courseTitle: course.title,
          moduleTitle: module.title,
          content
        }));
    });
  }) || [];

  // Check if student is already enrolled in a quiz
  const isEnrolled = (contentId: string) => {
    return enrolledSessions.some(session => session.contentId === contentId);
  };

  // Get session status for a content
  const getSessionStatus = (contentId: string) => {
    const session = enrolledSessions.find(s => s.contentId === contentId);
    return session?.status || null;
  };

  // Get session ID for a content
  const getSessionId = (contentId: string) => {
    const session = enrolledSessions.find(s => s.contentId === contentId);
    return session?.id || null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Available Secure Quizzes</h2>
      
      {secureQuizzes.length === 0 ? (
        <p>No secure quizzes are currently available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secureQuizzes.map(({ courseId, courseTitle, moduleTitle, content }) => {
            const enrolled = isEnrolled(content.id);
            const status = getSessionStatus(content.id);
            const sessionId = getSessionId(content.id);
            
            return (
              <Card key={content.id}>
                <CardHeader>
                  <CardTitle>{content.title}</CardTitle>
                  <CardDescription>
                    Course: {courseTitle} | Module: {moduleTitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">
                    This is a secure quiz that requires proctoring. The instructor will monitor your session.
                  </p>
                  {enrolled && (
                    <div className="mt-2 p-2 border rounded bg-blue-50">
                      <p className="font-medium">Status: {status === 'waiting' ? 'Waiting for instructor' : 
                                                status === 'active' ? 'Quiz is active' : 
                                                status === 'completed' ? 'Completed' : 'Terminated'}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!enrolled && (
                    <Button onClick={() => enrollInQuiz(content.id)}>
                      Enroll in Quiz
                    </Button>
                  )}
                  {enrolled && status === 'waiting' && (
                    <p className="text-sm text-amber-600">Waiting for instructor to start the quiz</p>
                  )}
                  {enrolled && status === 'active' && sessionId && (
                    <Button onClick={() => startQuiz(sessionId, courseId)}>
                      Start Quiz
                    </Button>
                  )}
                  {enrolled && (status === 'completed' || status === 'terminated') && (
                    <p className="text-sm text-gray-600">This quiz session has ended</p>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}