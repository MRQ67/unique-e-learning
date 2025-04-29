'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExamResult {
  id: string;
  score: number;
  completed: boolean;
  startedAt: string;
  endedAt: string;
  exam: {
    id: string;
    title: string;
  };
}

export default function ExamResults() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Fetch all completed exam sessions
  const { data: submissions, isLoading } = useQuery<ExamResult[], Error>({
    queryKey: ['exam-submissions'],
    queryFn: () => fetch('/api/examsessions/submissions').then(res => res.json()),
  });

  // Fetch details for a selected submission
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['exam-submission', selectedSession],
    queryFn: () => 
      fetch(`/api/examsessions/submissions?sessionId=${selectedSession}`).then(res => res.json()),
    enabled: !!selectedSession,
  });

  if (isLoading) return <div className="p-4">Loading your exam results...</div>;

  if (!submissions || submissions.length === 0) {
    return <div className="p-4">You haven't completed any exams yet.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Exam Results</h2>
      
      {!selectedSession ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedSession(submission.id)}>
              <CardHeader>
                <CardTitle>{submission.exam.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">Score: {submission.score.toFixed(2)}%</p>
                <p className="text-sm text-gray-500">
                  Completed on: {new Date(submission.endedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedSession(null)}>← Back to Results</Button>
          
          {detailsLoading ? (
            <div>Loading details...</div>
          ) : details && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{details.exam.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-lg">Final Score: {details.score.toFixed(2)}%</p>
                  <p>Started: {new Date(details.startedAt).toLocaleString()}</p>
                  <p>Completed: {new Date(details.endedAt).toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <h3 className="text-xl font-semibold">Question Review</h3>
              {details.exam.questions.map((question: any, index: number) => {
                const userAnswer = details.answers[question.id];
                const isCorrect = userAnswer === question.correctOption;
                
                return (
                  <Card key={question.id} className={isCorrect ? 'border-green-300' : 'border-red-300'}>
                    <CardHeader>
                      <CardTitle className="text-base">Question {index + 1}: {question.prompt}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {question.options.map((option: string, idx: number) => (
                        <div key={idx} className={`p-2 rounded ${idx === question.correctOption ? 'bg-green-100' : ''} ${idx === userAnswer && idx !== question.correctOption ? 'bg-red-100' : ''}`}>
                          {option}
                          {idx === question.correctOption && ' ✓'}
                          {idx === userAnswer && idx !== question.correctOption && ' ✗'}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}