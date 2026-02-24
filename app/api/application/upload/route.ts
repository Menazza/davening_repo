import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB (Vercel serverless limit)
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser();
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Allow either default or custom blob env names (e.g. BLOB2_READ_WRITE_TOKEN)
  const hasBlobToken =
    !!process.env.BLOB_READ_WRITE_TOKEN ||
    !!process.env.BLOB2_READ_WRITE_TOKEN ||
    Object.keys(process.env).some((key) =>
      key.endsWith('_READ_WRITE_TOKEN')
    );

  if (!hasBlobToken) {
    return NextResponse.json(
      { error: 'File upload is not configured. Please connect a Vercel Blob store to this project.' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const kind = (formData.get('kind') as string) || 'document'; // 'cv' | 'portrait'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${Math.round(MAX_SIZE_BYTES / 1024 / 1024)} MB.` },
      { status: 400 }
    );
  }

  const type = file.type || '';
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP.' },
      { status: 400 }
    );
  }

  try {
    const ext = type === 'application/pdf' ? 'pdf' : type.replace('image/', '');
    const filename = `davening-application/${kind}-${Date.now()}.${ext}`;

    // Use the store's configured (private) access mode
    const blob = await put(filename, file, {
      // access: 'private' is implied when using a private store token
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
