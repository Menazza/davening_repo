'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface User {
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

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Determine if existing bank_name is in our list or is "Other"
  const bankOptions = [
    'Standard Bank',
    'First National Bank (FNB)',
    'ABSA Bank',
    'Nedbank',
    'Capitec Bank',
    'Investec Bank',
    'African Bank',
    'Mercantile Bank',
    'Bidvest Bank',
    'Sasfin Bank',
    'Al Baraka Bank',
    'Ubank',
    'HBZ Bank',
    'South African Bank of Athens (SABA)',
    'Discovery Bank',
    'TymeBank',
    'Bank Zero',
  ];
  const existingBankName = initialUser.bank_name || '';
  const isBankInList = bankOptions.includes(existingBankName);
  const initialSelectedBank = isBankInList ? existingBankName : existingBankName ? 'Other' : '';

  const [formData, setFormData] = useState({
    full_name: initialUser.full_name || '',
    hebrew_name: initialUser.hebrew_name || '',
    bank_name: initialUser.bank_name || '',
    account_number: initialUser.account_number || '',
    branch_code: initialUser.branch_code || '',
    account_type: initialUser.account_type || '',
  });
  const [selectedBank, setSelectedBank] = useState(initialSelectedBank);
  const [bankNameOther, setBankNameOther] = useState(!isBankInList && existingBankName ? existingBankName : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={initialUser} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="hebrew_name" className="block text-sm font-medium text-gray-700 mb-1">
                Hebrew Name (for aliyas)
              </label>
              <input
                type="text"
                id="hebrew_name"
                value={formData.hebrew_name}
                onChange={(e) => setFormData({ ...formData, hebrew_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <select
                id="bank_name"
                value={selectedBank}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedBank(value);
                  if (value === 'Other') {
                    setFormData({ ...formData, bank_name: bankNameOther });
                  } else {
                    setFormData({ ...formData, bank_name: value });
                    setBankNameOther('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select bank</option>
                <option value="Standard Bank">Standard Bank</option>
                <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                <option value="ABSA Bank">ABSA Bank</option>
                <option value="Nedbank">Nedbank</option>
                <option value="Capitec Bank">Capitec Bank</option>
                <option value="Investec Bank">Investec Bank</option>
                <option value="African Bank">African Bank</option>
                <option value="Mercantile Bank">Mercantile Bank</option>
                <option value="Bidvest Bank">Bidvest Bank</option>
                <option value="Sasfin Bank">Sasfin Bank</option>
                <option value="Al Baraka Bank">Al Baraka Bank</option>
                <option value="Ubank">Ubank</option>
                <option value="HBZ Bank">HBZ Bank</option>
                <option value="South African Bank of Athens (SABA)">South African Bank of Athens (SABA)</option>
                <option value="Discovery Bank">Discovery Bank</option>
                <option value="TymeBank">TymeBank</option>
                <option value="Bank Zero">Bank Zero</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {selectedBank === 'Other' && (
              <div>
                <label htmlFor="bank_name_other" className="block text-sm font-medium text-gray-700 mb-1">
                  Specify Bank Name
                </label>
                <input
                  type="text"
                  id="bank_name_other"
                  placeholder="Enter bank name"
                  value={bankNameOther}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBankNameOther(value);
                    setFormData({ ...formData, bank_name: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="branch_code" className="block text-sm font-medium text-gray-700 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                id="branch_code"
                value={formData.branch_code}
                onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                id="account_type"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select account type</option>
                <option value="cheque">Cheque</option>
                <option value="savings">Savings</option>
                <option value="transmission">Transmission</option>
              </select>
            </div>

            {message && (
              <div
                className={`p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

