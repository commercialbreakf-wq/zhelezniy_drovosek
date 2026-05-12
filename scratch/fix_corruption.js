const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.html') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('.');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the mess created by the broken PS script
    // The broken script injected parts of the PS script block
    const brokenPattern = /onclick="\s*param\(\$m\)\s*if\s*\(\$m\.Value\s*-match\s*'\\\.\(css\|js\|png\|jpg\|jpeg\|gif\|svg\|webp\|ico\|json\|map\)\?\s*/g;
    
    if (content.match(brokenPattern)) {
        console.log('Fixing corrupted file:', file);
        // We need to restore what was there. 
        // Based on the example, it was something like window.location.href='/certificates/certificate_view.html?category=...
        // But since I don't have the original, I'll have to be careful.
        // Wait, I can see what was there before. 
        // It was: window.location.href='/certificates/certificate_view.html?category=...
        
        content = content.replace(brokenPattern, "onclick=\"window.location.href='/certificates/certificate_view?");
        fs.writeFileSync(file, content);
    }
});

console.log('Done fixing corruption.');
