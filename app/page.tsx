'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasCheckedRedirect) return;

    // Check session via our own auth endpoint
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          // Not logged in, show announcements
          setHasCheckedRedirect(true);
          const annRes = await fetch('/api/announcements');
          const data = await annRes.json();
          setAnnouncements(data.announcements || []);
          return;
        }

        const data = await res.json();
        setHasCheckedRedirect(true);

        if (data.user?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      })
      .catch((err) => {
        console.error('Error checking auth:', err);
        setHasCheckedRedirect(true);
      });
  }, [router, hasCheckedRedirect]);

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-blue-600 border-b-4 border-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-5 shadow-xl">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Program Tracker
            </h1>
            <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
              Track your attendance across all your programs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
        {/* Login Portal */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-blue-200 p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Sign In</h2>
              <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-3 sm:p-4 mb-4">
                <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-semibold mb-1">
                  Multi-Program Portal
                </p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  This portal supports multiple programs. After signing in, you can select and enroll in the programs you participate in. Choose your programs from the available options and track your attendance for each one.
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Link
                href="/login"
                className="flex items-center justify-center w-full bg-blue-600 text-white text-center py-4 sm:py-5 px-6 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg hover:shadow-xl min-h-[56px] touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center w-full bg-white text-blue-600 text-center py-4 sm:py-5 px-6 rounded-xl font-semibold text-base sm:text-lg border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-all shadow-md hover:shadow-lg min-h-[56px] touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Need help? <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact the administrator</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-12 mt-16">
            <div className="bg-purple-100 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">Latest Announcements</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white rounded-xl border-2 border-purple-200 p-5 hover:shadow-lg hover:border-purple-400 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">
                        {announcement.title}
                      </h3>
                      <div className="w-2.5 h-2.5 bg-purple-600 rounded-full mt-1.5"></div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-3 text-sm leading-relaxed">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {format(new Date(announcement.created_at), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* What You Can Do Section */}
        <div className="mb-16 mt-16">
          <div className="bg-green-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-8 text-center">What You Can Do</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl border-2 border-blue-300 p-8 text-center hover:shadow-xl hover:border-blue-500 transition-all shadow-lg transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-5 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Program Tracking</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Track attendance for multiple programs in a single day
                </p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-green-300 p-8 text-center hover:shadow-xl hover:border-green-500 transition-all shadow-lg transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mb-5 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Track Earnings</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Monitor your earnings from davening and learning activities
                </p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-purple-300 p-8 text-center hover:shadow-xl hover:border-purple-500 transition-all shadow-lg transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl mb-5 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Program History</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  View your attendance history and statistics for all programs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-blue-600 text-sm bg-white rounded-xl border-2 border-blue-200">
          <p className="font-semibold">© {new Date().getFullYear()} Program Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
