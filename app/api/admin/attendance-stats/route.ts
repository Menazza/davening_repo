import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';
import { getGlobalAttendanceSummary } from '@/lib/attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedHendlerAdmin();
    const summary = await getGlobalAttendanceSummary();
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Admin attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load attendance stats' },
      { status: 500 }
    );
  }
}

