'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // full redirect; NextAuth will set cookie and navigate to /dashboard
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    await signIn('credentials', {
      email,
      password,
      callbackUrl: baseUrl ? `${baseUrl}/dashboard` : '/dashboard',
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl mb-4">Sign In</h1>
      {error && <p className="mb-4 text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Sign In
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="bg-red-500 text-white p-2 rounded"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
          className="bg-blue-800 text-white p-2 rounded"
        >
          Sign in with Facebook
        </button>
      </div>
      <div className="mt-4 text-center text-sm">
        Don’t have an account?{' '}
        <Link href="/auth/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
}
