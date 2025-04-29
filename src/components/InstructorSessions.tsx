"use client";
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ExamSession {
  id: string;
  requiresProctoring: boolean;
  proctoringActive: boolean;
  user: { id: string; name: string; email: string };
  exam: { id: string; title: string };
  events: { id: string; type: string; timestamp: string }[];
}

const fetchSessions = () =>
  fetch('/api/examsessions').then(res => res.json() as Promise<ExamSession[]>);

const toggleProctoring = async ({ sessionId, active }: { sessionId: string; active: boolean }) => {
  const res = await fetch('/api/examsessions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, proctoringActive: active }),
  });
  return res.json();
};

export default function InstructorSessions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: sessions, isLoading } = useQuery<ExamSession[], Error>({
    queryKey: ['exam-sessions'],
    queryFn: fetchSessions,
    refetchInterval: 10000,
  });

  const mutation = useMutation({
    mutationFn: toggleProctoring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-sessions'] }),
  });

  // Count security violations for a session
  const countViolations = (events: { type: string }[]) => {
    return events.filter(e => e.type === 'face-lost' || e.type === 'tab-switch').length;
  };

  const startProctoringSession = async (sessionId: string, examId?: string) => {
    try {
      // First activate proctoring on the session
      await fetch('/api/examsessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, proctoringActive: true }),
      });
      
      // Then redirect to the appropriate proctoring dashboard
      if (examId) {
        router.push(`/exams/${examId}/proctor/${sessionId}`);
      } else {
        router.push(`/dashboard/instructor/proctor/${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to start proctoring session:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading sessions…</div>;
  }

  // Group sessions: waiting vs active
  const waitingSessions = sessions?.filter(s => s.requiresProctoring && !s.proctoringActive) || [];
  const activeSessions = sessions?.filter(s => s.proctoringActive) || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Waiting for Proctoring ({waitingSessions.length})</h2>
        {waitingSessions.length === 0 ? (
          <p className="text-gray-500">No students waiting for proctoring</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitingSessions.map(session => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{session.exam?.title || 'Secure Exam'}</CardTitle>
                      <CardDescription>Student: {session.user.name}</CardDescription>
                    </div>
                    <div className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                      Waiting
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Email: {session.user.email}</p>
                  <p className="text-sm">Session ID: {session.id}</p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => mutation.mutate({
                      sessionId: session.id,
                      active: true
                    })}
                  >
                    Start Proctoring
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Active Proctoring Sessions ({activeSessions.length})</h2>
        {activeSessions.length === 0 ? (
          <p className="text-gray-500">No active proctoring sessions</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => {
              const violationCount = countViolations(session.events);
              return (
                <Card key={session.id} className={violationCount > 0 ? 'border-red-300' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{session.exam?.title || 'Secure Exam'}</CardTitle>
                        <CardDescription>Student: {session.user.name}</CardDescription>
                      </div>
                      <div className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Active
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Email: {session.user.email}</p>
                    {violationCount > 0 && (
                      <p className="text-sm text-red-600 font-medium mt-2">
                        {violationCount} security violation{violationCount !== 1 ? 's' : ''} detected
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => mutation.mutate({
                        sessionId: session.id,
                        active: false
                      })}
                    >
                      Stop Proctoring
                    </Button>
                    <Button
                      onClick={() => startProctoringSession(session.id, session.exam?.id)}
                    >
                      View Proctoring Dashboard
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed sessions not shown */}
    </div>
  );
}
