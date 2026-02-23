import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getUserPayments, getUserEarningsHistory, deletePayment } from '@/lib/payments';
import { getAuthenticatedUser, getAuthenticatedHendlerAdmin } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedHendlerAdmin();

    const body = await request.json();
    const { user_id, amount, payment_date, notes } = body;

    if (!user_id || !amount || !payment_date) {
      return NextResponse.json(
        { error: 'user_id, amount, and payment_date are required' },
        { status: 400 }
      );
    }

    const payment = await createPayment(
      user_id,
      parseFloat(amount),
      payment_date,
      notes || null,
      admin.id
    );

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type'); // 'payments' or 'earnings'

    // Users can only view their own history, hendler admins can view anyone's
    const targetUserId = (user.is_admin && user.admin_type === 'hendler' && userId) ? userId : user.id;

    if (type === 'earnings') {
      const earnings = await getUserEarningsHistory(targetUserId);
      return NextResponse.json({ earnings });
    } else {
      const payments = await getUserPayments(targetUserId);
      return NextResponse.json({ payments });
    }
  } catch (error: any) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to get payments' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only Hendler admins can delete payments
    await getAuthenticatedHendlerAdmin();

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deletePayment(paymentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}

