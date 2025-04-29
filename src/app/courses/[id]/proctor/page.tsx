'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SecureQuiz from '@/components/SecureQuiz';
import Navbar from '@/components/Navbar';

export default function CourseProctorPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('proctor');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['proctor-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/quizzes?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    enabled: !!sessionId
  });
  
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', params.courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${params.courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    }
  });
  
  useEffect(() => {
    // Verify that the user is authorized to proctor this session
    if (session && course) {
      // Check if the course belongs to the current instructor
      const isInstructorsCourse = course.instructorId === session.user?.id;
      setIsAuthorized(isInstructorsCourse);
      
      if (!isInstructorsCourse) {
        // Redirect if not authorized
        router.push('/dashboard/instructor');
      }
    }
  }, [session, course, router]);
  
  if (sessionLoading || courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading proctoring session...</p>
      </div>
    );
  }
  
  if (!sessionId || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">Invalid proctoring session</p>
        <button 
          onClick={() => router.push('/dashboard/instructor')} 
          className="mt-4 px-4 py-2 bg-black text-white rounded"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">You are not authorized to proctor this session</p>
        <button 
          onClick={() => router.push('/dashboard/instructor')} 
          className="mt-4 px-4 py-2 bg-black text-white rounded"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <>
      <Navbar title={`Proctoring: ${course?.title || 'Course'}`} />
      <div className="container mx-auto mt-20 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Secure Proctoring Session</h1>
          <p className="text-gray-600">Monitoring student: {session.user?.name || 'Unknown'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <SecureQuiz sessionId={sessionId} />
        </div>
        
        <div className="mt-6">
          <button 
            onClick={() => router.push('/dashboard/instructor')} 
            className="px-4 py-2 bg-black text-white rounded"
          >
            End Proctoring
          </button>
        </div>
      </div>
    </>
  );
}