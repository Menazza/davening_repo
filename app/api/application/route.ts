import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getApplicationByUserId, upsertApplication, DaveningApplication } from '@/lib/application';
import { updateUserProfile } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const application = await getApplicationByUserId(user.id);
    return NextResponse.json({ application });
  } catch (error: any) {
    console.error('Get application error:', error);
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

    const data: Partial<DaveningApplication> & { popia_consent_at?: string | null; application_submitted_at?: string | null } = {
      firstname: body.firstname,
      surname: body.surname,
      date_of_birth: body.date_of_birth,
      contact_number: body.contact_number,
      home_address: body.home_address,
      is_student: body.is_student ?? false,
      student_what: body.student_what || null,
      student_where: body.student_where || null,
      next_of_kin_name: body.next_of_kin_name,
      next_of_kin_relationship: body.next_of_kin_relationship,
      next_of_kin_contact: body.next_of_kin_contact,
      availability_days: Array.isArray(body.availability_days) ? body.availability_days : [],
      cv_url: body.cv_url || null,
      portrait_url: body.portrait_url || null,
      health_condition: body.health_condition ?? false,
      health_condition_description: body.health_condition_description || null,
      mental_health_condition: body.mental_health_condition ?? false,
      mental_health_receiving_help: body.mental_health_receiving_help ?? null,
      mental_health_description: body.mental_health_description || null,
      mental_health_need_help: body.mental_health_need_help ?? null,
      bank_name: body.bank_name,
      account_holder_name: body.account_holder_name,
      account_number: body.account_number,
      branch_code: body.branch_code,
      account_type: body.account_type,
    };

    if (body.submit === true) {
      data.popia_consent_at = body.popia_consent_at ? new Date(body.popia_consent_at).toISOString() : new Date().toISOString();
      data.application_submitted_at = new Date().toISOString();
    }

    const application = await upsertApplication(user.id, data);

    // Keep basic profile fields in sync so users don't have to enter data twice
    try {
      const fullName: string | undefined =
        typeof body.full_name === 'string' && body.full_name.trim()
          ? body.full_name.trim()
          : body.firstname && body.surname
          ? `${body.firstname} ${body.surname}`.trim()
          : undefined;

      await updateUserProfile(user.id, {
        full_name: fullName,
        bank_name: body.bank_name,
        account_number: body.account_number,
        branch_code: body.branch_code,
        account_type: body.account_type,
      });
    } catch (syncError) {
      console.error('Profile sync from application failed:', syncError);
      // Do not fail the request if profile sync fails
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 }
    );
  }
}
