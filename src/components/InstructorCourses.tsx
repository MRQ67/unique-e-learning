'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import DeleteCourseDialog from './DeleteCourseDialog';
import EditCourseModal from './EditCourseModal';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  instructorId: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  order: number;
  contents: Content[];
}

interface Content {
  id: string;
  type: string;
  title: string;
  url: string;
  order: number;
  requiresProctoring?: boolean;
}

interface InstructorCoursesProps {
  instructorId: string;
}

export default function InstructorCourses({ instructorId }: InstructorCoursesProps) {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses', instructorId],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      const allCourses = await res.json() as Course[];
      // Filter courses by instructor ID
      return allCourses.filter(course => course.instructorId === instructorId);
    }
  });

  const startProctoring = async (courseId: string, contentId: string) => {
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          requiresProctoring: true,
          proctoringActive: true
        }),
      });
      
      if (res.ok) {
        const session = await res.json();
        router.push(`/courses/${courseId}?proctor=${session.id}`);
      }
    } catch (error) {
      console.error('Failed to start proctoring session:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading your courses...</div>;
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">You haven't created any courses yet.</p>
      </div>
    );
  }
  
  const handleCourseUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor-courses', instructorId] });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <EditCourseModal course={course} onUpdated={handleCourseUpdated} />
                <DeleteCourseDialog 
                  courseId={course.id} 
                  courseTitle={course.title} 
                  onDeleted={handleCourseUpdated} 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">Duration: {course.duration} minutes</p>
            <p className="text-sm font-medium mt-4">Modules: {course.modules?.length || 0}</p>
            
            {selectedCourse === course.id && (
              <div className="mt-4 space-y-2">
                {course.modules?.map((module) => (
                  <div key={module.id} className="border p-2 rounded">
                    <p className="font-medium">{module.title}</p>
                    <div className="ml-4 mt-2 space-y-1">
                      {module.contents
                        ?.filter(content => content.type === 'QUIZ')
                        .map((content) => (
                          <div key={content.id} className="flex justify-between items-center">
                            <span className="flex items-center">
                              {content.title} 
                              {content.requiresProctoring && (
                                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                  Secure
                                </span>
                              )}
                            </span>
                            {content.requiresProctoring ? (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => startProctoring(course.id, content.id)}
                              >
                                Start Proctoring
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => router.push(`/courses/${course.id}/quiz/${content.id}`)}
                              >
                                View Quiz
                              </Button>
                            )}
                          </div>
                        ))
                      }
                      <div className="mt-3 flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/courses/${course.id}/modules/${module.id}/quiz/create`)}
                        >
                          Create Quiz
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/courses/${course.id}/modules/${module.id}/secure-quiz/create`)}
                        >
                          Create Secure Quiz
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
            >
              {selectedCourse === course.id ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button onClick={() => router.push(`/courses/${course.id}`)}>View Course</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}