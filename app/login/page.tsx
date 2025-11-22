'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Neon Auth sign-in page
    router.push('/handler/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-gray-600">Redirecting to sign in...</div>
    </div>
  );
}

