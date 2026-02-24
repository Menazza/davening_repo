import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const SESSION_COOKIE_NAME = 'session_user_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, email, full_name, is_admin, admin_type
      FROM user_profiles
      WHERE email = ${email} AND password = ${password}
      LIMIT 1
    `;

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
    console.error('Password login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

