import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env', 'backend/index.mjs'], {
    stdio: 'inherit',
    env: process.env,
  }),
  spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--config',
      'frontend/vite.config.ts',
      '--host',
      '127.0.0.1',
      '--strictPort',
    ],
    { stdio: 'inherit', env: process.env },
  ),
];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 100).unref();
}
for (const child of children) child.on('exit', (code) => stop(code ?? 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
