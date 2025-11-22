import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/auth';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const body = await request.json();
    const { hebrew_name, bank_name, account_number, branch_code, account_type, full_name } = body;

    const updatedUser = await updateUserProfile(user.id, {
      hebrew_name,
      bank_name,
      account_number,
      branch_code,
      account_type,
      full_name,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

