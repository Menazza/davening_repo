'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface AttendanceFormProps {
  date: string;
  programId?: string | null;
  onSuccess?: () => void;
}

interface AttendanceData {
  came_early: boolean;
  learned_early: boolean;
  came_late: boolean;
  minutes_late: number | null;
}

export default function AttendanceForm({ date, programId, onSuccess }: AttendanceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<AttendanceData>({
    came_early: false,
    learned_early: false,
    came_late: false,
    minutes_late: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAttendance();
  }, [date, programId]);

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const url = programId
        ? `/api/attendance?date=${date}&program_id=${programId}`
        : `/api/attendance?date=${date}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.attendance) {
          setFormData({
            came_early: data.attendance.came_early || false,
            learned_early: data.attendance.learned_early || false,
            came_late: data.attendance.came_late || false,
            minutes_late: data.attendance.minutes_late || null,
          });
        } else {
          setFormData({
            came_early: false,
            learned_early: false,
            came_late: false,
            minutes_late: null,
          });
        }
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          program_id: programId || null,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Special handling for Handler programme requirements
        if (response.status === 403 && data?.code === 'APPLICATION_REQUIRED') {
          setMessage({
            type: 'error',
            text:
              'You need to complete the Davening Programme application before submitting attendance. Redirecting you to your profile...',
          });
          // Give the user a brief moment to read the message, then redirect
          setTimeout(() => {
            router.push('/profile?handlerForm=application');
          }, 1500);
        } else if (response.status === 403 && data?.code === 'TERMS_REQUIRED') {
          setMessage({
            type: 'error',
            text:
              'You need to accept this month’s programme terms before submitting attendance. Redirecting you to your profile...',
          });
          setTimeout(() => {
            router.push('/profile?handlerForm=terms');
          }, 1500);
        } else {
          setMessage({
            type: 'error',
            text: data.error || 'Failed to submit attendance',
          });
        }
        setIsSubmitting(false);
        return;
      }

      setMessage({ type: 'success', text: 'Attendance submitted successfully!' });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const lateMinutesOptions = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="flex items-center space-x-3 cursor-pointer touch-manipulation min-h-[44px]">
          <input
            type="checkbox"
            checked={formData.came_early}
            onChange={(e) => {
              const cameEarly = e.target.checked;
              setFormData({
                ...formData,
                came_early: cameEarly,
                // If they came early, uncheck came_late
                came_late: cameEarly ? false : formData.came_late,
                minutes_late: cameEarly ? null : formData.minutes_late,
                // If they uncheck came_early, also uncheck learned_early
                learned_early: cameEarly ? formData.learned_early : false,
              });
            }}
            className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
          />
          <span className="text-sm sm:text-base text-gray-700 font-medium">
            Did you come 5 minutes early?
          </span>
        </label>
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer touch-manipulation min-h-[44px]">
          <input
            type="checkbox"
            checked={formData.learned_early}
            onChange={(e) => setFormData({ ...formData, learned_early: e.target.checked })}
            disabled={!formData.came_early}
            className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          />
          <span className="text-sm sm:text-base text-gray-700 font-medium">
            Did you learn in those 5 minutes?
          </span>
        </label>
        {!formData.came_early && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-8">
            (Only applicable if you came 5 minutes early)
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer touch-manipulation min-h-[44px]">
          <input
            type="checkbox"
            checked={formData.came_late}
            onChange={(e) => {
              const cameLate = e.target.checked;
              setFormData({
                ...formData,
                came_late: cameLate,
                minutes_late: cameLate ? formData.minutes_late : null,
                // If they came late, uncheck came_early
                came_early: cameLate ? false : formData.came_early,
                learned_early: cameLate ? false : formData.learned_early,
              });
            }}
            disabled={formData.came_early}
            className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          />
          <span className={`text-sm sm:text-base text-gray-700 font-medium ${formData.came_early ? 'text-gray-400' : ''}`}>
            Did you come late to shul?
          </span>
        </label>
        {formData.came_early && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-8">
            (Not applicable if you came early)
          </p>
        )}
      </div>

      {formData.came_late && (
        <div>
          <label htmlFor="minutes_late" className="block text-sm font-medium text-gray-700 mb-2">
            How late did you come? (in increments of 5 minutes)
          </label>
          <select
            id="minutes_late"
            value={formData.minutes_late || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                minutes_late: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
          >
            <option value="">Select minutes late</option>
            {lateMinutesOptions.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div
          className={`px-4 py-3 rounded ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 sm:py-2 px-4 text-sm sm:text-base rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </form>
  );
}

