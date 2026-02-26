import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createShare } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo_full_name, file_path } = body;

    if (!repo_full_name || typeof repo_full_name !== 'string') {
      return NextResponse.json({ error: 'repo_full_name is required' }, { status: 400 });
    }
    if (!file_path || typeof file_path !== 'string') {
      return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
    }

    const shareKey = nanoid(12);
    const share = await createShare(repo_full_name.trim(), file_path.trim(), shareKey);

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const url = `${baseUrl}/s/${share.share_key}`;

    return NextResponse.json({ url, share_key: share.share_key });
  } catch (error) {
    console.error('Create share error:', error);
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
  }
}
