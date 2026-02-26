import { NextRequest, NextResponse } from 'next/server';
import { getShareByKey } from '@/lib/db';
import { fetchFileContent } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key) {
      return NextResponse.json({ error: 'Share key required' }, { status: 400 });
    }

    const share = await getShareByKey(key);
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const content = await fetchFileContent(share.repo_full_name, share.file_path);
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'File not found') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Fetch content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
