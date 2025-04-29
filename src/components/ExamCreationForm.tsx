'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';

interface ExamQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
}

interface ExamCreationFormProps {
  onSuccess?: () => void;
}

export default function ExamCreationForm({ onSuccess }: ExamCreationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    { prompt: '', options: ['', '', '', ''], correctOption: 0 },
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const addQuestion = () => {
    setQuestions(prev => [...prev, { prompt: '', options: ['', '', '', ''], correctOption: 0 }]);
  };

  const updatePrompt = (qi: number, value: string) => {
    const updated = [...questions];
    updated[qi].prompt = value;
    setQuestions(updated);
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  };

  const updateCorrectOption = (qi: number, oi: number) => {
    const updated = [...questions];
    updated[qi].correctOption = oi;
    setQuestions(updated);
  };

  const removeQuestion = (qi: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== qi));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Exam title is required');
      return;
    }
    if (questions.length === 0) {
      setError('Add at least one question');
      return;
    }
    for (const q of questions) {
      if (!q.prompt.trim()) {
        setError('All questions must have a prompt');
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setError('All options must be filled');
        return;
      }
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create exam');
      }
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-black">
      <div className="flex flex-col">
        <Label htmlFor="title">Exam Title</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      {questions.map((q, qi) => (
        <div key={qi} className="p-4 border rounded space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-medium">Question {qi + 1}</Label>
            <Button variant="destructive" size="sm" onClick={() => removeQuestion(qi)} type="button">Remove</Button>
          </div>
          <Input placeholder="Prompt" value={q.prompt} onChange={e => updatePrompt(qi, e.target.value)} required />
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`correct-${qi}`}
                checked={q.correctOption === oi}
                onChange={() => updateCorrectOption(qi, oi)}
              />
              <Input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} required />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>Add Question</Button>
        </div>
      ))}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSuccess && onSuccess()} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Exam'}</Button>
      </div>
    </form>
  );
}
