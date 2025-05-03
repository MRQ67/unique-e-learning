'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  // Timer countdown effect
  useEffect(() => {
    if (!sessionActive || examSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sessionActive, examSubmitted, handleSubmit]);
  
  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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
    let iceCandidateQueue: RTCIceCandidate[] = [];
    
    try {
      // Setup webcam with optimized settings for faster streaming
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Webcam access is not supported in this environment. Please use a modern browser on your device.');
        throw new Error('getUserMedia not supported');
      }
      
      // Optimize video constraints for faster transmission
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 15, max: 24 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Notify the server that video is streaming
        if (sessionId) {
          await logSecurityEvent('video-stream-start');
        }
        
        // Setup WebRTC for streaming to instructor with optimized configuration
        if (window.RTCPeerConnection) {
          // Create a peer connection with optimized STUN/TURN servers
          peerConnection = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ],
            iceTransportPolicy: 'all',
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle'
          });
          
          // Add the video tracks to the connection
          stream.getTracks().forEach(track => {
            if (peerConnection) peerConnection.addTrack(track, stream!);
          });
          
          // Set up connection state monitoring
          peerConnection.onconnectionstatechange = (event) => {
            console.log(`Connection state: ${peerConnection?.connectionState}`);
            if (peerConnection?.connectionState === 'connected') {
              logSecurityEvent('video-feed-received');
            }
          };
          
          // Handle ICE candidates with priority handling
          peerConnection.onicecandidate = (event) => {
            if (event.candidate && sessionId) {
              // Send ICE candidate to instructor via signaling server
              fetch('/api/examsessions/rtc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  type: 'student-ice',
                  signal: JSON.stringify(event.candidate),
                  priority: event.candidate.priority
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
                  // Add any queued ICE candidates
                  if (iceCandidateQueue.length) {
                    for (const cand of iceCandidateQueue) {
                      await peerConnection.addIceCandidate(cand);
                    }
                    iceCandidateQueue = [];
                  }
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
          
          // Initial check and then poll more frequently (every 2 seconds instead of 5)
          checkForOffers();
          const pollInterval = window.setInterval(checkForOffers, 2000);
          
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
                  if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
                    await peerConnection.addIceCandidate(candidate);
                  } else {
                    iceCandidateQueue.push(candidate);
                  }
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

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
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
      setExamSubmitted(true);
      
      // Redirect after 5 seconds
      setTimeout(() => {
        router.push('/dashboard/student');
      }, 5000);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && session?.exam?.questions && index < session.exam.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // If exam is completed, show the completion screen
  if (examSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-gray-200 py-4 px-6 flex justify-between items-center">
          <div className="font-semibold text-lg">PROCTOR X</div>
          <Button variant="outline" size="sm" className="rounded-full px-4" onClick={() => router.push('/dashboard/student')}>
            Home
          </Button>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You Finished Your Exam</h1>
          <p className="text-gray-600">Your admin will release your results shortly. All the best :)</p>
        </main>
      </div>
    );
  }

  // If session is not active or still loading, show waiting screens
  if (!sessionId) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg">Initializing exam session...</p>
      </div>
    </div>
  );
  
  if (!sessionActive) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-4">Waiting for instructor to start proctoring...</h2>
        <p className="text-gray-600">Your instructor will start the proctoring session shortly.</p>
        <div className="animate-pulse mt-6 h-2 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
  
  if (isLoading || !session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg">Loading exam questions...</p>
      </div>
    </div>
  );

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with PROCTOR X logo */}
      <header className="border-b border-gray-200 py-4 px-6">
        <div className="font-semibold text-lg">Unique's Proctored Exam</div>
      </header>
      
      <main className="flex-1 flex">
        {/* Main question area */}
        <div className="flex-1 p-6">
          {/* Video feed removed from here */}
          
          {/* Security warnings */}
          {(events.length > 0 || securityWarnings.length > 0) && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <p className="font-medium text-amber-800">
                {events.length + securityWarnings.length} security warning(s) detected. Instructor will review.
              </p>
            </div>
          )}
          
          {/* Current question */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">
              {currentQuestionIndex + 1}. {currentQuestion.prompt}
            </h3>
            
            <RadioGroup
              value={selected[currentQuestion.id]?.toString() || ''}
              onValueChange={(val) => handleSelect(currentQuestion.id, parseInt(val))}
              className="space-y-4"
            >
              {currentQuestion.options.map((opt: any, oi: number) => (
                <div key={oi} className="flex items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                  <RadioGroupItem id={`option-${oi}`} value={oi.toString()} className="mt-0.5" />
                  <label htmlFor={`option-${oi}`} className="ml-3 cursor-pointer flex-1">{opt}</label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <Button 
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={Object.keys(selected).length !== questions.length || isSubmitting}
                className="bg-black hover:bg-gray-800 text-white px-8"
                type="submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Submitting...</span>
                ) : (
                  'SUBMIT'
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-72 border-l border-gray-200 p-4 flex flex-col">
          {/* Video feed moved to sidebar */}
          <div className="mb-6 mt-2">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-40 bg-black rounded border border-gray-300" 
            />
          </div>
          
          {/* Timer */}
          <div className="mb-8">
            <h3 className="text-center font-medium mb-2">FINISH BEFORE</h3>
            <div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto">
              <div className="text-xl font-mono">{formatTime(timeRemaining)}</div>
            </div>
          </div>
          
          {/* Question navigation */}
          <div className="mb-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q: any, idx: number) => (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(idx)}
                  className={`h-10 w-10 flex items-center justify-center rounded-md border ${idx === currentQuestionIndex ? 'border-black bg-gray-100' : selected[q.id] !== undefined ? 'bg-gray-100' : 'border-gray-300'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          {/* Question dropdown for mobile */}
          <div className="mt-auto">
            <Select value={currentQuestionIndex.toString()} onValueChange={(val) => navigateToQuestion(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Select question" />
              </SelectTrigger>
              <SelectContent>
                {questions.map((q: any, idx: number) => (
                  <SelectItem key={q.id} value={idx.toString()}>
                    Question {idx + 1} {selected[q.id] !== undefined ? '(Answered)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </main>
    </div>
  );
}
