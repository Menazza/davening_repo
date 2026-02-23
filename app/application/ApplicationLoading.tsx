'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplicationLoading() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const maxAttempts = 5;

  useEffect(() => {
    const verifyAuth = async (attemptNum: number) => {
      setAttempt(attemptNum);
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          window.location.href = '/application?_stack_redirect=1';
        } else if (attemptNum < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, attemptNum), 5000);
          setTimeout(() => verifyAuth(attemptNum + 1), delay);
        } else {
          setStatus('error');
        }
      } catch {
        if (attemptNum < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, attemptNum), 5000);
          setTimeout(() => verifyAuth(attemptNum + 1), delay);
        } else {
          setStatus('error');
        }
      }
    };

    verifyAuth(1);
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Session Error</h2>
          <p className="text-gray-600 text-sm mb-4">We couldn't verify your session. Please try signing in again.</p>
          <button
            onClick={() => router.push('/handler/sign-in')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 text-sm">
          {attempt > 1 ? `Verifying session (${attempt}/${maxAttempts})...` : 'Loading...'}
        </p>
      </div>
    </div>
  );
}
