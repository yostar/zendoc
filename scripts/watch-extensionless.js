#!/usr/bin/env node
/**
 * Watches for new files without extensions and renames them to .md.
 * Run in prototype workspace: node scripts/watch-extensionless.js
 * Uses chokidar to avoid EMFILE with fs.watch on large trees.
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');

const EXCLUDED = ['.git', '.vscode', 'node_modules', '.md4h', '.cursor'];
const ROOT = process.cwd();
const WATCH_DIR = path.join(ROOT, 'projects');
const toWatch = fs.existsSync(WATCH_DIR) ? WATCH_DIR : ROOT;

function shouldRename(filePath) {
  const basename = path.basename(filePath);
  if (basename.startsWith('.')) return false;
  const ext = path.extname(filePath);
  if (ext !== '') return false;
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('..')) return false;
  return !EXCLUDED.some((d) => rel.includes(path.sep + d + path.sep) || rel.startsWith(d + path.sep));
}

const watcher = chokidar.watch(toWatch, {
  ignoreInitial: true,
  ignored: (p) => EXCLUDED.some((d) => p.includes(path.sep + d + path.sep) || p.endsWith(path.sep + d)),
});

watcher.on('add', (filePath) => {
  setTimeout(() => {
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return;
      if (!shouldRename(filePath)) return;

      const newPath = filePath + '.md';
      if (fs.existsSync(newPath)) return;

      fs.renameSync(filePath, newPath);
      console.log(`[watch] Renamed to .md: ${path.relative(ROOT, filePath)}`);
      // Open the new file in Cursor (can't close old tab from Node)
      exec(`cursor "${newPath}"`, () => {});
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`[watch] ${filePath}:`, e.message);
    }
  }, 100);
});

watcher.on('error', (e) => console.error('[watch]', e));

console.log(`[watch] Watching for extensionless files in ${toWatch}`);
console.log('[watch] Press Ctrl+C to stop');
