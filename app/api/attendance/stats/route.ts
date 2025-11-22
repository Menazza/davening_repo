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
        came_early,
        learned_early,
        came_late
      FROM attendance
      WHERE user_id = ${user.id}
        AND date >= ${startDate}
        AND date <= ${endDate}
    `;

    const stats = {
      totalDays: attendance.length,
      learningDays: attendance.filter((a: any) => a.learned_early).length,
      learningMinutes: attendance.filter((a: any) => a.learned_early).length * 5,
      earlyDays: attendance.filter((a: any) => a.came_early).length,
      lateDays: attendance.filter((a: any) => a.came_late).length,
      onTimeDays: attendance.filter((a: any) => !a.came_late && !a.came_early).length,
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Get attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

