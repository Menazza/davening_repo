import { NextResponse } from 'next/server';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';
import { getAllApplicationsForAdmin } from '@/lib/application';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getAuthenticatedHendlerAdmin();
    const applications = await getAllApplicationsForAdmin();
    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
