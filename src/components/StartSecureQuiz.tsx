'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface StartSecureQuizProps {
  contentId: string;
  courseId: string;
  title: string;
}

export default function StartSecureQuiz({ contentId, courseId, title }: StartSecureQuizProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const startSecureQuiz = async () => {
    setIsLoading(true);
    try {
      // Create a new quiz session with proctoring enabled
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          requiresProctoring: true,
          proctoringActive: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start secure quiz');
      }

      const session = await response.json();
      
      // Navigate to the quiz session
      router.push(`/courses/${courseId}/quiz/${session.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start secure quiz',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Secure Quiz with Proctoring</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          This is a secure quiz that requires proctoring. Your session will be monitored to ensure academic integrity.
        </p>
        <p className="text-sm font-medium text-amber-600 mb-2">
          Before starting:
        </p>
        <ul className="text-sm list-disc pl-5 mb-4 space-y-1">
          <li>Ensure your webcam is working</li>
          <li>Close all unnecessary applications</li>
          <li>Find a quiet, well-lit environment</li>
          <li>Have your ID ready for verification</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={startSecureQuiz} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Starting...</span>
          ) : (
            'Start Secure Quiz'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}