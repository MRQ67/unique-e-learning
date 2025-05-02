"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from '@/components/ui/button';

export default function StartExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    // Use a small timeout to show spinner before navigation
    setTimeout(() => {
      router.push(`/exams/${examId}/take`);
    }, 150);
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full">
      {loading ? (
        <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Starting...</span>
      ) : (
        'Start Exam'
      )}
    </Button>
  );
}
