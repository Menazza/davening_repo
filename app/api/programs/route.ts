import { NextRequest, NextResponse } from 'next/server';
import { getAllPrograms } from '@/lib/programs';
import { getUserProgramsWithDetails } from '@/lib/user-programs';
import { getAuthenticatedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrolledOnly = searchParams.get('enrolled_only') === 'true';

    if (enrolledOnly) {
      // Return only programs the user is enrolled in
      try {
        const user = await getAuthenticatedUser();
        const programs = await getUserProgramsWithDetails(user.id);
        return NextResponse.json({ programs });
      } catch (error) {
        // If not authenticated, return empty array
        return NextResponse.json({ programs: [] });
      }
    } else {
      // Return all active programs
      const programs = await getAllPrograms();
      return NextResponse.json({ programs });
    }
  } catch (error: any) {
    console.error('Get programs error:', error);
    return NextResponse.json(
      { error: 'Failed to get programs' },
      { status: 500 }
    );
  }
}
