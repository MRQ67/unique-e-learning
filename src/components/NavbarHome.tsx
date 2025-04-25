'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function NavbarHome() {
  return (
    <nav className="w-full bg-[#EFE3C2]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between fixed top-0 z-30">
      <div className="text-2xl font-bold text-[#123524]">Unique E-Learning</div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} className="text-[#123524] hover:text-[#3E7B27]">
              {item.label}
            </Link>
          ))}
        </div>
        <Link href="/auth/register">
          <Button variant="default" className="bg-[#3E7B27] hover:bg-[#123524] text-[#EFE3C2]">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
}
