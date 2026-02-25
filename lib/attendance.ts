import { sql } from './db';
import { format, isSaturday, isSunday, addDays, isSameDay } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  user_id: string;
  program_id: string | null;
  date: string;
  came_early: boolean;
  learned_early: boolean;
  came_late: boolean;
  minutes_late: number | null;
  created_at: string;
  updated_at: string;
}

export interface EarningsRecord {
  id: string;
  user_id: string;
  date: string;
  amount_earned: number;
  on_time_bonus: number;
  early_bonus: number;
  learning_bonus: number;
  is_weekend: boolean;
}

export interface GlobalAttendanceUserSummary {
  user_id: string;
  email: string;
  full_name: string | null;
  days_attended: number;
  learning_days: number;
  learning_minutes: number;
}

export interface GlobalAttendanceSummary {
  users: GlobalAttendanceUserSummary[];
  totalUsersWithAttendance: number;
  totalDays: number;
  totalLearningMinutes: number;
}

const WEEKDAY_RATE = 100;
const WEEKEND_RATE = 150;

async function checkWeekendPairComplete(
  userId: string,
  date: Date
): Promise<boolean> {
  // Check if both Saturday and Sunday in the pair have attendance
  if (isSaturday(date)) {
    // Check if Sunday (next day) has attendance
    const sunday = addDays(date, 1);
    const sundayStr = format(sunday, 'yyyy-MM-dd');
    const sundayAttendance = await sql`
      SELECT id FROM attendance
      WHERE user_id = ${userId} AND date = ${sundayStr}::date
    `;
    return sundayAttendance.length > 0;
  } else if (isSunday(date)) {
    // Check if Saturday (previous day) has attendance
    const saturday = addDays(date, -1);
    const saturdayStr = format(saturday, 'yyyy-MM-dd');
    const saturdayAttendance = await sql`
      SELECT id FROM attendance
      WHERE user_id = ${userId} AND date = ${saturdayStr}::date
    `;
    return saturdayAttendance.length > 0;
  }
  return false;
}

function calculateEarnings(
  record: AttendanceRecord,
  date: Date,
  isWeekendPair: boolean
): {
  on_time_bonus: number;
  early_bonus: number;
  learning_bonus: number;
  total: number;
  is_weekend: boolean;
} {
  const rate = isWeekendPair ? WEEKEND_RATE : WEEKDAY_RATE;

  let on_time_bonus = 0;
  let early_bonus = 0;
  let learning_bonus = 0;

  // On-time bonus: if they didn't come late, they get the base rate
  if (!record.came_late) {
    on_time_bonus = rate;
  }

  // Early bonus: if they came early (15 min weekdays, 25 min on weekends, but payout is still a flat rate)
  if (record.came_early) {
    early_bonus = rate;
  }

  // Learning bonus: if they learned in that early time block
  if (record.learned_early) {
    learning_bonus = rate;
  }

  const total = on_time_bonus + early_bonus + learning_bonus;

  return {
    on_time_bonus,
    early_bonus,
    learning_bonus,
    total,
    is_weekend: isWeekendPair,
  };
}

