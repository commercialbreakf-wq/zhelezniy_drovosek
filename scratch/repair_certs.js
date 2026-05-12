const fs = require('fs');

const file = 'certificates/index.html';
let content = fs.readFileSync(file, 'utf8');

// Find the first occurrence of </html> and truncate everything after it
const closingTag = '</html>';
const index = content.indexOf(closingTag);
if (index !== -1) {
    console.log('Truncating file after first </html>');
    content = content.substring(0, index + closingTag.length);
}

// Clean the links in this truncated content
content = content.replace(/href="\/([^"]+)\.html"/g, 'href="/$1"')
                 .replace(/href='\/([^']+)\.html'/g, "href='/$1'")
                 .replace(/window\.location\.href\s*=\s*['"]\/([^'"]+)\.html(['"])/g, (match, p1, p2) => `window.location.href = "/${p1}${p2}`);

// Also fix any potential corruption that might have happened BEFORE the first </html>
const corruption1 = /else\s*{\s*\$m\.Value\s*-replace\s*'\\\.html\?/g;
const corruption2 = /param\(\$m\)\s*if\s*\(\$m\.Value\s*-match\s*'\\\.\(css\|js\|png\|jpg\|jpeg\|gif\|svg\|webp\|ico\|json\|map\)\?\s*/g;

content = content.replace(corruption1, "window.location.href='/certificates/certificate_view?")
                 .replace(corruption2, "window.location.href='/certificates/certificate_view?");

fs.writeFileSync(file, content);
console.log('Successfully repaired and cleaned certificates/index.html');
