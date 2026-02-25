'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { POPIA_STATEMENT, PROGRAMME_TERMS } from './terms-content';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbos', 'Sunday'];

const BANKS = [
  'Absa Bank',
  'Capitec Bank',
  'Discovery Bank',
  'First National Bank (FNB)',
  'Investec Bank',
  'Nedbank',
  'Standard Bank',
  'Tyme Bank',
  'Other',
];

const ACCOUNT_TYPES = ['Cheque/Current Account', 'Savings Account', 'Other'];

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  account_type?: string;
}

interface Application {
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
}

const emptyApp: Application = {
  firstname: '',
  surname: '',
  date_of_birth: '',
  contact_number: '',
  home_address: '',
  is_student: false,
  student_what: null,
  student_where: null,
  next_of_kin_name: '',
  next_of_kin_relationship: '',
  next_of_kin_contact: '',
  availability_days: [],
  cv_url: null,
  portrait_url: null,
  health_condition: false,
  health_condition_description: null,
  mental_health_condition: false,
  mental_health_receiving_help: null,
  mental_health_description: null,
  mental_health_need_help: null,
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  branch_code: '',
  account_type: '',
};

interface ApplicationClientProps {
  user: User;
  initialApplication: Application | null;
  alreadySubmitted: boolean;
}

