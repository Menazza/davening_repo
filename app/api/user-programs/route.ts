import { NextRequest, NextResponse } from 'next/server';
import { getUserProgramsWithDetails, updateUserPrograms } from '@/lib/user-programs';
import { getAllPrograms } from '@/lib/programs';
import { getAuthenticatedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const programs = await getUserProgramsWithDetails(user.id);
    return NextResponse.json({ programs });
  } catch (error: any) {
    console.error('Get user programs error:', error);
    return NextResponse.json(
      { error: 'Failed to get user programs' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { programIds } = body;

    if (!Array.isArray(programIds)) {
      return NextResponse.json(
        { error: 'programIds must be an array' },
        { status: 400 }
      );
    }

    // Verify all program IDs exist and are active
    const allPrograms = await getAllPrograms();
    const validProgramIds = allPrograms.map(p => p.id);
    const invalidIds = programIds.filter((id: string) => !validProgramIds.includes(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid program IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    await updateUserPrograms(user.id, programIds);

    const updatedPrograms = await getUserProgramsWithDetails(user.id);
    return NextResponse.json({ programs: updatedPrograms });
  } catch (error: any) {
    console.error('Update user programs error:', error);
    return NextResponse.json(
      { error: 'Failed to update user programs' },
      { status: 500 }
    );
  }
}
