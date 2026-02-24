import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getJoinRequestsByUser } from '@/lib/program-join-requests';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const requests = await getJoinRequestsByUser(user.id);
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Get join requests error:', error);
    return NextResponse.json(
      { error: 'Failed to get join requests' },
      { status: 500 }
    );
  }
}
