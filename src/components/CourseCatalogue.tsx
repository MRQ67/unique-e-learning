'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import CourseCreationModal from './CourseCreationModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface CourseWithInstructor {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  instructor: { name: string | null };
}

export default function CourseCatalogue({ courses }: { courses: CourseWithInstructor[] }) {
  const [search, setSearch] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('all');

  const instructors = useMemo(
    () => ['all', ...Array.from(new Set(courses.map(c => c.instructor.name || 'Unknown')))],
    [courses]
  );

  const filtered = useMemo(
    () =>
      courses.filter(
        c =>
          (c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())) &&
          (instructorFilter === 'all' || (c.instructor.name || 'Unknown') === instructorFilter)
      ),
    [courses, search, instructorFilter]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search Courses</Label>
          <Input id="search" placeholder="Search courses" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="instructor-filter">Instructor</Label>
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger id="instructor-filter">
              <SelectValue placeholder="All Instructors" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ul className="space-y-4 mt-4">
        {filtered.map(c => (
          <li key={c.id}>
            <Card>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardAction>
                  <Button asChild variant="link">
                    <Link href={`/courses/${c.id}`}>View</Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardDescription>{c.description}</CardDescription>
              <CardFooter>
                Instructor: {c.instructor.name || 'Unknown'} | Duration: {Math.floor(c.duration / 60)}h {c.duration % 60}m
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <CourseCreationModal />
      </div>
    </div>
  );
}
