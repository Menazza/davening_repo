import { NextRequest, NextResponse } from 'next/server';
import { getAllPrograms } from '@/lib/programs';

export async function GET(request: NextRequest) {
  try {
    const programs = await getAllPrograms();
    return NextResponse.json({ programs });
  } catch (error: any) {
    console.error('Get programs error:', error);
    return NextResponse.json(
      { error: 'Failed to get programs' },
      { status: 500 }
    );
  }
}
