'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';
import { QuizQuestion } from './QuizEngine';
import { Button } from './ui/button';

interface EnhancedSecureQuizProps {
  sessionId: string;
  questions: QuizQuestion[];
  onComplete?: (results: Record<string, { correct: boolean; userAnswer: string }>) => void;
}

export default function EnhancedSecureQuiz({ sessionId, questions, onComplete }: EnhancedSecureQuizProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [warnings, setWarnings] = useState<{type: string, timestamp: Date}[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [timer, setTimer] = useState(questions[0]?.timeLimit || 0);
  const [answers, setAnswers] = useState<Record<string, { correct: boolean; userAnswer: string }>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [kicked, setKicked] = useState(false);
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

  const addWarning = (type: string) => {
    const newWarning = { type, timestamp: new Date() };
    setWarnings(prev => {
      const updatedWarnings = [...prev, newWarning];
      // If 3 or more warnings, kick the student out
      if (updatedWarnings.length >= 3) {
        setKicked(true);
        logEvent('kicked-out');
      }
      return updatedWarnings;
    });
    
    // Blur the screen temporarily
    setIsBlurred(true);
    setTimeout(() => setIsBlurred(false), 3000); // Unblur after 3 seconds
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
            addWarning('face-lost');
            await logEvent('face-lost');
          }
        }, 1000);
      } catch (err) {
        console.error('Camera or model error:', err);
      }
    }
    setupProctoring();

    const handleVisibility = () => {
      if (document.hidden) {
        addWarning('tab-switch');
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

  useEffect(() => {
    if (!questions.length) return;
    setSelected('');
    setFeedback(null);
    setTimer(questions[current]?.timeLimit || 30); // Default to 30 seconds if timeLimit is not defined
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          submitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [current, questions]);

  function submitAnswer() {
    if (feedback || !questions.length) return;
    const q = questions[current];
    if (!q) return;
    
    const isCorrect =
      q.type === 'multiple-choice'
        ? selected === q.answer
        : selected.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setAnswers((prev) => ({ ...prev, [q.id]: { correct: isCorrect, userAnswer: selected } }));
    setFeedback(isCorrect ? 'Correct!' : `Incorrect. Answer: ${q.answer}`);
    if (current === questions.length - 1) {
      setFinished(true);
      if (onComplete) onComplete(answers);
    }
  }

  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  }

  if (kicked) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">You have been removed from this quiz</h2>
        <p className="mb-6">Due to multiple security violations, you have been removed from this quiz session.</p>
        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  if (!questions.length) return null;

  if (finished) {
    const score = Object.values(answers).filter((a) => a.correct).length;
    return (
      <div className="p-4 border rounded bg-white">
        <h2 className="text-2xl font-semibold mb-2">Quiz Complete</h2>
        <p>
          You scored {score} out of {questions.length}.
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <div className="flex justify-between w-full">
        <div>
          <p className="text-sm font-medium">Warnings: {warnings.length}/3</p>
          {warnings.length > 0 && (
            <ul className="text-xs text-red-500">
              {warnings.map((warning, index) => (
                <li key={index}>
                  {warning.type === 'face-lost' ? 'Face not detected' : 'Tab switching detected'} at {warning.timestamp.toLocaleTimeString()}
                </li>
              ))}
            </ul>
          )}
        </div>
        <video ref={videoRef} autoPlay muted className="w-32 h-24 bg-black rounded" />
      </div>
      
      <div className={`p-4 border rounded bg-white w-full transition-all ${isBlurred ? 'blur-md' : ''}`}>
        <h2 className="text-xl font-semibold mb-1">Question {current + 1} of {questions.length}</h2>
        <p className="mb-2">Time left: {timer}s</p>
        <p className="mb-4">{q.question}</p>
        {q.type === 'multiple-choice' && q.options && (
          <div className="space-y-2 mb-4">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name="quiz"
                  value={opt}
                  checked={selected === opt}
                  onChange={() => setSelected(opt)}
                  className="mr-2"
                  disabled={!!feedback}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        {q.type === 'short-answer' && (
          <div className="mb-4">
            <input
              type="text"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={!!feedback}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        )}
        {!feedback && (
          <Button
            onClick={submitAnswer}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Submit
          </Button>
        )}
        {feedback && (
          <div className="mt-4">
            <p className="font-medium">{feedback}</p>
            {!finished && (
              <Button
                onClick={nextQuestion}
                className="mt-2 text-indigo-600 hover:underline"
              >
                Next Question
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}