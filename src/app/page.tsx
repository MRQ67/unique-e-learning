'use client';

import Link from "next/link";
import NavbarHome from '@/components/NavbarHome';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@radix-ui/react-progress';
import { TrendingUp, BookOpen, Users, Clock } from 'lucide-react';
import { BookOpen as BookIcon, BarChart2, Video as VideoIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { VelocityScroll } from "@/components/magicui/scroll-based-velocity";  
import { LineShadowText } from "@/components/magicui/line-shadow-text";  

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Course {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'not_started';
  progress: number;
  students: number;
  nextLesson: string;
}

interface Exam {
  id: number;
  title: string;
  course: string;
  status: 'completed' | 'in_progress' | 'not_started';
  score: number;
  totalQuestions: number;
  duration: number;
}

interface CourseType {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  image?: string;
  instructor: { name: string };
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => fetch('http://localhost:3000/api/courses').then(res => res.json()),
  });

  const { data: exams, isLoading: isExamsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetch('http://localhost:3000/api/exams').then(res => res.json()),
  });

  // Dummy data for development
  const dummyCourses: Course[] = [
    {
      id: 1,
      title: 'Advanced JavaScript',
      description: 'Master advanced JavaScript concepts and build complex applications',
      status: 'in_progress',
      progress: 65,
      students: 125,
      nextLesson: 'Async/Await Patterns'
    },
    {
      id: 2,
      title: 'React Fundamentals',
      description: 'Learn the basics of React and build modern web applications',
      status: 'completed',
      progress: 100,
      students: 250,
      nextLesson: 'Completed'
    },
    {
      id: 3,
      title: 'Next.js Advanced',
      description: 'Build production-ready Next.js applications with best practices',
      status: 'not_started',
      progress: 0,
      students: 50,
      nextLesson: 'Introduction to Next.js'
    },
    {
      id: 4,
      title: 'TypeScript Essentials',
      description: 'Learn TypeScript and improve your JavaScript applications',
      status: 'in_progress',
      progress: 45,
      students: 80,
      nextLesson: 'Type Inference'
    }
  ];

  const dummyExams: Exam[] = [
    {
      id: 1,
      title: 'JavaScript Final Exam',
      course: 'Advanced JavaScript',
      status: 'in_progress',
      score: 0,
      totalQuestions: 20,
      duration: 60
    },
    {
      id: 2,
      title: 'React Certification Exam',
      course: 'React Fundamentals',
      status: 'completed',
      score: 95,
      totalQuestions: 30,
      duration: 90
    },
    {
      id: 3,
      title: 'Next.js Assessment',
      course: 'Next.js Advanced',
      status: 'not_started',
      score: 0,
      totalQuestions: 25,
      duration: 75
    },
    {
      id: 4,
      title: 'TypeScript Quiz',
      course: 'TypeScript Essentials',
      status: 'in_progress',
      score: 0,
      totalQuestions: 15,
      duration: 45
    }
  ];

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c: { title: string; category: string; }) => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [courses, searchTerm]);
  const featuredCourses = useMemo(() => filteredCourses.slice(0, 3), [filteredCourses]);
  const categories = useMemo(() => (courses ? Array.from(new Set(courses.map((c: { category: any; }) => c.category))) : []), [courses]);
  const instructors = [
    { name: 'Abdellah Ahmed', expertise: 'Lead Developer', photo: '/images/instructors/abdellah.jpg' },
    { name: 'Fuad Abdella', expertise: 'Project Manager', photo: '/images/instructors/fuad.jpg' },
  ];

  return (
    <main className="flex flex-col min-h-screen">
      {/* Navigation */}
      <NavbarHome />
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mt-16 relative bg-gradient-to-r from-[#3E7B27] to-[#85A947] text-[#EFE3C2] py-24 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl font-extrabold">
            Empower Your <LineShadowText>Learning Journey</LineShadowText>
          </h1>
          <p className="text-lg">Interactive courses, quizzes, and progress tracking to help you learn effectively.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/auth">
              <Button variant="default" size="lg" className="bg-[#3E7B27] hover:bg-[#123524] text-[#EFE3C2]">Get Started</Button>
            </Link>
            <Link href="/courses">
              <Button variant="default" size="lg" className="bg-[#EFE3C2] text-[#123524] hover:bg-[#EFE3C2]/90">Browse Courses</Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Featured Courses */}
      <section className="py-20 px-6 bg-[#EFE3C2]">
        <div className="px-4 py-8">
          <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{course.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Students</p>
                        <span className="text-sm font-medium">{course.students}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor Spotlight */}
      <section className="py-20 px-6 bg-[#EFE3C2]">
        <h2 className="text-3xl font-bold text-[#123524] text-center mb-8">Team of Unique</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {instructors.map(inst => (
            <div key={inst.name} className="flex flex-col items-center">
              <img src={inst.photo} alt={inst.name} className="w-32 h-32 rounded-full object-cover" />
              <h3 className="mt-4 text-lg font-medium">{inst.name}</h3>
              <p className="text-gray-600">{inst.expertise}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call-to-Action Banner */}
      <section className="py-16 px-6 bg-[#3E7B27] text-[#EFE3C2] text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to dive in?</h2>
        <p className="mb-6">Join now for a 7-day free trial and start learning today.</p>
        <Link href="/auth/register">
          <Button variant="default" className="bg-[#EFE3C2] text-[#123524] hover:bg-[#EFE3C2]/90">
            Start Free Trial
          </Button>
        </Link>
      </section>

      <footer className="py-8 px-6 bg-[#123524] text-[#EFE3C2] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-start">
            <div>{new Date().getFullYear()} Unique E-Learning. All rights reserved.</div>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/about" className="hover:text-[#85A947]">About</Link>
            <Link href="/contact" className="hover:text-[#85A947]">Contact</Link>
          </div>
        </div>
      </footer>

      <div className="py-8 px-6 bg-[#123524] text-[#EFE3C2] flex flex-col items-center space-y-4">
        <VelocityScroll>Unique E-Learning</VelocityScroll>
      </div>
    </main>
  );
}
