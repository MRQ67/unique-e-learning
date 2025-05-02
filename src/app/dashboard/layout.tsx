"use client";
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { NavItem } from '@/components/ui/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export default function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  return (
    <div className="flex">
      {navItems && (
        <Sidebar navItems={navItems} />
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
