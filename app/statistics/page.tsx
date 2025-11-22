'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Navigation from '@/components/Navigation';
import AttendanceCalendar from '@/components/AttendanceCalendar';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface AttendanceStats {
  totalDays: number;
  learningDays: number;
  learningMinutes: number;
  earlyDays: number;
  lateDays: number;
  onTimeDays: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthStats, setMonthStats] = useState<AttendanceStats | null>(null);
  const [yearStats, setYearStats] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPeriod, selectedMonth, selectedYear]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/handler/sign-in');
        return;
      }
      const data = await response.json();
      setUser(data.user);
      // Don't call fetchStats here - let the useEffect handle it
    } catch (error) {
      router.push('/handler/sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (selectedPeriod === 'month') {
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
        const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        const response = await fetch(`/api/attendance/stats?start=${startDate}&end=${endDate}`);
        if (response.ok) {
          const data = await response.json();
          setMonthStats(data.stats);
        }
      } else {
        const yearStart = startOfYear(new Date(selectedYear, 0, 1));
        const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
        const startDate = format(yearStart, 'yyyy-MM-dd');
        const endDate = format(yearEnd, 'yyyy-MM-dd');

        const response = await fetch(`/api/attendance/stats?start=${startDate}&end=${endDate}`);
        if (response.ok) {
          const data = await response.json();
          setYearStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = selectedPeriod === 'month' ? monthStats : yearStats;
  const currentDate = new Date(selectedYear, selectedMonth, 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics & Analytics</h1>
          <p className="text-gray-600">Track your attendance and learning progress</p>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Year
            </button>
          </div>

          {selectedPeriod === 'month' && (
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2024, i, 1), 'MMMM')}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 3 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {selectedPeriod === 'year' && (
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 3 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Statistics Cards */}
          <div className="lg:col-span-2 space-y-6">
            {stats && (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                  <h2 className="text-lg font-semibold mb-4">Learning Statistics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm opacity-90 mb-1">Learning Days</p>
                      <p className="text-3xl font-bold">{stats.learningDays}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm opacity-90 mb-1">Total Learning Time</p>
                      <p className="text-3xl font-bold">
                        {Math.floor(stats.learningMinutes / 60)}h {stats.learningMinutes % 60}m
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Breakdown</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
                      <p className="text-sm text-gray-600">Total Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.onTimeDays}</p>
                      <p className="text-sm text-gray-600">On Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.earlyDays}</p>
                      <p className="text-sm text-gray-600">Early</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.lateDays}</p>
                      <p className="text-sm text-gray-600">Late</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-1">
            <AttendanceCalendar year={selectedYear} month={selectedMonth} />
          </div>
        </div>

        {/* Additional Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Attendance Days</span>
                <span className="font-semibold text-gray-900">{stats.totalDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days with Learning (5 min early)</span>
                <span className="font-semibold text-blue-600">{stats.learningDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Learning Time</span>
                <span className="font-semibold text-blue-600">
                  {Math.floor(stats.learningMinutes / 60)} hours {stats.learningMinutes % 60} minutes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Arrived Early</span>
                <span className="font-semibold text-green-600">{stats.earlyDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Arrived Late</span>
                <span className="font-semibold text-orange-600">{stats.lateDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days On Time</span>
                <span className="font-semibold text-gray-900">{stats.onTimeDays}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

