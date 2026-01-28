import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserKollelEarnings, 
  calculateKollelEarnings, 
  getAllUsersKollelEarnings 
} from '@/lib/kollel-payments';
import { getAuthenticatedUser, getAuthenticatedKollelAdmin } from '@/lib/server-auth';
import { getProgramByName } from '@/lib/programs';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const allUsers = searchParams.get('all_users') === 'true';
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Get the Morning Kollel program
    const program = await getProgramByName('Keter Eliyahu Morning Kollel');
    if (!program) {
      return NextResponse.json(
        { error: 'Kollel program not found' },
        { status: 404 }
      );
    }

    // If requesting all users, require Kollel admin
    if (allUsers) {
      if (!user.is_admin || user.admin_type !== 'kollel') {
        return NextResponse.json(
          { error: 'Unauthorized - Kollel admin access required' },
          { status: 403 }
        );
      }

      const users = await getAllUsersKollelEarnings(program.id);
      return NextResponse.json({ users });
    }

    // If requesting to recalculate for a specific month
    if (year && month) {
      const targetUserId = user.is_admin && userId ? userId : user.id;
      const earnings = await calculateKollelEarnings(
        targetUserId,
        program.id,
        parseInt(year),
        parseInt(month)
      );
      return NextResponse.json({ earnings });
    }

    // Get earnings for user (only kollel admin can view other users)
    const targetUserId = (user.is_admin && user.admin_type === 'kollel' && userId) ? userId : user.id;
    const earnings = await getUserKollelEarnings(targetUserId, program.id);
    return NextResponse.json({ earnings });
  } catch (error: any) {
    console.error('Get kollel earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to get kollel earnings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { user_id, year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month are required' },
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

    // Users can only recalculate their own earnings, kollel admins can do anyone's
    const targetUserId = (user.is_admin && user.admin_type === 'kollel' && user_id) ? user_id : user.id;

    const earnings = await calculateKollelEarnings(
      targetUserId,
      program.id,
      parseInt(year),
      parseInt(month)
    );

    return NextResponse.json({ success: true, earnings });
  } catch (error: any) {
    console.error('Calculate kollel earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate kollel earnings' },
      { status: 500 }
    );
  }
}
