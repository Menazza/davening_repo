'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DaveningTimes from '@/components/DaveningTimes';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface DashboardClientProps {
  user: User;
  announcements: Announcement[];
  hasHandlerProgram: boolean;
  needsTermsAcceptance?: boolean;
}

export default function DashboardClient({ user, announcements, hasHandlerProgram, needsTermsAcceptance: initialNeedsTerms = false }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [needsTermsAcceptance, setNeedsTermsAcceptance] = useState(initialNeedsTerms);

  // Clean up the redirect parameter from URL after successful load
  useEffect(() => {
    if (searchParams.get('_stack_redirect') === '1') {
      // Remove the parameter from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('_stack_redirect');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome, {user.full_name || user.email}!</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Track your attendance across all your programs</p>

        {hasHandlerProgram && needsTermsAcceptance && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-semibold text-yellow-900 mb-1">
                Action needed for the Davening Programme
              </h2>
              <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                You need to accept this month&apos;s programme terms before submitting attendance.
              </p>
              <button
                type="button"
                onClick={() => router.push('/profile?handlerForm=terms')}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Profile to accept terms
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {announcements.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Announcements</h2>
                <div className="space-y-3 sm:space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                      <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-wrap mb-2">
                        {announcement.message}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {format(new Date(announcement.created_at), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AttendanceCalendar />

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Submit Attendance</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Submit attendance for any of your programs. You can track multiple programs each day.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <Link
                  href="/submit-attendance"
                  className="inline-flex items-center w-full justify-center px-4 sm:px-6 py-3 sm:py-3.5 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[48px]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Attendance
                </Link>
                <p className="text-xs text-gray-500 text-center px-2">
                  Select a program to log your attendance
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {hasHandlerProgram && <DaveningTimes />}
            <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 ${hasHandlerProgram ? 'mt-4 sm:mt-6' : ''}`}>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors touch-manipulation min-h-[44px] flex items-center"
                >
                  View Profile
                </Link>
                <Link
                  href="/statistics"
                  className="block px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors touch-manipulation min-h-[44px] flex items-center"
                >
                  Statistics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

