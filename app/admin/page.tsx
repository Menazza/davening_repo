'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import DateTimePicker from '@/components/DateTimePicker';

interface User {
  id: string;
  email: string;
  full_name?: string;
  hebrew_name?: string;
  is_admin: boolean;
}

interface UserEarnings {
  user_id: string;
  email: string;
  full_name: string | null;
  total_earned: number;
  total_paid: number;
  total_owed: number;
  application_status?: 'not_started' | 'incomplete' | 'complete';
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
  is_admin: boolean;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  admin_id: string | null;
  created_at: string;
}

interface EarningsRecord {
  date: string;
  amount_earned: number;
  on_time_bonus: number;
  early_bonus: number;
  learning_bonus: number;
  is_weekend: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalEarned: number;
  totalPaid: number;
  totalOwed: number;
  usersWithBalance: number;
}

interface ApplicationRecord {
  id: string;
  user_id: string;
  firstname: string;
  surname: string;
  date_of_birth: string;
  contact_number: string;
  home_address: string;
  is_student: boolean;
  student_what: string | null;
  student_where: string | null;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_contact: string;
  availability_days: string[];
  cv_url: string | null;
  portrait_url: string | null;
  health_condition: boolean;
  health_condition_description: string | null;
  mental_health_condition: boolean;
  mental_health_receiving_help: boolean | null;
  mental_health_description: string | null;
  mental_health_need_help: boolean | null;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  branch_code: string;
  account_type: string;
  application_submitted_at: string | null;
  user_email: string;
  user_full_name: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserEarnings[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserEarnings[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'owed' | 'earned'>('owed');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'announcements' | 'applications' | 'application-results' | 'join-requests' | 'shul-times'
  >('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([]);
  const [userEarnings, setUserEarnings] = useState<EarningsRecord[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationsSearch, setApplicationsSearch] = useState('');
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [resultsSearch, setResultsSearch] = useState('');

  // Clean up the redirect parameter from URL after successful load
  useEffect(() => {
    if (searchParams.get('_stack_redirect') === '1') {
      // Remove the parameter from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('_stack_redirect');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, sortBy]);

  const fetchApplications = useCallback(async () => {
    setIsLoadingApplications(true);
    try {
      const response = await fetch('/api/admin/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'applications' || activeTab === 'application-results') {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  const checkAuth = async (attempt: number = 1) => {
    const maxAttempts = 5;
    const isStackRedirect = searchParams.get('_stack_redirect') === '1';
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!response.ok) {
        // If this is a redirect from sign-in, retry with backoff
        if (isStackRedirect && attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
          console.log(`[Admin] Auth not ready, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
          setTimeout(() => checkAuth(attempt + 1), delay);
          return;
        }
        setIsLoading(false);
        router.push('/handler/sign-in');
        return;
      }
      
      const data = await response.json();
      if (!data.user.is_admin || data.user.admin_type !== 'hendler') {
        // Not a Hendler admin - redirect to appropriate page
        setIsLoading(false);
        if (data.user.admin_type === 'kollel') {
          router.push('/kollel-admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      setUser(data.user);
      setIsLoading(false);
      fetchUsers();
    } catch (error) {
      // If this is a redirect from sign-in, retry with backoff
      if (isStackRedirect && attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 5000);
        console.log(`[Admin] Auth error, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        setTimeout(() => checkAuth(attempt + 1), delay);
        return;
      }
      setIsLoading(false);
      router.push('/handler/sign-in');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    // Sort
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

  const calculateStats = (): AdminStats => {
    const totalEarned = users.reduce((sum, u) => sum + u.total_earned, 0);
    const totalPaid = users.reduce((sum, u) => sum + u.total_paid, 0);
    const totalOwed = totalEarned - totalPaid;
    const usersWithBalance = users.filter((u) => u.total_owed > 0).length;

    return {
      totalUsers: users.length,
      totalEarned,
      totalPaid,
      totalOwed,
      usersWithBalance,
    };
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !paymentAmount || !paymentDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/payments', {
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
      // Refresh profile if viewing
      if (viewingUserId) {
        fetchUserDetails(viewingUserId);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete this payment of R${amount.toFixed(2)}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete payment');
        return;
      }

      alert('Payment deleted successfully!');
      fetchUsers();
      if (viewingUserId) {
        fetchUserDetails(viewingUserId);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setUserPayments(data.payments || []);
        setUserEarnings(data.earnings || []);
      } else {
        alert('Failed to load user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('An error occurred while loading user details');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    fetchUserDetails(userId);
  };

  const handleCloseProfile = () => {
    setViewingUserId(null);
    setUserProfile(null);
    setUserPayments([]);
    setUserEarnings([]);
  };

  const getDownloadUrl = (fileUrl: string, filename: string) =>
    `/api/admin/download-file?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;

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

  const handleDownloadOwedCsv = () => {
    try {
      // Let the browser handle the file download via CSV response headers
      window.location.href = '/api/admin/users?format=csv';
    } catch (error) {
      console.error('Failed to start download:', error);
      alert('Could not start download. Please try again.');
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

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-600 mt-1">Manage users, payments, and announcements</p>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users & Payments
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'announcements'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Announcements
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'applications'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab('application-results')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'application-results'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Application results
              </button>
              <button
                onClick={() => setActiveTab('join-requests')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'join-requests'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Join Requests
              </button>
              <button
                onClick={() => setActiveTab('shul-times')}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'shul-times'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shul Times
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Users</p>
                        <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Total Earned</p>
                        <p className="text-3xl font-bold mt-1">R{stats.totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Paid</p>
                        <p className="text-3xl font-bold mt-1">R{stats.totalPaid.toFixed(2)}</p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Total Owed</p>
                        <p className="text-3xl font-bold mt-1">R{stats.totalOwed.toFixed(2)}</p>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Users with balance</span>
                        <span className="font-semibold text-gray-900">{stats.usersWithBalance}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average per user</span>
                        <span className="font-semibold text-gray-900">
                          R{stats.totalUsers > 0 ? (stats.totalEarned / stats.totalUsers).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment rate</span>
                        <span className="font-semibold text-gray-900">
                          {stats.totalEarned > 0 ? ((stats.totalPaid / stats.totalEarned) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Balance</h3>
                    <div className="space-y-2">
                      {users
                        .filter((u) => u.total_owed > 0)
                        .sort((a, b) => b.total_owed - a.total_owed)
                        .slice(0, 5)
                        .map((u) => (
                          <div key={u.user_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 truncate">
                              {u.full_name || u.email}
                            </span>
                            <span className="font-semibold text-orange-600">
                              R{u.total_owed.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      {users.filter((u) => u.total_owed > 0).length === 0 && (
                        <p className="text-gray-500 text-sm">No outstanding balances</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search, Sort, and Export */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'owed' | 'earned')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="owed">Sort by: Balance Owed</option>
                      <option value="earned">Sort by: Total Earned</option>
                      <option value="name">Sort by: Name</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleDownloadOwedCsv}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 whitespace-nowrap"
                    >
                      Download Owed (Excel/CSV)
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    All Users & Earnings ({filteredUsers.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name / Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Form Status
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
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {u.application_status === 'complete' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Form complete
                                </span>
                              )}
                              {u.application_status === 'incomplete' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Form incomplete
                                </span>
                              )}
                              {!u.application_status || u.application_status === 'not_started' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  No form
                                </span>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              R{u.total_earned.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                              R{u.total_paid.toFixed(2)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                u.total_owed > 0 ? 'text-orange-600' : 'text-gray-500'
                              }`}
                            >
                              R{u.total_owed.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleViewProfile(u.user_id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View Profile
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
                        No users found matching your search.
                      </div>
                    )}
                  </div>
                </div>

                {selectedUserId && (
                  <div className="border-t pt-6">
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
            )}

            {activeTab === 'announcements' && (
              <div>
                <AnnouncementsManager />
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Davening Programme Applications</h3>
                <p className="text-sm text-gray-600">View all submitted application forms, answers, and documents.</p>

                <div>
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={applicationsSearch}
                    onChange={(e) => setApplicationsSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
                  />
                </div>

                {isLoadingApplications ? (
                  <p className="text-gray-600">Loading applications...</p>
                ) : (
                  <div className="space-y-3">
                    {applications
                      .filter(
                        (app) =>
                          !applicationsSearch ||
                          `${app.firstname} ${app.surname}`.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                          app.user_email?.toLowerCase().includes(applicationsSearch.toLowerCase()) ||
                          (app.user_full_name || '').toLowerCase().includes(applicationsSearch.toLowerCase())
                      )
                      .map((app) => (
                        <div
                          key={app.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedApplicationId(expandedApplicationId === app.id ? null : app.id)
                            }
                            className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
                          >
                            <div>
                              <span className="font-semibold text-gray-900">
                                {app.firstname} {app.surname}
                              </span>
                              <span className="text-gray-500 ml-2">({app.user_email})</span>
                              {app.application_submitted_at && (
                                <span className="ml-2 text-xs text-green-600">Submitted</span>
                              )}
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedApplicationId === app.id ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {expandedApplicationId === app.id && (
                            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4 text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><span className="font-medium text-gray-600">First name:</span> {app.firstname}</div>
                                <div><span className="font-medium text-gray-600">Surname:</span> {app.surname}</div>
                                <div><span className="font-medium text-gray-600">Date of birth:</span> {app.date_of_birth}</div>
                                <div><span className="font-medium text-gray-600">Contact:</span> {app.contact_number}</div>
                                <div className="md:col-span-2"><span className="font-medium text-gray-600">Email:</span> {app.user_email}</div>
                                <div className="md:col-span-2"><span className="font-medium text-gray-600">Home address:</span> {app.home_address}</div>
                                <div><span className="font-medium text-gray-600">Student:</span> {app.is_student ? 'Yes' : 'No'}</div>
                                {app.is_student && (
                                  <>
                                    <div><span className="font-medium text-gray-600">Studying:</span> {app.student_what || '-'}</div>
                                    <div><span className="font-medium text-gray-600">Institution:</span> {app.student_where || '-'}</div>
                                  </>
                                )}
                                <div><span className="font-medium text-gray-600">Next of kin:</span> {app.next_of_kin_name}</div>
                                <div><span className="font-medium text-gray-600">Relationship:</span> {app.next_of_kin_relationship}</div>
                                <div><span className="font-medium text-gray-600">Next of kin contact:</span> {app.next_of_kin_contact}</div>
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-600">Availability days:</span>{' '}
                                  {(app.availability_days || []).length > 0 ? app.availability_days.join(', ') : 'None'}
                                </div>
                              </div>

                              <div>
                                <span className="font-medium text-gray-600 block mb-1">Documents:</span>
                                <div className="flex gap-4 flex-wrap items-center">
                                  {app.cv_url ? (
                                    <>
                                      <a
                                        href={app.cv_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline"
                                      >
                                        View CV
                                      </a>
                                      <a
                                        href={getDownloadUrl(app.cv_url, `CV-${app.surname}-${app.firstname}.pdf`)}
                                        className="text-green-600 hover:underline"
                                      >
                                        Download CV
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">No CV uploaded</span>
                                  )}
                                  {app.portrait_url ? (
                                    <>
                                      <a
                                        href={app.portrait_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline"
                                      >
                                        View portrait
                                      </a>
                                      <a
                                        href={getDownloadUrl(app.portrait_url, `Portrait-${app.surname}-${app.firstname}.jpg`)}
                                        className="text-green-600 hover:underline"
                                      >
                                        Download portrait
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">No portrait uploaded</span>
                                  )}
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <span className="font-medium text-gray-600 block mb-2">Medical details (confidential)</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div><span className="text-gray-600">Health condition:</span> {app.health_condition ? 'Yes' : 'No'}</div>
                                  {app.health_condition && app.health_condition_description && (
                                    <div className="md:col-span-2">{app.health_condition_description}</div>
                                  )}
                                  <div><span className="text-gray-600">Mental health condition:</span> {app.mental_health_condition ? 'Yes' : 'No'}</div>
                                  {app.mental_health_condition && (
                                    <>
                                      {app.mental_health_receiving_help !== null && (
                                        <div>Receiving help: {app.mental_health_receiving_help ? 'Yes' : 'No'}</div>
                                      )}
                                      {app.mental_health_description && (
                                        <div className="md:col-span-2">{app.mental_health_description}</div>
                                      )}
                                      {app.mental_health_need_help !== null && (
                                        <div>Needs help: {app.mental_health_need_help ? 'Yes' : 'No'}</div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <span className="font-medium text-gray-600 block mb-2">Bank details</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div><span className="text-gray-600">Bank:</span> {app.bank_name}</div>
                                  <div><span className="text-gray-600">Account holder:</span> {app.account_holder_name}</div>
                                  <div><span className="text-gray-600">Account number:</span> {app.account_number}</div>
                                  <div><span className="text-gray-600">Branch code:</span> {app.branch_code}</div>
                                  <div><span className="text-gray-600">Account type:</span> {app.account_type}</div>
                                </div>
                              </div>

                              {app.application_submitted_at && (
                                <p className="text-xs text-gray-500 pt-2">
                                  Submitted: {format(new Date(app.application_submitted_at), 'PPpp')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    {applications.length === 0 && !isLoadingApplications && (
                      <p className="text-gray-500">No applications submitted yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'application-results' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Application results (form & test answers)</h3>
                <p className="text-sm text-gray-600">
                  View form answers including health, need for assistance, and download CV and profile photos.
                </p>

                <div>
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
                  />
                </div>

                {isLoadingApplications ? (
                  <p className="text-gray-600">Loading application results...</p>
                ) : (
                  <div className="space-y-3">
                    {applications
                      .filter(
                        (app) =>
                          !resultsSearch ||
                          `${app.firstname} ${app.surname}`.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                          app.user_email?.toLowerCase().includes(resultsSearch.toLowerCase()) ||
                          (app.user_full_name || '').toLowerCase().includes(resultsSearch.toLowerCase())
                      )
                      .map((app) => (
                        <div
                          key={app.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedResultId(expandedResultId === app.id ? null : app.id)
                            }
                            className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {app.portrait_url ? (
                                <img
                                  src={app.portrait_url}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                  {app.firstname?.[0]}{app.surname?.[0]}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {app.firstname} {app.surname}
                                </span>
                                <span className="text-gray-500 ml-2">({app.user_email})</span>
                                {app.application_submitted_at && (
                                  <span className="ml-2 text-xs text-green-600">Submitted</span>
                                )}
                              </div>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedResultId === app.id ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {expandedResultId === app.id && (
                            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-5 text-sm">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Contact & basic info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div><span className="text-gray-600">Name:</span> {app.firstname} {app.surname}</div>
                                  <div><span className="text-gray-600">Email:</span> {app.user_email}</div>
                                  <div><span className="text-gray-600">Contact:</span> {app.contact_number}</div>
                                  <div><span className="text-gray-600">Date of birth:</span> {app.date_of_birth}</div>
                                  <div className="md:col-span-2"><span className="text-gray-600">Address:</span> {app.home_address}</div>
                                  <div><span className="text-gray-600">Next of kin:</span> {app.next_of_kin_name} ({app.next_of_kin_relationship})</div>
                                  <div><span className="text-gray-600">Availability:</span> {(app.availability_days || []).length > 0 ? app.availability_days.join(', ') : 'None'}</div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Health & assistance</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-gray-600">Physical health condition:</span>{' '}
                                    <span className={app.health_condition ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                      {app.health_condition ? 'Yes' : 'No'}
                                    </span>
                                    {app.health_condition && app.health_condition_description && (
                                      <p className="mt-1 text-gray-700 bg-white p-2 rounded border border-gray-200">
                                        {app.health_condition_description}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Mental health condition:</span>{' '}
                                    <span className={app.mental_health_condition ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                      {app.mental_health_condition ? 'Yes' : 'No'}
                                    </span>
                                    {app.mental_health_condition && (
                                      <>
                                        {app.mental_health_receiving_help !== null && (
                                          <div className="mt-1">
                                            <span className="text-gray-600">Receiving help:</span>{' '}
                                            {app.mental_health_receiving_help ? 'Yes' : 'No'}
                                          </div>
                                        )}
                                        {app.mental_health_need_help !== null && (
                                          <div className="mt-1">
                                            <span className="text-gray-600">Needs assistance:</span>{' '}
                                            <span className={app.mental_health_need_help ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                              {app.mental_health_need_help ? 'Yes' : 'No'}
                                            </span>
                                          </div>
                                        )}
                                        {app.mental_health_description && (
                                          <p className="mt-1 text-gray-700 bg-white p-2 rounded border border-gray-200">
                                            {app.mental_health_description}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Documents (CV & profile photo)</h4>
                                <div className="flex flex-wrap gap-4 items-center">
                                  {app.cv_url ? (
                                    <div className="flex gap-2 items-center">
                                      <a
                                        href={app.cv_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline"
                                      >
                                        View CV
                                      </a>
                                      <a
                                        href={getDownloadUrl(app.cv_url, `CV-${app.surname}-${app.firstname}.pdf`)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                                      >
                                        Download CV
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No CV uploaded</span>
                                  )}
                                  {app.portrait_url ? (
                                    <div className="flex gap-2 items-center">
                                      <a
                                        href={app.portrait_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline"
                                      >
                                        View portrait
                                      </a>
                                      <a
                                        href={getDownloadUrl(app.portrait_url, `Portrait-${app.surname}-${app.firstname}.jpg`)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                                      >
                                        Download portrait
                                      </a>
                                      <img
                                        src={app.portrait_url}
                                        alt={`${app.firstname} ${app.surname}`}
                                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No portrait uploaded</span>
                                  )}
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Bank details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div><span className="text-gray-600">Bank:</span> {app.bank_name}</div>
                                  <div><span className="text-gray-600">Account holder:</span> {app.account_holder_name}</div>
                                  <div><span className="text-gray-600">Account number:</span> {app.account_number}</div>
                                  <div><span className="text-gray-600">Branch code:</span> {app.branch_code}</div>
                                  <div><span className="text-gray-600">Account type:</span> {app.account_type}</div>
                                </div>
                              </div>

                              {app.application_submitted_at && (
                                <p className="text-xs text-gray-500 pt-2">
                                  Submitted: {format(new Date(app.application_submitted_at), 'PPpp')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    {applications.length === 0 && !isLoadingApplications && (
                      <p className="text-gray-500">No application results yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'join-requests' && (
              <div>
                <JoinRequestsManager />
              </div>
            )}

            {activeTab === 'shul-times' && (
              <div>
                <ShulTimesManager />
              </div>
            )}
          </div>
        </div>

        {/* User Profile Modal */}
        {viewingUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
                <button
                  onClick={handleCloseProfile}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {isLoadingProfile ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading user details...</p>
                </div>
              ) : userProfile ? (
                <div className="p-6 space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900 font-medium">{userProfile.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hebrew Name</label>
                        <p className="text-gray-900 font-medium">{userProfile.hebrew_name || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 font-medium">{userProfile.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Banking Details */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bank Name</label>
                        <p className="text-gray-900 font-medium">{userProfile.bank_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Number</label>
                        <p className="text-gray-900 font-medium font-mono">{userProfile.account_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Branch Code</label>
                        <p className="text-gray-900 font-medium font-mono">{userProfile.branch_code || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Type</label>
                        <p className="text-gray-900 font-medium">{userProfile.account_type || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Earned</label>
                        <p className="text-2xl font-bold text-green-700">
                          R{users.find((u) => u.user_id === viewingUserId)?.total_earned.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Paid</label>
                        <p className="text-2xl font-bold text-blue-700">
                          R{users.find((u) => u.user_id === viewingUserId)?.total_paid.toFixed(2) || '0.00'}
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

                  {/* Payment History */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                      <button
                        onClick={() => {
                          setSelectedUserId(viewingUserId);
                          handleCloseProfile();
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Notes
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recorded At
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
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
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => handleDeletePayment(payment.id, payment.amount)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    title="Delete payment"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
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

                  {/* Monthly Earnings Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings Summary</h3>
                    {userEarnings.length > 0 ? (
                      <div className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Month
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Days Attended
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Earnings
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg per Day
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              // Group earnings by month
                              const monthlyData = userEarnings.reduce((acc: any, earning) => {
                                const monthKey = format(new Date(earning.date), 'yyyy-MM');
                                if (!acc[monthKey]) {
                                  acc[monthKey] = {
                                    month: monthKey,
                                    days: 0,
                                    total: 0
                                  };
                                }
                                acc[monthKey].days += 1;
                                acc[monthKey].total += earning.amount_earned;
                                return acc;
                              }, {});
                              
                              return Object.values(monthlyData)
                                .sort((a: any, b: any) => b.month.localeCompare(a.month))
                                .map((data: any) => (
                                  <tr key={data.month} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {format(new Date(data.month + '-01'), 'MMMM yyyy')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                      {data.days} days
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                      R{data.total.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                      R{(data.total / data.days).toFixed(2)}
                                    </td>
                                  </tr>
                                ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mb-6">
                        No earnings recorded yet.
                      </div>
                    )}
                  </div>

                  {/* Daily Earnings History */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Earnings History</h3>
                    {userEarnings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Base
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Early Bonus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Learning Bonus
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userEarnings.map((earning, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(earning.date), 'PP')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  R{earning.on_time_bonus.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  R{earning.early_bonus.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  R{earning.learning_bonus.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                  R{earning.amount_earned.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    earning.is_weekend
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {earning.is_weekend ? 'Weekend' : 'Weekday'}
                                  </span>
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
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Failed to load user details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Announcements Manager Component
function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/announcements?all=true');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          expires_at: formData.expires_at || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Announcement created successfully!' });
        setFormData({ title: '', message: '', expires_at: '' });
        fetchAnnouncements();
        // Hide form after a short delay
        setTimeout(() => {
          setShowForm(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create announcement' });
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setMessage({ type: 'error', text: 'Failed to create announcement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      fetchAnnouncements();
    } catch (error) {
      alert('Failed to update announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch (error) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
          {message && (
            <div
              className={`px-4 py-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <DateTimePicker
              value={formData.expires_at}
              onChange={(datetime) => setFormData({ ...formData, expires_at: datetime })}
              minDate={new Date()}
              label="Expires At (optional)"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Announcement'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({ title: '', message: '', expires_at: '' });
                setMessage(null);
              }}
              disabled={isSubmitting}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{ann.title}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggle(ann.id, ann.is_active)}
                  className={`text-sm px-3 py-1 rounded ${
                    ann.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ann.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap mb-2">{ann.message}</p>
            <p className="text-sm text-gray-500">
              Created: {format(new Date(ann.created_at), 'PPp')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Join Requests Manager Component
function JoinRequestsManager() {
  const [requests, setRequests] = useState<{
    id: string;
    user_id: string;
    program_id: string;
    program_name: string;
    email: string;
    full_name: string | null;
    requested_at: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/join-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: string) => {
    setActingId(requestId);
    try {
      const response = await fetch(`/api/admin/join-requests/${requestId}/approve`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Request approved.');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (error) {
      alert('An error occurred.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Reject this join request? The user can request again later.')) return;
    setActingId(requestId);
    try {
      const response = await fetch(`/api/admin/join-requests/${requestId}/reject`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Request rejected.');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to reject');
      }
    } catch (error) {
      alert('An error occurred.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Program Join Requests</h3>
      <p className="text-sm text-gray-600 mb-4">
        Users request to join programs from their profile. Approve or reject requests here.
      </p>
      {isLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No pending join requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <span className="font-semibold text-gray-900">
                  {req.full_name || req.email}
                </span>
                <span className="text-gray-500 ml-2">({req.email})</span>
                <div className="text-sm text-gray-600 mt-1">
                  Program: <span className="font-medium">{req.program_name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Requested: {format(new Date(req.requested_at), 'PPp')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actingId !== null}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {actingId === req.id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={actingId !== null}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                >
                  {actingId === req.id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Shul Times Manager Component
function ShulTimesManager() {
  const [times, setTimes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: '0',
    service_name: '',
    time: '',
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    fetchTimes();
  }, []);

  const fetchTimes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shul-times');
      if (response.ok) {
        const data = await response.json();
        setTimes(data.times || []);
      }
    } catch (error) {
      console.error('Error fetching shul times:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/shul-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: parseInt(formData.day_of_week),
          service_name: formData.service_name,
          time: formData.time,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ day_of_week: '0', service_name: '', time: '' });
        fetchTimes();
      }
    } catch (error) {
      alert('Failed to save shul time');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shul time?')) return;
    try {
      await fetch(`/api/shul-times?id=${id}`, { method: 'DELETE' });
      fetchTimes();
    } catch (error) {
      alert('Failed to delete shul time');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Shul Times</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Time'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {daysOfWeek.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              placeholder="e.g., Shacharit, Mincha, Maariv"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700"
          >
            Save Time
          </button>
        </form>
      )}

      <div className="space-y-4">
        {times.map((time) => (
          <div key={time.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <span className="font-semibold text-gray-900">
                {daysOfWeek.find((d) => d.value === time.day_of_week)?.label}
              </span>
              <span className="mx-2 text-gray-600">-</span>
              <span className="text-gray-700">{time.service_name}</span>
              <span className="mx-2 text-gray-600">-</span>
              <span className="text-gray-700">{time.time}</span>
            </div>
            <button
              onClick={() => handleDelete(time.id)}
              className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
