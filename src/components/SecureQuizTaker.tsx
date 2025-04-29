'use client';

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  points: number;
}

interface SecureQuizTakerProps {
  quizId: string;
  sessionId: string;
  studentId: string;
}

export default function SecureQuizTaker({ quizId, sessionId, studentId }: SecureQuizTakerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [proctoringWarnings, setProctoringWarnings] = useState<{type: string, timestamp: string}[]>([]);
  
  // Fetch quiz data
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['secure-quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`);
      return res.json();
    },
  });

  // Fetch proctoring session status
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['quiz-session', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/session/${sessionId}`);
      return res.json();
    },
    refetchInterval: 5000, // Check session status every 5 seconds
  });

  // Submit quiz answers
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentId,
          answers: selectedAnswers,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      setQuizCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['quiz-session', sessionId] });
    },
  });

  // Log proctoring event
  const logProctoringEvent = async (type: string) => {
    try {
      await fetch('/api/quizzes/proctoring/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type,
          timestamp: new Date().toISOString(),
        }),
      });
      
      setProctoringWarnings(prev => [
        ...prev,
        { type, timestamp: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  };

  // Monitor tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !quizCompleted) {
        logProctoringEvent('tab-switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizCompleted]);

  // Face detection would be implemented here in a real application
  // This is a simplified version for demonstration purposes
  useEffect(() => {
    // Simulate occasional face detection issues
    const faceDetectionInterval = setInterval(() => {
      // Random chance of face detection issue (for demo purposes)
      if (Math.random() < 0.1 && !quizCompleted) {
        logProctoringEvent('face-lost');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(faceDetectionInterval);
  }, [quizCompleted]);

  // Check if session is terminated
  useEffect(() => {
    if (session?.status === 'terminated') {
      router.push(`/courses/${quiz?.courseId}?terminated=true`);
    }
  }, [session, router, quiz]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz?.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setIsSubmitting(true);
    submitQuizMutation.mutate();
  };

  if (isLoading || sessionLoading) {
    return <div className="p-4">Loading secure quiz...</div>;
  }

  if (session?.status !== 'active') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting for Instructor</CardTitle>
          <CardDescription>
            Your quiz session is waiting for the instructor to start the proctoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please wait while the instructor prepares to monitor your quiz session.</p>
          <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Completed</CardTitle>
          <CardDescription>
            Your answers have been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Thank you for completing the quiz. Your instructor will review your submission.</p>
          {proctoringWarnings.length > 0 && (
            <div className="mt-4 p-3 border rounded bg-amber-50">
              <p className="font-medium text-amber-800">Proctoring Warnings: {proctoringWarnings.length}</p>
              <p className="text-sm text-amber-700">
                Some security issues were detected during your session. These will be reviewed by your instructor.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push(`/courses/${quiz.courseId}`)}>
            Return to Course
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </CardDescription>
            </div>
            {proctoringWarnings.length > 0 && (
              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                {proctoringWarnings.length} Security Warning{proctoringWarnings.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{currentQuestion.question}</h3>
              <p className="text-sm text-gray-500">Points: {currentQuestion.points}</p>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option: { id: Key | null | undefined; text: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                <div 
                  key={option.id} 
                  className={`p-3 border rounded-md cursor-pointer ${selectedAnswers[currentQuestion.id] === option.id ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestion.id, String(option.id))}
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
          </div>
          <div className="flex space-x-2">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={isSubmitting}
                variant="default"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="fixed bottom-4 right-4 p-3 bg-black bg-opacity-80 text-white rounded-md text-sm">
        <p>Secure Proctoring Active</p>
        <p className="text-xs opacity-70">Your session is being monitored</p>
      </div>
    </div>
  );
}