const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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
    
    // 1. Fix the corruption patterns
    // Example: window.location.href='/certificates/certificate_view?category=...
    const corruption1 = /else\s*{\s*\$m\.Value\s*-replace\s*'\\\.html\?/g;
    const corruption2 = /param\(\$m\)\s*if\s*\(\$m\.Value\s*-match\s*'\\\.\(css\|js\|png\|jpg\|jpeg\|gif\|svg\|webp\|ico\|json\|map\)\?\s*/g;
    
    let newContent = content;
    
    if (newContent.match(corruption1)) {
        console.log('Fixing corruption type 1 in:', file);
        newContent = newContent.replace(corruption1, "window.location.href='/certificates/certificate_view?");
    }
    
    if (newContent.match(corruption2)) {
        console.log('Fixing corruption type 2 in:', file);
        newContent = newContent.replace(corruption2, "window.location.href='/certificates/certificate_view?");
    }
    
    // Remove stray } and other artifacts if they exist
    // This is risky but based on the diffs it seems necessary
    newContent = newContent.replace(/\s*,\s*''\s*}\s*\?/g, '?');
    newContent = newContent.replace(/\s*,\s*''\s*}\s*"/g, '"');
    newContent = newContent.replace(/}\s*,\s*''\s*/g, '');

    // 2. Clean .html extensions
    newContent = newContent.replace(/href="\/([^"]+)\.html"/g, 'href="/$1"')
                           .replace(/href='\/([^']+)\.html'/g, "href='/$1'")
                           .replace(/window\.location\.href\s*=\s*['"]\/([^'"]+)\.html(['"])/g, (match, p1, p2) => `window.location.href = "/${p1}${p2}`);

    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log(`Updated: ${file}`);
    }
});
