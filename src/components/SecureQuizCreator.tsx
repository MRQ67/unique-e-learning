'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface SecureQuizCreatorProps {
  moduleId: string;
  courseId: string;
  onSuccess?: () => void;
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
  points: number;
};

export default function SecureQuizCreator({ moduleId, courseId, onSuccess }: SecureQuizCreatorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: `q-${Date.now()}`,
    question: '',
    options: [
      { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
      { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
      { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
      { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
    ],
    explanation: '',
    points: 1,
  });
  const [requiresProctoring, setRequiresProctoring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newOptions = currentQuestion.options.map((option, idx) => ({
      ...option,
      isCorrect: idx === index
    }));
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handlePointsChange = (value: string) => {
    const points = parseInt(value) || 1;
    setCurrentQuestion(prev => ({ ...prev, points }));
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError('Question text is required');
      return;
    }

    if (!currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('Please select a correct answer for the question');
      return;
    }

    if (currentQuestion.options.some(opt => !opt.text.trim())) {
      setError('All options must have text');
      return;
    }

    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion({
      id: `q-${Date.now()}`,
      question: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
        { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
      ],
      explanation: '',
      points: 1,
    });
    setError('');
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (questions.length === 0) {
      setError('Add at least one question to the quiz');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/courses/secure-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          title: quizTitle,
          questions,
          requiresProctoring,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create secure quiz');
      }

      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      if (onSuccess) onSuccess();
      router.push(`/courses/${courseId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the secure quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Secure Quiz</CardTitle>
          <CardDescription>
            Create a quiz with proctoring enabled for secure assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
              />
            </div>

            <div className="border p-4 rounded-md space-y-4">
              <h3 className="font-medium">Add Question</h3>
              
              <div className="space-y-2">
                <Label htmlFor="question">Question Text</Label>
                <Textarea
                  id="question"
                  name="question"
                  value={currentQuestion.question}
                  onChange={handleQuestionChange}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Options (select the correct answer)</Label>
                {currentQuestion.options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="answerOption"
                      checked={option.isCorrect}
                      onChange={() => handleCorrectAnswerChange(index)}
                      disabled={!option.text.trim()}
                    />
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={currentQuestion.points}
                  onChange={(e) => handlePointsChange(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  placeholder="Explain the correct answer"
                  value={currentQuestion.explanation || ''}
                  onChange={handleExplanationChange}
                  rows={2}
                />
              </div>

              <Button type="button" onClick={addQuestion}>Add Question</Button>
            </div>

            {questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Quiz Questions ({questions.length})</h3>
                {questions.map((q, index) => (
                  <div key={q.id} className="border p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Question {index + 1}: {q.question}</p>
                        <p className="text-sm">Points: {q.points}</p>
                        <p className="text-sm">Correct Answer: {q.options.find(opt => opt.isCorrect)?.text}</p>
                        {q.explanation && <p className="text-sm text-gray-500">Explanation: {q.explanation}</p>}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeQuestion(q.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="proctoring"
                  checked={requiresProctoring}
                  onCheckedChange={setRequiresProctoring}
                />
                <Label htmlFor="proctoring" className="font-medium">Enable Proctoring</Label>
              </div>
              <p className="text-sm text-gray-500">
                When enabled, students will need instructor approval to start the quiz, and their session will be monitored for security violations.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || questions.length === 0}>
                {isSubmitting ? 'Creating...' : 'Create Secure Quiz'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}