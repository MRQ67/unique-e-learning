"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

interface SecureQuizProps {
  sessionId: string;
}

export default function SecureQuiz({ sessionId }: SecureQuizProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [violation, setViolation] = useState<string | null>(null);
  const router = useRouter();

  const logEvent = async (type: string) => {
    try {
      await fetch('/api/quizzes/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type }),
      });
    } catch (err) {
      console.error('Log event error', err);
    }
  };

  useEffect(() => {
    let stream: MediaStream;
    let detector: any;
    let intervalId: number;

    async function setupProctoring() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        await (await import('@tensorflow/tfjs-backend-webgl')).setWebGLContext;
        detector = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          { runtime: 'tfjs', modelType: 'full' }
        );
        intervalId = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return;
          const faces = await detector.estimateFaces(videoRef.current as HTMLVideoElement);
          if (faces.length === 0) {
            setViolation('face-lost');
            await logEvent('face-lost');
            clearInterval(intervalId);
          }
        }, 1000);
      } catch (err) {
        console.error('Camera or model error:', err);
      }
    }
    setupProctoring();

    const handleVisibility = () => {
      if (document.hidden) {
        setViolation('tab-switch');
        logEvent('tab-switch');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId]);

  if (violation) {
    return (
      <div className="p-4">
        <p className="text-red-600">Violation detected: {violation}</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white" onClick={() => router.back()}>
          Exit Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <video ref={videoRef} autoPlay muted className="w-64 h-48 bg-black rounded" />
      <p>Secure Quiz Session: {sessionId}</p>
      {/* Render quiz questions here */}
    </div>
  );
}
