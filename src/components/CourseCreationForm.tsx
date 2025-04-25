'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator
} from '@/components/ui/select';

type ContentType = 'VIDEO' | 'PDF' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE';

interface ContentItem {
  type: ContentType;
  title: string;
  url: string;
  order: number;
  meetingId?: string;
  joinUrl?: string;
  startTime?: string;
  duration?: number;
}

interface ModuleItem {
  title: string;
  order: number;
  contents: ContentItem[];
}

interface CourseCreationFormProps {
  onSuccess?: () => void;
}

export default function CourseCreationForm({ onSuccess }: CourseCreationFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addModule = () => {
    setModules([...modules, { title: '', order: modules.length + 1, contents: [] }]);
  };

  const updateModule = (index: number, field: keyof ModuleItem, value: any) => {
    const updated = [...modules];
    // @ts-ignore
    updated[index][field] = value;
    setModules(updated);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const addContent = (modIndex: number) => {
    const updated = [...modules];
    updated[modIndex].contents.push({
      type: 'VIDEO',
      title: '',
      url: '',
      order: updated[modIndex].contents.length + 1,
      meetingId: '',
      joinUrl: '',
      startTime: '',
      duration: 0,
    });
    setModules(updated);
  };

  const updateContent = (modIndex: number, contentIndex: number, field: keyof ContentItem, value: any) => {
    const updated = [...modules];
    // @ts-ignore
    updated[modIndex].contents[contentIndex][field] = value;
    setModules(updated);
  };

  const removeContent = (modIndex: number, contentIndex: number) => {
    const updated = [...modules];
    updated[modIndex].contents = updated[modIndex].contents.filter((_, i) => i !== contentIndex);
    setModules(updated);
  };

  // PDF upload handler (server-side)
  const handlePdfUpload = async (modIndex: number, contentIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Upload failed'); return; }
      updateContent(modIndex, contentIndex, 'url', data.url);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleScheduleLive = async (modIndex: number, contentIndex: number) => {
    const ct = modules[modIndex].contents[contentIndex];
    if (!ct.title || !ct.startTime || !ct.duration) {
      alert('Please fill topic, start time, and duration');
      return;
    }
    try {
      const res = await fetch('/api/zoom/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: ct.title,
          start_time: new Date(ct.startTime).toISOString(),
          duration: ct.duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Scheduling failed'); return; }
      updateContent(modIndex, contentIndex, 'joinUrl', data.joinUrl);
      updateContent(modIndex, contentIndex, 'url', data.joinUrl);
      updateContent(modIndex, contentIndex, 'meetingId', data.meetingId);
    } catch (err) {
      console.error(err);
      alert('Scheduling failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description, duration, modules }),
    });
    if (res.ok) {
      onSuccess?.();
    } else {
      console.error(await res.json());
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-2">
        <Label htmlFor="course-title">Title</Label>
        <Input id="course-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="mb-2">
        <Label htmlFor="course-desc">Description</Label>
        <Input id="course-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <div className="mb-2">
        <Label htmlFor="course-duration">Duration (min)</Label>
        <Input id="course-duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} required />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Modules</h2>
        {modules.map((mod, mi) => (
          <div key={mi} className="border p-4 rounded mb-4">
            <div className="flex justify-between mb-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`module-${mi}-title`}>Module Title</Label>
                <Input id={`module-${mi}-title`} type="text" value={mod.title} onChange={e => updateModule(mi, 'title', e.target.value)} required />
              </div>
              <Button variant="secondary" size="sm" onClick={() => removeModule(mi)} type="button">Remove Module</Button>
            </div>
            <div className="mb-2 flex flex-col gap-2">
              <Label htmlFor={`module-${mi}-order`}>Order</Label>
              <Input id={`module-${mi}-order`} type="number" value={mod.order} onChange={e => updateModule(mi, 'order', Number(e.target.value))} required />
            </div>
            <div>
              <h3 className="font-medium mb-1">Contents</h3>
              {mod.contents.map((ct, ci) => (
                <div key={ci} className="flex flex-col gap-2 border p-2 rounded mb-2">
                  <Select value={ct.type} onValueChange={value => updateContent(mi, ci, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['VIDEO','PDF','QUIZ','ASSIGNMENT','LIVE'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="text" placeholder="Title" value={ct.title} onChange={e => updateContent(mi, ci, 'title', e.target.value)} required />
                  {ct.type === 'PDF' ? (
                    <>
                      <input type="file" accept="application/pdf" onChange={e => handlePdfUpload(mi, ci, e)} required />
                      {ct.url && (
                        <embed src={ct.url} type="application/pdf" className="mt-2 w-full h-60" />
                      )}
                    </>
                  ) : ct.type === 'LIVE' ? (
                    <>
                      <Input type="text" placeholder="Topic" value={ct.title} onChange={e => updateContent(mi, ci, 'title', e.target.value)} required />
                      <Input type="datetime-local" value={ct.startTime || ''} onChange={e => updateContent(mi, ci, 'startTime', e.target.value)} required />
                      <Input type="number" placeholder="Duration (min)" value={ct.duration || 0} onChange={e => updateContent(mi, ci, 'duration', Number(e.target.value))} required />
                      <Button variant="secondary" size="sm" onClick={() => handleScheduleLive(mi, ci)} type="button">Schedule Live</Button>
                      {ct.joinUrl && (
                        <a href={ct.joinUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-indigo-600 hover:underline">Join Live Session</a>
                      )}
                    </>
                  ) : (
                    <Input type="text" placeholder="URL" value={ct.url} onChange={e => updateContent(mi, ci, 'url', e.target.value)} required />
                  )}
                  <Input type="number" placeholder="Order" value={ct.order} onChange={e => updateContent(mi, ci, 'order', Number(e.target.value))} required />
                  <Button variant="secondary" size="sm" onClick={() => removeContent(mi, ci)} type="button">Remove Content</Button>
                </div>
              ))}
              <Button variant="default" onClick={() => addContent(mi)} className="mt-4" type="button">Add Content</Button>
            </div>
          </div>
        ))}
        <Button variant="default" onClick={addModule} className="mt-4" type="button">Add Module</Button>
      </div>
      <Button type="submit" disabled={isLoading} className="mt-6">
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          'Create Course'
        )}
      </Button>
    </form>
  );
}
