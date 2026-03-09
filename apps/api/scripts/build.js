const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ultra-minimal build script - NO TypeScript compilation to save memory
console.log('Building API for deployment (minimal)...');

// Set aggressive Node.js memory limits
process.env.NODE_OPTIONS = '--max-old-space-size=64 --max-new-space-size=16';

// Force garbage collection
if (global.gc) {
  global.gc();
}

// Clean previous build
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist directory
fs.mkdirSync('dist', { recursive: true });

// Copy package.json for dependencies
fs.copyFileSync('package.json', 'dist/package.json');

// Copy all files (including TypeScript) - let tsx handle compilation at runtime
function copyAllFiles(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyAllFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy essential directories
console.log('Copying source files...');
copyAllFiles('src', 'dist/src');
copyAllFiles('prisma', 'dist/prisma');

// Create a simple entry point that uses tsx
const entryPoint = `
require('dotenv').config();
require('tsx/register')(require.resolve('./src/index.ts'));
`;

fs.writeFileSync('dist/index.js', entryPoint);

console.log('Minimal build completed!');
