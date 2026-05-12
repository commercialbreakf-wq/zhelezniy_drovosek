const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "./catalog.docx"})
    .then(function(result) {
        var text = result.value; // The raw text
        var messages = result.messages; // Any messages, such as warnings during conversion
        fs.writeFileSync("catalog_dump.txt", text);
        console.log("Extracted text saved to catalog_dump.txt");
    })
    .catch(function(err) {
        console.error(err);
    });
