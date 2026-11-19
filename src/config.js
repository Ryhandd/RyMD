'use strict';

/**
 * Konfigurasi statis RyMD: daftar ignore dan pemetaan bahasa.
 * Semua pencocokan dilakukan dalam huruf kecil (case-insensitive).
 */

/** Folder yang tidak pernah dimasuki. */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

/** Nama file persis yang dilewati (lockfile non-".lock" & sampah OS). */
const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  '.ds_store',
  'thumbs.db',
]);

/** Ekstensi file biner / non-teks yang dilewati. */
const BINARY_EXTS = new Set([
  // gambar
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.avif', '.tiff', '.psd',
  // arsip
  '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz',
  // executable & library
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.obj', '.class', '.jar', '.apk', '.msi',
  // lockfile
  '.lock',
  // media
  '.mp3', '.wav', '.ogg', '.flac', '.mp4', '.mkv', '.avi', '.mov', '.webm',
  // dokumen & font biner
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  // lain-lain
  '.sqlite', '.db', '.pyc', '.map',
]);

/** Label bahasa untuk code fence berdasarkan ekstensi. */
const LANG_BY_EXT = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.jsx': 'jsx',
  '.ts': 'typescript', '.tsx': 'tsx', '.json': 'json', '.jsonc': 'jsonc',
  '.md': 'markdown', '.mdx': 'markdown', '.html': 'html', '.htm': 'html',
  '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
  '.vue': 'vue', '.svelte': 'svelte', '.astro': 'astro',
  '.py': 'python', '.java': 'java', '.kt': 'kotlin', '.kts': 'kotlin',
  '.rs': 'rust', '.go': 'go', '.c': 'c', '.h': 'c', '.cpp': 'cpp', '.cc': 'cpp',
  '.hpp': 'cpp', '.cs': 'csharp', '.php': 'php', '.rb': 'ruby', '.swift': 'swift',
  '.dart': 'dart', '.lua': 'lua', '.r': 'r',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash', '.ps1': 'powershell',
  '.bat': 'batch', '.cmd': 'batch',
  '.yml': 'yaml', '.yaml': 'yaml', '.toml': 'toml', '.ini': 'ini', '.cfg': 'ini',
  '.xml': 'xml', '.svg': 'xml', '.gradle': 'groovy', '.sql': 'sql',
  '.graphql': 'graphql', '.gql': 'graphql', '.proto': 'protobuf',
  '.glsl': 'glsl', '.vert': 'glsl', '.frag': 'glsl', '.txt': 'text',
};

/** Label bahasa untuk file tanpa ekstensi / dotfile. */
const LANG_BY_NAME = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmakelists: 'cmake',
  '.gitignore': 'gitignore',
  '.gitattributes': 'gitattributes',
  '.npmrc': 'ini',
  '.editorconfig': 'ini',
  '.env.example': 'ini',
  '.env.sample': 'ini',
};

/** Batas ukuran file yang dibaca isinya (byte). */
const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

/** Jumlah file yang dibaca paralel per batch (cegah EMFILE & lonjakan memori). */
const READ_BATCH_SIZE = 64;

/**
 * File rahasia (.env, .env.local, dst.) dilewati agar kredensial tidak bocor
 * ke dokumen. Template (.env.example / .env.sample) tetap disertakan.
 */
function isSecretEnvFile(lowerName) {
  if (lowerName === '.env.example' || lowerName === '.env.sample') return false;
  return lowerName === '.env' || lowerName.startsWith('.env.');
}

module.exports = {
  IGNORED_DIRS,
  IGNORED_FILES,
  BINARY_EXTS,
  LANG_BY_EXT,
  LANG_BY_NAME,
  MAX_FILE_BYTES,
  READ_BATCH_SIZE,
  isSecretEnvFile,
};
