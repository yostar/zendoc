# Zendoc Share Service - Deployment

## Local development

1. Copy `.env.example` to `.env.local`
2. Add your Neon connection string and ZendocBot token
3. Run the schema in Neon (see below)
4. `npm run dev`

## 1. Neon Database

1. Create a project at [neon.tech](https://neon.tech) (or use existing).
2. In the SQL Editor, run the schema from `schema.sql`:

```sql
CREATE TABLE shares (
  id SERIAL PRIMARY KEY,
  share_key TEXT UNIQUE NOT NULL,
  repo_full_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shares_key ON shares(share_key);
```

3. Copy the connection string from the Neon dashboard.

## 2. Vercel

### Option A: Connect GitHub repo

1. Go to [vercel.com](https://vercel.com) → Add New Project.
2. Import the zendoc repo.
3. Set **Root Directory** to `app`.
4. Add Environment Variables:
   - `DATABASE_URL` – Neon connection string
   - `GITHUB_ZENDOC_BOT_TOKEN` – ZendocBot GitHub PAT (fine-grained, Contents read)
   - `APP_URL` – Canonical share URL (e.g. `https://zendoc-mu.vercel.app`) so share links use this instead of deployment-specific URLs
5. Deploy.

### Option B: Vercel CLI

1. `cd app`
2. `npx vercel login` (if not logged in)
3. `npx vercel env add DATABASE_URL` – paste Neon connection string
4. `npx vercel env add GITHUB_ZENDOC_BOT_TOKEN` – paste ZendocBot token
5. `npx vercel env add APP_URL` – set to your canonical URL (e.g. `https://zendoc-mu.vercel.app`)
6. `npx vercel deploy --prod`

## 3. Extension configuration

After deployment, set the share API URL in Cursor/VS Code:

- Open Settings → search "zendoc"
- Set **Zendoc: Share Api Url** to your Vercel URL (e.g. `https://zendoc-xxx.vercel.app`)

Or add to `.vscode/settings.json`:

```json
{
  "zendoc.shareApiUrl": "https://your-vercel-url.vercel.app"
}
```
