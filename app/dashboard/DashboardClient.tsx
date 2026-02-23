'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DaveningTimes from '@/components/DaveningTimes';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';
import { PROGRAMME_TERMS } from '@/app/application/terms-content';

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
  const stackUser = useUser();
  const searchParams = useSearchParams();
  const [showTermsModal, setShowTermsModal] = useState(initialNeedsTerms);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

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
      // Sign out on client side first
      if (stackUser) {
        await stackUser.signOut();
      }
      // Also call the API to ensure server-side logout
      await fetch('/api/auth/logout', { method: 'POST' });
      // Force hard redirect to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  const handleAcceptTerms = async () => {
    setAcceptingTerms(true);
    try {
      const res = await fetch('/api/terms', { method: 'POST' });
      if (res.ok) setShowTermsModal(false);
    } finally {
      setAcceptingTerms(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Programme conduct & participation terms</h2>
              <p className="text-sm text-gray-500 mt-1">Please re-accept at the start of each month.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-700 whitespace-pre-wrap">{PROGRAMME_TERMS}</div>
            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleAcceptTerms}
                disabled={acceptingTerms}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {acceptingTerms ? 'Accepting...' : 'I have read, understood, and agree to the above terms'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome, {user.full_name || user.email}!</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Track your attendance across all your programs</p>

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

