const mammoth = require('mammoth');
const fs = require('fs');

async function inspectDocx() {
    try {
        const result = await mammoth.convertToHtml({path: "./catalog.docx"});
        const html = result.value;
        fs.writeFileSync('./
            param($m)
            if ($m.Value -match '\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|map)', html);
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
) { $m.Value }
            else { $m.Value -replace '\.html', html);
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
, '' }
        ', html);
        console.log("Converted docx to html for inspection in ./
            param($m)
            if ($m.Value -match '\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|map)");
        
        // Also dump plain text for quick look
        const textResult = await mammoth.extractRawText({path: "./catalog.docx"});
        console.log("Raw text sample (first 1000 chars):");
        console.log(textResult.value.substring(0, 1000));
    } catch (err) {
        console.error(err);
    }
}

inspectDocx();
) { $m.Value }
            else { $m.Value -replace '\.html");
        
        // Also dump plain text for quick look
        const textResult = await mammoth.extractRawText({path: "./catalog.docx"});
        console.log("Raw text sample (first 1000 chars):");
        console.log(textResult.value.substring(0, 1000));
    } catch (err) {
        console.error(err);
    }
}

inspectDocx();");
        
        // Also dump plain text for quick look
        const textResult = await mammoth.extractRawText({path: "./catalog.docx"});
        console.log("Raw text sample (first 1000 chars):");
        console.log(textResult.value.substring(0, 1000));
    } catch (err) {
        console.error(err);
    }
}

inspectDocx();

