'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from 'date-fns';
import AttendanceForm from './AttendanceForm';
import KollelAttendanceForm from './KollelAttendanceForm';
import { formatProgramName } from '@/lib/format-program-name';

interface AttendanceRecord {
  date: string;
  came_early?: boolean;
  learned_early?: boolean;
  came_late?: boolean;
  type?: 'handler' | 'kollel';
  program_id?: string;
  arrival_time?: string;
  departure_time?: string;
}

interface AttendanceCalendarProps {
  year?: number;
  month?: number; // 0-11 (JavaScript month index)
}

export default function AttendanceCalendar({ year, month }: AttendanceCalendarProps) {
  const router = useRouter();
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalLearningDays, setTotalLearningDays] = useState(0);
  const [totalLearningMinutes, setTotalLearningMinutes] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgramForEdit, setSelectedProgramForEdit] = useState<AttendanceRecord | null>(null);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [handlerStatus, setHandlerStatus] = useState<{ hasHandlerProgram: boolean; applicationComplete: boolean } | null>(null);
  
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
    loadPrograms();
    loadHandlerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

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
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await fetch('/api/programs?enrolled_only=true');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/attendance/range?start=${startDate}&end=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        const attendanceMap: Record<string, AttendanceRecord[]> = {};
        
        (data.attendance || []).forEach((record: any) => {
          // Normalize date format - handle both date strings and date objects
          const dateStr = record.date ? (typeof record.date === 'string' ? record.date.split('T')[0] : format(new Date(record.date), 'yyyy-MM-dd')) : null;
          if (dateStr) {
            if (!attendanceMap[dateStr]) {
              attendanceMap[dateStr] = [];
            }
            attendanceMap[dateStr].push({
              date: dateStr,
              came_early: record.came_early || false,
              learned_early: record.learned_early || false,
              came_late: record.came_late || false,
              type: record.type || (record.arrival_time ? 'kollel' : 'handler'),
              program_id: record.program_id,
              arrival_time: record.arrival_time,
              departure_time: record.departure_time,
            });
          }
        });
        
        setAttendance(attendanceMap);
        
        // Calculate learning stats (only from Handler attendance)
        let learningDays = 0;
        let learningMinutes = 0;
        Object.values(attendanceMap).forEach((records) => {
          records.forEach((record) => {
            if (record.type === 'handler' && record.learned_early) {
              learningDays++;
              learningMinutes += 5; // 5 minutes per day
            }
          });
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

  const getDayAttendanceCount = (day: Date): number => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const records = attendance[dateStr] || [];
    return records.length;
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // Only allow clicking on days in the current month and not in the future
    if (isSameMonth(day, currentDate) && day <= now) {
      setSelectedDate(dateStr);
      setShowEditModal(true);
    }
  };

  const handleDayRightClick = (day: Date, event: React.MouseEvent) => {
    event.preventDefault();
    // Right-click also opens the day view (same as left-click)
    handleDayClick(day);
  };


  const handleFormSuccess = () => {
    setShowEditModal(false);
    setSelectedDate(null);
    setSelectedProgramForEdit(null);
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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {format(targetDate, 'MMMM yyyy')}
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={handleToday}
                className="text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium px-2 py-1.5 rounded hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation min-h-[32px]"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Next month"
            disabled={isSameMonth(currentDate, new Date(now.getFullYear(), now.getMonth(), 1))}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center px-2">
          Click any day to view and manage attendance for all programs
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3 sm:mb-4">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1.5 sm:py-2">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const attendanceCount = getDayAttendanceCount(day);
          const isCurrentMonth = isSameMonth(day, targetDate);
          const isCurrentDay = isToday(day);
          
          const canClick = isCurrentMonth && day <= now;
          
          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              onContextMenu={(e) => handleDayRightClick(day, e)}
              className={`
                aspect-square flex items-center justify-center text-xs sm:text-sm rounded transition-all relative
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                ${canClick ? 'cursor-pointer hover:bg-blue-50 active:bg-blue-100 hover:ring-2 hover:ring-blue-200 touch-manipulation' : ''}
                ${attendanceCount > 0 ? 'bg-blue-50 border-2 border-blue-300' : ''}
                min-h-[36px] sm:min-h-[44px]
              `}
              title={canClick ? `Click to view/manage attendance${attendanceCount > 0 ? ` (${attendanceCount} program${attendanceCount > 1 ? 's' : ''} recorded)` : ''}` : ''}
            >
              {format(day, 'd')}
              {attendanceCount > 0 && (
                <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-gray-600">Learning Days:</span>
            <span className="ml-1 sm:ml-2 font-semibold text-gray-900">{totalLearningDays}</span>
          </div>
          <div>
            <span className="text-gray-600">Learning Time:</span>
            <span className="ml-1 sm:ml-2 font-semibold text-gray-900">{totalLearningMinutes} min</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center px-2">
          Click any day to view and manage attendance for all your programs
        </p>

      </div>

      {/* Day View Modal - Shows all programs for the selected day */}
      {showEditModal && selectedDate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setSelectedDate(null);
              setSelectedProgramForEdit(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 pr-2">
                  {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDate(null);
                    setSelectedProgramForEdit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {programs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You must enroll in at least one program in your profile.</p>
                  <button
                    onClick={() => router.push('/profile?enroll=true')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {programs.map((program) => {
                    const existingRecord = selectedDate 
                      ? (attendance[selectedDate] || []).find(r => r.program_id === program.id)
                      : null;
                    const isKollel = program.name === 'Keter Eliyahu Morning Kollel' || 
                                     program.name === 'Keter Eliyahu Full Morning Kollel';
                    
                    return (
                      <div
                        key={program.id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900">{formatProgramName(program.name)}</h4>
                            {existingRecord ? (
                              <p className="text-xs sm:text-sm text-green-600 mt-1">✓ Attendance recorded</p>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">No attendance yet</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {existingRecord ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProgramForEdit(existingRecord);
                                  }}
                                  className="flex-1 sm:flex-none px-3 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px] font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete attendance for ${formatProgramName(program.name)}?`)) {
                                      try {
                                        let response;
                                        if (existingRecord.type === 'kollel') {
                                          response = await fetch(`/api/kollel-attendance?date=${selectedDate}&program_id=${program.id}`, {
                                            method: 'DELETE',
                                          });
                                        } else {
                                          response = await fetch(`/api/attendance?date=${selectedDate}&program_id=${program.id}`, {
                                            method: 'DELETE',
                                          });
                                        }
                                        if (response.ok) {
                                          fetchAttendance();
                                        }
                                      } catch (error) {
                                        console.error('Error deleting:', error);
                                      }
                                    }
                                  }}
                                  className="flex-1 sm:flex-none px-3 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px] font-medium"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  const isHandlerProgram = program.name === 'Handler';
                                  if (isHandlerProgram && handlerStatus && !handlerStatus.applicationComplete) {
                                    router.push('/profile?handlerForm=application');
                                    return;
                                  }
                                  router.push(`/submit-attendance?date=${selectedDate}&program_id=${program.id}`);
                                }}
                                className="w-full sm:w-auto px-3 sm:px-3 py-2 sm:py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px] font-medium"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Show existing attendance details */}
                        {existingRecord && selectedProgramForEdit?.program_id === program.id && (
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                            {existingRecord.type === 'kollel' ? (
                              <KollelAttendanceForm
                                date={selectedDate}
                                programId={program.id}
                                programName={program.name}
                                onSuccess={handleFormSuccess}
                              />
                            ) : (
                              <AttendanceForm
                                date={selectedDate}
                                programId={program.id}
                                onSuccess={handleFormSuccess}
                              />
                            )}
                          </div>
                        )}
                        
                        {/* Show summary if attendance exists but not editing */}
                        {existingRecord && selectedProgramForEdit?.program_id !== program.id && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                            {existingRecord.type === 'kollel' ? (
                              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                <p>Arrival: {existingRecord.arrival_time}</p>
                                <p>Departure: {existingRecord.departure_time}</p>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                                {existingRecord.learned_early && (
                                  <span className="text-blue-600 font-medium">✓ Learned (5 min early)</span>
                                )}
                                {existingRecord.came_early && (
                                  <span className="text-green-600 font-medium">✓ Came Early</span>
                                )}
                                {existingRecord.came_late && (
                                  <span className="text-orange-600 font-medium">⚠ Came Late</span>
                                )}
                                {!existingRecord.learned_early && !existingRecord.came_early && !existingRecord.came_late && (
                                  <span className="text-gray-600">✓ Attended</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

