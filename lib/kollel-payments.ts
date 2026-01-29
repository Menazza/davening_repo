import { sql } from './db';
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { KollelAttendanceRecord } from './kollel';

export interface KollelEarningsRecord {
  id: string;
  user_id: string;
  program_id: string;
  month: string; // First day of the month (YYYY-MM-01)
  total_minutes_attended: number;
  total_available_minutes: number;
  rate_per_minute: number;
  amount_earned: number;
  created_at: string;
  updated_at: string;
}

export interface KollelPaymentRecord {
  id: string;
  user_id: string;
  program_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  admin_id: string | null;
  created_at: string;
}

// Constants for the 8:30-10:30 kollel
const MONTHLY_SALARY = 8000; // R8000 per month
const KOLLEL_START_TIME = '08:30:00';
const KOLLEL_END_TIME = '10:30:00';
const MINUTES_PER_DAY = 120; // 2 hours = 120 minutes

/**
 * Calculate total available minutes in a month for the kollel
 * Monday to Friday only
 */
export function calculateAvailableMinutes(year: number, month: number): number {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Count Monday (1) to Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++;
    }
  }

  return workingDays * MINUTES_PER_DAY;
}

/**
 * Calculate minutes attended from time strings
 */
export function calculateMinutesAttended(arrivalTime: string, departureTime: string): number {
  // Parse time strings (format: HH:MM:SS or HH:MM)
  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10),
    };
  };

  const arrival = parseTime(arrivalTime);
  const departure = parseTime(departureTime);

  const arrivalMinutes = arrival.hours * 60 + arrival.minutes;
  const departureMinutes = departure.hours * 60 + departure.minutes;

  return Math.max(0, departureMinutes - arrivalMinutes);
}

/**
 * Calculate or update earnings for a user for a specific month
 */
export async function calculateKollelEarnings(
  userId: string,
  programId: string,
  year: number,
  month: number
): Promise<KollelEarningsRecord> {
  const monthStart = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

  // Get all attendance records for this user, program, and month
  const attendanceRecords = await sql`
    SELECT * FROM kollel_attendance
    WHERE user_id = ${userId} 
      AND program_id = ${programId}
      AND date >= ${monthStart}::date 
      AND date <= ${monthEnd}::date
    ORDER BY date
  `;

  // Calculate total minutes attended
  let totalMinutesAttended = 0;
  for (const record of attendanceRecords) {
    const minutes = calculateMinutesAttended(
      record.arrival_time,
      record.departure_time
    );
    totalMinutesAttended += minutes;
  }

  // Calculate total available minutes in the month
  const totalAvailableMinutes = calculateAvailableMinutes(year, month);

  // Calculate rate per minute
  const ratePerMinute = totalAvailableMinutes > 0 
    ? MONTHLY_SALARY / totalAvailableMinutes 
    : 0;

  // Calculate amount earned
  const amountEarned = totalMinutesAttended * ratePerMinute;

  // Insert or update earnings record
  const result = await sql`
    INSERT INTO kollel_earnings (
      user_id, program_id, month, 
      total_minutes_attended, total_available_minutes, 
      rate_per_minute, amount_earned
    )
    VALUES (
      ${userId}, ${programId}, ${monthStart}::date,
      ${totalMinutesAttended}, ${totalAvailableMinutes},
      ${ratePerMinute}, ${amountEarned}
    )
    ON CONFLICT (user_id, program_id, month)
    DO UPDATE SET
      total_minutes_attended = EXCLUDED.total_minutes_attended,
      total_available_minutes = EXCLUDED.total_available_minutes,
      rate_per_minute = EXCLUDED.rate_per_minute,
      amount_earned = EXCLUDED.amount_earned,
      updated_at = NOW()
    RETURNING *
  `;

  return result[0] as KollelEarningsRecord;
}

/**
 * Get daily kollel attendance records for a user
 */
export async function getUserDailyKollelAttendance(
  userId: string,
  programId: string
): Promise<
  Array<{
    date: string;
    arrival_time: string;
    departure_time: string;
    minutes_attended: number;
    created_at: string;
  }>
> {
  const result = await sql`
    SELECT 
      date,
      arrival_time,
      departure_time,
      created_at
    FROM kollel_attendance
    WHERE user_id = ${userId} AND program_id = ${programId}
    ORDER BY date DESC
  `;

  return result.map((row: any) => ({
    date: row.date,
    arrival_time: row.arrival_time,
    departure_time: row.departure_time,
    minutes_attended: calculateMinutesAttended(row.arrival_time, row.departure_time),
    created_at: row.created_at,
  }));
}

