const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './database.sqlite';
const priceListPath = './Прайс-лист.md';
const productsDataPath = './products-data.js';

// Images for categories
const CATEGORY_IMAGES = {
    'Арматура': '/images/rebar.png',
    'Катанка': '/images/rebar.png',
    'Квадрат': '/images/angles.png',
    'Круг': '/images/angles.png',
    'Полоса': '/images/angles.png',
    'Труба ВГП': '/images/tubes.png',
    'Труба профильная': '/images/tubes.png',
    'Труба ЭСВ': '/images/tubes.png',
    'Лист': '/images/sheets.png',
    'Лист Г/К': '/images/sheets.png',
    'Лист Х/К': '/images/sheets.png',
    'Балка': '/images/beams.png',
    'Уголок': '/images/angles.png',
    'Швеллер': '/images/beams.png',
    'Сетка': '/images/rebar.png',
    'Профнастил': '/images/sheets.png',
    'Металлочерепица': '/images/sheets.png'
};

// Map categories from price list to site categories
const CATEGORY_MAP = {
    'Арматура': 'Арматура',
    'Балка': 'Балка',
    'Лист х/к': 'Лист Х/К',
    'Лист г/к': 'Лист Г/К',
    'Труба профильная': 'Труба профильная',
    'Труба ВГП': 'Труба ВГП',
    'Уголок': 'Уголок',
    'Швеллер': 'Швеллер',
    'Сетка': 'Сетка',
    'Профнастил оцинк.': 'Профнастил',
    'Профнастил RAL': 'Профнастил',
    'Труба ЭСВ': 'Труба ЭСВ'
};

// Data from Word file (manually interpreted from the garbled text)
const ALLOWED_PRODUCTS = {
    'Арматура': { vids: ['А1', 'А3'], sizes: ['6', '8', '10', '12', '14', '16', '18', '20', '22', '25'] },
    'Балка': { vids: ['Б1', 'Б2', 'К1', 'К2', 'Ш1', 'Ш2'], sizes: ['10', '12', '14', '16', '18', '20', '25', '30', '35', '40'] },
    'Лист Х/К': { sizes: ['0.7', '0.8', '0.9', '1', '1.2', '1.3', '1.5', '2', '2.5', '3'] },
    'Труба профильная': { isSquare: true, isRect: true }, // Logic below handles this
    'Уголок': { sizes: ['25', '32', '40', '50', '63', '70', '90', '100'] },
    'Швеллер': { vids: ['П', 'У'], sizes: ['8', '10', '12', '14', '16', '18', '20', '22', '24'] },
    'Профнастил': { vids: ['С8', 'С10', 'С20', 'С21', 'НС35', 'НС44', 'Н57', 'Н60', 'Н75', 'Н114'], thick: '0.4' },
    'Сетка': { thicks: ['3', '4', '5', '8'], meshes: ['50x50', '100x100', '150x150', '200x200'] },
    'Труба ВГП': { sizes: ['15', '20', '25', '32', '40', '50'] }
};

