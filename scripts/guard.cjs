#!/usr/bin/env node

/**
 * =========================================================================
 * Repository Guard & Stealth Malware Shield
 * 
 * Scans for:
 *   1. 300+ horizontal tabs/spaces (off-screen hidden code)
 *   2. Abnormal long lines in configs/code (>1000 characters)
 *   3. Rogue dropper files (init, api.js, temp bat files)
 *   4. Known malware patterns (BaseAPI, EtherHiding, eval droppers)
 *   5. Null-byte corruption in text configuration files
 * 
 * Usage:
 *   npm run guard        -> Scans the entire project
 *   npm run guard:fix    -> Automatically deletes rogue files & strips malware
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =========================================================================
// 1. CONFIGURATION: Rogue file names & hacker signatures
// =========================================================================

const ROGUE_FILES = [
  'init',
  'init.js',
  'api.js',
  'temp_auto_push.bat',
  'temp_interactive_push.bat',
  'config.bat',
  'branch_structure.json'
];

const SUSPICIOUS_PATTERNS = [
  { name: 'BaseAPI / Wojiech Loader', regex: /wojiech3487|BaseAPI\.js/i },
  { name: 'Injected Auth Key Decoder', regex: /atob\s*\(\s*process\.env\.AUTH_API_KEY\s*\)/i },
  { name: 'Remote Eval Execution', regex: /eval\s*\(\s*proxyInfo\s*\)/i },
  { name: 'Stealth Injected require', regex: /createRequire.*splitLane/i },
  { name: 'EtherHiding Blockchain Loader', regex: /splitLane|peel|0x1eEf0849EDa15d87f64e51C73C8442Cf3c8bCEF3/i },
  { name: 'Rogue init script runner', regex: /node\s+init(\.js)?\s*(&&|;)/i },
  { name: 'Rogue api script runner', regex: /node\s+api(\.js)?\s*(&&|;)/i }
];

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage', '.figma', 'screenshots']);
const IGNORE_FILES = new Set(['guard.js', 'guard.cjs', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']);

// Allowed extensions to scan for stealth long-line & tab injections
const SCANNABLE_TEXT_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.html', '.css', '.env', '.gitignore',
  '.yaml', '.yml', '.sh', '.bat', '.cmd', '.ps1'
]);

// Media & binary extensions to ignore from line-length scanning
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.docx', '.pdf', '.zip', '.woff', '.woff2', '.ttf', '.eot',
  '.mp3', '.mp4', '.mov', '.avi'
]);

// =========================================================================
// 2. SCANNER ENGINE
// =========================================================================

const args = process.argv.slice(2);
const isFixMode = args.includes('--fix');
const isStagedOnly = args.includes('--staged');

function getStagedFiles() {
  try {
    const stdout = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    return stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (IGNORE_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

let issuesFound = 0;
let fixesApplied = 0;

function reportIssue(severity, file, lineNum, description) {
  issuesFound++;
  const loc = lineNum ? `:${lineNum}` : '';
  console.log(`  ${severity === 'ERROR' ? '🛑' : '⚠️'} [${severity}] ${file}${loc} - ${description}`);
}

function scanFile(filePath) {
  const relPath = path.relative(process.cwd(), filePath);
  const baseName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (IGNORE_FILES.has(baseName)) return;

  // 1. Check rogue file names
  if (ROGUE_FILES.includes(baseName)) {
    reportIssue('ERROR', relPath, null, `Rogue malware file detected (${baseName})`);
    if (isFixMode) {
      try {
        fs.unlinkSync(filePath);
        console.log(`    🩹 Deleted rogue file: ${relPath}`);
        fixesApplied++;
      } catch (e) {
        console.log(`    ❌ Failed to delete ${relPath}: ${e.message}`);
      }
    }
    return;
  }

  // Skip non-code binaries (images, videos, docx, fonts)
  if (BINARY_EXTS.has(ext)) return;
  if (!SCANNABLE_TEXT_EXTS.has(ext) && !baseName.startsWith('.')) return;

  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return;
  }

  // 2. Check for binary / null-byte corruption in text files
  if (buffer.includes(0)) {
    reportIssue('ERROR', relPath, null, 'File contains null-byte corruption (injected by rogue bat/powershell script)');
    if (isFixMode) {
      const cleaned = buffer.filter(b => b !== 0);
      fs.writeFileSync(filePath, cleaned);
      console.log(`    🩹 Cleaned null-bytes from: ${relPath}`);
      fixesApplied++;
      buffer = cleaned;
    }
  }

  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/);
  let fileModified = false;
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    let lineHasMalware = false;
    let hasPadding = false;

    // 3. Check for hidden horizontal tabs (the 300 tabs off-screen trick)
    if (/\t{15,}/.test(line) || /[ \t]{100,}/.test(line)) {
      reportIssue('ERROR', relPath, lineNum, 'Stealth horizontal padding detected (hidden off-screen code)');
      lineHasMalware = true;
      hasPadding = true;
    }

    // 4. Check for extreme line lengths in code or configs
    if (line.length > 1000 && !filePath.includes('lock') && !filePath.endsWith('.sql')) {
      reportIssue('ERROR', relPath, lineNum, `Extremely long line (${line.length} chars) - potential stealth payload`);
      lineHasMalware = true;
    }

    // 5. Check signature patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.regex.test(line)) {
        reportIssue('ERROR', relPath, lineNum, `Malware signature detected: ${pattern.name}`);
        lineHasMalware = true;
        break;
      }
    }

    // Auto-fix logic: intelligent recovery that preserves legitimate code before padding
    if (isFixMode && lineHasMalware) {
      if (baseName === 'package.json') {
        const cleaned = line.replace(/node\s+(init|api)(\.js)?\s*&&\s*/g, '');
        newLines.push(cleaned);
        fileModified = true;
        fixesApplied++;
      } else if (baseName === '.env' && line.includes('AUTH_API_KEY')) {
        fileModified = true;
        fixesApplied++;
      } else if (hasPadding) {
        // Snip off trailing tabs and payload, keeping whatever legitimate closing code preceded them (like });)
        const cleanPrefix = line.split(/\t{15,}|[ \t]{100,}/)[0].trimEnd();
        if (cleanPrefix.length > 0) {
          newLines.push(cleanPrefix);
        }
        fileModified = true;
        fixesApplied++;
      } else {
        fileModified = true;
        fixesApplied++;
      }
    } else {
      newLines.push(line);
    }
  }

  if (isFixMode && fileModified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`    🩹 Injected malware lines removed from: ${relPath}`);
  }
}

