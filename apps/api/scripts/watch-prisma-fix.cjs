/**
 * В watch-режиме nest не вызывает npm postbuild — патчим client.js после каждой пересборки.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const fixScript = path.join(__dirname, 'fix-prisma-cjs.cjs');
const clientJs = path.join(root, 'dist', 'generated', 'prisma', 'client.js');
const prismaDir = path.join(root, 'dist', 'generated', 'prisma');

function runFix() {
  try {
    execFileSync(process.execPath, [fixScript], { cwd: root, stdio: 'inherit' });
  } catch {
    /* dist ещё не готов */
  }
}

let timer;
function scheduleFix() {
  clearTimeout(timer);
  timer = setTimeout(runFix, 120);
}

function startWatch() {
  if (!fs.existsSync(prismaDir)) {
    setTimeout(startWatch, 400);
    return;
  }
  runFix();
  try {
    fs.watch(prismaDir, { recursive: true }, scheduleFix);
  } catch {
    fs.watch(prismaDir, scheduleFix);
  }
}

startWatch();
