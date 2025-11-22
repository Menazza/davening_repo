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

interface Payment {
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'earnings' | 'payments'>('summary');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Fetch all data in parallel for faster loading
      const [authResponse, earningsResponse, paymentsResponse, earningsHistoryResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/earnings'),
        fetch('/api/payments?type=payments'),
        fetch('/api/payments?type=earnings'),
      ]);

      if (!authResponse.ok) {
        router.push('/handler/sign-in');
        return;
      }

      // Process all responses in parallel
      const [authData, earningsData, paymentsData, earningsHistoryData] = await Promise.all([
        authResponse.json(),
        earningsResponse.ok ? earningsResponse.json() : Promise.resolve(null),
        paymentsResponse.ok ? paymentsResponse.json() : Promise.resolve(null),
        earningsHistoryResponse.ok ? earningsHistoryResponse.json() : Promise.resolve(null),
      ]);

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
            {activeTab === 'summary' && earnings && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600">
                      R{earnings.totalEarned.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                    <p className="text-3xl font-bold text-blue-600">
                      R{earnings.totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Total Owed</p>
                    <p className="text-3xl font-bold text-orange-600">
                      R{earnings.totalOwed.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Earnings Breakdown
                  </h3>
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

            {activeTab === 'earnings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Daily Earnings History
                </h3>
                {earningsHistory.length === 0 ? (
                  <p className="text-gray-500">No earnings history yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
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
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment History
                </h3>
                {payments.length === 0 ? (
                  <p className="text-gray-500">No payments recorded yet.</p>
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

