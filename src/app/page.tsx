'use client';

import Link from "next/link";
import NavbarHome from '@/components/NavbarHome';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { BookOpen, BarChart2, Video as VideoIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { VelocityScroll } from "@/components/magicui/scroll-based-velocity";  
import { LineShadowText } from "@/components/magicui/line-shadow-text";  

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

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
  const { data: courses, isLoading } = useQuery<CourseType[]>({
    queryKey: ['courses'],
    queryFn: () => fetch('/api/courses').then(res => res.json()),
  });
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [courses, searchTerm]);
  const featuredCourses = useMemo(() => filteredCourses.slice(0, 3), [filteredCourses]);
  const categories = useMemo(() => (courses ? Array.from(new Set(courses.map(c => c.category))) : []), [courses]);
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
        <h2 className="text-3xl font-bold text-[#123524] text-center mb-8">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {featuredCourses.map(course => (
            <Card key={course.id}>
              <img src={course.image} alt={course.title} className="w-full h-48 object-cover rounded-t-lg" />
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/courses/${course.id}`}>
                  <Button variant="link">View Course</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3E7B27]"
          />
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-12 px-6 bg-[#f7fafc]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xl text-[#123524]">Flexible learning anytime, anywhere.</p>
          <p className="text-xl text-[#123524]">Expert instructors from top universities.</p>
          <p className="text-xl text-[#123524]">Hands-on projects and real-world examples.</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6 bg-white">
        <h2 className="text-3xl font-bold text-[#123524] text-center mb-8">Categories</h2>
        <div className="flex justify-center flex-wrap gap-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSearchTerm(cat)}
              className="px-4 py-2 bg-[#85A947] text-white rounded-full"
            >
              {cat}
            </button>
          ))}
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
