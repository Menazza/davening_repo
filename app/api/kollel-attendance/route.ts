import { NextRequest, NextResponse } from 'next/server';
import { submitKollelAttendance, getKollelAttendanceByDate, deleteKollelAttendance } from '@/lib/kollel';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getProgramById } from '@/lib/programs';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { date, program_id, arrival_time, departure_time } = body;

    if (!date || !program_id || !arrival_time || !departure_time) {
      return NextResponse.json(
        { error: 'Date, program_id, arrival_time, and departure_time are required' },
        { status: 400 }
      );
    }

    // Get program name for validation
    const program = await getProgramById(program_id);
    const programName = program?.name;

    const result = await submitKollelAttendance(
      user.id,
      program_id,
      new Date(date),
      {
        arrival_time,
        departure_time,
      },
      programName
    );

    return NextResponse.json({ success: true, attendance: result });
  } catch (error: any) {
    console.error('Submit kollel attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit kollel attendance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const program_id = searchParams.get('program_id');

    if (!date || !program_id) {
      return NextResponse.json(
        { error: 'Date and program_id are required' },
        { status: 400 }
      );
    }

    const attendance = await getKollelAttendanceByDate(
      user.id,
      program_id,
      new Date(date)
    );
    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error('Get kollel attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to get kollel attendance' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const program_id = searchParams.get('program_id');

    if (!date || !program_id) {
      return NextResponse.json(
        { error: 'Date and program_id are required' },
        { status: 400 }
      );
    }

    await deleteKollelAttendance(user.id, program_id, new Date(date));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete kollel attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to delete kollel attendance' },
      { status: 500 }
    );
  }
}
