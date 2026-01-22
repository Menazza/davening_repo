'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface KollelAttendanceFormProps {
  date: string;
  programId: string;
  programName?: string;
  onSuccess?: () => void;
}

interface KollelAttendanceData {
  arrival_time: string;
  departure_time: string;
}

export default function KollelAttendanceForm({ date, programId, programName, onSuccess }: KollelAttendanceFormProps) {
  // Determine time range based on program name
  const isFullMorningKollel = programName === 'Keter Eliyahu Full Morning Kollel';
  const defaultArrival = isFullMorningKollel ? '08:45' : '08:30';
  const defaultDeparture = isFullMorningKollel ? '12:00' : '10:30';
  const minTime = isFullMorningKollel ? '08:45' : '08:30';
  const maxTime = isFullMorningKollel ? '12:00' : '10:30';
  const earliestText = isFullMorningKollel ? '8:45 AM' : '8:30 AM';
  const latestText = isFullMorningKollel ? '12:00 PM' : '10:30 AM';

  const [formData, setFormData] = useState<KollelAttendanceData>({
    arrival_time: defaultArrival,
    departure_time: defaultDeparture,
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
      const response = await fetch(`/api/kollel-attendance?date=${date}&program_id=${programId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.attendance) {
          // Format time from HH:MM:SS to HH:MM
          const arrival = data.attendance.arrival_time.slice(0, 5);
          const departure = data.attendance.departure_time.slice(0, 5);
          setFormData({
            arrival_time: arrival,
            departure_time: departure,
          });
        } else {
          setFormData({
            arrival_time: defaultArrival,
            departure_time: defaultDeparture,
          });
        }
      }
    } catch (error) {
      console.error('Error loading kollel attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validate times based on program
    if (formData.arrival_time < minTime) {
      setMessage({ type: 'error', text: `Arrival time cannot be before ${earliestText}` });
      setIsSubmitting(false);
      return;
    }

    if (formData.departure_time > maxTime) {
      setMessage({ type: 'error', text: `Departure time cannot be after ${latestText}` });
      setIsSubmitting(false);
      return;
    }

    if (formData.arrival_time >= formData.departure_time) {
      setMessage({ type: 'error', text: 'Departure time must be after arrival time' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/kollel-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          program_id: programId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to submit attendance' });
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

  if (isLoading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-2">
          Arrival Time
        </label>
        <input
          type="time"
          id="arrival_time"
          value={formData.arrival_time}
          onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
          min={minTime}
          max={maxTime}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Earliest: {earliestText}
        </p>
      </div>

      <div>
        <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-2">
          Departure Time
        </label>
        <input
          type="time"
          id="departure_time"
          value={formData.departure_time}
          onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
          min={minTime}
          max={maxTime}
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Latest: {latestText}
        </p>
      </div>

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