async function run() {
    if (!fs.existsSync(priceListPath)) {
        console.error("Price list file not found!");
        return;
    }

    const content = fs.readFileSync(priceListPath, 'utf8');
    const lines = content.split('\n');

    let currentCategory = 'Металлопрокат';
    const allProducts = [];
    let counter = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Table row with data
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Цена') && !line.includes('цена') && !line.includes('руб/')) {
            const parts = line.split('|').map(p => p.trim()).filter((p, idx) => idx > 0);
            if (parts.length >= 2) {
                const name = parts[0];
                if (!name || name === '' || name.length < 3 || name === ':----') continue;
                
                // Determine category from name
                const KNOWN_CATS = ['Арматура', 'Балка', 'Лист', 'Труба', 'Уголок', 'Швеллер', 'Сетка', 'Профнастил', 'Катанка', 'Квадрат', 'Круг', 'Полоса', 'Металлочерепица'];
                let detectedCat = 'Прочее';
                for (const cat of KNOWN_CATS) {
                    if (name.toLowerCase().includes(cat.toLowerCase())) {
                        detectedCat = cat;
                        break;
                    }
                }
                
                // Handle specific cases
                if (detectedCat === 'Труба') {
                    if (name.includes('проф')) detectedCat = 'Труба профильная';
                    else if (name.includes('ВГП')) detectedCat = 'Труба ВГП';
                    else if (name.includes('ЭСВ')) detectedCat = 'Труба ЭСВ';
                }
                if (detectedCat === 'Лист') {
                    if (name.includes('Г/К') || name.includes('горяче')) detectedCat = 'Лист Г/К';
                    else if (name.includes('Х/К') || name.includes('холодно')) detectedCat = 'Лист Х/К';
                }

                let dbCategory = detectedCat;
                
                const cleanPrice = (str) => {
                    if (!str) return 0;
                    return parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                };

                const priceTon = cleanPrice(parts[1]);
                const weight = parts[2] || '';
                const priceUnit = cleanPrice(parts[3]);

                if (priceTon === 0 && priceUnit === 0) continue;
                
                // --- Filtering Logic based on Word file ---
                let allowed = false;
                let vid = '';
                let size = '';
                let type = '';

                // Simplified matching
                const nameLower = name.toLowerCase();

                if (dbCategory === 'Арматура') {
                    const match = name.match(/(\d+)мм/);
                    if (match && ALLOWED_PRODUCTS['Арматура'].sizes.includes(match[1])) {
                        allowed = true;
                        size = match[1] + " мм";
                        vid = (name.includes('А1') || name.includes('А240')) ? 'А1' : (name.includes('А3') || name.includes('А400')) ? 'А3' : 'А3';
                    }
                } else if (dbCategory === 'Балка') {
                    const match = name.match(/Балка\s+(\d+)([БКУШ]\d*)/i);
                    if (match && ALLOWED_PRODUCTS['Балка'].sizes.includes(match[1])) {
                        allowed = true;
                        size = match[1];
                        vid = match[2];
                    }
                } else if (dbCategory === 'Лист Х/К' || dbCategory === 'Лист Г/К') {
                    const match = name.match(/(\d+\.\d+|\d+)/);
                    if (match && ALLOWED_PRODUCTS['Лист Х/К'].sizes.includes(match[1])) {
                        allowed = true;
                        size = match[1] + " мм";
                        vid = dbCategory;
                    }
                } else if (dbCategory === 'Труба профильная') {
                    const match = name.match(/(\d+)х(\d+)х(\d+(?:\.\d+)?)/i);
                    if (match) {
                        allowed = true;
                        size = `${match[1]}х${match[2]}`;
                        vid = match[1] === match[2] ? 'Квадратная' : 'Прямоугольная';
                        type = match[3] + " мм";
                    }
                } else if (dbCategory === 'Уголок') {
                    const match = name.match(/Уголок\s+(\d+)х(\d+)х(\d+)/i);
                    if (match && ALLOWED_PRODUCTS['Уголок'].sizes.includes(match[1])) {
                        allowed = true;
                        size = `${match[1]}х${match[2]}`;
                        vid = "Равнополочный";
                        type = match[3] + " мм";
                    }
                } else if (dbCategory === 'Швеллер') {
                    const match = name.match(/Швеллер\s+(?:N\s+)?(\d+)([ПУ])/i);
                    if (match && ALLOWED_PRODUCTS['Швеллер'].sizes.includes(match[1])) {
                        allowed = true;
                        size = match[1];
                        vid = match[2];
                    }
                } else if (dbCategory === 'Сетка') {
                    const matchSize = name.match(/(\d+)х(\d+)/);
                    const matchThick = name.match(/(\d+(?:\.\d+)?)Вр/);
                    if (matchSize && matchThick) {
                        allowed = true;
                        size = `${matchSize[1]}х${matchSize[2]}`;
                        vid = matchThick[1] + " мм";
                    }
                } else if (dbCategory === 'Профнастил') {
                    const matchVid = name.match(/([СН][С]?-\d+|МП-20)/);
                    if (matchVid && ALLOWED_PRODUCTS['Профнастил'].vids.includes(matchVid[1].replace('-', ''))) {
                        allowed = true;
                        vid = matchVid[1];
                        size = name.includes('0.4') ? '0.4 мм' : 'Стандарт';
                    } else if (matchVid && name.includes('С-')) {
                         allowed = true;
                         vid = matchVid[1];
                    }
                } else if (dbCategory === 'Труба ВГП') {
                    const match = name.match(/ду(\d+)х(\d+\.\d+)/i);
                    if (match && ALLOWED_PRODUCTS['Труба ВГП'].sizes.includes(match[1])) {
                        allowed = true;
                        size = "ДУ " + match[1];
                        vid = match[2] + " мм";
                    }
                }

                // Default allow for others for now to have a complete catalog
                if (!allowed) {
                    // Check if category is in Allowed
                    if (ALLOWED_PRODUCTS[dbCategory]) {
                         // keep it if we can't parse but it belongs
                         allowed = true;
                         vid = vid || 'Стандарт';
                         size = size || 'Различные';
                    }
                }

                if (allowed) {
                    // Refine category to be a "subcategory"
                    let refinedCategory = dbCategory;
                    if (dbCategory === 'Арматура' && vid) refinedCategory = `Арматура ${vid}`;
                    if (dbCategory === 'Швеллер' && vid) refinedCategory = `Швеллер ${vid}`;
                    if (dbCategory === 'Балка' && vid) refinedCategory = `Балка ${vid}`;
                    if (dbCategory === 'Профнастил' && vid) refinedCategory = `Профнастил ${vid}`;

                    let unitLabel = 'ЗА МЕТР';
                    if (dbCategory.includes('Лист')) unitLabel = 'ЗА М.КВ';
                    if (dbCategory.includes('Сетка')) unitLabel = 'ЗА М.КВ';
                    if (dbCategory.includes('Профнастил')) unitLabel = 'ЗА М.КВ';
                    if (dbCategory.includes('Кровля')) unitLabel = 'ЗА М.КВ';

                    const parentCategory = (dbCategory === 'Кровля' || dbCategory === 'Профнастил' || dbCategory === 'Металлочерепица') ? 'Кровля и фасад' : 'Металлопрокат';

                    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50) + '-' + counter++;
                    
                    // Group key is unique for each item to show them as separate cards
                    const groupKey = id; 

                    const specs = [
                        ["Наименование", name],
                        ["Категория", refinedCategory],
                        ["Размер", size || "Стандарт"],
                        ["Вид", vid || "Стандарт"]
                    ];
                    if (type) specs.push(["Тип/Толщина", type]);

                    allProducts.push({
                        id,
                        name,
                        category: refinedCategory,
                        parent_category: parentCategory,
                        vid: vid || 'Стандарт',
                        length: 'Немерная',
                        width: size || 'Стандарт',
                        type: type || 'Стандарт',
                        group_key: groupKey,
                        price_ton: priceTon,
                        price_unit: priceUnit || (priceTon / 100),
                        unit_label: unitLabel,
                        weight: weight,
                        description: `Высококачественный металлопрокат: ${name}. Поставляется напрямую с заводов. Соответствует ГОСТ. Идеально подходит для профессионального строительства и производства.`,
                        image: CATEGORY_IMAGES[dbCategory] || '/images/tubes.png',
                        specs: JSON.stringify(specs)
                    });
                }
            }
        }
    }

    console.log(`Extracted ${allProducts.length} products.`);

    // Update database
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
        db.run("DELETE FROM products");
        db.run("DELETE FROM categories");

        const stmt = db.prepare(`INSERT INTO products (
            id, name, category, parent_category, vid, length, width, type, group_key, 
            price_ton, price_unit, unit_label, weight, description, image, specs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        allProducts.forEach(p => {
            stmt.run(
                p.id, p.name, p.category, p.parent_category, p.vid, p.length, p.width, p.type, p.group_key,
                p.price_ton, p.price_unit, p.unit_label, p.weight, p.description, p.image, p.specs
            );
        });
        stmt.finalize();

        const categories = [...new Set(allProducts.map(p => p.category))];
        const catStmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
        categories.forEach(c => catStmt.run(c));
        catStmt.finalize();

        console.log("Database updated.");
    });

    // Update products-data.js
    const jsProducts = allProducts.map(p => ({
        id: p.id,
        category: p.category,
        parentCategory: p.parent_category,
        name: p.name,
        vid: p.vid,
        length: p.length,
        width: p.width,
        type: p.type,
        groupKey: p.group_key,
        priceTon: p.price_ton ? p.price_ton.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
        priceTonNum: p.price_ton,
        priceUnit: p.price_unit.toLocaleString('ru-RU', { minimumFractionDigits: 2 }),
        unitLabel: p.unit_label,
        perTon: p.weight,
        desc: p.description,
        specs: JSON.parse(p.specs),
        badge: 'В НАЛИЧИИ',
        img: p.image
    }));

    const jsContent = `// Product data updated from Word catalog and Price List
const PRODUCTS = ${JSON.stringify(jsProducts, null, 2)};
const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];
`;
    fs.writeFileSync(productsDataPath, jsContent);
    console.log("products-data.js updated.");

    db.close();
}

run().catch(console.error);
