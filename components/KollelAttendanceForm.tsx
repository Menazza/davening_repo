'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface KollelAttendanceFormProps {
  date: string;
  programId: string;
  onSuccess?: () => void;
}

interface KollelAttendanceData {
  arrival_time: string;
  departure_time: string;
}

export default function KollelAttendanceForm({ date, programId, onSuccess }: KollelAttendanceFormProps) {
  const [formData, setFormData] = useState<KollelAttendanceData>({
    arrival_time: '08:30',
    departure_time: '10:30',
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
            arrival_time: '08:30',
            departure_time: '10:30',
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

    // Validate times
    if (formData.arrival_time < '08:30') {
      setMessage({ type: 'error', text: 'Arrival time cannot be before 8:30 AM' });
      setIsSubmitting(false);
      return;
    }

    if (formData.departure_time > '10:30') {
      setMessage({ type: 'error', text: 'Departure time cannot be after 10:30 AM' });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-2">
          Arrival Time
        </label>
        <input
          type="time"
          id="arrival_time"
          value={formData.arrival_time}
          onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
          min="08:30"
          max="10:30"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Earliest: 8:30 AM
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
          min="08:30"
          max="10:30"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Latest: 10:30 AM
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
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </form>
  );
}
