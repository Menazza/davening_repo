'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';

interface Earnings {
  totalEarned: number;
  totalPaid: number;
  totalOwed: number;
}

interface KollelEarnings {
  totalEarned: number;
  totalPaid: number;
  totalOwed: number;
  monthlyEarnings: MonthlyKollelEarning[];
  dailyAttendance: DailyKollelAttendance[];
}

interface MonthlyKollelEarning {
  id: string;
  month: string;
  total_minutes_attended: number;
  total_available_minutes: number;
  rate_per_minute: number;
  amount_earned: number;
}

interface DailyKollelAttendance {
  date: string;
  arrival_time: string;
  departure_time: string;
  minutes_attended: number;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface KollelPayment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface EarningsHistory {
  date: string;
  amount_earned: number;
  on_time_bonus: number;
  early_bonus: number;
  learning_bonus: number;
  is_weekend: boolean;
  program_id?: string | null;
  program_name?: string | null;
}

interface Program {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

export default function EarningsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [kollelEarnings, setKollelEarnings] = useState<KollelEarnings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kollelPayments, setKollelPayments] = useState<KollelPayment[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'earnings' | 'payments'>('summary');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [handlerProgramId, setHandlerProgramId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Fetch all data in parallel for faster loading
      const [authResponse, earningsResponse, paymentsResponse, earningsHistoryResponse, programsResponse, kollelEarningsResponse, kollelPaymentsResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/earnings'),
        fetch('/api/payments?type=payments'),
        fetch('/api/payments?type=earnings'),
        fetch('/api/programs'),
        fetch('/api/kollel-earnings'),
        fetch('/api/kollel-payments'),
      ]);

      if (!authResponse.ok) {
        router.push('/handler/sign-in');
        return;
      }

      // Process all responses in parallel
      const [authData, earningsData, paymentsData, earningsHistoryData, programsData, kollelEarningsData, kollelPaymentsData] = await Promise.all([
        authResponse.json(),
        earningsResponse.ok ? earningsResponse.json() : Promise.resolve(null),
        paymentsResponse.ok ? paymentsResponse.json() : Promise.resolve(null),
        earningsHistoryResponse.ok ? earningsHistoryResponse.json() : Promise.resolve(null),
        programsResponse.ok ? programsResponse.json() : Promise.resolve(null),
        kollelEarningsResponse.ok ? kollelEarningsResponse.json() : Promise.resolve(null),
        kollelPaymentsResponse.ok ? kollelPaymentsResponse.json() : Promise.resolve(null),
      ]);

      // Redirect admins to admin portal
      if (authData.user.is_admin) {
        router.push('/admin');
        return;
      }
      
      setUser(authData.user);

      if (earningsData?.earnings) {
        setEarnings(earningsData.earnings);
      }

      if (paymentsData?.payments) {
        const formattedPayments = (paymentsData.payments || []).map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount || 0),
        }));
        setPayments(formattedPayments);
      }

      // Load kollel earnings
      if (kollelEarningsData?.earnings) {
        setKollelEarnings(kollelEarningsData.earnings);
      }

      // Load kollel payments
      if (kollelPaymentsData?.payments) {
        const formattedKollelPayments = (kollelPaymentsData.payments || []).map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount || 0),
        }));
        setKollelPayments(formattedKollelPayments);
      }

      // Load programs and find Handler program
      if (programsData?.programs) {
        const programsList = programsData.programs || [];
        setPrograms(programsList);
        const handlerProgram = programsList.find((p: Program) => p.name === 'Handler');
        if (handlerProgram) {
          setHandlerProgramId(handlerProgram.id);
        }
      }

      if (earningsHistoryData?.earnings) {
        const formattedEarnings = (earningsHistoryData.earnings || []).map((item: any) => ({
          ...item,
          amount_earned: Number(item.amount_earned || 0),
          on_time_bonus: Number(item.on_time_bonus || 0),
          early_bonus: Number(item.early_bonus || 0),
          learning_bonus: Number(item.learning_bonus || 0),
          is_weekend: Boolean(item.is_weekend),
        }));
        setEarningsHistory(formattedEarnings);
      }
    } catch (error) {
      router.push('/handler/sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  // These functions are now called in parallel in checkAuth, but kept for manual refresh if needed
  const fetchEarnings = async () => {
    try {
      const response = await fetch('/api/earnings');
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments?type=payments');
      if (response.ok) {
        const data = await response.json();
        const formattedPayments = (data.payments || []).map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount || 0),
        }));
        setPayments(formattedPayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchEarningsHistory = async () => {
    try {
      const response = await fetch('/api/payments?type=earnings');
      if (response.ok) {
        const data = await response.json();
        const formattedEarnings = (data.earnings || []).map((item: any) => ({
          ...item,
          amount_earned: Number(item.amount_earned || 0),
          on_time_bonus: Number(item.on_time_bonus || 0),
          early_bonus: Number(item.early_bonus || 0),
          learning_bonus: Number(item.learning_bonus || 0),
          is_weekend: Boolean(item.is_weekend),
        }));
        setEarningsHistory(formattedEarnings);
      }
    } catch (error) {
      console.error('Error fetching earnings history:', error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings & Payment History</h2>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Earnings History
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payment History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Overall Totals */}
                {(earnings || kollelEarnings) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Totals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Earned (All Programs)</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600 break-words">
                          R{((earnings?.totalEarned || 0) + (kollelEarnings?.totalEarned || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Total Paid (All Programs)</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600 break-words">
                          R{((earnings?.totalPaid || 0) + (kollelEarnings?.totalPaid || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <p className="text-sm text-gray-600 mb-1">Total Owed (All Programs)</p>
                        <p className="text-2xl sm:text-3xl font-bold text-orange-600 break-words">
                          R{((earnings?.totalOwed || 0) + (kollelEarnings?.totalOwed || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hendler Attendance Earnings */}
                {earnings && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hendler Attendance Program</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-300">
                        <p className="text-sm text-gray-600 mb-1">Earned</p>
                        <p className="text-xl font-bold text-green-700 break-words">
                          R{earnings.totalEarned.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-300">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="text-xl font-bold text-blue-700 break-words">
                          R{earnings.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-300">
                        <p className="text-sm text-gray-600 mb-1">Owed</p>
                        <p className="text-xl font-bold text-orange-700 break-words">
                          R{earnings.totalOwed.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Weekday Rate:</strong> R100 per activity (on-time, early arrival, learning)
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Weekend Rate (Saturday + Sunday):</strong> R150 per activity
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Maximum per day:</strong> R300 (weekday) or R450 (weekend pair)
                      </p>
                    </div>
                  </div>
                )}

                {/* Kollel Earnings */}
                {kollelEarnings && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Keter Eliyahu Morning Kollel</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-300">
                        <p className="text-sm text-gray-600 mb-1">Earned</p>
                        <p className="text-xl font-bold text-purple-700 break-words">
                          R{kollelEarnings.totalEarned.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-300">
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="text-xl font-bold text-indigo-700 break-words">
                          R{kollelEarnings.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-300">
                        <p className="text-sm text-gray-600 mb-1">Owed</p>
                        <p className="text-xl font-bold text-pink-700 break-words">
                          R{kollelEarnings.totalOwed.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Monthly Salary:</strong> R8,000
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Schedule:</strong> 8:30 AM - 10:30 AM (120 minutes per day)
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Payment Structure:</strong> Earnings are calculated based on actual minutes attended divided by total available minutes (Monday-Friday only).
                      </p>
                    </div>
                  </div>
                )}

                {/* Earnings by Program */}
                {earningsHistory.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hendler Attendance by Program
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        // Calculate earnings by program
                        const programTotals = earningsHistory.reduce((acc: Record<string, { name: string; amount: number }>, item) => {
                          const programKey = item.program_id || 'no-program';
                          const programName = item.program_name || 'General Attendance';
                          if (!acc[programKey]) {
                            acc[programKey] = { name: programName, amount: 0 };
                          }
                          acc[programKey].amount += item.amount_earned;
                          return acc;
                        }, {});

                        return Object.entries(programTotals).map(([key, data]) => (
                          <div key={key} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-1 font-medium">{data.name}</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-700 break-words">
                              R{data.amount.toFixed(2)}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {/* Hendler Attendance Earnings */}
                {earningsHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hendler Attendance - Daily Earnings
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Program
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              On-Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Early
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Learning
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {earningsHistory.map((item) => (
                            <tr key={item.date}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(item.date), 'PPP')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {item.program_name || 'General'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R{item.on_time_bonus.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R{item.early_bonus.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                R{item.learning_bonus.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                R{item.amount_earned.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {item.is_weekend ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                    Weekend
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                    Weekday
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Kollel Daily Attendance */}
                {kollelEarnings && kollelEarnings.dailyAttendance && kollelEarnings.dailyAttendance.length > 0 && (
                  <div className={earningsHistory.length > 0 ? 'border-t pt-6' : ''}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Kollel - Daily Attendance
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Arrival Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Departure Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Minutes Attended
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount Earned
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {kollelEarnings.dailyAttendance.map((attendance) => {
                            const fullSession = attendance.minutes_attended >= 120;
                            const partial = attendance.minutes_attended > 0 && attendance.minutes_attended < 120;

                            // Normalise attendance date to a Date object. It may already be a Date,
                            // or a string like "2026-01-19" or "2026-01-19T00:00:00.000Z".
                            const attendanceDateObj =
                              typeof attendance.date === 'string'
                                ? new Date(attendance.date)
                                : new Date(attendance.date as any);

                            // Guard against invalid dates to avoid runtime errors
                            if (isNaN(attendanceDateObj.getTime())) {
                              return null;
                            }

                            const attendanceYear = attendanceDateObj.getFullYear();
                            const attendanceMonth = attendanceDateObj.getMonth(); // 0-11

                            // Find the monthly earnings record whose month (stored as a timestamp)
                            // falls in the same local calendar month/year as this attendance date.
                            const monthlyRecord =
                              kollelEarnings.monthlyEarnings.find((m) => {
                                const monthDateObj =
                                  typeof m.month === 'string'
                                    ? new Date(m.month)
                                    : new Date(m.month as any);
                                if (isNaN(monthDateObj.getTime())) return false;
                                const monthYear = monthDateObj.getFullYear();
                                const monthMonth = monthDateObj.getMonth();
                                return monthYear === attendanceYear && monthMonth === attendanceMonth;
                              }) || null;

                            const ratePerMinute = monthlyRecord ? Number(monthlyRecord.rate_per_minute) : 0;
                            const dailyEarnings = attendance.minutes_attended * ratePerMinute;

                            return (
                              <tr key={String(attendance.date)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(attendanceDateObj, 'PPP')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {attendance.arrival_time.substring(0, 5)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {attendance.departure_time.substring(0, 5)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {attendance.minutes_attended} min
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-700">
                                  R{dailyEarnings.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {fullSession ? (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                      Full Session
                                    </span>
                                  ) : partial ? (
                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                      No Time
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Kollel Monthly Summary (moved to bottom) */}
                {kollelEarnings && kollelEarnings.monthlyEarnings.length > 0 && (
                  <div className={(earningsHistory.length > 0 || (kollelEarnings.dailyAttendance && kollelEarnings.dailyAttendance.length > 0)) ? 'border-t pt-6' : ''}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Kollel - Monthly Summary
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Minutes Attended
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Available
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate/Min
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount Earned
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {kollelEarnings.monthlyEarnings.map((earning) => (
                            <tr key={earning.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(earning.month), 'MMMM yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {earning.total_minutes_attended} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {earning.total_available_minutes} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {earning.total_available_minutes > 0 
                                  ? ((earning.total_minutes_attended / earning.total_available_minutes) * 100).toFixed(1)
                                  : '0.0'}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                R{earning.rate_per_minute.toFixed(4)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-700">
                                R{earning.amount_earned.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {earningsHistory.length === 0 && (!kollelEarnings || (kollelEarnings.monthlyEarnings.length === 0 && (!kollelEarnings.dailyAttendance || kollelEarnings.dailyAttendance.length === 0))) && (
                  <p className="text-gray-500">No earnings history yet.</p>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                {/* Hendler Payments */}
                {payments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hendler Attendance Payments
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recorded
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(payment.payment_date), 'PPP')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                R{payment.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {payment.notes || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(payment.created_at), 'PPp')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Kollel Payments */}
                {kollelPayments.length > 0 && (
                  <div className={payments.length > 0 ? 'border-t pt-6' : ''}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Kollel Payments
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recorded
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {kollelPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(payment.payment_date), 'PPP')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                                R{payment.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {payment.notes || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(payment.created_at), 'PPp')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {payments.length === 0 && kollelPayments.length === 0 && (
                  <p className="text-gray-500">No payments recorded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

