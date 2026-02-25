'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface UserEarnings {
  user_id: string;
  email: string;
  full_name: string | null;
  total_earned: number;
  total_paid: number;
  total_owed: number;
}

interface MonthlyEarning {
  id: string;
  month: string;
  total_minutes_attended: number;
  total_available_minutes: number;
  rate_per_minute: number;
  amount_earned: number;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  hebrew_name?: string;
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  account_type?: string;
}

export default function KollelAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserEarnings[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserEarnings[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'owed' | 'earned'>('owed');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingUserProfile, setViewingUserProfile] = useState<UserProfile | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, sortBy]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/handler/sign-in');
        return;
      }
      const data = await response.json();
      if (!data.user.is_admin || data.user.admin_type !== 'kollel') {
        // Not a Kollel admin - redirect to appropriate page
        if (data.user.admin_type === 'hendler') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      setUser(data.user);
      fetchUsers();
    } catch (error) {
      router.push('/handler/sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/kollel-earnings?all_users=true');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = (a.full_name || a.email).toLowerCase();
          const nameB = (b.full_name || b.email).toLowerCase();
          return nameA.localeCompare(nameB);
        case 'owed':
          return b.total_owed - a.total_owed;
        case 'earned':
          return b.total_earned - a.total_earned;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !paymentAmount || !paymentDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/kollel-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          amount: parseFloat(paymentAmount),
          payment_date: paymentDate,
          notes: paymentNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to record payment');
        return;
      }

      alert('Payment recorded successfully!');
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedUserId(null);
      fetchUsers();
      if (viewingUserId) {
        fetchUserDetails(viewingUserId);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setIsLoadingDetails(true);
    try {
      const [profileRes, earningsRes, paymentsRes] = await Promise.all([
        fetch(`/api/kollel-admin/users/${userId}`),
        fetch(`/api/kollel-earnings?user_id=${userId}`),
        fetch(`/api/kollel-payments?user_id=${userId}`),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setViewingUserProfile(profileData.user || null);
      } else {
        setViewingUserProfile(null);
      }

      if (earningsRes.ok && paymentsRes.ok) {
        const earningsData = await earningsRes.json();
        const paymentsData = await paymentsRes.json();
        setMonthlyEarnings(earningsData.earnings?.monthlyEarnings || []);
        setUserPayments(paymentsData.payments || []);
      } else {
        alert('Failed to load user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('An error occurred while loading user details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewDetails = (userId: string) => {
    setViewingUserId(userId);
    fetchUserDetails(userId);
  };

  const handleCloseDetails = () => {
    setViewingUserId(null);
    setViewingUserProfile(null);
    setMonthlyEarnings([]);
    setUserPayments([]);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = {
    totalUsers: users.length,
    totalEarned: users.reduce((sum, u) => sum + u.total_earned, 0),
    totalPaid: users.reduce((sum, u) => sum + u.total_paid, 0),
    totalOwed: users.reduce((sum, u) => sum + u.total_owed, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kollel Admin Portal</h1>
          <p className="text-gray-600 mt-1">8:30-10:30 Morning Kollel - Manage earnings and payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium">Total Participants</p>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm font-medium">Total Earned</p>
            <p className="text-3xl font-bold mt-1">R{stats.totalEarned.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium">Total Paid</p>
            <p className="text-3xl font-bold mt-1">R{stats.totalPaid.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
            <p className="text-orange-100 text-sm font-medium">Total Owed</p>
            <p className="text-3xl font-bold mt-1">R{stats.totalOwed.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'owed' | 'earned')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="owed">Sort by: Balance Owed</option>
              <option value="earned">Sort by: Total Earned</option>
              <option value="name">Sort by: Name</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name / Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Owed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {u.full_name || u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R{u.total_earned.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      R{u.total_paid.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                      u.total_owed > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      R{u.total_owed.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewDetails(u.user_id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setSelectedUserId(u.user_id)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Record Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found.
              </div>
            )}
          </div>

          {/* Payment Form */}
          {selectedUserId && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Record Payment
              </h3>
              <form onSubmit={handleSubmitPayment} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <input
                    type="text"
                    value={
                      users.find((u) => u.user_id === selectedUserId)?.full_name ||
                      users.find((u) => u.user_id === selectedUserId)?.email ||
                      ''
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current balance: R{users.find((u) => u.user_id === selectedUserId)?.total_owed.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId(null);
                      setPaymentAmount('');
                      setPaymentNotes('');
                    }}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {viewingUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Kollel Earnings Details</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading details...</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-gray-900 font-medium">
                          {viewingUserProfile?.full_name || users.find((u) => u.user_id === viewingUserId)?.full_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 font-medium">
                          {viewingUserProfile?.email ?? users.find((u) => u.user_id === viewingUserId)?.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Balance Owed</label>
                        <p className="text-2xl font-bold text-orange-700">
                          R{users.find((u) => u.user_id === viewingUserId)?.total_owed.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banking Details */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bank Name</label>
                        <p className="text-gray-900 font-medium">{viewingUserProfile?.bank_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Number</label>
                        <p className="text-gray-900 font-medium font-mono">{viewingUserProfile?.account_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Branch Code</label>
                        <p className="text-gray-900 font-medium font-mono">{viewingUserProfile?.branch_code || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Type</label>
                        <p className="text-gray-900 font-medium">{viewingUserProfile?.account_type || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Earnings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings Breakdown</h3>
                    {monthlyEarnings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutes Attended</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Available</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Min</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Earned</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {monthlyEarnings.map((earning) => (
                              <tr key={earning.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(earning.month), 'MMMM yyyy')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {earning.total_minutes_attended} min
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {earning.total_available_minutes} min
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  R{earning.rate_per_minute.toFixed(4)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                  R{earning.amount_earned.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No earnings recorded yet.
                      </div>
                    )}
                  </div>

                  {/* Payment History */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                      <button
                        onClick={() => {
                          setSelectedUserId(viewingUserId);
                          handleCloseDetails();
                        }}
                        className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                      >
                        Record New Payment
                      </button>
                    </div>
                    {userPayments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userPayments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(payment.payment_date), 'PP')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                  R{payment.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {payment.notes || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(payment.created_at), 'PPp')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No payments recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
