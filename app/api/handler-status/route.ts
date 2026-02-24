import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getUserProgramsWithDetails } from '@/lib/user-programs';
import { getApplicationByUserId, isApplicationComplete } from '@/lib/application';
import { hasAcceptedTermsThisMonth, getLatestTermsAcceptance } from '@/lib/terms';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const [programs, application, acceptedTermsThisMonth, latestTermsAcceptedAt] =
      await Promise.all([
        getUserProgramsWithDetails(user.id).catch(() => []),
        getApplicationByUserId(user.id).catch(() => null),
        hasAcceptedTermsThisMonth(user.id).catch(() => false),
        getLatestTermsAcceptance(user.id).catch(() => null),
      ]);

    const hasHandlerProgram = (programs || []).some(
      (p: any) => p.name === 'Handler'
    );

    const applicationComplete = isApplicationComplete(application);

    return NextResponse.json({
      hasHandlerProgram,
      applicationComplete,
      applicationSubmittedAt: application?.application_submitted_at ?? null,
      acceptedTermsThisMonth,
      latestTermsAcceptedAt: latestTermsAcceptedAt
        ? latestTermsAcceptedAt.toISOString()
        : null,
    });
  } catch (error: any) {
    console.error('Handler status error:', error);
    return NextResponse.json(
      { error: 'Failed to load Handler status' },
      { status: 500 }
    );
  }
}

