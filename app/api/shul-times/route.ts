import { NextRequest, NextResponse } from 'next/server';
import {
  getShulTimes,
  upsertShulTime,
  deleteShulTime,
} from '@/lib/admin';
import { getAuthenticatedAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const times = await getShulTimes();
    return NextResponse.json({ times });
  } catch (error: any) {
    console.error('Get shul times error:', error);
    return NextResponse.json(
      { error: 'Failed to get shul times' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedAdmin();

    const body = await request.json();
    const { day_of_week, service_name, time } = body;

    if (
      day_of_week === undefined ||
      !service_name ||
      !time
    ) {
      return NextResponse.json(
        { error: 'day_of_week, service_name, and time are required' },
        { status: 400 }
      );
    }

    const shulTime = await upsertShulTime(day_of_week, service_name, time);
    return NextResponse.json({ success: true, time: shulTime });
  } catch (error: any) {
    console.error('Create/update shul time error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update shul time' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getAuthenticatedAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteShulTime(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete shul time error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shul time' },
      { status: 500 }
    );
  }
}

