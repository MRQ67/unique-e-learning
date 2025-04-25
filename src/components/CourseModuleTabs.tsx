'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Content = { id: string; order: number; title: string; type: string; url: string; joinUrl?: string };
type Module = { id: string; order: number; title: string; contents: Content[] };

export default function CourseModuleTabs({ modules }: { modules: Module[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="flex overflow-x-auto border-b mb-6">
        {modules.map((mod, idx) => (
          <Button
            key={mod.id}
            variant={idx === activeIndex ? 'default' : 'ghost'}
            className="px-4 py-2 -mb-px font-medium"
            onClick={() => setActiveIndex(idx)}
          >
            {mod.title}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        {modules[activeIndex]?.contents.map((ct) => (
          <div key={ct.id} className="border p-4 rounded">
            <h3 className="text-lg font-medium">{ct.order}. {ct.title}</h3>
            <p className="text-sm text-gray-600">Type: {ct.type}</p>
            {ct.type === 'VIDEO' && (() => {
              const url = ct.url;
              let embedUrl = url;
              if (url.includes('watch?v=')) embedUrl = url.replace('watch?v=', 'embed/');
              else if (url.includes('youtu.be/')) embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
              return embedUrl.includes('embed') ? (
                <iframe
                  src={embedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="mt-2 w-full aspect-video rounded"
                />
              ) : (
                <video src={url} controls className="mt-2 w-full rounded" />
              );
            })()}
            {ct.type === 'PDF' && (
              <>
                <embed src={ct.url} type="application/pdf" className="mt-2 w-full h-96 rounded" />
                <Button asChild variant="link" className="block mt-2">
                  <a href={ct.url} download>
                    Download PDF
                  </a>
                </Button>
              </>
            )}
            {ct.type === 'LIVE' && (
              <Button asChild variant="default" className="mt-2">
                <a href={ct.joinUrl} target="_blank" rel="noopener noreferrer">
                  Join Live Session
                </a>
              </Button>
            )}
            {ct.type !== 'VIDEO' && ct.type !== 'PDF' && ct.type !== 'LIVE' && (
              <Button asChild variant="link" className="mt-2">
                <a href={ct.url} target="_blank" rel="noopener noreferrer">
                  Access Content
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
