'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DaveningTimes from '@/components/DaveningTimes';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface Earnings {
  totalEarned: number;
  totalPaid: number;
  totalOwed: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface DashboardClientProps {
  user: User;
  earnings: Earnings | null;
  announcements: Announcement[];
}

export default function DashboardClient({ user, earnings, announcements }: DashboardClientProps) {
  const router = useRouter();
  const stackUser = useUser();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.full_name || user.email}!</h1>
        <p className="text-gray-600 mb-8">Track your attendance across all your programs</p>

        {earnings && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Earned</p>
                <p className="text-3xl font-bold">R{earnings.totalEarned.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Paid</p>
                <p className="text-3xl font-bold">R{earnings.totalPaid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Owed</p>
                <p className="text-3xl font-bold">R{earnings.totalOwed.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {announcements.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Announcements</h2>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">
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

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Attendance</h2>
              <p className="text-gray-600 mb-4">
                Submit attendance for any of your programs. You can track multiple programs each day.
              </p>
              <Link
                href="/submit-attendance"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit Attendance
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <DaveningTimes />
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href="/earnings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Earnings History
                </Link>
                <Link
                  href="/statistics"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
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

