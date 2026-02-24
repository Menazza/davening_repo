'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLoading() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'verifying' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    // Don't redirect on user===null - we're in post-sign-in flow, useUser() can be stale
    // on some devices (Safari, slow hydration). Always verify with server first.
    const verifyAuth = async (attemptNum: number) => {
      setStatus('verifying');
      setAttempt(attemptNum);

      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user?.is_admin) {
            sessionStorage.removeItem('dashboard_reload_count');
            window.location.href = '/admin?_stack_redirect=1';
            return;
          }
          const reloadCount = parseInt(sessionStorage.getItem('dashboard_reload_count') || '0', 10);
          if (reloadCount >= 2) {
            sessionStorage.removeItem('dashboard_reload_count');
            setStatus('error');
            return;
          }
          sessionStorage.setItem('dashboard_reload_count', String(reloadCount + 1));
          await new Promise((r) => setTimeout(r, 500));
          window.location.href = `/dashboard?_stack_redirect=1&_t=${Date.now()}`;
        } else if (attemptNum < maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(1.5, attemptNum), 5000);
          setTimeout(() => verifyAuth(attemptNum + 1), delay);
        } else {
          setStatus('error');
        }
      } catch (error) {
        if (attemptNum < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, attemptNum), 5000);
          setTimeout(() => verifyAuth(attemptNum + 1), delay);
        } else {
          setStatus('error');
        }
      }
    };

    // Start verification
    verifyAuth(1);
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Session Error</h2>
          <p className="text-gray-600 text-sm mb-4">
            We couldn't verify your session. This sometimes happens on mobile devices.
          </p>
          <button
            onClick={() => router.push('/handler/sign-in')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try signing in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-xl animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard...</h2>
        <p className="text-gray-600 text-sm">
          {status === 'verifying' 
            ? `Verifying your session${attempt > 1 ? ` (attempt ${attempt}/${maxAttempts})` : ''}...`
            : 'Setting up your session...'
          }
        </p>
        <div className="mt-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
