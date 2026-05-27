import fs from 'fs';
import path from 'path';

function findDB(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    if (file === "node_modules") return;
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findDB(fullPath));
    } else {
      if (file.endsWith('.db')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log(findDB('/app/applet'));
