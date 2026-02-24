import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedHendlerAdmin } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

/**
 * Admin-only proxy to download application files (CV, portrait) with a proper filename.
 * GET /api/admin/download-file?url=...&filename=...
 */
export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedHendlerAdmin();

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download';

    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Only allow our Vercel Blob storage URLs
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
      }
      const host = parsed.host.toLowerCase();
      const isBlobStorage =
        host.includes('vercel-storage.com') || host.includes('blob.vercel');
      if (!isBlobStorage) {
        return NextResponse.json(
          { error: 'URL not allowed' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file' },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}"`,
      },
    });
  } catch (error: unknown) {
    if (error && typeof (error as any).message === 'string' && (error as any).message?.includes('auth')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}
