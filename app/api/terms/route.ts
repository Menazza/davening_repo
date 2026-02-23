import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { hasAcceptedTermsThisMonth, recordTermsAcceptance } from '@/lib/terms';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const acceptedThisMonth = await hasAcceptedTermsThisMonth(user.id);
    return NextResponse.json({ acceptedThisMonth });
  } catch (error: any) {
    console.error('Get terms status error:', error);
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    await recordTermsAcceptance(user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Accept terms error:', error);
    return NextResponse.json(
      { error: 'Failed to record acceptance' },
      { status: 500 }
    );
  }
}
