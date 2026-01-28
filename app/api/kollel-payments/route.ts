import { NextRequest, NextResponse } from 'next/server';
import { createKollelPayment, getUserKollelPayments } from '@/lib/kollel-payments';
import { getAuthenticatedUser, getAuthenticatedKollelAdmin } from '@/lib/server-auth';
import { getProgramByName } from '@/lib/programs';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedKollelAdmin();

    const body = await request.json();
    const { user_id, amount, payment_date, notes } = body;

    if (!user_id || !amount || !payment_date) {
      return NextResponse.json(
        { error: 'user_id, amount, and payment_date are required' },
        { status: 400 }
      );
    }

    // Get the Morning Kollel program
    const program = await getProgramByName('Keter Eliyahu Morning Kollel');
    if (!program) {
      return NextResponse.json(
        { error: 'Kollel program not found' },
        { status: 404 }
      );
    }

    const payment = await createKollelPayment(
      user_id,
      program.id,
      parseFloat(amount),
      payment_date,
      notes || null,
      admin.id
    );

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Create kollel payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create kollel payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Get the Morning Kollel program
    const program = await getProgramByName('Keter Eliyahu Morning Kollel');
    if (!program) {
      return NextResponse.json(
        { error: 'Kollel program not found' },
        { status: 404 }
      );
    }

    // Users can only view their own payments, kollel admins can view anyone's
    const targetUserId = (user.is_admin && user.admin_type === 'kollel' && userId) ? userId : user.id;

    const payments = await getUserKollelPayments(targetUserId, program.id);
    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Get kollel payments error:', error);
    return NextResponse.json(
      { error: 'Failed to get kollel payments' },
      { status: 500 }
    );
  }
}
