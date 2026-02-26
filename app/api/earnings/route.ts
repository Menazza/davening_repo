import { NextRequest, NextResponse } from 'next/server';
import { getUserEarnings } from '@/lib/attendance';
import { getAuthenticatedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const earnings = await getUserEarnings(user.id);
    return NextResponse.json({ earnings });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}