/**
 * Get kollel earnings for a user
 */
export async function getUserKollelEarnings(
  userId: string,
  programId: string
): Promise<{ 
  totalEarned: number; 
  totalPaid: number; 
  totalOwed: number; 
  monthlyEarnings: KollelEarningsRecord[];
  dailyAttendance: Array<{
    date: string;
    arrival_time: string;
    departure_time: string;
    minutes_attended: number;
    created_at: string;
  }>;
}> {
  // Get all earnings records
  const earningsResult = await sql`
    SELECT * FROM kollel_earnings
    WHERE user_id = ${userId} AND program_id = ${programId}
    ORDER BY month DESC
  `;

  const monthlyEarnings = earningsResult.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    program_id: row.program_id,
    month: row.month,
    total_minutes_attended: Number(row.total_minutes_attended || 0),
    total_available_minutes: Number(row.total_available_minutes || 0),
    rate_per_minute: Number(row.rate_per_minute || 0),
    amount_earned: Number(row.amount_earned || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const totalEarned = monthlyEarnings.reduce((sum, e) => sum + e.amount_earned, 0);

  // Get all payments
  const paymentsResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_paid
    FROM kollel_payments
    WHERE user_id = ${userId} AND program_id = ${programId}
  `;

  const totalPaid = Number(paymentsResult[0]?.total_paid || 0);
  const totalOwed = totalEarned - totalPaid;

  // Get daily attendance
  const dailyAttendance = await getUserDailyKollelAttendance(userId, programId);

  return { totalEarned, totalPaid, totalOwed, monthlyEarnings, dailyAttendance };
}

/**
 * Get all users' kollel earnings for a specific program
 */
export async function getAllUsersKollelEarnings(
  programId: string
): Promise<
  Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    total_earned: number;
    total_paid: number;
    total_owed: number;
  }>
> {
  const result = await sql`
    SELECT 
      up.id as user_id,
      up.email,
      up.full_name,
      COALESCE((
        SELECT SUM(amount_earned)
        FROM kollel_earnings
        WHERE user_id = up.id AND program_id = ${programId}
      ), 0) as total_earned,
      COALESCE((
        SELECT SUM(amount)
        FROM kollel_payments
        WHERE user_id = up.id AND program_id = ${programId}
      ), 0) as total_paid
    FROM user_profiles up
    WHERE EXISTS (
      SELECT 1 FROM kollel_attendance
      WHERE user_id = up.id AND program_id = ${programId}
    )
    ORDER BY up.full_name, up.email
  `;

  return result.map((row: any) => ({
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name,
    total_earned: Number(row.total_earned || 0),
    total_paid: Number(row.total_paid || 0),
    total_owed: Number(row.total_earned || 0) - Number(row.total_paid || 0),
  }));
}

/**
 * Create a kollel payment record
 */
export async function createKollelPayment(
  userId: string,
  programId: string,
  amount: number,
  paymentDate: string,
  notes: string | null,
  adminId: string
): Promise<KollelPaymentRecord> {
  const result = await sql`
    INSERT INTO kollel_payments (user_id, program_id, amount, payment_date, notes, admin_id)
    VALUES (${userId}, ${programId}, ${amount}, ${paymentDate}::date, ${notes}, ${adminId})
    RETURNING *
  `;
  return result[0] as KollelPaymentRecord;
}

/**
 * Get kollel payment history for a user
 */
export async function getUserKollelPayments(
  userId: string,
  programId: string
): Promise<KollelPaymentRecord[]> {
  const result = await sql`
    SELECT * FROM kollel_payments
    WHERE user_id = ${userId} AND program_id = ${programId}
    ORDER BY payment_date DESC, created_at DESC
  `;

  return result.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    program_id: row.program_id,
    amount: Number(row.amount || 0),
    payment_date: row.payment_date,
    notes: row.notes,
    admin_id: row.admin_id,
    created_at: row.created_at,
  }));
}

/**
 * Recalculate earnings for all users in a specific month
 * Useful for batch processing or corrections
 */
export async function recalculateMonthlyEarnings(
  programId: string,
  year: number,
  month: number
): Promise<void> {
  // Get all users who have attendance in this month
  const monthStart = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

  const usersResult = await sql`
    SELECT DISTINCT user_id
    FROM kollel_attendance
    WHERE program_id = ${programId}
      AND date >= ${monthStart}::date 
      AND date <= ${monthEnd}::date
  `;

  // Recalculate for each user
  for (const row of usersResult) {
    await calculateKollelEarnings(row.user_id, programId, year, month);
  }
}
