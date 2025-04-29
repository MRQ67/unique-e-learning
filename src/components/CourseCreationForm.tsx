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

interface CourseMetadata {
  category: string;
  level: string;
  prerequisites: string;
  learningObjectives: string[];
  thumbnail: string;
  price: number;
  tags: string[];
}

interface ModuleItem {
  title: string;
  order: number;
  contents: ContentItem[];
}

interface CourseCreationFormProps {
  onSuccess?: () => void;
}

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COURSE_CATEGORIES = [
  'Programming',
  'Data Science',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Other'
];

export default function CourseCreationForm({ onSuccess }: CourseCreationFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<CourseMetadata>({
    category: '',
    level: '',
    prerequisites: '',
    learningObjectives: [''],
    thumbnail: '',
    price: 0,
    tags: []
  });

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

  const updateMetadata = (field: keyof CourseMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const addLearningObjective = () => {
    updateMetadata('learningObjectives', [...metadata.learningObjectives, '']);
  };

  const updateLearningObjective = (index: number, value: string) => {
    const newObjectives = [...metadata.learningObjectives];
    newObjectives[index] = value;
    updateMetadata('learningObjectives', newObjectives);
  };

  const removeLearningObjective = (index: number) => {
    const newObjectives = metadata.learningObjectives.filter((_, i) => i !== index);
    updateMetadata('learningObjectives', newObjectives);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        title, 
        description, 
        duration, 
        modules,
        ...metadata
      }),
    });
    if (res.ok) {
      onSuccess?.();
    } else {
      console.error(await res.json());
      setIsLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="course-title">Title</Label>
        <Input id="course-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="course-desc">Description</Label>
        <Input id="course-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="course-category">Category</Label>
          <Select value={metadata.category} onValueChange={value => updateMetadata('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="course-level">Difficulty Level</Label>
          <Select value={metadata.level} onValueChange={value => updateMetadata('level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderCourseDetails = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prerequisites">Prerequisites</Label>
        <Input
          id="prerequisites"
          value={metadata.prerequisites}
          onChange={e => updateMetadata('prerequisites', e.target.value)}
          placeholder="What should students know before taking this course?"
        />
      </div>
      <div>
        <Label>Learning Objectives</Label>
        <div className="space-y-2">
          {metadata.learningObjectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={e => updateLearningObjective(index, e.target.value)}
                placeholder={`Objective ${index + 1}`}
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeLearningObjective(index)}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addLearningObjective}
            className="w-full"
          >
            Add Learning Objective
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFinalDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="course-duration">Duration (min)</Label>
          <Input
            id="course-duration"
            type="number"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label htmlFor="course-price">Price ($)</Label>
          <Input
            id="course-price"
            type="number"
            min="0"
            step="0.01"
            value={metadata.price}
            onChange={e => updateMetadata('price', parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="thumbnail">Thumbnail URL</Label>
        <Input
          id="thumbnail"
          value={metadata.thumbnail}
          onChange={e => updateMetadata('thumbnail', e.target.value)}
          placeholder="Enter thumbnail image URL"
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Step {step} of 3</h2>
            <p className="text-sm text-gray-500">
              {step === 1 ? 'Basic Information' : step === 2 ? 'Course Details' : 'Final Details'}
            </p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-black rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && renderBasicInfo()}
        {step === 2 && renderCourseDetails()}
        {step === 3 && renderFinalDetails()}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="ml-auto">
              Next
            </Button>
          ) : (
            <div className="flex gap-4 ml-auto">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          )}
        </div>

        {step === 3 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Course Modules</h2>
            {modules.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-gray-500">No modules added yet. Click the button below to add your first module.</p>
              </div>
            ) : modules.map((mod, mi) => (
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
        )}
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
