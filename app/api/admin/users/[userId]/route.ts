import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth';
import { getUserPayments, getUserEarningsHistory } from '@/lib/payments';
import { getAuthenticatedAdmin } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await getAuthenticatedAdmin();

    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get payment history
    const payments = await getUserPayments(userId);

    // Get earnings history
    const earnings = await getUserEarningsHistory(userId);

    return NextResponse.json({
      user: userProfile,
      payments,
      earnings,
    });
  } catch (error: any) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}

