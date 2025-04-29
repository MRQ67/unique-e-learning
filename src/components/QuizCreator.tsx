'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface QuizCreatorProps {
  moduleId: string;
  courseId: string;
  onSuccess?: () => void;
}

type QuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  options: string[];
  answer: string;
  timeLimit: number;
};

export default function QuizCreator({ moduleId, courseId, onSuccess }: QuizCreatorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quizTitle, setQuizTitle] = useState('');
  const [isSecure, setIsSecure] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: `q-${Date.now()}`,
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    answer: '',
    timeLimit: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: name === 'timeLimit' ? parseInt(value) || 60 : value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.type === 'multiple-choice' && !currentQuestion.answer) {
      setError('Please select an answer for the multiple-choice question');
      return;
    }

    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion({
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      answer: '',
      timeLimit: 60,
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
      const response = await fetch('/api/courses/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          title: quizTitle,
          type: 'QUIZ',
          requiresProctoring: isSecure,
          questions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create quiz');
      }

      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      if (onSuccess) onSuccess();
      router.push(`/courses/${courseId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Quiz</CardTitle>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSecure"
                checked={isSecure}
                onCheckedChange={(checked) => setIsSecure(checked as boolean)}
              />
              <Label htmlFor="isSecure">Require Secure Proctoring</Label>
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

              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <select
                  id="type"
                  name="type"
                  value={currentQuestion.type}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value as 'multiple-choice' | 'short-answer' }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="short-answer">Short Answer</option>
                </select>
              </div>

              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-3">
                  <Label>Options</Label>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="answerOption"
                        checked={currentQuestion.answer === option}
                        onChange={() => setCurrentQuestion(prev => ({ ...prev, answer: option }))}
                        disabled={!option.trim()}
                      />
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short-answer' && (
                <div className="space-y-2">
                  <Label htmlFor="answer">Correct Answer</Label>
                  <Input
                    id="answer"
                    name="answer"
                    value={currentQuestion.answer}
                    onChange={handleQuestionChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  value={currentQuestion.timeLimit}
                  onChange={handleQuestionChange}
                  min={10}
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
                        <p className="text-sm">Type: {q.type}</p>
                        <p className="text-sm">Time Limit: {q.timeLimit} seconds</p>
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
                {isSubmitting ? 'Creating...' : 'Create Quiz'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}