'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ExamQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  questions: { id: string; prompt: string; options: string[]; correctOption: number }[];
}

interface ExamEditFormProps {
  exam: Exam;
  onSuccess?: () => void;
}

export default function ExamEditForm({ exam, onSuccess }: ExamEditFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(exam.title);
  const [description, setDescription] = useState(exam.description || '');
  const [questions, setQuestions] = useState<ExamQuestion[]>(
    exam.questions.map(q => ({ prompt: q.prompt, options: q.options, correctOption: q.correctOption }))
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { prompt: '', options: ['', '', '', ''], correctOption: 0 }]);
  };
  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };
  const updatePrompt = (qi: number, val: string) => {
    const u = [...questions]; u[qi].prompt = val; setQuestions(u);
  };
  const updateOption = (qi: number, oi: number, val: string) => {
    const u = [...questions]; u[qi].options[oi] = val; setQuestions(u);
  };
  const updateCorrectOption = (qi: number, oi: number) => {
    const u = [...questions]; u[qi].correctOption = oi; setQuestions(u);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (questions.length === 0) { setError('Add at least one question'); return; }
    for (const q of questions) {
      if (!q.prompt.trim() || q.options.some(o => !o.trim())) {
        setError('All fields must be filled'); return;
      }
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questions }),
      });
      if (!res.ok) {
        const d = await res.json(); throw new Error(d.error || 'Update failed');
      }
      await res.json();
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
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
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
          <Input placeholder="Prompt" value={q.prompt} onChange={e => updatePrompt(qi, e.target.value)} />
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center space-x-2">
              <input type="radio" name={`correct-${qi}`} checked={q.correctOption === oi} onChange={() => updateCorrectOption(qi, oi)} />
              <Input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>Add Question</Button>
        </div>
      ))}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSuccess && onSuccess()} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating...</span>
  ) : (
    'Update Exam'
  )}
</Button>
      </div>
    </form>
  );
}
