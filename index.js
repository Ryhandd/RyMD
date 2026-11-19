#!/usr/bin/env node
'use strict';

/**
 * RyMD — CLI zero-dependency.
 * Memindai direktori target dan menulis [Target]/[Nama_Folder].md
 * berisi pohon direktori + isi lengkap tiap file teks.
 *
 * Pemakaian: rymd <path-direktori>
 */

const fs = require('fs/promises');
const path = require('path');
const { crawl } = require('./src/crawler');
const { writeMarkdown } = require('./src/generator');

const USAGE = `RyMD — generator dokumentasi Markdown dari direktori

Pemakaian:
  rymd <path-direktori>

Contoh:
  rymd .
  rymd ./proyek-saya
  rymd "C:\\Users\\Ryzu\\proyek"

Output: <path-direktori>/<nama-folder>.md`;

async function main() {
  const arg = process.argv[2];

  if (arg === '-h' || arg === '--help') {
    console.log(USAGE);
    return;
  }
  if (!arg || !arg.trim()) {
    console.error(`Error: path direktori belum diberikan.\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }

  // Resolve ke path absolut; path.resolve menangani "/" dan "\" sesuai OS.
  const target = path.resolve(arg.trim().replace(/^["']|["']$/g, ''));

  let stat;
  try {
    stat = await fs.stat(target);
  } catch {
    console.error(`Error: path tidak ditemukan: ${target}`);
    process.exitCode = 1;
    return;
  }
  if (!stat.isDirectory()) {
    console.error(`Error: bukan direktori: ${target}`);
    process.exitCode = 1;
    return;
  }

  // Nama folder; fallback untuk root drive/filesystem (mis. "C:\" atau "/").
  const rootName =
    path.basename(target) || path.parse(target).root.replace(/[\\/:]/g, '') || 'root';
  const outputPath = path.join(target, `${rootName}.md`);

  const started = Date.now();
  const { tree, files } = await crawl(target, outputPath);
  const { included, skipped } = await writeMarkdown({ rootName, outputPath, tree, files });

  console.log(`Selesai: ${outputPath}`);
  console.log(
    `${included} file disertakan` +
      (skipped ? `, ${skipped} dilewati isinya` : '') +
      ` (${((Date.now() - started) / 1000).toFixed(2)}s)`
  );
}

main().catch((err) => {
  console.error(`Error tak terduga: ${err.stack || err.message}`);
  process.exitCode = 1;
});
