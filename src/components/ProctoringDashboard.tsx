'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface QuizSession {
  id: string;
  contentId: string;
  requiresProctoring: boolean;
  proctoringActive: boolean;
  user: { id: string; name: string; email: string };
  events: { id: string; type: string; timestamp: string }[];
  videoFeed?: string;
}

interface ProctoringDashboardProps {
  sessionId: string;
}

export default function ProctoringDashboard({ sessionId }: ProctoringDashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  // Fetch active proctoring sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['proctoring-sessions', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/proctoring?sessionId=${sessionId}`);
      return res.json() as Promise<QuizSession[]>;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation to end a student's session
  const endSessionMutation = useMutation({
    mutationFn: async (studentSessionId: string) => {
      const res = await fetch(`/api/quizzes/${studentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proctoringActive: false, status: 'terminated' }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proctoring-sessions', sessionId] });
    },
  });

  // Count violations by type for a session
  const countViolations = (events: { type: string }[]) => {
    return events.reduce((counts: Record<string, number>, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {});
  };

  // Check if a student has 3 or more warnings
  const hasThreeWarnings = (events: { type: string }[]) => {
    const violations = events.filter(e => e.type === 'face-lost' || e.type === 'tab-switch');
    return violations.length >= 3;
  };

  if (isLoading) {
    return <div className="p-4">Loading proctoring sessions...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">No active proctoring sessions found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz Proctoring Dashboard</h2>
        <Button onClick={() => router.back()}>Exit Proctoring</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students ({sessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.map((session) => {
                  const violations = countViolations(session.events);
                  const needsAttention = hasThreeWarnings(session.events);
                  
                  return (
                    <div 
                      key={session.id} 
                      className={`p-3 border rounded-md cursor-pointer ${selectedStudent === session.id ? 'bg-blue-50 border-blue-300' : ''} ${needsAttention ? 'bg-red-50 border-red-300' : ''}`}
                      onClick={() => setSelectedStudent(session.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{session.user.name}</p>
                          <p className="text-sm text-gray-500">{session.user.email}</p>
                        </div>
                        {needsAttention && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Attention Needed
                          </span>
                        )}
                      </div>
                      {Object.keys(violations).length > 0 && (
                        <div className="mt-2 text-xs">
                          {Object.entries(violations).map(([type, count]) => (
                            <span key={type} className="mr-2 px-1.5 py-0.5 bg-gray-100 rounded">
                              {type === 'face-lost' ? 'Face Lost' : 'Tab Switch'}: {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {sessions.find(s => s.id === selectedStudent)?.user.name} - Live Feed
                  </CardTitle>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => endSessionMutation.mutate(selectedStudent)}
                  >
                    End Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                    {/* This would be replaced with actual video feed in a real implementation */}
                    <div className="text-center">
                      <p>Student's camera feed would appear here</p>
                      <p className="text-sm text-gray-500">Using WebRTC or similar technology</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Activity Log</h3>
                    <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                      {sessions.find(s => s.id === selectedStudent)?.events.length ? (
                        <ul className="space-y-1">
                          {sessions
                            .find(s => s.id === selectedStudent)
                            ?.events
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .filter(event => [
                              'face-lost', 
                              'tab-switch', 
                              'video-stream-start', 
                              'video-feed-received',
                              'violation'
                            ].includes(event.type))
                            .map((event) => {
                              let displayText = '';
                              switch(event.type) {
                                case 'face-lost':
                                  displayText = 'Face not detected';
                                  break;
                                case 'tab-switch':
                                  displayText = 'Tab switching detected';
                                  break;
                                case 'video-stream-start':
                                  displayText = 'Video streaming started';
                                  break;
                                case 'video-feed-received':
                                  displayText = 'Video feed received';
                                  break;
                                case 'violation':
                                  displayText = 'Security violation';
                                  break;
                                default:
                                  displayText = event.type;
                              }
                              return (
                                <li key={event.id} className="text-sm">
                                  <span className="font-medium">{displayText}</span>
                                  <span className="text-gray-500 ml-2">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No events recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border rounded-md p-8">
              <p className="text-gray-500">Select a student to view their proctoring session</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}