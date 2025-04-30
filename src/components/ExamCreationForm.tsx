'use client';

import { useState } from 'react';
import ExamSidebar from './ExamSidebar';
import ExamQuestionEditor from './ExamQuestionEditor';
import ExamResultPreviewModal from './ExamResultPreviewModal';
import { useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


export type QuestionType = 'multiple-choice' | 'true-false';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  choices: { id: string; text: string; correct: boolean }[];
  estimationTime: number;
  points: number;
}


interface ExamCreationFormProps {
  onSuccess?: () => void;
}

export default function ExamCreationForm({ onSuccess }: ExamCreationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([{
    id: `q-${Date.now()}`,
    type: 'multiple-choice',
    label: '',
    required: true,
    choices: [
      { id: 'c1', text: '', correct: false },
      { id: 'c2', text: '', correct: false },
      { id: 'c3', text: '', correct: false },
      { id: 'c4', text: '', correct: false },
    ],
    estimationTime: 2,
    points: 1,
  }]);
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [showResultPreview, setShowResultPreview] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // DnD handlers
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      setQuestions(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    const newQ: ExamQuestion = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      label: '',
      required: true,
      choices: [
        { id: 'c1', text: '', correct: false },
        { id: 'c2', text: '', correct: false },
        { id: 'c3', text: '', correct: false },
        { id: 'c4', text: '', correct: false },
      ],
      estimationTime: 2,
      points: 1,
    };
    setQuestions(qs => [...qs, newQ]);
    setSelectedId(newQ.id);
  };

  const handleSelect = (id: string) => setSelectedId(id);

  const handleUpdate = (updatedQ: ExamQuestion) => {
    setQuestions(qs => qs.map(q => q.id === updatedQ.id ? updatedQ : q));
  };

  const handleDelete = (id: string) => {
    setQuestions(qs => qs.filter(q => q.id !== id));
    if (selectedId === id) setSelectedId(questions[0]?.id ?? null);
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
      if (!q.label.trim()) {
        setError('All questions must have a prompt');
        return;
      }
      if (q.type === 'multiple-choice' && q.choices.some(opt => !opt.text.trim())) {
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

  const selectedQ = questions.find(q => q.id === selectedId) ?? questions[0];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <div className="flex bg-[#f6f7fa] w-screen h-screen overflow-hidden">
      <ExamSidebar
        questions={questions.map(q => ({ id: q.id, type: q.type, label: q.label }))}
        selectedId={selectedId}
        onSelect={handleSelect}
        onAdd={handleAdd}
        onReorder={order => setQuestions(order.map(id => questions.find(q => q.id === id)!))}
      />
      <main className="flex-1 p-8 overflow-y-auto h-full">
        <form onSubmit={handleSubmit} className="flex flex-col w-full h-full space-y-6">
          <div className="flex flex-col gap-2 mb-4">
            <Label htmlFor="exam-title" className="text-xl font-bold">Exam Title</Label>
            <Input id="exam-title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Label htmlFor="exam-desc" className="font-medium mt-2">Description</Label>
            <Textarea id="exam-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          {selectedQ && (
            <ExamQuestionEditor
              question={selectedQ}
              onChange={handleUpdate}
              onDelete={() => handleDelete(selectedQ.id)}
            />
          )}
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex justify-between items-center mt-8">
            <Button variant="outline" type="button" onClick={() => setShowResultPreview(true)}>
              Preview Result Screen
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onSuccess && onSuccess()} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Exam'}</Button>
            </div>
          </div>
        </form>
        <ExamResultPreviewModal
          open={showResultPreview}
          onClose={() => setShowResultPreview(false)}
          totalPoints={totalPoints}
          questionCount={questions.length}
        />
      </main>
    </div>
  );
}
