import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';
import { getPendingJoinRequests } from '@/lib/program-join-requests';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedHendlerAdmin();
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id') || undefined;
    const requests = await getPendingJoinRequests(programId);
    return NextResponse.json({ requests });
  } catch (error: any) {
    if (error.message?.includes('admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Admin get join requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get join requests' },
      { status: 500 }
    );
  }
}
