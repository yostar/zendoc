const GITHUB_API = 'https://api.github.com';

export async function fetchFileContent(repoFullName: string, filePath: string, ref = 'main'): Promise<string> {
  const token = process.env.GITHUB_ZENDOC_BOT_TOKEN;
  if (!token) {
    throw new Error('GITHUB_ZENDOC_BOT_TOKEN is not configured');
  }

  const url = `${GITHUB_API}/repos/${repoFullName}/contents/${encodeURIComponent(filePath)}?ref=${ref}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('File not found');
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.text();
}
