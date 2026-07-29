#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

console.log('⚡ TailorFit.ai — Real-Time AI Resume ATS Optimizer v1.1.0');
console.log('🔗 Launching local server at http://localhost:3002 ...');

const serverPath = path.join(__dirname, '../server.js');
const serverProcess = spawn('node', [serverPath], { stdio: 'inherit' });

serverProcess.on('close', (code) => {
  process.exit(code);
});
