'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ExamEditForm from './ExamEditForm';
import { useQuery } from '@tanstack/react-query';
import type { Exam } from './ExamEditForm';

interface ExamEditModalProps {
  examId: string;
}

export default function ExamEditModal({ examId }: ExamEditModalProps) {
  const [open, setOpen] = useState(false);
  const { data: exam, isLoading } = useQuery<Exam, Error>({
    queryKey: ['exam', examId] as const,
    queryFn: () =>
      fetch(`/api/exams/${examId}`)
        .then(res => res.json() as Promise<Exam>),
  });

  useEffect(() => {
    if (open && !exam) {
      // refetch or handle loading
    }
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">Edit Exam</Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-full">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-black text-2xl">&times;</button>
            {!isLoading && exam && (
              <ExamEditForm exam={exam} onSuccess={() => setOpen(false)} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
