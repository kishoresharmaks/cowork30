const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 [Production Boot] Starting NestJS Backend...');
const backend = spawn('npm', ['run', 'start:prod', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true,
});

let frontendStarted = false;

function checkBackendReady() {
  if (frontendStarted) return;

  const req = http.get('http://127.0.0.1:4000/api/v1/health', (res) => {
    if (!frontendStarted) {
      frontendStarted = true;
      console.log('✅ [Production Boot] NestJS Backend is ready on port 4000! Launching Next.js Frontend...');
      spawnFrontend();
    }
  });

  req.on('error', () => {
    // Backend not ready yet, retry in 500ms
    setTimeout(checkBackendReady, 500);
  });

  req.end();
}

function spawnFrontend() {
  const frontend = spawn('npm', ['run', 'start', '--prefix', 'frontend'], {
    stdio: 'inherit',
    shell: true,
  });

  process.on('SIGTERM', () => {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });
}

// Start polling backend readiness after 1 second
setTimeout(checkBackendReady, 1000);

// Fallback: If health check doesn't pass within 12 seconds, start frontend anyway
setTimeout(() => {
  if (!frontendStarted) {
    frontendStarted = true;
    console.log('⚠️ [Production Boot] Timeout waiting for backend health endpoint, starting Next.js Frontend...');
    spawnFrontend();
  }
}, 12000);
