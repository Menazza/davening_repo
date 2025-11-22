import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/lib/admin';
import { getAuthenticatedAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    if (all === 'true') {
      await getAuthenticatedAdmin();
      const announcements = await getAllAnnouncements();
      return NextResponse.json({ announcements });
    } else {
      const announcements = await getActiveAnnouncements();
      return NextResponse.json({ announcements });
    }
  } catch (error: any) {
    console.error('Get announcements error:', error);
    if (error.message === 'Admin access required' || error.message?.includes('throw')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();

    const body = await request.json();
    const { title, message, expires_at } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const announcement = await createAnnouncement(
      title,
      message,
      admin.id,
      expires_at
    );

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();

    const body = await request.json();
    const { id, title, message, is_active, expires_at } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const announcement = await updateAnnouncement(id, {
      title,
      message,
      is_active,
      expires_at,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Update announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
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

    await deleteAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}

