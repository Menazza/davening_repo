import { NextRequest, NextResponse } from 'next/server';
import { submitAttendance, getAttendanceByDate } from '@/lib/attendance';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { date, came_early, learned_early, came_late, minutes_late } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const result = await submitAttendance(user.id, new Date(date), {
      came_early: came_early || false,
      learned_early: learned_early || false,
      came_late: came_late || false,
      minutes_late: minutes_late || null,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Submit attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to submit attendance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const attendance = await getAttendanceByDate(user.id, new Date(date));
    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to get attendance' },
      { status: 500 }
    );
  }
}

