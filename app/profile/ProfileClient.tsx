'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { formatProgramName } from '@/lib/format-program-name';

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

interface Program {
  id: string;
  name: string;
  description: string | null;
}

interface HandlerStatus {
  hasHandlerProgram: boolean;
  applicationComplete: boolean;
  applicationSubmittedAt: string | null;
  acceptedTermsThisMonth: boolean;
  latestTermsAcceptedAt: string | null;
}

export default function ProfileClient({ user: initialUser }: ProfileClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [userProgramIds, setUserProgramIds] = useState<string[]>([]);
  const [joinRequests, setJoinRequests] = useState<{ program_id: string; program_name: string; status: string }[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [requestingProgramId, setRequestingProgramId] = useState<string | null>(null);
  const [isProgramEnrollmentOpen, setIsProgramEnrollmentOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [handlerStatus, setHandlerStatus] = useState<HandlerStatus | null>(null);
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

  useEffect(() => {
    loadPrograms();
    loadHandlerStatus();

    // Check if user was redirected here to enroll or to fix Handler requirements
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('enroll') === 'true') {
        setMessage({
          type: 'error',
          text: 'Please enroll in at least one program before accessing other features.',
        });
        setIsProgramEnrollmentOpen(true);
      }
      const handlerForm = params.get('handlerForm');
      if (handlerForm === 'application') {
        setMessage({
          type: 'error',
          text: 'You need to complete the Davening Programme application before submitting attendance.',
        });
      } else if (handlerForm === 'terms') {
        setMessage({
          type: 'error',
          text: 'You need to accept this month’s programme terms before submitting attendance.',
        });
      }
    }
  }, []);

  const loadHandlerStatus = async () => {
    try {
      const res = await fetch('/api/handler-status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setHandlerStatus(data);
    } catch (error) {
      console.error('Error loading Handler status:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      setIsLoadingPrograms(true);
      const [programsResponse, userProgramsResponse, joinRequestsResponse] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/user-programs'),
        fetch('/api/join-requests'),
      ]);
      if (programsResponse.ok) {
        const programsData = await programsResponse.json();
        setAllPrograms(programsData.programs || []);
      }
      if (userProgramsResponse.ok) {
        const userProgramsData = await userProgramsResponse.json();
        setUserProgramIds((userProgramsData.programs || []).map((p: any) => p.id));
      }
      if (joinRequestsResponse.ok) {
        const joinData = await joinRequestsResponse.json();
        setJoinRequests((joinData.requests || []).map((r: any) => ({
          program_id: r.program_id,
          program_name: r.program_name || '',
          status: r.status,
        })));
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const getProgramStatus = (programId: string): 'member' | 'pending' | 'rejected' | null => {
    if (userProgramIds.includes(programId)) return 'member';
    const req = joinRequests.find(r => r.program_id === programId);
    if (req?.status === 'pending') return 'pending';
    if (req?.status === 'rejected') return 'rejected';
    return null;
  };

  const handleRequestToJoin = async (programId: string) => {
    setRequestingProgramId(programId);
    setMessage(null);
    try {
      const response = await fetch(`/api/programs/${programId}/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Join request submitted. An admin will review it.' });
        await loadPrograms();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setRequestingProgramId(null);
    }
  };

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
        // Close the personal info section after saving
        setIsPersonalInfoOpen(false);
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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to home
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={initialUser} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Profile Settings</h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Handler Programme Status */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Davening Programme (Rabbi Hendler)
          </h3>
          {!handlerStatus ? (
            <p className="text-sm text-gray-600">Checking your programme status...</p>
          ) : !handlerStatus.hasHandlerProgram ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                You are not currently enrolled in the Davening Programme.
              </p>
              <p className="text-sm text-gray-600">
                To join, open the Program Enrollment section below and request to join the Handler programme. An admin must approve your request.
              </p>
            </div>
          ) : !handlerStatus.applicationComplete ? (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800 font-semibold">
                  Your Davening Programme application is not complete.
                </p>
                <p className="text-xs text-red-700 mt-1">
                  You must complete the application before you can submit attendance for the programme.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/application')}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Open Application Form
              </button>
            </div>
          ) : !handlerStatus.acceptedTermsThisMonth ? (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold">
                  You need to accept this month’s programme terms.
                </p>
                {handlerStatus.latestTermsAcceptedAt && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Last accepted:{' '}
                    {new Date(handlerStatus.latestTermsAcceptedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-yellow-700 mt-1">
                  Accepting the terms takes just a moment and is required once per calendar month.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/terms', { method: 'POST' });
                    if (!res.ok) {
                      const data = await res.json();
                      setMessage({
                        type: 'error',
                        text: data.error || 'Failed to record terms acceptance',
                      });
                      return;
                    }
                    setMessage({
                      type: 'success',
                      text: 'Programme terms accepted for this month.',
                    });
                    await loadHandlerStatus();
                  } catch (error) {
                    setMessage({
                      type: 'error',
                      text: 'Failed to record terms acceptance. Please try again.',
                    });
                  }
                }}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Accept This Month’s Terms
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-800 font-semibold">
                You are fully set up for the Davening Programme this month.
              </p>
              {handlerStatus.latestTermsAcceptedAt && (
                <p className="text-xs text-green-700 mt-1">
                  Latest terms accepted:{' '}
                  {new Date(handlerStatus.latestTermsAcceptedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Program Enrollment Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => setIsProgramEnrollmentOpen(!isProgramEnrollmentOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Program Enrollment</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isProgramEnrollmentOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isProgramEnrollmentOpen && (
            <>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4 mt-3">
                Request to join a program. An admin must approve your request before you can submit attendance for that program.
              </p>
          
              {isLoadingPrograms ? (
                <div className="text-gray-600">Loading programs...</div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {allPrograms.map((program) => {
                    const status = getProgramStatus(program.id);
                    return (
                      <div
                        key={program.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{formatProgramName(program.name)}</div>
                          {program.description && (
                            <div className="text-sm text-gray-500">{program.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {status === 'member' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Member
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Pending approval
                            </span>
                          )}
                          {status === 'rejected' && (
                            <>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Request rejected
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRequestToJoin(program.id)}
                                disabled={requestingProgramId === program.id}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                {requestingProgramId === program.id ? 'Submitting...' : 'Request again'}
                              </button>
                            </>
                          )}
                          {status === null && (
                            <button
                              type="button"
                              onClick={() => handleRequestToJoin(program.id)}
                              disabled={requestingProgramId === program.id}
                              className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {requestingProgramId === program.id ? 'Submitting...' : 'Request to join'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {userProgramIds.length === 0 && !isLoadingPrograms && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You need to be approved for at least one program to submit attendance.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isPersonalInfoOpen ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isPersonalInfoOpen && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                  className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
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
                className="w-full px-3 sm:px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px]"
              >
                <option value="">Select account type</option>
                <option value="cheque">Cheque</option>
                <option value="savings">Savings</option>
                <option value="transmission">Transmission</option>
              </select>
            </div>


            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-3 sm:py-2 px-4 text-sm sm:text-base rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[48px] font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

