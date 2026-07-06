import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const binExt = process.platform === 'win32' ? '.cmd' : '';

const processes = [];
let shuttingDown = false;

function bin(packageDir, name) {
  return path.join(repoRoot, packageDir, 'node_modules', '.bin', `${name}${binExt}`);
}

function start(name, packageDir, command, args) {
  const child = spawn(command, args, {
    cwd: path.join(repoRoot, packageDir),
    env: {
      ...process.env,
      JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long',
    },
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[e2e-web-server] ${name} exited with ${reason}`);
    shutdown(code ?? 1);
  });

  processes.push(child);
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(1);
});

start('backend', 'apps/backend', process.execPath, ['--import', 'tsx', 'src/index.ts']);
start('frontend', 'apps/frontend', bin('apps/frontend', 'vite'), ['--host', '127.0.0.1']);
