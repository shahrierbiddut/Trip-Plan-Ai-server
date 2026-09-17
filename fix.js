import fs from 'fs';
import path from 'path';
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
      return `from '${p1}.js'`;
    }
    return match;
  });
  content = content.replace(/import\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
      return `import '${p1}.js'`;
    }
    return match;
  });
  fs.writeFileSync(file, content);
});
console.log('Added .js extensions to all relative imports.');
