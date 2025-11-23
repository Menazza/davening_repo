'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';
import Navigation from '@/components/Navigation';

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
}

interface AdminStats {
  totalUsers: number;
  totalEarned: number;
  totalPaid: number;
  totalOwed: number;
  usersWithBalance: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserEarnings[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserEarnings[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'owed' | 'earned'>('owed');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'announcements' | 'shul-times'
  >('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState('');

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
      if (!data.user.is_admin) {
        router.push('/dashboard');
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
    } catch (error) {
      alert('An error occurred. Please try again.');
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
                {/* Search and Sort */}
                <div className="flex flex-col sm:flex-row gap-4">
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
                              <button
                                onClick={() => setSelectedUserId(u.user_id)}
                                className="text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Record Payment
                              </button>
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

            {activeTab === 'shul-times' && (
              <div>
                <ShulTimesManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Announcements Manager Component
function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ title: '', message: '', expires_at: '' });
        fetchAnnouncements();
      }
    } catch (error) {
      alert('Failed to create announcement');
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700"
          >
            Create Announcement
          </button>
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
