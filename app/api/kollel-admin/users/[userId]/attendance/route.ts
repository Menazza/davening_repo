import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedKollelAdmin } from '@/lib/server-auth';
import { getUserDailyKollelAttendance } from '@/lib/kollel-payments';
import { getProgramByName } from '@/lib/programs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await getAuthenticatedKollelAdmin();
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const program = await getProgramByName('Keter Eliyahu Morning Kollel');
    if (!program) {
      return NextResponse.json(
        { error: 'Kollel program not found' },
        { status: 404 }
      );
    }

    const attendance = await getUserDailyKollelAttendance(userId, program.id);
    return NextResponse.json({ attendance });
  } catch (error: any) {
    if (error.message?.includes('admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Kollel admin get user attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to get user attendance' },
      { status: 500 }
    );
  }
}