export async function submitAttendance(
  userId: string,
  date: Date,
  data: {
    program_id?: string | null;
    came_early: boolean;
    learned_early: boolean;
    came_late: boolean;
    minutes_late: number | null;
  }
): Promise<{ attendance: AttendanceRecord; earnings: EarningsRecord }> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dateObj = new Date(dateStr);

  // Insert or update attendance record
  const attendanceResult = await sql`
    INSERT INTO attendance (user_id, program_id, date, came_early, learned_early, came_late, minutes_late)
    VALUES (${userId}, ${data.program_id || null}, ${dateStr}::date, ${data.came_early}, ${data.learned_early}, ${data.came_late}, ${data.minutes_late})
    ON CONFLICT (user_id, COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::uuid), date)
    DO UPDATE SET
      came_early = EXCLUDED.came_early,
      learned_early = EXCLUDED.learned_early,
      came_late = EXCLUDED.came_late,
      minutes_late = EXCLUDED.minutes_late,
      updated_at = NOW()
    RETURNING *
  `;

  const attendance = attendanceResult[0] as AttendanceRecord;

  // Check if this is part of a complete weekend pair (both Sat and Sun have attendance)
  const isWeekendPair = await checkWeekendPairComplete(userId, dateObj);

  // Calculate earnings for the current date
  const earningsCalc = calculateEarnings(attendance, dateObj, isWeekendPair);

  // Insert or update earnings record for current date
  const earningsResult = await sql`
    INSERT INTO earnings (
      user_id, date, amount_earned, on_time_bonus, early_bonus, learning_bonus, is_weekend
    )
    VALUES (
      ${userId}, ${dateStr}::date, ${earningsCalc.total}, 
      ${earningsCalc.on_time_bonus}, ${earningsCalc.early_bonus}, 
      ${earningsCalc.learning_bonus}, ${earningsCalc.is_weekend}
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      amount_earned = EXCLUDED.amount_earned,
      on_time_bonus = EXCLUDED.on_time_bonus,
      early_bonus = EXCLUDED.early_bonus,
      learning_bonus = EXCLUDED.learning_bonus,
      is_weekend = EXCLUDED.is_weekend
    RETURNING *
  `;

  const earnings = earningsResult[0] as EarningsRecord;

  // If this is Saturday or Sunday, check and update the paired day's earnings
  if (isSaturday(dateObj) || isSunday(dateObj)) {
    const otherDay = isSaturday(dateObj) ? addDays(dateObj, 1) : addDays(dateObj, -1);
    const otherDayStr = format(otherDay, 'yyyy-MM-dd');
    
    // Check if the other day has attendance
    const otherDayAttendance = await sql`
      SELECT * FROM attendance
      WHERE user_id = ${userId} AND date = ${otherDayStr}::date
    `;

    if (otherDayAttendance.length > 0) {
      // Both days now exist, so both should use weekend rates (R150)
      // Recalculate earnings for the other day with weekend pair status = true
      const otherDayRecord = otherDayAttendance[0] as AttendanceRecord;
      const otherDayEarningsCalc = calculateEarnings(otherDayRecord, otherDay, true); // Always true since both exist

      // Update the other day's earnings to weekend rates
      await sql`
        UPDATE earnings
        SET
          amount_earned = ${otherDayEarningsCalc.total},
          on_time_bonus = ${otherDayEarningsCalc.on_time_bonus},
          early_bonus = ${otherDayEarningsCalc.early_bonus},
          learning_bonus = ${otherDayEarningsCalc.learning_bonus},
          is_weekend = true
        WHERE user_id = ${userId} AND date = ${otherDayStr}::date
      `;
      
      // Also recalculate current day's earnings with weekend rates since pair is now complete
      const currentDayEarningsCalc = calculateEarnings(attendance, dateObj, true);
      await sql`
        UPDATE earnings
        SET
          amount_earned = ${currentDayEarningsCalc.total},
          on_time_bonus = ${currentDayEarningsCalc.on_time_bonus},
          early_bonus = ${currentDayEarningsCalc.early_bonus},
          learning_bonus = ${currentDayEarningsCalc.learning_bonus},
          is_weekend = true
        WHERE user_id = ${userId} AND date = ${dateStr}::date
      `;
    } else {
      // Only one day exists, so it should use weekday rates (R100)
      // If we just submitted and isWeekendPair is false, earnings are already correct
      // But if we're updating and the other day was deleted, we need to recalculate
      // Recalculate current day with weekday rates since pair is incomplete
      const currentDayEarningsCalc = calculateEarnings(attendance, dateObj, false);
      
      await sql`
        UPDATE earnings
        SET
          amount_earned = ${currentDayEarningsCalc.total},
          on_time_bonus = ${currentDayEarningsCalc.on_time_bonus},
          early_bonus = ${currentDayEarningsCalc.early_bonus},
          learning_bonus = ${currentDayEarningsCalc.learning_bonus},
          is_weekend = false
        WHERE user_id = ${userId} AND date = ${dateStr}::date
      `;
    }
  }

  return { attendance, earnings };
}

export async function deleteAttendance(
  userId: string,
  date: Date
): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dateObj = new Date(dateStr);

  // Delete attendance record
  await sql`
    DELETE FROM attendance
    WHERE user_id = ${userId} AND date = ${dateStr}::date
  `;

  // Delete earnings record
  await sql`
    DELETE FROM earnings
    WHERE user_id = ${userId} AND date = ${dateStr}::date
  `;

  // If this was Saturday or Sunday, recalculate the other day's earnings
  if (isSaturday(dateObj) || isSunday(dateObj)) {
    const otherDay = isSaturday(dateObj) ? addDays(dateObj, 1) : addDays(dateObj, -1);
    const otherDayStr = format(otherDay, 'yyyy-MM-dd');
    
    // Check if the other day still has attendance
    const otherDayAttendance = await sql`
      SELECT * FROM attendance
      WHERE user_id = ${userId} AND date = ${otherDayStr}::date
    `;

    if (otherDayAttendance.length > 0) {
      // Other day exists but pair is now incomplete, recalculate with weekday rates
      const otherDayRecord = otherDayAttendance[0] as AttendanceRecord;
      const otherDayEarningsCalc = calculateEarnings(otherDayRecord, otherDay, false); // false = weekday rates

      // Update the other day's earnings to weekday rates
      await sql`
        UPDATE earnings
        SET
          amount_earned = ${otherDayEarningsCalc.total},
          on_time_bonus = ${otherDayEarningsCalc.on_time_bonus},
          early_bonus = ${otherDayEarningsCalc.early_bonus},
          learning_bonus = ${otherDayEarningsCalc.learning_bonus},
          is_weekend = false
        WHERE user_id = ${userId} AND date = ${otherDayStr}::date
      `;
    }
  }
}

