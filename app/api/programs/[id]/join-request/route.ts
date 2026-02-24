import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { createJoinRequest } from '@/lib/program-join-requests';
import { getProgramById } from '@/lib/programs';
import { isUserEnrolledInProgram } from '@/lib/user-programs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id: programId } = await params;

    const program = await getProgramById(programId);
    if (!program || !program.is_active) {
      return NextResponse.json(
        { error: 'Program not found or not active' },
        { status: 404 }
      );
    }

    const alreadyEnrolled = await isUserEnrolledInProgram(user.id, programId);
    if (alreadyEnrolled) {
      return NextResponse.json(
        { error: 'You are already a member of this program' },
        { status: 400 }
      );
    }

    const { request: joinRequest, alreadyExisted } = await createJoinRequest(
      user.id,
      programId
    );

    return NextResponse.json({
      request: joinRequest,
      message: alreadyExisted
        ? 'You already have a pending request for this program'
        : 'Join request submitted. An admin will review it.',
    });
  } catch (error: any) {
    if (error.message === 'Already a member of this program') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Create join request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit join request' },
      { status: 500 }
    );
  }
}
