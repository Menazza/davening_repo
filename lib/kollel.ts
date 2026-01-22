import { sql } from './db';
import { format } from 'date-fns';
import { getProgramById } from './programs';

export interface KollelAttendanceRecord {
  id: string;
  user_id: string;
  program_id: string;
  date: string;
  arrival_time: string; // TIME format (HH:MM:SS)
  departure_time: string; // TIME format (HH:MM:SS)
  created_at: string;
  updated_at: string;
}

/**
 * Get time range for a Kollel program
 */
export function getKollelTimeRange(programName: string): { start: string; end: string } {
  if (programName === 'Keter Eliyahu Full Morning Kollel') {
    return { start: '08:45:00', end: '12:00:00' };
  }
  // Default to Morning Kollel times
  return { start: '08:30:00', end: '10:30:00' };
}

/**
 * Validates that arrival and departure times are within the kollel hours for a specific program
 */
export function validateKollelTimes(
  arrivalTime: string,
  departureTime: string,
  programName: string
): {
  valid: boolean;
  error?: string;
} {
  const { start, end } = getKollelTimeRange(programName);
  
  // Parse times (format: HH:MM or HH:MM:SS)
  const arrival = arrivalTime.length === 5 ? arrivalTime + ':00' : arrivalTime;
  const departure = departureTime.length === 5 ? departureTime + ':00' : departureTime;

  if (arrival < start) {
    return { valid: false, error: `Arrival time cannot be before ${start.slice(0, 5)}` };
  }

  if (departure > end) {
    return { valid: false, error: `Departure time cannot be after ${end.slice(0, 5)}` };
  }

  if (arrival >= departure) {
    return { valid: false, error: 'Departure time must be after arrival time' };
  }

  return { valid: true };
}

/**
 * Submit kollel attendance with arrival and departure times
 */
export async function submitKollelAttendance(
  userId: string,
  programId: string,
  date: Date,
  data: {
    arrival_time: string;
    departure_time: string;
  },
  programName?: string
): Promise<KollelAttendanceRecord> {
  const dateStr = format(date, 'yyyy-MM-dd');

  // Get program name if not provided
  let programNameToUse = programName;
  if (!programNameToUse) {
    const program = await getProgramById(programId);
    programNameToUse = program?.name || 'Keter Eliyahu Morning Kollel';
  }

  // Validate times
  const validation = validateKollelTimes(data.arrival_time, data.departure_time, programNameToUse);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid times');
  }

  // Normalize time format (ensure HH:MM:SS)
  const arrivalTime = data.arrival_time.length === 5 ? data.arrival_time + ':00' : data.arrival_time;
  const departureTime = data.departure_time.length === 5 ? data.departure_time + ':00' : data.departure_time;

  const result = await sql`
    INSERT INTO kollel_attendance (user_id, program_id, date, arrival_time, departure_time)
    VALUES (${userId}, ${programId}, ${dateStr}::date, ${arrivalTime}::time, ${departureTime}::time)
    ON CONFLICT (user_id, program_id, date)
    DO UPDATE SET
      arrival_time = EXCLUDED.arrival_time,
      departure_time = EXCLUDED.departure_time,
      updated_at = NOW()
    RETURNING *
  `;

  return result[0] as KollelAttendanceRecord;
}

/**
 * Get kollel attendance for a specific date
 */
export async function getKollelAttendanceByDate(
  userId: string,
  programId: string,
  date: Date
): Promise<KollelAttendanceRecord | null> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const result = await sql`
    SELECT * FROM kollel_attendance
    WHERE user_id = ${userId} AND program_id = ${programId} AND date = ${dateStr}::date
  `;
  return (result[0] as KollelAttendanceRecord) || null;
}

/**
 * Delete kollel attendance
 */
export async function deleteKollelAttendance(
  userId: string,
  programId: string,
  date: Date
): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');
  await sql`
    DELETE FROM kollel_attendance
    WHERE user_id = ${userId} AND program_id = ${programId} AND date = ${dateStr}::date
  `;
}

/**
 * Get all kollel attendance for a user
 */
export async function getUserKollelAttendance(
  userId: string,
  programId: string
): Promise<KollelAttendanceRecord[]> {
  const result = await sql`
    SELECT * FROM kollel_attendance
    WHERE user_id = ${userId} AND program_id = ${programId}
    ORDER BY date DESC
  `;
  return result as KollelAttendanceRecord[];
}
