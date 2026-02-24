import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersEarnings } from '@/lib/attendance';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedHendlerAdmin();

    const usersEarnings = await getAllUsersEarnings();
    // Hide all admin accounts from the Hendler admin users table
    const nonAdminUsers = usersEarnings.filter((u: any) => !u.is_admin);

    return NextResponse.json({ users: nonAdminUsers });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

