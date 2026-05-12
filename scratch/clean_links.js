const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.startsWith('.')) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (file.endsWith('.html') || file.endsWith('.js')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk('.');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Regex to find links ending in .html
    // Href links
    const hrefRegex = /href="\/([^"]+)\.html"/g;
    const hrefSingleRegex = /href='\/([^']+)\.html'/g;
    
    // JS window.location links
    const jsRegex = /window\.location\.href\s*=\s*['"]\/([^'"]+)\.html(['"])/g;
    
    let newContent = content.replace(hrefRegex, 'href="/$1"')
                            .replace(hrefSingleRegex, "href='/$1'")
                            .replace(jsRegex, (match, p1, p2) => `window.location.href = "/${p1}${p2}`);

    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log(`Cleaned links in: ${file}`);
    }
});
