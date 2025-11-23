'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';
import AttendanceForm from '@/components/AttendanceForm';
import Navigation from '@/components/Navigation';
import DatePicker from '@/components/DatePicker';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface AttendanceFormPageProps {
  user: User;
}

export default function AttendanceFormPage({ user }: AttendanceFormPageProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

  const handleSuccess = () => {
    // Redirect back to dashboard after successful submission
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Attendance</h1>
        <p className="text-gray-600 mb-6">Record your attendance for morning learning and davening</p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              maxDate={new Date()}
              label="Select Date"
            />
          </div>

          <AttendanceForm
            date={selectedDate}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

