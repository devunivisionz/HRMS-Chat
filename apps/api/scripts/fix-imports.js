const fs = require('fs');
const path = require('path');

// Fix @/ imports to relative paths
function fixImports(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      fixImports(itemPath);
    } else if (item.endsWith('.ts')) {
      let content = fs.readFileSync(itemPath, 'utf8');
      
      // Replace @/ imports with relative paths
      content = content.replace(/from '@\/([^']+)'/g, (match, importPath) => {
        const relativePath = path.relative(dir, path.join('src', importPath));
        const normalizedPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
        return `from '${normalizedPath.replace(/\\/g, '/')}'`;
      });
      
      fs.writeFileSync(itemPath, content);
    }
  }
}

console.log('Fixing imports...');
fixImports('src');
fixImports('prisma');
console.log('Imports fixed!');
