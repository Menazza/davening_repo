'use client';

import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from 'date-fns';
import AttendanceForm from './AttendanceForm';

interface AttendanceRecord {
  date: string;
  came_early: boolean;
  learned_early: boolean;
  came_late: boolean;
}

interface AttendanceCalendarProps {
  year?: number;
  month?: number; // 0-11 (JavaScript month index)
}

export default function AttendanceCalendar({ year, month }: AttendanceCalendarProps) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalLearningDays, setTotalLearningDays] = useState(0);
  const [totalLearningMinutes, setTotalLearningMinutes] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const now = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    year !== undefined && month !== undefined 
      ? new Date(year, month, 1) 
      : new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const targetDate = currentDate;
  
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    if (year !== undefined && month !== undefined) {
      setCurrentDate(new Date(year, month, 1));
    }
  }, [year, month]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/attendance/range?start=${startDate}&end=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        const attendanceMap: Record<string, AttendanceRecord> = {};
        
        (data.attendance || []).forEach((record: any) => {
          // Normalize date format - handle both date strings and date objects
          const dateStr = record.date ? (typeof record.date === 'string' ? record.date.split('T')[0] : format(new Date(record.date), 'yyyy-MM-dd')) : null;
          if (dateStr) {
            attendanceMap[dateStr] = {
              date: dateStr,
              came_early: record.came_early || false,
              learned_early: record.learned_early || false,
              came_late: record.came_late || false,
            };
          }
        });
        
        setAttendance(attendanceMap);
        
        // Calculate learning stats
        let learningDays = 0;
        let learningMinutes = 0;
        Object.values(attendanceMap).forEach((record) => {
          if (record.learned_early) {
            learningDays++;
            learningMinutes += 5; // 5 minutes per day
          }
        });
        setTotalLearningDays(learningDays);
        setTotalLearningMinutes(learningMinutes);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayStatus = (day: Date): 'attended' | 'learned' | 'late' | 'none' => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendance[dateStr];
    
    if (!record) return 'none';
    
    // If they learned, show as learned (highest priority)
    if (record.learned_early) return 'learned';
    
    // If they came late, show as late
    if (record.came_late) return 'late';
    
    // If they came early or attended (any attendance record exists), show as attended
    if (record.came_early || !record.came_late) return 'attended';
    
    return 'none';
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // Only allow clicking on days in the current month and not in the future
    if (isSameMonth(day, currentDate) && day <= now) {
      setSelectedDate(dateStr);
      setShowEditModal(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    
    if (!confirm(`Are you sure you want to delete attendance for ${format(parseISO(selectedDate), 'PPP')}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        const newAttendance = { ...attendance };
        delete newAttendance[selectedDate];
        setAttendance(newAttendance);
        
        // Recalculate learning stats
        let learningDays = 0;
        let learningMinutes = 0;
        Object.values(newAttendance).forEach((record) => {
          if (record.learned_early) {
            learningDays++;
            learningMinutes += 5;
          }
        });
        setTotalLearningDays(learningDays);
        setTotalLearningMinutes(learningMinutes);
        
        setShowEditModal(false);
        setSelectedDate(null);
        
        // Refresh attendance data
        fetchAttendance();
      } else {
        alert('Failed to delete attendance');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('An error occurred while deleting attendance');
    }
  };

  const handleFormSuccess = () => {
    setShowEditModal(false);
    setSelectedDate(null);
    fetchAttendance();
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Calendar</h3>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isCurrentMonth = isSameMonth(currentDate, now);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(targetDate, 'MMMM yyyy')}
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={handleToday}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
            disabled={isSameMonth(currentDate, new Date(now.getFullYear(), now.getMonth(), 1))}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span>Learned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span>Late</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const status = getDayStatus(day);
          const isCurrentMonth = isSameMonth(day, targetDate);
          const isCurrentDay = isToday(day);
          
          const canClick = isCurrentMonth && day <= now;
          
          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded transition-all
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                ${status === 'learned' ? 'bg-blue-500 text-white font-semibold' : ''}
                ${status === 'attended' ? 'bg-green-500 text-white' : ''}
                ${status === 'late' ? 'bg-orange-500 text-white' : ''}
                ${canClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50' : ''}
                ${status === 'none' && isCurrentMonth && canClick ? 'hover:bg-gray-100' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Learning Days:</span>
            <span className="ml-2 font-semibold text-gray-900">{totalLearningDays}</span>
          </div>
          <div>
            <span className="text-gray-600">Learning Time:</span>
            <span className="ml-2 font-semibold text-gray-900">{totalLearningMinutes} min</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click on any day to edit or delete attendance
        </p>
      </div>

      {/* Edit/Delete Modal */}
      {showEditModal && selectedDate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setSelectedDate(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <AttendanceForm
                  date={selectedDate}
                  onSuccess={handleFormSuccess}
                />
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

