import { NextRequest, NextResponse } from 'next/server';
import { submitAttendance, getAttendanceByDate, deleteAttendance } from '@/lib/attendance';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getProgramById } from '@/lib/programs';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import { hasAcceptedTermsThisMonth } from '@/lib/terms';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { date, program_id, came_early, learned_early, came_late, minutes_late } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Handler program: require completed application and terms accepted this month
    if (program_id) {
      const program = await getProgramById(program_id);
      if (program?.name === 'Handler') {
        const application = await getApplicationByUserId(user.id);
        if (!isApplicationComplete(application)) {
          return NextResponse.json(
            { error: 'You must complete the Davening Programme application before submitting attendance. Please complete your application first.' },
            { status: 403 }
          );
        }
        const acceptedTerms = await hasAcceptedTermsThisMonth(user.id);
        if (!acceptedTerms) {
          return NextResponse.json(
            { error: 'You must accept the Programme terms for this month before submitting attendance. Please visit your dashboard to accept the terms.' },
            { status: 403 }
          );
        }
      }
    }

    const result = await submitAttendance(user.id, new Date(date), {
      program_id: program_id || null,
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
    const program_id = searchParams.get('program_id');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const attendance = await getAttendanceByDate(
      user.id,
      new Date(date),
      program_id || undefined
    );
    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to get attendance' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await deleteAttendance(user.id, new Date(date));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}

