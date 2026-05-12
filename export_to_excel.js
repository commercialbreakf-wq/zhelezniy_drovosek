const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './database.sqlite';
const outputXmlPath = './каталог_управление.xml';

function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM products ORDER BY parent_category, category, name", (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
    xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
    xml += ' <Styles>\n';
    xml += '  <Style ss:ID="header">\n';
    xml += '   <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n';
    xml += '   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>\n';
    xml += '  </Style>\n';
    xml += ' </Styles>\n';
    xml += ' <Worksheet ss:Name="Каталог">\n';
    xml += '  <Table>\n';
    xml += '   <Column ss:Width="150"/>\n';
    xml += '   <Column ss:Width="150"/>\n';
    xml += '   <Column ss:Width="250"/>\n';
    xml += '   <Column ss:Width="80"/>\n';
    xml += '   <Column ss:Width="80"/>\n';
    xml += '   <Column ss:Width="80"/>\n';
    
    // Header Row
    xml += '   <Row ss:StyleID="header">\n';
    xml += '    <Cell><Data ss:Type="String">Группа</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Категория</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Наименование</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Цена (тонна)</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Цена (ед.)</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Вес</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Ед. измерения</Data></Cell>\n';
    xml += '   </Row>\n';

    rows.forEach(p => {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.parent_category)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.category)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${p.price_ton || 0}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="Number">${p.price_unit || 0}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.weight)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.unit_label)}</Data></Cell>\n`;
        xml += '   </Row>\n';
    });

    xml += '  </Table>\n';
    xml += ' </Worksheet>\n';
    xml += '</Workbook>';

    fs.writeFileSync(outputXmlPath, xml);
    console.log(`Exported ${rows.length} products to ${outputXmlPath}`);
    db.close();
});
