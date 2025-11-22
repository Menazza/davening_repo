'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';

interface ShulTime {
  id: string;
  day_of_week: number;
  service_name: string;
  time: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DaveningTimes() {
  const [times, setTimes] = useState<ShulTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shul-times')
      .then((res) => res.json())
      .then((data) => {
        setTimes(data.times || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching shul times:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Davening Times</h3>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (times.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Davening Times</h3>
        <p className="text-gray-500 text-sm">No davening times have been set yet.</p>
      </div>
    );
  }

  // Get current week
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group times by day
  const timesByDay: Record<number, ShulTime[]> = {};
  times.forEach((time) => {
    if (!timesByDay[time.day_of_week]) {
      timesByDay[time.day_of_week] = [];
    }
    timesByDay[time.day_of_week].push(time);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Davening Times - This Week</h3>
      <div className="space-y-3">
        {weekDays.map((day, idx) => {
          const dayTimes = timesByDay[idx] || [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={idx}
              className={`border rounded-lg p-3 ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {dayNames[idx]}
                </span>
                <span className="text-sm text-gray-500">
                  {format(day, 'MMM d')}
                </span>
              </div>
              {dayTimes.length > 0 ? (
                <div className="space-y-1">
                  {dayTimes.map((time) => (
                    <div key={time.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{time.service_name}</span>
                      <span className="font-medium text-gray-900">{time.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No services scheduled</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

