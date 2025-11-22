import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { getUserProfile, createUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const user = await stackServerApp.getUser({ or: 'throw' });
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get or create user profile in our database
    let profile = await getUserProfile(user.id);
    
    if (!profile) {
      // Create user profile if it doesn't exist
      profile = await createUserProfile(
        user.id,
        user.primaryEmail,
        user.displayName || undefined
      );
    }

    return NextResponse.json({ user: profile });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
