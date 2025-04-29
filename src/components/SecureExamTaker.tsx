'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface SecureExamTakerProps {
  examId: string;
  studentId: string;
}

export default function SecureExamTaker({ examId, studentId }: SecureExamTakerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [securityWarnings, setSecurityWarnings] = useState<{type: string, timestamp: Date}[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Create or retrieve exam session
  useEffect(() => {
    if (!sessionId) {
      // First check if there's an existing session for this exam
      fetch(`/api/examsessions?examId=${examId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          // If there's an existing session, use it
          if (data && data.length > 0) {
            const existingSession = data.find((s: { examId: string; endedAt: any; }) => s.examId === examId && !s.endedAt);
            if (existingSession) {
              setSessionId(existingSession.id);
              return;
            }
          }
          
          // Otherwise create a new session
          return fetch('/api/examsessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId }),
          })
            .then(res => res.json())
            .then(data => setSessionId(data.id));
        })
        .catch(console.error);
    }
  }, [sessionId, examId]);


  // Poll exam session status
  const { data: status } = useQuery<{ proctoringActive: boolean } | null, Error>({
    queryKey: ['exam-session-status', sessionId] as const,
    queryFn: () =>
      sessionId
        ? fetch(`/api/examsessions?sessionId=${sessionId}`)
            .then(res => res.json() as Promise<{ proctoringActive: boolean }>)
        : Promise.resolve(null),
    enabled: !!sessionId && !sessionActive,
    refetchInterval: !sessionActive ? 2000 : false,
  });

  // Activate session when proctoring starts
  useEffect(() => {
    if (status?.proctoringActive) {
      setSessionActive(true);
      // Initialize face detection and tab switching detection when proctoring starts
      setupProctoring();
    }
  }, [status]);
  
  // Log security event to backend
  const logSecurityEvent = async (type: string) => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/examsessions/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type }),
      });
      
      // Add to local warnings
      setSecurityWarnings(prev => [
        ...prev,
        { type, timestamp: new Date() }
      ]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };
  
  // Setup webcam and tab switching detection
  const setupProctoring = async () => {
    let stream: MediaStream | null = null;
    let peerConnection: RTCPeerConnection | null = null;
    
    try {
      // Setup webcam
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Webcam access is not supported in this environment. Please use a modern browser on your device.');
        throw new Error('getUserMedia not supported');
      }
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Notify the server that video is streaming
        if (sessionId) {
          await fetch('/api/examsessions/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId, 
              type: 'video-stream-started' 
            }),
          });
        }
        
        // Setup WebRTC for streaming to instructor
        if (window.RTCPeerConnection) {
          // Create a peer connection
          peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          // Add the video tracks to the connection
          stream.getTracks().forEach(track => {
            if (peerConnection) peerConnection.addTrack(track, stream!);
          });
          
          // Handle ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate && sessionId) {
              // Send ICE candidate to instructor via signaling server
              fetch('/api/examsessions/rtc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  type: 'student-ice',
                  signal: JSON.stringify(event.candidate)
                })
              });
            }
          };
          
          // Poll for instructor offers
          const checkForOffers = async () => {
            try {
              // In a real implementation, this would use WebSockets instead of polling
              const response = await fetch(`/api/examsessions/rtc?sessionId=${sessionId}&type=offer`, {
                method: 'GET'
              });
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.signal && peerConnection) {
                  // Process the offer
                  const offer = JSON.parse(data.signal);
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                  
                  // Create an answer
                  const answer = await peerConnection.createAnswer();
                  await peerConnection.setLocalDescription(answer);
                  
                  // Send the answer back
                  await fetch('/api/examsessions/rtc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId,
                      type: 'answer',
                      signal: JSON.stringify(answer)
                    })
                  });
                  
                  console.log('Sent answer to instructor');
                }
              }
            } catch (error) {
              console.error('Error checking for offers:', error);
            }
          };
          
          // Initial check and then poll every 5 seconds
          checkForOffers();
          const pollInterval = window.setInterval(checkForOffers, 5000);
          // Poll for instructor ICE candidates
          const checkForInstructorIce = async () => {
            try {
              const response = await fetch(
                `/api/examsessions/rtc?sessionId=${sessionId}&type=instructor-ice`
              );
              if (response.ok) {
                const data = await response.json();
                if (data.signal && peerConnection) {
                  const candidate = new RTCIceCandidate(
                    JSON.parse(data.signal)
                  );
                  await peerConnection.addIceCandidate(candidate);
                }
              }
            } catch (error) {
              console.error('Error fetching instructor ICE candidates:', error);
            }
          };
          const iceInterval = window.setInterval(checkForInstructorIce, 2000);
          // Clean up intervals and peer resources
          return () => {
            clearInterval(pollInterval);
            clearInterval(iceInterval);
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (peerConnection) peerConnection.close();
          };
        }
      }
      
      // Setup tab switching detection
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logSecurityEvent('tab-switch');
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
          peerConnection.close();
        }
      };
    } catch (err) {
      console.error('Error setting up proctoring:', err);
      logSecurityEvent('webcam-access-failed');
    }
  };

  // Fetch session details when active
  const { data: session, isLoading } = useQuery({
    queryKey: ['exam-session', sessionId],
    queryFn: () => fetch(`/api/examsessions?sessionId=${sessionId}`).then(res => res.json()),
    enabled: sessionActive,
  });

  if (!sessionId) return <div className="p-4">Initializing exam session...</div>;
  if (!sessionActive) return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-semibold mb-4">Waiting for instructor to start proctoring...</h2>
      <p className="text-gray-600">Your instructor will start the proctoring session shortly.</p>
    </div>
  );
  if (isLoading || !session) return <div className="p-4">Loading exam questions...</div>;

  const { exam, events } = session;
  const { title, questions } = exam;

  const handleSelect = (qId: string, idx: number) => {
    setSelected(prev => ({ ...prev, [qId]: idx }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/examsessions/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers: selected }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit exam');
      }
      
      const result = await res.json();
      alert(`Exam submitted! Your score: ${result.score.toFixed(2)}%`);
      window.location.href = '/dashboard/student';
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">{title}</h2>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="w-32 h-24 bg-black rounded border border-gray-300" 
        />
      </div>
      
      {(events.length > 0 || securityWarnings.length > 0) && (
        <Card className="p-4 bg-amber-100">
          <CardDescription>
            {events.length + securityWarnings.length} security warning(s) detected. Instructor will review.
          </CardDescription>
          {securityWarnings.length > 0 && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Recent warnings:</p>
              <ul className="list-disc pl-5">
                {securityWarnings.slice(-3).map((warning, idx) => (
                  <li key={idx}>
                    {warning.type === 'face-lost' ? 'Face not detected' : 'Tab switching detected'} at {warning.timestamp.toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
      {questions.map((q: any, idx: number) => (
        <Card key={q.id} className="space-y-2">
          <CardHeader>
            <CardTitle>{`Q${idx + 1}: ${q.prompt}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {q.options.map((opt: any, oi: number) => (
              <div key={oi} className="flex items-center">
                <input
                  id={`${q.id}-${oi}`}
                  type="radio"
                  name={q.id}
                  checked={selected[q.id] === oi}
                  onChange={() => handleSelect(q.id, oi)}
                  className="mr-2"
                />
                <label htmlFor={`${q.id}-${oi}`}>{opt}</label>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSubmit} disabled={Object.keys(selected).length !== questions.length}>
        Submit Exam
      </Button>
    </div>
  );
}
