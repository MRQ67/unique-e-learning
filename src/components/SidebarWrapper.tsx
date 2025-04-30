import * as React from 'react';
import { cn } from '@/lib/utils';

interface SidebarWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// A simple shadcn-style sidebar wrapper that accepts children and className
export function SidebarWrapper({ children, className, ...props }: SidebarWrapperProps) {
  return (
    <aside
      className={cn(
        'w-72 min-w-[16rem] bg-background border-r flex flex-col h-full shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
