'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useUser } from '@stackframe/stack';
import AttendanceForm from '@/components/AttendanceForm';
import KollelAttendanceForm from '@/components/KollelAttendanceForm';
import Navigation from '@/components/Navigation';
import DatePicker from '@/components/DatePicker';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
}

interface ProgramAttendancePageProps {
  user: User;
}

export default function ProgramAttendancePage({ user }: ProgramAttendancePageProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  const stackUser = useUser();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
        if (data.programs && data.programs.length > 0) {
          setSelectedProgram(data.programs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (stackUser) {
        await stackUser.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const isKollelProgram = selectedProgram?.name === 'Keter Eliyahu Morning Kollel';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Attendance</h1>
        <p className="text-gray-600 mb-6">Record your attendance for any of your programs</p>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              maxDate={new Date()}
              label="Select Date"
            />
          </div>

          {isLoadingPrograms ? (
            <div className="text-gray-600">Loading programs...</div>
          ) : (
            <>
              <div>
                <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Program
                </label>
                <select
                  id="program"
                  value={selectedProgram?.id || ''}
                  onChange={(e) => {
                    const program = programs.find(p => p.id === e.target.value);
                    setSelectedProgram(program || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {selectedProgram?.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedProgram.description}</p>
                )}
              </div>

              {selectedProgram && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {selectedProgram.name}
                  </h2>
                  {isKollelProgram ? (
                    <KollelAttendanceForm
                      date={selectedDate}
                      programId={selectedProgram.id}
                      onSuccess={handleSuccess}
                    />
                  ) : (
                    <AttendanceForm
                      date={selectedDate}
                      programId={selectedProgram.id}
                      onSuccess={handleSuccess}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
