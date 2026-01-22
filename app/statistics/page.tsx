'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useUser } from '@stackframe/stack';
import Navigation from '@/components/Navigation';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import { formatProgramName } from '@/lib/format-program-name';

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

interface ProgramStats {
  programId: string;
  programName: string;
  totalDays: number;
  learningDays: number;
  learningMinutes: number;
  earlyDays: number;
  lateDays: number;
  onTimeDays: number;
  kollelDays?: number;
  totalKollelMinutes?: number;
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
  const [monthStatsByProgram, setMonthStatsByProgram] = useState<ProgramStats[]>([]);
  const [yearStatsByProgram, setYearStatsByProgram] = useState<ProgramStats[]>([]);

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
      
      // Redirect admins to admin portal
      if (data.user.is_admin) {
        router.push('/admin');
        return;
      }
      
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
          setMonthStatsByProgram(data.statsByProgram || []);
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
          setYearStatsByProgram(data.statsByProgram || []);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
  const statsByProgram = selectedPeriod === 'month' ? monthStatsByProgram : yearStatsByProgram;
  const currentDate = new Date(selectedYear, selectedMonth, 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Statistics & Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your attendance and learning progress</p>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors touch-manipulation min-h-[44px] ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors touch-manipulation min-h-[44px] ${
                selectedPeriod === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              This Year
            </button>
          </div>

          {selectedPeriod === 'month' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats by Program - Each program gets its own section */}
            {statsByProgram && statsByProgram.length > 0 ? (
              <div className="space-y-6">
                {statsByProgram.map((programStat) => (
                  <div key={programStat.programId} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-blue-500">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">{formatProgramName(programStat.programName)}</h2>
                    
                    {programStat.kollelDays !== undefined ? (
                      // Kollel program stats
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-4 sm:p-6 text-white mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Kollel Statistics</h3>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
                              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Days</p>
                              <p className="text-xl sm:text-3xl font-bold">{programStat.kollelDays}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
                              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Time</p>
                              <p className="text-lg sm:text-2xl font-bold">
                                {Math.floor((programStat.totalKollelMinutes || 0) / 60)}h {(programStat.totalKollelMinutes || 0) % 60}m
                              </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
                              <p className="text-xs sm:text-sm opacity-90 mb-1">Avg. Session</p>
                              <p className="text-lg sm:text-2xl font-bold">
                                {programStat.kollelDays > 0 
                                  ? `${Math.floor((programStat.totalKollelMinutes || 0) / programStat.kollelDays)}m`
                                  : '0m'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Handler program stats
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 text-white mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Learning Statistics</h3>
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
                              <p className="text-xs sm:text-sm opacity-90 mb-1">Learning Days</p>
                              <p className="text-xl sm:text-3xl font-bold">{programStat.learningDays}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 sm:p-4 backdrop-blur-sm">
                              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Learning Time</p>
                              <p className="text-lg sm:text-3xl font-bold">
                                {Math.floor(programStat.learningMinutes / 60)}h {programStat.learningMinutes % 60}m
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Breakdown</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-gray-900">{programStat.totalDays}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Total Days</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-green-600">{programStat.onTimeDays}</p>
                              <p className="text-xs sm:text-sm text-gray-600">On Time</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-blue-600">{programStat.earlyDays}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Early</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-orange-600">{programStat.lateDays}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Late</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-gray-600">No statistics available for the selected period.</p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-1">
            <AttendanceCalendar year={selectedYear} month={selectedMonth} />
          </div>
        </div>

      </div>
    </div>
  );
}

