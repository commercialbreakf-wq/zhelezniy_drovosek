const fs = require('fs');
const filePath = '_5/code.html';
let content = fs.readFileSync(filePath, 'utf8');
content = content.trim();
// Remove duplicate </body></html> at the end if they exist
const duplicate = '</body>\n</html>\n</body>\n</html>';
const correct = '</body>\n</html>';
if (content.endsWith(duplicate)) {
    content = content.slice(0, -duplicate.length) + correct;
    fs.writeFileSync(filePath, content);
    console.log('Fixed duplicate tags.');
} else {
    // try with different line endings
    const duplicate2 = '</body></html></body></html>';
    if (content.replace(/\s/g, '').endsWith(duplicate2)) {
         // more aggressive fix
         content = content.replace(/<\/body>\s*<\/html>\s*<\/body>\s*<\/html>$/, '</body>\n</html>');
         fs.writeFileSync(filePath, content);
         console.log('Fixed duplicate tags (regex).');
    } else {
        console.log('No duplicate tags found or format mismatch.');
    }
}



