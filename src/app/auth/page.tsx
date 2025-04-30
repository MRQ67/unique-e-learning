'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { signIn, getSession } from 'next-auth/react';
import { Role } from '@prisma/client';

export default function AuthPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Use NextAuth signIn to prevent redirects
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (result?.ok) {
      toast({ title: tab === 'register' ? 'Registered!' : 'Signed In!', description: 'Success' });
      const session = await getSession();
      const role = session?.user?.role as Role | undefined;
      let redirectPath = '/';
      if (role === Role.STUDENT) redirectPath = '/dashboard/student';
      else if (role === Role.INSTRUCTOR) redirectPath = '/dashboard/instructor';
      else if (role === Role.ADMIN) redirectPath = '/dashboard/admin';
      router.push(redirectPath);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result?.error || 'Something went wrong' });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'signin' | 'register')}>
        <TabsList>
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" className="mt-4">Sign In</Button>
          </form>
        </TabsContent>
        <TabsContent value="register">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label htmlFor="email-reg">Email</Label>
            <Input id="email-reg" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Label htmlFor="password-reg">Password</Label>
            <Input id="password-reg" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" className="mt-4">Register</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
