'use client';

import { useState } from 'react';
import CourseCreationForm from './CourseCreationForm';

export default function CourseCreationModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
      >
        Create a Course
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black text-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-full">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
            >
              &times;
            </button>
            <CourseCreationForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
