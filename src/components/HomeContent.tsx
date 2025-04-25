'use client';
import Link from 'next/link';
import NavbarHome from '@/components/NavbarHome';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { BookOpen, BarChart2, Video as VideoIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomeContent() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Navigation */}
      <NavbarHome />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-r from-[#3E7B27] to-[#85A947] text-[#EFE3C2] py-24 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl font-extrabold">Empower Your Learning Journey</h1>
          <p className="text-lg">Interactive courses, quizzes, and progress tracking to help you learn effectively.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/auth/register">
              <Button variant="default" size="lg" className="bg-[#3E7B27] hover:bg-[#123524] text-[#EFE3C2]">Get Started</Button>
            </Link>
            <Link href="/courses">
              <Button variant="default" size="lg" className="bg-[#EFE3C2] text-[#123524] hover:bg-[#EFE3C2]/90">Browse Courses</Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#EFE3C2]">
        <h2 className="text-3xl font-bold text-[#123524] text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0 }}>
            <Card>
              <CardHeader>
                <BookOpen className="text-[#3E7B27] size-6" />
                <CardTitle className="text-[#3E7B27]">Interactive Courses</CardTitle>
                <CardDescription className="text-[#123524]">Hands-on lessons with real-time feedback.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/courses">
                  <Button variant="link" className="text-[#3E7B27]">Explore</Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card>
              <CardHeader>
                <BarChart2 className="text-[#3E7B27] size-6" />
                <CardTitle className="text-[#3E7B27]">Progress Tracking</CardTitle>
                <CardDescription className="text-[#123524]">Stay motivated by visualizing your progress.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/dashboard">
                  <Button variant="link" className="text-[#3E7B27]">View Dashboard</Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card>
              <CardHeader>
                <VideoIcon className="text-[#3E7B27] size-6" />
                <CardTitle className="text-[#3E7B27]">Live Sessions</CardTitle>
                <CardDescription className="text-[#123524]">Schedule and join live webinars seamlessly.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/live">
                  <Button variant="link" className="text-[#3E7B27]">Learn More</Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-6 bg-[#123524] text-[#EFE3C2] mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>{new Date().getFullYear()} Unique E-Learning. All rights reserved.</div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/about" className="hover:text-[#85A947]">About</Link>
            <Link href="/contact" className="hover:text-[#85A947]">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
