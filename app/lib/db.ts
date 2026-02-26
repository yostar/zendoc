import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export interface Share {
  id: number;
  share_key: string;
  repo_full_name: string;
  file_path: string;
  created_at: Date;
}

export async function createShare(repoFullName: string, filePath: string, shareKey: string): Promise<Share> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO shares (share_key, repo_full_name, file_path)
    VALUES (${shareKey}, ${repoFullName}, ${filePath})
    RETURNING id, share_key, repo_full_name, file_path, created_at
  `;
  return rows[0] as Share;
}

export async function getShareByKey(shareKey: string): Promise<Share | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, share_key, repo_full_name, file_path, created_at
    FROM shares
    WHERE share_key = ${shareKey}
  `;
  return (rows[0] as Share) ?? null;
}
