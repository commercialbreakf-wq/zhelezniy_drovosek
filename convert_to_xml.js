const fs = require('fs');
const path = require('path');

const priceListPath = './Прайс-лист.md';
const outputXmlPath = './каталог.xml';

const CATEGORY_MAP = {
    'Арматура': 'Арматура',
    'Проволока': 'Проволока',
    'Катанка': 'Катанка',
    'Квадрат': 'Квадрат',
    'Круг': 'Круг',
    'Полоса': 'Полоса',
    'Труба ВГП': 'Труба ВГП',
    'Труба профильная': 'Труба профильная',
    'Лист г/к': 'Лист горячекатаный',
    'Лист г/к риф.': 'Лист горячекатаный',
    'Лист ПВ': 'Лист горячекатаный',
    'Лист х/к': 'Лист холоднокатаный',
    'Сетка': 'Сетка',
    'Балка': 'Балка',
    'Уголок': 'Уголок',
    'Швеллер': 'Швеллер',
    'Швеллер гнутый': 'Швеллер',
    'Профнастил оцинкованный': 'Профнастил',
    'Профнастил RAL': 'Профнастил',
    'Металлочерепица': 'Кровля',
    'Доборные элементы': 'Кровля'
};

function cleanPrice(str) {
    if (!str) return 0;
    // Remove currency symbol and spaces, replace comma with dot
    return parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

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

function run() {
    if (!fs.existsSync(priceListPath)) {
        console.error("Price list file not found!");
        return;
    }

    const content = fs.readFileSync(priceListPath, 'utf8');
    const lines = content.split('\n');

    let currentCategory = 'Металлопрокат';
    const products = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Detect category change
        if (line.startsWith('|') && line.includes('---')) {
            let prevLine = lines[i-1] ? lines[i-1].trim() : '';
            if (prevLine.startsWith('|')) {
                let catPart = prevLine.split('|')[1].trim();
                // If it's a header line like | Катанка | price | ..., use the first part as category
                if (catPart && !catPart.includes('цена') && !catPart.includes('руб') && !catPart.includes('Метров')) {
                    currentCategory = catPart;
                }
            }
            continue;
        }

        // Table row with data
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Цена') && !line.includes('цена') && !line.includes('руб/')) {
            // Split by | and filter out empty first/last parts
            const parts = line.split('|').map(p => p.trim()).filter((p, idx, arr) => {
                if (idx === 0 && p === '') return false;
                if (idx === arr.length - 1 && p === '') return false;
                return true;
            });
            
            if (parts.length >= 1) {
                const name = parts[0];
                if (!name || name === '' || name.length < 3 || name === ':----' || name === '---') continue;
                
                const price1 = parts[1] || '';
                const weight = parts[2] || '';
                const price2 = parts[3] || '';

                let dbCategory = CATEGORY_MAP[currentCategory] || currentCategory;

                products.push({
                    name,
                    category: dbCategory,
                    price1: price1,
                    weight: weight,
                    price2: price2
                });
            }
        }
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n'; // Excel SpreadsheetML hint
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
    xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
    xml += ' <Worksheet ss:Name="Products">\n';
    xml += '  <Table>\n';
    
    // Header Row
    xml += '   <Row>\n';
    xml += '    <Cell><Data ss:Type="String">Категория</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Наименование</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Цена 1</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Вес/Метров/Шт</Data></Cell>\n';
    xml += '    <Cell><Data ss:Type="String">Цена 2</Data></Cell>\n';
    xml += '   </Row>\n';

    products.forEach(p => {
        xml += '   <Row>\n';
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.category)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.price1)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.weight)}</Data></Cell>\n`;
        xml += `    <Cell><Data ss:Type="String">${escapeXml(p.price2)}</Data></Cell>\n`;
        xml += '   </Row>\n';
    });

    xml += '  </Table>\n';
    xml += ' </Worksheet>\n';
    xml += '</Workbook>';

    fs.writeFileSync(outputXmlPath, xml);
    console.log(`Successfully converted ${products.length} products to ${outputXmlPath}`);
}

run();
