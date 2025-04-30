'use client';

import { useState } from 'react';
import ExamCreationForm from './ExamCreationForm';

export default function ExamCreationModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
      >
        Create an Exam
      </button>
      {open && (
        <div className="fixed inset-0 bg-white flex flex-col h-screen overflow-hidden z-50">
          <div className="flex-1 overflow-auto relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-black hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
            <ExamCreationForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
