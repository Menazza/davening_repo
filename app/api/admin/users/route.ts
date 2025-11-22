import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersEarnings } from '@/lib/attendance';
import { getAuthenticatedAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedAdmin();

    const usersEarnings = await getAllUsersEarnings();
    return NextResponse.json({ users: usersEarnings });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

