'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is signed in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
      return;
    }

    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch((err) => console.error('Error fetching announcements:', err));
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Rabbi Hendler's Minyan
            </h1>
            <p className="text-sm md:text-base text-blue-100 max-w-2xl mx-auto">
              Morning Learning & Davening Attendance System
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-blue-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 relative z-10">
        {/* Sign In/Sign Up Section - Moved to top */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600 text-sm">
                Sign in to track your attendance or create a new account
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/handler/sign-in"
                className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
              <Link
                href="/handler/sign-up"
                className="flex items-center justify-center w-full bg-white text-blue-600 text-center py-3 px-6 rounded-xl font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Need help? <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact the administrator</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">Latest Announcements</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-2 text-xs leading-relaxed">
                    {announcement.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(announcement.created_at), 'PPp')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Section */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5 text-center">Why Join Us?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Daily Tracking</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Submit your attendance each day for morning learning and davening with our simple, intuitive system
              </p>
            </div>
            
            <div className="group bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Earn R100-150 per activity. Up to R300 on weekdays, R450 on weekends. Your commitment pays off!
              </p>
            </div>
            
            <div className="group bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                View your earnings, payment history, and attendance records with detailed analytics and insights
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Rabbi Hendler's Minyan. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
