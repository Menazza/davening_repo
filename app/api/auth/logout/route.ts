import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';

export async function POST(request: NextRequest) {
  try {
    await stackServerApp.signOut();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
