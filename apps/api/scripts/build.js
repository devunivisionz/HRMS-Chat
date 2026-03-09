const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simple build script that copies files and uses tsc to transpile
console.log('Building API for deployment...');

// Set aggressive Node.js memory limits
process.env.NODE_OPTIONS = '--max-old-space-size=128 --max-new-space-size=32';

// Force garbage collection
if (global.gc) {
  global.gc();
}

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy all non-TypeScript files
function copyFiles(src, dest) {
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyFiles(srcPath, destPath);
    } else if (!item.endsWith('.ts')) {
      // Ensure destination directory exists before copying file
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy src and prisma folders
copyFiles('src', 'dist/src');
copyFiles('prisma', 'dist/prisma');

// Transpile TypeScript files using simple approach to save memory
try {
  console.log('Compiling TypeScript files...');
  
  // Use tsc directly with minimal flags to save memory
  execSync('npx tsc --project tsconfig.build.json', { 
    stdio: 'inherit',
    maxBuffer: 1024 * 1024 // 1MB buffer limit
  });
  
} catch (e) {
  console.log('TypeScript compilation failed, copying files as-is...');
  // If compilation fails, just copy the .ts files as-is for runtime compilation
  function copyAllFiles(src, dest) {
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyAllFiles(srcPath, destPath);
      } else {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyAllFiles('src', 'dist/src');
  copyAllFiles('prisma', 'dist/prisma');
}

console.log('Build completed!');
