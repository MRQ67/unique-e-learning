'use client';
import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

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
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Sign Out</DialogTitle>
                <DialogDescription>Are you sure you want to sign out?</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