export default function ApplicationClient({
  user,
  initialApplication,
  alreadySubmitted,
}: ApplicationClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<Application>(() => {
    const base = { ...emptyApp };
    if (initialApplication) {
      const bankInList = initialApplication.bank_name && BANKS.includes(initialApplication.bank_name);
      Object.assign(base, {
        firstname: initialApplication.firstname || '',
        surname: initialApplication.surname || '',
        date_of_birth: initialApplication.date_of_birth || '',
        contact_number: initialApplication.contact_number || '',
        home_address: initialApplication.home_address || '',
        is_student: initialApplication.is_student ?? false,
        student_what: initialApplication.student_what ?? null,
        student_where: initialApplication.student_where ?? null,
        next_of_kin_name: initialApplication.next_of_kin_name || '',
        next_of_kin_relationship: initialApplication.next_of_kin_relationship || '',
        next_of_kin_contact: initialApplication.next_of_kin_contact || '',
        availability_days: initialApplication.availability_days || [],
        cv_url: initialApplication.cv_url ?? null,
        portrait_url: initialApplication.portrait_url ?? null,
        health_condition: initialApplication.health_condition ?? false,
        health_condition_description: initialApplication.health_condition_description ?? null,
        mental_health_condition: initialApplication.mental_health_condition ?? false,
        mental_health_receiving_help: initialApplication.mental_health_receiving_help ?? null,
        mental_health_description: initialApplication.mental_health_description ?? null,
        mental_health_need_help: initialApplication.mental_health_need_help ?? null,
        bank_name: bankInList ? initialApplication.bank_name : (initialApplication.bank_name ? 'Other' : ''),
        account_holder_name: initialApplication.account_holder_name || '',
        account_number: initialApplication.account_number || '',
        branch_code: initialApplication.branch_code || '',
        account_type: initialApplication.account_type || '',
      });
    }
    // If there's no existing application, prefill some fields from profile
    if (!initialApplication) {
      base.account_holder_name = user.full_name || '';
      if (user.bank_name) {
        base.bank_name = user.bank_name;
      }
      if (user.account_number) {
        base.account_number = user.account_number;
      }
      if (user.branch_code) {
        base.branch_code = user.branch_code;
      }
      if (user.account_type) {
        base.account_type = user.account_type;
      }
    }
    return base;
  });
  const [fullName, setFullName] = useState(() => {
    if (initialApplication && (initialApplication.firstname || initialApplication.surname)) {
      return `${initialApplication.firstname || ''} ${initialApplication.surname || ''}`.trim();
    }
    return user.full_name || '';
  });
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bankOther, setBankOther] = useState(() => {
    if (!initialApplication?.bank_name) return '';
    return BANKS.includes(initialApplication.bank_name) ? '' : initialApplication.bank_name;
  });

  useEffect(() => {
    if (alreadySubmitted) {
      router.replace('/profile?handlerForm=terms');
    }
  }, [alreadySubmitted, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availability_days: prev.availability_days.includes(day)
        ? prev.availability_days.filter((d) => d !== day)
        : [...prev.availability_days, day],
    }));
  };

  const uploadFile = async (file: File, kind: 'cv' | 'portrait') => {
    const setUploading = kind === 'cv' ? setUploadingCv : setUploadingPortrait;
    const key = kind === 'cv' ? 'cv_url' : 'portrait_url';
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      const res = await fetch('/api/application/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((prev) => ({ ...prev, [key]: data.url }));
      setMessage({ type: 'success', text: kind === 'cv' ? 'CV uploaded.' : 'Portrait uploaded.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedFullName = fullName.trim();
    const [firstNamePart, ...rest] = trimmedFullName.split(' ');
    const surnamePart = rest.join(' ');

    const required = [
      trimmedFullName,
      form.date_of_birth,
      form.contact_number,
      form.home_address,
      form.next_of_kin_name,
      form.next_of_kin_relationship,
      form.next_of_kin_contact,
      form.availability_days.length > 0,
      form.cv_url,
      form.portrait_url,
      form.bank_name,
      form.account_holder_name,
      form.account_number,
      form.branch_code,
      form.account_type,
      popiaConsent,
      termsConsent,
    ];
    if (required.some((v) => !v)) {
      setMessage({ type: 'error', text: 'Please complete all required fields and uploads, and accept both consent statements.' });
      return;
    }

    setSaving(true);
    try {
      const bankName = form.bank_name === 'Other' ? bankOther : form.bank_name;
      const res = await fetch('/api/application', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          firstname: firstNamePart,
          surname: surnamePart,
          full_name: trimmedFullName,
          bank_name: bankName,
          submit: true,
          popia_consent_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setMessage({ type: 'success', text: 'Application submitted successfully.' });
      router.push('/profile?enroll=true');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to submit application' });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const trimmedFullName = fullName.trim();
      const [firstNamePart, ...rest] = trimmedFullName.split(' ');
      const surnamePart = rest.join(' ');
      const bankName = form.bank_name === 'Other' ? bankOther : form.bank_name;
      const res = await fetch('/api/application', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          firstname: firstNamePart || form.firstname,
          surname: surnamePart || form.surname,
          full_name: trimmedFullName || undefined,
          bank_name: bankName,
          submit: false,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      setMessage({ type: 'success', text: 'Draft saved.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Davening Programme Application Form</h1>
        <p className="text-sm text-gray-600 mb-6">Submit your application for the Davening Programme.</p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal details</h2>
            <p className="text-sm text-gray-500 mb-4">* Indicates required</p>

            <div className="mt-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth *</label>
              <input
                type="date"
                required
                value={form.date_of_birth}
                onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact number *</label>
              <input
                type="tel"
                required
                value={form.contact_number}
                onChange={(e) => setForm((p) => ({ ...p, contact_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" value={user.email} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600" />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Home address *</label>
              <textarea
                required
                rows={2}
                value={form.home_address}
                onChange={(e) => setForm((p) => ({ ...p, home_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Are you currently a student? *</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={form.is_student === true}
                    onChange={() => setForm((p) => ({ ...p, is_student: true }))}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={form.is_student === false}
                    onChange={() => setForm((p) => ({ ...p, is_student: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {form.is_student && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, what are you studying?</label>
                  <input
                    type="text"
                    value={form.student_what || ''}
                    onChange={(e) => setForm((p) => ({ ...p, student_what: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, where are you studying (Institution name)?</label>
                  <input
                    type="text"
                    value={form.student_where || ''}
                    onChange={(e) => setForm((p) => ({ ...p, student_where: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Next of kin full name *</label>
              <input
                type="text"
                required
                value={form.next_of_kin_name}
                onChange={(e) => setForm((p) => ({ ...p, next_of_kin_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Next of kin relationship to applicant *</label>
              <input
                type="text"
                required
                value={form.next_of_kin_relationship}
                onChange={(e) => setForm((p) => ({ ...p, next_of_kin_relationship: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Next of kin contact number *</label>
              <input
                type="tel"
                required
                value={form.next_of_kin_contact}
                onChange={(e) => setForm((p) => ({ ...p, next_of_kin_contact: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which days are you generally available to attend Shacharis at the shul? * (No bearing on acceptance)
              </label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((day) => (
                  <label key={day} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={form.availability_days.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="mr-2"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload a copy of your CV * (PDF or image, max 4.5 MB)</label>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, 'cv');
                }}
                disabled={uploadingCv}
                className="w-full text-sm"
              />
              {form.cv_url && <p className="mt-1 text-sm text-green-600">Uploaded.</p>}
              {uploadingCv && <p className="mt-1 text-sm text-gray-500">Uploading...</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload a portrait image of your face * (max 4.5 MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, 'portrait');
                }}
                disabled={uploadingPortrait}
                className="w-full text-sm"
              />
              {form.portrait_url && <p className="mt-1 text-sm text-green-600">Uploaded.</p>}
              {uploadingPortrait && <p className="mt-1 text-sm text-gray-500">Uploading...</p>}
            </div>
          </section>

          {/* Medical */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Medical details</h2>
            <p className="text-sm text-gray-500 mb-4">All information will be kept confidential. This section has no bearing on acceptance.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a health condition? *</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" checked={form.health_condition} onChange={() => setForm((p) => ({ ...p, health_condition: true }))} className="mr-2" />
                  Yes
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" checked={!form.health_condition} onChange={() => setForm((p) => ({ ...p, health_condition: false }))} className="mr-2" />
                  No
                </label>
              </div>
            </div>
            {form.health_condition && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">If yes, please describe</label>
                <textarea
                  rows={2}
                  value={form.health_condition_description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, health_condition_description: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a mental health condition? *</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" checked={form.mental_health_condition} onChange={() => setForm((p) => ({ ...p, mental_health_condition: true }))} className="mr-2" />
                  Yes
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" checked={!form.mental_health_condition} onChange={() => setForm((p) => ({ ...p, mental_health_condition: false }))} className="mr-2" />
                  No
                </label>
              </div>
            </div>
            {form.mental_health_condition && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">If yes, are you receiving help?</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input type="radio" checked={form.mental_health_receiving_help === true} onChange={() => setForm((p) => ({ ...p, mental_health_receiving_help: true }))} className="mr-2" />
                      Yes
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" checked={form.mental_health_receiving_help === false} onChange={() => setForm((p) => ({ ...p, mental_health_receiving_help: false }))} className="mr-2" />
                      No
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, please describe</label>
                  <textarea
                    rows={2}
                    value={form.mental_health_description || ''}
                    onChange={(e) => setForm((p) => ({ ...p, mental_health_description: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">If no, do you need help? (Financially or other)</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input type="radio" checked={form.mental_health_need_help === true} onChange={() => setForm((p) => ({ ...p, mental_health_need_help: true }))} className="mr-2" />
                      Yes
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" checked={form.mental_health_need_help === false} onChange={() => setForm((p) => ({ ...p, mental_health_need_help: false }))} className="mr-2" />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Bank */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bank details (South Africa)</h2>
            <p className="text-sm text-gray-500 mb-4">Please ensure your details are correct. We cannot be held responsible if they are not.</p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank name *</label>
              <select
                required
                value={form.bank_name || ''}
                onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select bank</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            {form.bank_name === 'Other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify bank name</label>
                <input
                  type="text"
                  value={bankOther}
                  onChange={(e) => setBankOther(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account holder name *</label>
              <input
                type="text"
                required
                value={form.account_holder_name}
                onChange={(e) => setForm((p) => ({ ...p, account_holder_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account number *</label>
              <input
                type="text"
                required
                value={form.account_number}
                onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch code *</label>
              <input
                type="text"
                required
                value={form.branch_code}
                onChange={(e) => setForm((p) => ({ ...p, branch_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account type *</label>
              <select
                required
                value={form.account_type || ''}
                onChange={(e) => setForm((p) => ({ ...p, account_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Consent & Terms */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Important information & consent</h2>

            <div className="mb-6">
              <div className="max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap mb-4">
                {POPIA_STATEMENT}
              </div>
              <label className="inline-flex items-center">
                <input type="checkbox" checked={popiaConsent} onChange={(e) => setPopiaConsent(e.target.checked)} className="mr-2" />
                <span>I consent to the collection, processing, and storage of my personal information in accordance with the POPIA statement above. *</span>
              </label>
            </div>

            <div className="mb-6">
              <div className="max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap mb-4">
                {PROGRAMME_TERMS}
              </div>
              <label className="inline-flex items-start">
                <input type="checkbox" checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)} className="mt-1 mr-2" />
                <span>I have read, understood, and agree to the above Programme Conduct & Participation Terms. *</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
