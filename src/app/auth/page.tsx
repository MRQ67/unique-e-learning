import Link from 'next/link';

export default function AuthIndexPage() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome</h1>
      <div className="flex justify-center gap-6">
        <Link href="/auth/register" className="text-blue-600 hover:underline">
          Register
        </Link>
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
