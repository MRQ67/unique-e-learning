'use client';

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
}
interface FullExamSession {
  id: string;
  requiresProctoring: boolean;
  proctoringActive: boolean;
  user: { id: string; name: string; email: string };
  exam: { id: string; title: string; questions: Question[] };
  events: { id: string; type: string; timestamp: string }[];
}
interface ProctorDashboardProps {
  sessionId: string;
}

export default function ProctorDashboard({ sessionId }: ProctorDashboardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: session, isLoading, error } = useQuery<FullExamSession | null, Error>({
    queryKey: ['exam-session', sessionId] as const,
    queryFn: async () => {
      const res = await fetch(`/api/examsessions?sessionId=${sessionId}`);
      if (!res.ok) {
        // If session not found (likely completed and deleted), redirect to dashboard
        if (res.status === 404) {
          router.push('/dashboard/instructor');
          return null;
        }
        throw new Error('Failed to fetch session');
      }
      return res.json() as Promise<FullExamSession>;
    },
    refetchInterval: 2000,
  });
  
  // Setup video stream connection when session is active
  useEffect(() => {
    if (session?.proctoringActive && videoRef.current) {
      // Connect to student's WebRTC stream
      const connectToStudentStream = async () => {
        try {
          // Check if the browser supports WebRTC
          if (!navigator.mediaDevices || !window.RTCPeerConnection) {
            console.error('WebRTC is not supported in this browser');
            return;
          }
          
          // Create a peer connection
          const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          // Request to receive video from student
          peerConnection.addTransceiver('video', { direction: 'recvonly' });
          
          // Listen for ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              // Send the ICE candidate to the student via the signaling server
              fetch('/api/examsessions/rtc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  type: 'instructor-ice',
                  signal: JSON.stringify(event.candidate)
                })
              });
            }
          };
          
          // When we get a remote stream, display it
          peerConnection.ontrack = (event) => {
            if (videoRef.current && event.streams[0]) {
              const stream = event.streams[0];
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(console.error);
              console.log('Received student video stream');
            }
          };
          
          // Create an offer to connect
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          // Send the offer to the student via the signaling server
          await fetch('/api/examsessions/rtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              type: 'offer',
              signal: JSON.stringify(offer)
            })
          });
          
          console.log('Sent connection offer to student');
          
          // Poll for student answers and ICE candidates
          let answerInterval: number;
          const checkForAnswers = async () => {
            try {
              const response = await fetch(`/api/examsessions/rtc?sessionId=${sessionId}&type=answer`, {
                method: 'GET'
              });
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.signal && peerConnection.signalingState === 'have-local-offer') {
                  // Process the answer
                  const answer = JSON.parse(data.signal);
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                  console.log('Processed student answer');
                  clearInterval(answerInterval);
                }
              }
            } catch (error) {
              console.error('Error checking for answers:', error);
            }
          };
          
          // Initial check and then poll for answers every 5s
          checkForAnswers();
          answerInterval = window.setInterval(checkForAnswers, 5000);
          // Poll for student ICE candidates every 2s
          const checkForStudentIce = async () => {
            try {
              const res = await fetch(
                `/api/examsessions/rtc?sessionId=${sessionId}&type=student-ice`
              );
              if (res.ok) {
                const data = await res.json();
                if (data.signal) {
                  const candidate = new RTCIceCandidate(JSON.parse(data.signal));
                  await peerConnection.addIceCandidate(candidate);
                }
              }
            } catch (e) {
              console.error('Error fetching student ICE candidates:', e);
            }
          };
          const iceInterval = window.setInterval(checkForStudentIce, 2000);
          // Clean up when component unmounts
          return () => {
            clearInterval(answerInterval);
            clearInterval(iceInterval);
            peerConnection.close();
          };
        } catch (err) {
          console.error('Error connecting to student stream:', err);
        }
      };
      
      connectToStudentStream();
    }
  }, [session?.proctoringActive, sessionId]);

  const mutation = useMutation<FullExamSession, Error, { sessionId: string; active: boolean }>({    
    mutationFn: ({ sessionId, active }) =>
      fetch('/api/examsessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, proctoringActive: active }),
      }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-session', sessionId] }),
  });

  // Auto-start proctoring when the instructor visits this page
  useEffect(() => {
    if (session && !session.proctoringActive) {
      mutation.mutate({ sessionId, active: true });
    }
  }, [session, sessionId, mutation]);

  if (isLoading || !session) return <div className="p-4">Loading proctoring session...</div>;

  const { exam, user, events, proctoringActive } = session;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="text-sm">Student: {user.name} ({user.email})</p>
        </div>
        <div className="relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            muted
            className="w-64 h-48 bg-gray-900 rounded border border-gray-300" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-sm bg-black bg-opacity-50 p-1 rounded">
              Student webcam feed
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Security Events</h2>
        {events.length === 0 ? (
          <p>No security events recorded.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {events.map((e: Event) => (
              <li key={e.id}>{new Date(e.timestamp).toLocaleTimeString()} - {e.type}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Exam Questions (Read-Only)</h2>
        {exam.questions.map((q: { id: Key | null | undefined; prompt: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; options: any[]; correctOption: any; }) => (
          <Card key={q.id} className="mb-4">
            <CardHeader>
              <CardTitle>{q.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5">
                {q.options.map((opt, idx) => (
                  <li key={idx} className={idx === q.correctOption ? 'font-bold text-green-700' : ''}>
                    {opt}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex space-x-2">
        {proctoringActive ? (
          <Button variant="destructive" onClick={() => mutation.mutate({ sessionId, active: false })}>
            Stop Proctoring
          </Button>
        ) : (
          <Button onClick={() => mutation.mutate({ sessionId, active: true })}>
            Start Proctoring
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push('/dashboard/instructor')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

interface Event {
  id: string;
  timestamp: string;
  type: string;
}
