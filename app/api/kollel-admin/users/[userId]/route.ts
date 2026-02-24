import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth';
import { getAuthenticatedKollelAdmin } from '@/lib/server-auth';

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
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.message?.includes('admin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Kollel admin get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}
