const mammoth = require('mammoth');
const fs = require('fs');

async function inspectDocx() {
    try {
        const result = await mammoth.convertToHtml({path: "./catalog.docx"});
        const html = result.value;
        fs.writeFileSync('./scratch/catalog_structure.html', html);
        console.log("Converted docx to html for inspection in ./scratch/catalog_structure.html");
        
        // Also dump plain text for quick look
        const textResult = await mammoth.extractRawText({path: "./catalog.docx"});
        console.log("Raw text sample (first 1000 chars):");
        console.log(textResult.value.substring(0, 1000));
    } catch (err) {
        console.error(err);
    }
}

inspectDocx();
