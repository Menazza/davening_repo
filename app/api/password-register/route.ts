import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const SESSION_COOKIE_NAME = 'session_user_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if a user already exists with this email
    const existing = await sql`
      SELECT id FROM user_profiles WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create a new user profile with a generated UUID
    const created = await sql`
      INSERT INTO user_profiles (id, email, full_name, password, is_admin)
      VALUES (gen_random_uuid(), ${email}, ${full_name || null}, ${password}, false)
      RETURNING id, email, full_name, is_admin, admin_type
    `;

    const user = created[0];

    const response = NextResponse.json({ user });

    response.cookies.set(SESSION_COOKIE_NAME, String(user.id), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error('Password register error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

