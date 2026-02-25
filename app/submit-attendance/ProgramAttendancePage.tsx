'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import AttendanceForm from '@/components/AttendanceForm';
import KollelAttendanceForm from '@/components/KollelAttendanceForm';
import Navigation from '@/components/Navigation';
import DatePicker from '@/components/DatePicker';
import { formatProgramName } from '@/lib/format-program-name';

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
  const [handlerStatus, setHandlerStatus] = useState<{ hasHandlerProgram: boolean; applicationComplete: boolean } | null>(null);
  const [isLoadingHandlerStatus, setIsLoadingHandlerStatus] = useState(true);

  useEffect(() => {
    // Check for date and program_id query parameters from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      const programIdParam = params.get('program_id');
      
      if (dateParam) {
        setSelectedDate(dateParam);
      }
      
      loadPrograms(programIdParam || undefined);
      loadHandlerStatus();
    }
  }, []);

  const loadPrograms = async (preselectProgramId?: string) => {
    try {
      // Only load programs the user is enrolled in
      const response = await fetch('/api/programs?enrolled_only=true');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
        if (data.programs && data.programs.length > 0) {
          // If program_id is in URL, select that program, otherwise select first
          if (preselectProgramId) {
            const preselected = data.programs.find((p: Program) => p.id === preselectProgramId);
            setSelectedProgram(preselected || data.programs[0]);
          } else {
            setSelectedProgram(data.programs[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const loadHandlerStatus = async () => {
    try {
      const res = await fetch('/api/handler-status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setHandlerStatus({
        hasHandlerProgram: data.hasHandlerProgram,
        applicationComplete: data.applicationComplete,
      });
    } catch (error) {
      console.error('Error loading Handler status:', error);
    } finally {
      setIsLoadingHandlerStatus(false);
    }
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

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const isKollelProgram = selectedProgram?.name === 'Keter Eliyahu Morning Kollel' || 
                          selectedProgram?.name === 'Keter Eliyahu Full Morning Kollel';
  const isHandlerProgram = selectedProgram?.name === 'Handler';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={handleLogout} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Submit Attendance</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Record your attendance for any of your programs</p>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
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
          ) : programs.length === 0 ? (
            <div className="text-red-600">
              <p className="font-semibold mb-2">No programs enrolled</p>
              <p className="text-sm mb-3">You must enroll in at least one program in your profile before submitting attendance.</p>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Profile
              </button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Program *
                </label>
                <select
                  id="program"
                  value={selectedProgram?.id || ''}
                  onChange={(e) => {
                    const program = programs.find(p => p.id === e.target.value);
                    setSelectedProgram(program || null);
                  }}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
                >
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {formatProgramName(program.name)}
                    </option>
                  ))}
                </select>
                {selectedProgram?.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedProgram.description}</p>
                )}
                {programs.length > 1 && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Tip: You can submit attendance for multiple programs on the same day. After submitting, come back here and select another program.
                  </p>
                )}
              </div>

              {selectedProgram && (
                <div className="border-t pt-4 sm:pt-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {formatProgramName(selectedProgram.name)}
                  </h2>
                  {isKollelProgram ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                        {selectedProgram.name === 'Keter Eliyahu Full Morning Kollel'
                          ? 'Enter your arrival and departure times for the Full Morning Kollel session (8:45 AM - 12:00 PM).'
                          : 'Enter your arrival and departure times for the Kollel session (8:30 AM - 10:30 AM).'}
                      </p>
                      <KollelAttendanceForm
                        date={selectedDate}
                        programId={selectedProgram.id}
                        programName={selectedProgram.name}
                        onSuccess={handleSuccess}
                      />
                    </div>
                  ) : isHandlerProgram && handlerStatus && !handlerStatus.applicationComplete ? (
                    <div>
                      <p className="text-sm text-red-600 mb-3 sm:mb-4">
                        You need to complete the Davening Programme application before submitting attendance for this program.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/profile?handlerForm=application')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        Go to Profile to complete application
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                        Mark your attendance details for Rabbi Hendler&apos;s Minyan.
                      </p>
                      <AttendanceForm
                        date={selectedDate}
                        programId={selectedProgram.id}
                        onSuccess={handleSuccess}
                      />
                    </div>
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
