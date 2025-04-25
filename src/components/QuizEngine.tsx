'use client';

import React, { useState, useEffect } from 'react';

export type QuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options?: string[];
  answer: string;
  timeLimit: number;
};

interface QuizEngineProps {
  questions: QuizQuestion[];
}

export default function QuizEngine({ questions }: QuizEngineProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [timer, setTimer] = useState(questions[0]?.timeLimit || 0);
  const [answers, setAnswers] = useState<Record<string, { correct: boolean; userAnswer: string }>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!questions.length) return;
    setSelected('');
    setFeedback(null);
    setTimer(questions[current].timeLimit);
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
    if (feedback) return;
    const q = questions[current];
    const isCorrect =
      q.type === 'multiple-choice'
        ? selected === q.answer
        : selected.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setAnswers((prev) => ({ ...prev, [q.id]: { correct: isCorrect, userAnswer: selected } }));
    setFeedback(isCorrect ? 'Correct!' : `Incorrect. Answer: ${q.answer}`);
    if (current === questions.length - 1) setFinished(true);
  }

  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
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
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="p-4 border rounded bg-white">
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
        <button
          onClick={submitAnswer}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Submit
        </button>
      )}
      {feedback && (
        <div className="mt-4">
          <p className="font-medium">{feedback}</p>
          {!finished && (
            <button
              onClick={nextQuestion}
              className="mt-2 text-indigo-600 hover:underline"
            >
              Next Question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
