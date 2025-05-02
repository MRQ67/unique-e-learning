'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { signIn, getSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Checkbox } from '@/components/ui/checkbox';

export default function AuthPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tab, setTab] = useState<'signin' | 'register'>('register');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (tab === 'register') {
      if (!name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter your name' });
        return;
      }
      
      if (!termsAccepted) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please accept the terms and conditions' });
        return;
      }
      
      // For registration, we need to call the API endpoint to create the user
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: `${name} ${lastName}`.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          toast({ variant: 'destructive', title: 'Error', description: data.message || 'Failed to create user' });
          return;
        }
        // After creating user, try to sign in
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        if (result?.ok) {
          toast({ title: 'Registered!', description: 'Success' });
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
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create user' });
      }
    } else {
      // For sign in, use the credentials provider
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.ok) {
        toast({ title: 'Signed In!', description: 'Success' });
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden flex">
        {/* Left side - Image */}
        <div className="relative w-1/2 bg-purple-600 hidden md:block">
          <div className="absolute top-4 left-4 z-10">
            <Image src="/unique.svg" alt="Unique Logo" width={48} height={48} />
          </div>
          <div className="absolute top-4 right-4 z-10">
            <Button asChild variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Link href="/">Back to website</Link>
            </Button>
          </div>
          <div className="relative h-full">
            <Image 
              src="/job503-wit-003-e.jpg" 
              alt="Background" 
              fill 
              style={{ objectFit: 'cover' }} 
              priority 
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8 bg-black/30">
              <h2 className="text-3xl font-bold mb-2">Capturing Moments,</h2>
              <h2 className="text-3xl font-bold">Creating Memories</h2>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{tab === 'signin' ? 'Sign in to your account' : 'Create an account'}</h1>
            <p className="text-gray-600">
              {tab === 'signin' ? (
                <>Don't have an account? <button onClick={() => setTab('register')} className="text-purple-600 hover:underline">Register</button></>
              ) : (
                <>Already have an account? <button onClick={() => setTab('signin')} className="text-purple-600 hover:underline">Log in</button></>
              )}
            </p>
          </div>
          
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'signin' | 'register')} className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                    className="w-full p-3" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    className="w-full p-3" 
                    required 
                  />
                </div>
                
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 mt-6">
                  Sign In
                </Button>
                <p className="text-center text-sm text-gray-600 mt-2">
                  <Link href="/auth/reset-password" className="text-purple-600 hover:underline">
                    Forgot password?
                  </Link>
                </p>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <div className="space-y-2 w-1/2">
                    <Label htmlFor="name">First name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="First name" 
                      className="w-full p-3" 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2 w-1/2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      type="text" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      placeholder="Last name" 
                      className="w-full p-3" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-reg">Email</Label>
                  <Input 
                    id="email-reg" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                    className="w-full p-3" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-reg">Password</Label>
                  <Input 
                    id="password-reg" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    className="w-full p-3" 
                    required 
                  />
                </div>
                
                <p className="text-center text-sm text-gray-600 mt-2">
                  Already have an account? <button onClick={() => setTab('signin')} className="text-purple-600 hover:underline">Log in</button>
                </p>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted} 
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} 
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the <Link href="#" className="text-purple-600 hover:underline">Terms & Conditions</Link>
                  </label>
                </div>
                
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 mt-6">
                  Create account
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or register with</span>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <a href="" className="w-1/2 block">
                    <Button variant="outline" className="w-full py-3" type="button">
                      <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-2" />
                      Google
                    </Button>
                  </a>
                  <a href="" className="w-1/2 block">
                    <Button variant="outline" className="w-full py-3" type="button">
                      <Image src="/facebook.svg" alt="Facebook" width={20} height={20} className="mr-2" />
                      Facebook
                    </Button>
                  </a>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
