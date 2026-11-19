'use strict';

const fs = require('fs/promises');
const path = require('path');
const {
  LANG_BY_EXT,
  LANG_BY_NAME,
  MAX_FILE_BYTES,
  READ_BATCH_SIZE,
} = require('./config');

/**
 * Markdown generator: menerima pohon + daftar file dari crawler,
 * lalu menulis satu file .md (tree di awal, isi file sesudahnya).
 */

/** Gambar pohon ASCII (├── └── │). */
function renderTree(rootName, nodes) {
  const lines = [`${rootName}/`];
  (function draw(children, prefix) {
    children.forEach((node, i) => {
      const last = i === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${node.name}${node.type === 'dir' ? '/' : ''}`);
      if (node.type === 'dir') draw(node.children, prefix + (last ? '    ' : '│   '));
    });
  })(nodes, '');
  return lines.join('\n');
}

/** Label bahasa dari nama/ekstensi file. */
function languageOf(fileName) {
  const lower = fileName.toLowerCase();
  if (LANG_BY_NAME[lower]) return LANG_BY_NAME[lower];
  const ext = path.extname(lower);
  if (ext && LANG_BY_EXT[ext]) return LANG_BY_EXT[ext];
  return ext ? ext.slice(1) : 'text';
}

/** Fence backtick yang lebih panjang dari run backtick terpanjang di konten. */
function fenceFor(content) {
  const runs = content.match(/`{3,}/g);
  const longest = runs ? Math.max(...runs.map((r) => r.length)) : 2;
  return '`'.repeat(Math.max(3, longest + 1));
}

/** Baca satu file teks. Mengembalikan { content } atau { skipped: alasan }. */
async function readTextFile(node) {
  try {
    const stat = await fs.stat(node.fullPath);
    if (stat.size > MAX_FILE_BYTES) {
      return { skipped: `file terlalu besar (${(stat.size / 1024 / 1024).toFixed(1)} MB)` };
    }
    const buf = await fs.readFile(node.fullPath);
    if (buf.subarray(0, 8000).includes(0)) return { skipped: 'terdeteksi biner' };
    let content = buf.toString('utf8');
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // buang BOM
    return { content: content.replace(/\r\n?/g, '\n') };
  } catch (err) {
    return { skipped: `gagal dibaca (${err.code || err.message})` };
  }
}

function renderFileSection(node, result) {
  const head = `### \`${node.relPath}\`\n\n`;
  if (result.skipped) return `${head}*(isi dilewati: ${result.skipped})*\n\n`;
  if (result.content.trim() === '') return `${head}*(file kosong)*\n\n`;
  const body = result.content.endsWith('\n') ? result.content : `${result.content}\n`;
  const fence = fenceFor(body);
  return `${head}${fence}${languageOf(node.name)}\n${body}${fence}\n\n`;
}

/**
 * Tulis dokumen Markdown ke outputPath.
 * File dibaca paralel per batch, ditulis berurutan (hasil deterministik, memori terbatas).
 * @returns {Promise<{included: number, skipped: number}>}
 */
async function writeMarkdown({ rootName, outputPath, tree, files }) {
  const handle = await fs.open(outputPath, 'w');
  let included = 0;
  let skipped = 0;

  try {
    await handle.write(
      `# ${rootName}\n\n` +
        `> Dibuat oleh RyMD · ${new Date().toISOString()} · ${files.length} file\n\n` +
        `## Struktur Direktori\n\n\`\`\`text\n${renderTree(rootName, tree)}\n\`\`\`\n\n` +
        `## Isi File\n\n`
    );

    for (let i = 0; i < files.length; i += READ_BATCH_SIZE) {
      const batch = files.slice(i, i + READ_BATCH_SIZE);
      const results = await Promise.all(batch.map(readTextFile));
      let chunk = '';
      batch.forEach((node, j) => {
        if (results[j].skipped) skipped++;
        else included++;
        chunk += renderFileSection(node, results[j]);
      });
      await handle.write(chunk);
    }
  } finally {
    await handle.close();
  }

  return { included, skipped };
}

module.exports = { writeMarkdown, renderTree, languageOf };
