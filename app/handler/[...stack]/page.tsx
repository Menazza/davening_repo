'use client';

import { StackHandler } from "@stackframe/stack";
import { useUser } from "@stackframe/stack";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Handler() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    // If user is already signed in and they're on sign-in or sign-up, redirect appropriately
    // Use ref to prevent multiple redirects
    if (user && (pathname?.includes('/sign-in') || pathname?.includes('/sign-up')) && !hasRedirected.current) {
      hasRedirected.current = true;
      setIsRedirecting(true);
      
      console.log('[Handler] User detected, checking profile before redirect');
      
      // Function to verify cookies are working before redirecting
      const verifyAndRedirect = async (attempt: number) => {
        console.log(`[Handler] Verification attempt ${attempt}/${maxRetries}`);
        
        try {
          const res = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          });
          
          console.log('[Handler] Profile check response status:', res.status);
          
          if (res.status === 401 || res.status === 500) {
            // Cookies not ready yet, retry with exponential backoff
            if (attempt < maxRetries) {
              const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
              console.log(`[Handler] Auth not ready, retrying in ${delay}ms...`);
              setRedirectAttempts(attempt);
              setTimeout(() => verifyAndRedirect(attempt + 1), delay);
              return;
            } else {
              console.error('[Handler] Max retries reached, forcing redirect anyway');
            }
          }
          
          const data = await res.json();
          console.log('[Handler] Profile data:', data);
          
          // Use router.push with _stack_redirect param to bypass middleware auth check
          // This allows the page to load while cookies fully propagate
          if (data.user?.is_admin) {
            console.log('[Handler] Redirecting to /admin');
            router.push('/admin?_stack_redirect=1');
          } else {
            console.log('[Handler] Redirecting to /dashboard');
            router.push('/dashboard?_stack_redirect=1');
          }
        } catch (err) {
          console.error('[Handler] Profile check failed:', err);
          
          // Retry on network errors
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
            console.log(`[Handler] Retrying in ${delay}ms...`);
            setRedirectAttempts(attempt);
            setTimeout(() => verifyAndRedirect(attempt + 1), delay);
          } else {
            // Last resort - try dashboard with bypass param
            console.log('[Handler] Max retries reached, defaulting to dashboard');
            router.push('/dashboard?_stack_redirect=1');
          }
        }
      };
      
      // Start verification after a short initial delay for cookies to set
      setTimeout(() => verifyAndRedirect(1), 500);
    }
  }, [user, router, pathname]);

  const isSignInOrSignUp = pathname?.includes('/sign-in') || pathname?.includes('/sign-up');

  // Show redirecting state while we verify auth and redirect
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-xl animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in...</h2>
          <p className="text-gray-600 text-sm">
            {redirectAttempts > 0 
              ? `Verifying your session (attempt ${redirectAttempts}/${maxRetries})...`
              : 'Please wait while we set up your session'
            }
          </p>
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isSignInOrSignUp) {
    return (
      <div className="min-h-screen bg-blue-50">
        {/* Header - Mobile Optimized */}
        <div className="bg-blue-600 border-b-4 border-blue-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl mb-3 sm:mb-4 md:mb-5 shadow-xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight px-2">
                Program Tracker
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 max-w-2xl mx-auto px-2">
                Track your attendance across all your programs
              </p>
            </div>
          </div>
        </div>

        {/* Stack Auth Handler with custom wrapper - Mobile Optimized */}
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-blue-200 p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {pathname?.includes('/sign-up') ? 'Create Account' : 'Sign In'}
              </h2>
              <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-semibold mb-1">
                  Multi-Program Portal
                </p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  This portal supports multiple programs. After signing in, you can select and enroll in the programs you participate in. Choose your programs from the available options and track your attendance for each one.
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              <StackHandler fullPage={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <StackHandler fullPage />;
}
