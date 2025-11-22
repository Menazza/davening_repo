import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const attendance = await sql`
      SELECT 
        date::text as date,
        came_early,
        learned_early,
        came_late,
        minutes_late
      FROM attendance
      WHERE user_id = ${user.id}
        AND date >= ${startDate}::date
        AND date <= ${endDate}::date
      ORDER BY date ASC
    `;

    // Format dates as YYYY-MM-DD strings
    const formattedAttendance = attendance.map((record: any) => ({
      ...record,
      date: record.date ? record.date.split('T')[0] : record.date,
    }));

    return NextResponse.json({ attendance: formattedAttendance });
  } catch (error: any) {
    console.error('Get attendance range error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

