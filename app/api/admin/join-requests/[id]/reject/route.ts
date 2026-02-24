import { NextResponse } from 'next/server';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';
import { rejectJoinRequest } from '@/lib/program-join-requests';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedHendlerAdmin();
    const { id: requestId } = await params;
    const req = await rejectJoinRequest(requestId, admin.id);
    return NextResponse.json({ request: req, message: 'Request rejected.' });
  } catch (error: any) {
    if (error.message?.includes('admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message === 'Join request not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === 'Request is not pending') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Reject join request error:', error);
    return NextResponse.json(
      { error: 'Failed to reject request' },
      { status: 500 }
    );
  }
}