export async function getAttendanceByDate(
  userId: string,
  date: Date,
  programId?: string | null
): Promise<AttendanceRecord | null> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const result = programId
    ? await sql`
        SELECT * FROM attendance
        WHERE user_id = ${userId} AND program_id = ${programId} AND date = ${dateStr}::date
      `
    : await sql`
        SELECT * FROM attendance
        WHERE user_id = ${userId} AND date = ${dateStr}::date
        ORDER BY created_at DESC
        LIMIT 1
      `;
  return (result[0] as AttendanceRecord) || null;
}

export async function getUserEarnings(
  userId: string
): Promise<{ totalEarned: number; totalPaid: number; totalOwed: number }> {
  const earningsResult = await sql`
    SELECT COALESCE(SUM(amount_earned), 0) as total_earned
    FROM earnings
    WHERE user_id = ${userId}
  `;

  const paymentsResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_paid
    FROM payments
    WHERE user_id = ${userId}
  `;

  const totalEarned = Number(earningsResult[0]?.total_earned || 0);
  const totalPaid = Number(paymentsResult[0]?.total_paid || 0);
  const totalOwed = totalEarned - totalPaid;

  return { totalEarned, totalPaid, totalOwed };
}

export async function getAllUsersEarnings(): Promise<
  Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    is_admin: boolean;
    admin_type: string | null;
    total_earned: number;
    total_paid: number;
    total_owed: number;
  }>
> {
  // Use subqueries to avoid JOIN multiplication issues
  const result = await sql`
    SELECT 
      up.id as user_id,
      up.email,
      up.full_name,
      up.is_admin,
      up.admin_type,
      COALESCE((
        SELECT SUM(amount_earned)
        FROM earnings
        WHERE user_id = up.id
      ), 0) as total_earned,
      COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE user_id = up.id
      ), 0) as total_paid
    FROM user_profiles up
    ORDER BY up.full_name, up.email
  `;

  return result.map((row: any) => ({
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name,
    is_admin: row.is_admin,
    admin_type: row.admin_type,
    total_earned: Number(row.total_earned || 0),
    total_paid: Number(row.total_paid || 0),
    total_owed: Number(row.total_earned || 0) - Number(row.total_paid || 0),
  }));
}

export async function getGlobalAttendanceSummary(): Promise<GlobalAttendanceSummary> {
  const rows = await sql`
    SELECT
      up.id AS user_id,
      up.email,
      up.full_name,
      COUNT(DISTINCT a.date) AS days_attended,
      SUM(CASE WHEN a.learned_early THEN 1 ELSE 0 END) AS learning_days,
      SUM(
        CASE
          WHEN a.learned_early AND EXTRACT(DOW FROM a.date) = 6 THEN 25  -- Saturday
          WHEN a.learned_early THEN 15  -- weekdays and Sundays
          ELSE 0
        END
      ) AS learning_minutes
    FROM attendance a
    JOIN user_profiles up ON up.id = a.user_id
    GROUP BY up.id, up.email, up.full_name
  `;

  const users: GlobalAttendanceUserSummary[] = rows.map((row: any) => ({
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name,
    days_attended: Number(row.days_attended || 0),
    learning_days: Number(row.learning_days || 0),
    learning_minutes: Number(row.learning_minutes || 0),
  }));

  const totalUsersWithAttendance = users.length;
  const totalDays = users.reduce((sum, u) => sum + u.days_attended, 0);
  const totalLearningMinutes = users.reduce(
    (sum, u) => sum + u.learning_minutes,
    0
  );

  return {
    users,
    totalUsersWithAttendance,
    totalDays,
    totalLearningMinutes,
  };
}

