'use strict';

const fs = require('fs/promises');
const path = require('path');
const {
  IGNORED_DIRS,
  IGNORED_FILES,
  BINARY_EXTS,
  isSecretEnvFile,
} = require('./config');

/**
 * File crawler: hanya bertugas memindai direktori dan membangun pohon node.
 * Tidak membaca isi file (itu tugas generator).
 *
 * Node: { name, type: 'dir'|'file', children?, fullPath?, relPath? }
 */

const IS_WIN = process.platform === 'win32';

/** Kunci perbandingan path: case-insensitive di Windows. */
const pathKey = (p) => (IS_WIN ? p.toLowerCase() : p);

/** Normalisasi separator ke "/" agar output konsisten (Windows maupun Unix). */
const toPosix = (p) => p.split(path.sep).join('/');

function shouldSkipFile(name) {
  const lower = name.toLowerCase();
  if (IGNORED_FILES.has(lower)) return true;
  if (isSecretEnvFile(lower)) return true;
  return BINARY_EXTS.has(path.extname(lower));
}

/**
 * Pindai rootDir secara rekursif.
 * @param {string} rootDir    Path absolut direktori target.
 * @param {string} outputPath Path absolut file output (dikecualikan agar tidak rekursif).
 * @returns {Promise<{tree: object[], files: object[]}>}
 */
async function crawl(rootDir, outputPath) {
  const outputKey = pathKey(path.resolve(outputPath));

  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      console.warn(`[rymd] Lewati folder tak terbaca: ${dir} (${err.code || err.message})`);
      return [];
    }

    // Folder dulu, lalu file; masing-masing urut alfabet.
    entries.sort((a, b) => {
      const ad = a.isDirectory() ? 0 : 1;
      const bd = b.isDirectory() ? 0 : 1;
      return ad - bd || a.name.localeCompare(b.name);
    });

    const nodes = await Promise.all(
      entries.map(async (entry) => {
        if (entry.isSymbolicLink()) return null; // hindari loop symlink
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name.toLowerCase())) return null;
          return { name: entry.name, type: 'dir', children: await walk(fullPath) };
        }

        if (entry.isFile()) {
          if (pathKey(fullPath) === outputKey) return null; // cegah memindai output sendiri
          if (shouldSkipFile(entry.name)) return null;
          return {
            name: entry.name,
            type: 'file',
            fullPath,
            relPath: toPosix(path.relative(rootDir, fullPath)),
          };
        }
        return null;
      })
    );

    return nodes.filter(Boolean);
  }

  const tree = await walk(rootDir);
  return { tree, files: flatten(tree) };
}

/** Ratakan pohon menjadi daftar file sesuai urutan tampil. */
function flatten(nodes, acc = []) {
  for (const node of nodes) {
    if (node.type === 'dir') flatten(node.children, acc);
    else acc.push(node);
  }
  return acc;
}

module.exports = { crawl };
