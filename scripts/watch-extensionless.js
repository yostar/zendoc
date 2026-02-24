#!/usr/bin/env node
/**
 * Watches for new files without extensions and renames them to .md.
 * Run in prototype workspace: node scripts/watch-extensionless.js
 * Same logic as the Zendoc extension's file watcher.
 */
const fs = require('fs');
const path = require('path');

const EXCLUDED = ['.git', '.vscode', 'node_modules', '.md4h', '.cursor'];
const ROOT = process.cwd();

function shouldRename(filePath) {
  const basename = path.basename(filePath);
  if (basename.startsWith('.')) return false;
  const ext = path.extname(filePath);
  if (ext !== '') return false;
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('..')) return false;
  return !EXCLUDED.some((d) => rel.includes(path.sep + d + path.sep) || rel.startsWith(d + path.sep));
}

fs.watch(ROOT, { recursive: true }, (event, filename) => {
  if (!filename) return;
  const full = path.join(ROOT, filename);
  if (event !== 'rename') return; // 'rename' = create or delete

  setTimeout(() => {
    try {
      const stat = fs.statSync(full);
      if (!stat.isFile()) return;
      if (!shouldRename(full)) return;

      const newPath = full + '.md';
      if (fs.existsSync(newPath)) return;

      fs.renameSync(full, newPath);
      console.log(`[watch] Renamed to .md: ${filename}`);
    } catch (_) {
      // File may have been deleted or doesn't exist yet
    }
  }, 50);
});

console.log(`[watch] Watching for extensionless files in ${ROOT}`);
console.log('[watch] Press Ctrl+C to stop');
