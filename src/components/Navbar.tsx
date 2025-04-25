'use client';
import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Navbar({ title }: { title: string }) {
  const username = 'User';
  const avatarUrl = 'https://www.gravatar.com/avatar/?d=mp&f=y';

  return (
    <nav className="w-full bg-transparent backdrop-blur-md bg-opacity-40 px-6 py-4 flex items-center justify-between fixed top-0 z-30">
      <div className="text-2xl font-bold text-black">{title}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback>{username[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/account">Account Setting</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/' })}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
