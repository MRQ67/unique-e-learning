'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AnimatedCircularProgressBar } from '@/components/magicui/animated-circular-progress-bar';

type Content = { id: string; order: number; title: string };
type Module = { id: string; order: number; title: string; contents: Content[] };

export default function CourseProgress({ modules }: { modules: Module[] }) {
  const lessons = modules.flatMap(m => m.contents);
  const total = lessons.length;

  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    setCompleted(stored);
  }, []);

  const toggle = (id: string) => {
    const next = completed.includes(id)
      ? completed.filter(cid => cid !== id)
      : [...completed, id];
    setCompleted(next);
    localStorage.setItem('completedLessons', JSON.stringify(next));
  };

  const percent = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Progress</h2>
      <AnimatedCircularProgressBar
        value={percent}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
        className="mx-auto"
      />
      <p>{completed.length} of {total} lessons completed ({percent}%)</p>
      {percent === 100 && (
        <Alert>
          <AlertTitle>Congratulations!</AlertTitle>
          <AlertDescription>Certificate Earned!</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        {lessons.map(l => (
          <div key={l.id} className="flex items-center">
            <Checkbox
              checked={completed.includes(l.id)}
              onCheckedChange={() => toggle(l.id)}
              className="mr-2"
            />
            <span>{l.order}. {l.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
