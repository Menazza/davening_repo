'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateTimePickerProps {
  value: string; // datetime-local format: YYYY-MM-DDTHH:mm
  onChange: (datetime: string) => void;
  minDate?: Date;
  label?: string;
}

export default function DateTimePicker({ value, onChange, minDate, label }: DateTimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Parse the datetime-local value
  const parsedDate = value ? parseISO(value) : null;
  const selectedDate = parsedDate || new Date();
  
  // Extract date and time components
  const dateStr = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '';
  const timeStr = parsedDate ? format(parsedDate, 'HH:mm') : '00:00';

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    
    // Combine selected date with current time
    const newDateTime = new Date(day);
    if (parsedDate) {
      newDateTime.setHours(parsedDate.getHours());
      newDateTime.setMinutes(parsedDate.getMinutes());
    }
    
    const formatted = format(newDateTime, "yyyy-MM-dd'T'HH:mm");
    onChange(formatted);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    if (!dateStr) {
      // If no date selected, use today
      const today = new Date();
      const [hours, minutes] = time.split(':');
      today.setHours(parseInt(hours), parseInt(minutes));
      onChange(format(today, "yyyy-MM-dd'T'HH:mm"));
    } else {
      // Combine existing date with new time
      const date = parseISO(dateStr);
      const [hours, minutes] = time.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    }
    setIsTimeOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsCalendarOpen(false);
      setIsTimeOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayValue = parsedDate 
    ? `${format(parsedDate, 'PPP')} at ${format(parsedDate, 'h:mm a')}`
    : 'Select date and time';

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex gap-2">
        {/* Date Button */}
        <button
          type="button"
          onClick={() => {
            setIsCalendarOpen(!isCalendarOpen);
            setIsTimeOpen(false);
          }}
          className="flex-1 flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <span>{dateStr ? format(parseISO(dateStr), 'PPP') : 'Select date'}</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Time Button */}
        <button
          type="button"
          onClick={() => {
            setIsTimeOpen(!isTimeOpen);
            setIsCalendarOpen(false);
          }}
          className="flex-1 flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <span>{timeStr || 'Select time'}</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
          <DayPicker
            mode="single"
            selected={parsedDate || undefined}
            onSelect={(day) => day && handleDateSelect(day)}
            disabled={(day) => minDate ? day < startOfDay(minDate) : false}
            defaultMonth={parsedDate || new Date()}
            modifiersStyles={{
              selected: {
                backgroundColor: '#9333EA', // purple-600
                color: 'white',
              },
              today: {
                borderColor: '#9333EA',
                borderWidth: '1px',
              },
            }}
          />
        </div>
      )}

      {/* Time Popup */}
      {isTimeOpen && (
        <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 right-0">
          <div className="text-sm font-medium text-gray-700 mb-2">Select Time</div>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}

