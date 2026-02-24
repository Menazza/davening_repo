import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersEarnings } from '@/lib/attendance';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';
import { getAllApplicationsForAdmin, isApplicationComplete } from '@/lib/application';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedHendlerAdmin();

    const [usersEarnings, applications] = await Promise.all([
      getAllUsersEarnings(),
      getAllApplicationsForAdmin(),
    ]);

    // Build a lookup of application status per user
    const applicationStatusByUser: Record<
      string,
      'not_started' | 'incomplete' | 'complete'
    > = {};

    applications.forEach((app) => {
      const status = isApplicationComplete(app) ? 'complete' : 'incomplete';
      applicationStatusByUser[app.user_id] = status;
    });

    // Hide all admin accounts and attach form status
    const nonAdminUsers = usersEarnings
      .filter((u: any) => !u.is_admin)
      .map((u: any) => ({
        ...u,
        application_status:
          applicationStatusByUser[u.user_id] ?? 'not_started',
      }));

    return NextResponse.json({ users: nonAdminUsers });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