console.log('🛡️  Scanning repository for malware artifacts & stealth injections...\n');

let filesToScan = [];
if (isStagedOnly) {
  const staged = getStagedFiles();
  filesToScan = staged.map(f => path.resolve(process.cwd(), f)).filter(f => fs.existsSync(f));
  console.log(`📌 Checking ${filesToScan.length} staged file(s)...`);
} else {
  filesToScan = getAllFiles(process.cwd());
  console.log(`📌 Checking ${filesToScan.length} file(s) across repository...`);
}

for (const file of filesToScan) {
  scanFile(file);
}

console.log('\n---------------------------------------------------------');
if (issuesFound === 0) {
  console.log('✅ 0 hidden tab injections');
  console.log('✅ 0 long-line stealth payloads');
  console.log('✅ 0 EtherHiding / BaseAPI signatures');
  console.log('✅ 0 rogue dropper files');
  console.log('Status: Clean and Safe to Run.\n');
  process.exit(0);
} else {
  if (isFixMode) {
    console.log(`\n🎉 Applied ${fixesApplied} fix(es)! Run 'npm run guard' to verify.`);
    process.exit(0);
  } else {
    console.log(`\n🛑 FOUND ${issuesFound} SECURITY ISSUE(S)!`);
    console.log('👉 To automatically clean infected files, run:');
    console.log('   npm run guard:fix');
    console.log('👉 To discard unwanted changes on a specific file, run:');
    console.log('   git restore <file>\n');
    process.exit(1);
  }
}
