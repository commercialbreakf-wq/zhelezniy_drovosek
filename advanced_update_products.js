const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './database.sqlite';
const priceListPath = './Прайс-лист.md';

const CATEGORY_IMAGES = {
    'Арматура': '/images/rebar.png',
    'Катанка': '/images/rebar.png',
    'Квадрат': '/images/angles.png',
    'Круг': '/images/angles.png',
    'Полоса': '/images/angles.png',
    'Труба ВГП': '/images/tubes.png',
    'Труба профильная': '/images/tubes.png',
    'Лист горячекатаный': '/images/sheets.png',
    'Лист холоднокатаный': '/images/sheets.png',
    'Балка': '/images/beams.png',
    'Уголок': '/images/angles.png',
    'Швеллер': '/images/beams.png',
    'Сетка': '/images/rebar.png',
    'Профнастил': '/images/sheets.png',
    'Кровля': '/images/sheets.png'
};

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

const PARENT_CATEGORIES = {
    'Арматура': 'Черный металлопрокат',
    'Проволока': 'Черный металлопрокат',
    'Катанка': 'Черный металлопрокат',
    'Квадрат': 'Черный металлопрокат',
    'Круг': 'Черный металлопрокат',
    'Полоса': 'Черный металлопрокат',
    'Труба ВГП': 'Черный металлопрокат',
    'Труба профильная': 'Черный металлопрокат',
    'Лист горячекатаный': 'Черный металлопрокат',
    'Лист холоднокатаный': 'Черный металлопрокат',
    'Балка': 'Черный металлопрокат',
    'Уголок': 'Черный металлопрокат',
    'Швеллер': 'Черный металлопрокат',
    'Сетка': 'Черный металлопрокат',
    'Профнастил': 'Кровельные материалы',
    'Кровля': 'Кровельные материалы'
};

function parseProductName(name, category) {
    let vid = '';
    let length = '';
    let width = '';
    let type = '';

    // Extract length (meters) - look for numbers followed by 'м' with word boundary
    const lenMatch = name.match(/(\d+(?:[.,]\d+)?)\s*м\b(?!\w)/i) || name.match(/длина\s*(\d+(?:[.,]\d+)?)/i);
    if (lenMatch) {
        length = lenMatch[1].replace(',', '.') + ' м';
    }

    // Extract width (mm) - look for numbers followed by 'мм'
    const widthMatch = name.match(/(\d+(?:[.,]\d+)?)\s*мм/i);
    if (widthMatch) {
        width = widthMatch[1].replace(',', '.') + ' мм';
    } else {
        // Try to find dimensions like 40x40x2 or 10x10
        const dimsMatch = name.match(/(\d+(?:[.,]\d+)?\s*[хx*]\s*\d+(?:[.,]\d+)?(?:\s*[хx*]\s*\d+(?:[.,]\d+)?)?)/i);
        if (dimsMatch) {
            width = dimsMatch[1].replace(/[х*]/g, 'x');
        }
    }

    // Extract type (C255, Ст3, etc.)
    const typeMatch = name.match(/[СC]\d{3}/i) || name.match(/Ст\d+\w*/i) || name.match(/А\d+/i) || name.match(/09Г2С/i) || name.match(/Вр-1/i);
    if (typeMatch) {
        type = typeMatch[0];
    }

    // Extract vid
    let cleaned = name;
    // Remove category if it's at the start
    const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^${escapedCat}\\s*`, 'i'), '');
    
    // Remove extracted values
    if (length) cleaned = cleaned.replace(new RegExp(length.replace('.', '\\.').replace(' м', '\\s*м'), 'gi'), '');
    if (width) cleaned = cleaned.replace(new RegExp(width.replace('.', '\\.').replace(' мм', '\\s*мм'), 'gi'), '');
    if (type) cleaned = cleaned.replace(new RegExp(type, 'gi'), '');
    
    cleaned = cleaned.replace(/длина|гост|сто|риф\.|гнутый|оцинк\.|окрашен\.|сорт|в размер|ду/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    vid = cleaned || 'Стандарт';

    return { vid, length, width, type };
}

async function run() {
    if (!fs.existsSync(priceListPath)) {
        console.error("Price list file not found!");
        return;
    }

    const content = fs.readFileSync(priceListPath, 'utf8');
    const lines = content.split('\n');

    let currentCategory = 'Металлопрокат';
    const products = [];
    let lineCounter = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Detect category change
        if (line.startsWith('|')) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
            if (parts.length >= 2 && (parts[1].toLowerCase().includes('цена') || parts[1].toLowerCase().includes('руб/'))) {
                let catPart = parts[0].replace(/[^а-яА-Яa-zA-Z\s/-]/g, '').trim();
                if (catPart && catPart.length > 2) {
                    currentCategory = catPart;
                    continue; // Skip header row
                }
            }
        }

        // Table row with data
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Цена') && !line.includes('цена') && !line.includes('руб/')) {
            const parts = line.split('|').map(p => p.trim()).filter((p, idx) => idx > 0);
            
            if (parts.length >= 2) {
                const name = parts[0];
                if (!name || name === '' || name.length < 3 || name === ':----') continue;
                
                const cleanPrice = (str) => {
                    if (!str) return 0;
                    return parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
                };

                const priceTon = cleanPrice(parts[1]);
                const weight = parts[2] || '';
                const priceUnit = cleanPrice(parts[3]);

                if (priceTon === 0 && priceUnit === 0) continue;

                let dbCategory = CATEGORY_MAP[currentCategory] || currentCategory;
                const parentCategory = PARENT_CATEGORIES[dbCategory] || 'Металлопрокат';
                const { vid, length, width, type } = parseProductName(name, dbCategory);

                let unitLabel = 'ЗА МЕТР';
                if (dbCategory.includes('Лист')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Сетка')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Профнастил')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Кровля')) unitLabel = 'ЗА М.КВ';
                if (currentCategory.includes('Доборные')) unitLabel = 'ЗА ШТ';
                if (currentCategory.includes('Лягушка')) unitLabel = 'ЗА ШТ';

                const id = `${dbCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${lineCounter++}`;

                const specs = [
                    ["Наименование", name], 
                    ["Категория", dbCategory],
                    ["Вид", vid || 'Стандарт'],
                    ["Тип", type || 'Сталь 3'],
                    ["Длина", length || 'Немерная'],
                    ["Ширина/Размер", width || 'Стандарт']
                ];

                const group_key = `${dbCategory}|${vid || 'Стандарт'}|${width || 'Стандарт'}|${type || 'Сталь 3'}`;

                products.push({
                    id,
                    name,
                    category: dbCategory,
                    parent_category: parentCategory,
                    price_ton: priceTon,
                    price_unit: priceUnit || (priceTon / 100), 
                    unit_label: unitLabel,
                    weight: weight,
                    vid,
                    length,
                    width,
                    type,
                    group_key,
                    description: `Промышленный металлопрокат: ${name}. Качество подтверждено сертификатами.`,
                    image: CATEGORY_IMAGES[dbCategory] || '/images/tubes.png',
                    specs: JSON.stringify([
                        ["Наименование", name], 
                        ["Категория", dbCategory],
                        ["Вид", vid || 'Стандарт'],
                        ["Тип", type || 'Сталь 3'],
                        ["Длина", length || 'Немерная'],
                        ["Ширина/Размер", width || 'Стандарт']
                    ])
                });
            }
        }
    }

    console.log(`Extracted ${products.length} products total.`);

    // Update products-data.js for frontend (optional, but good for compatibility)
    const jsProducts = products.map(p => {
        const specs = JSON.parse(p.specs);
        return {
            id: p.id,
            category: p.category,
            parentCategory: p.parent_category,
            name: p.name,
            vid: p.vid,
            length: p.length,
            width: p.width,
            type: p.type,
            groupKey: p.group_key,
            standard: 'ГОСТ / ТУ',
            steel: p.type || 'Ст3сп5',
            priceTon: p.price_ton ? p.price_ton.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '',
            priceTonNum: p.price_ton,
            priceUnit: p.price_unit.toLocaleString('ru-RU', { minimumFractionDigits: 2 }),
            unitLabel: p.unit_label,
            perTon: p.weight,
            weight: '', 
            desc: p.description,
            specs: specs,
            badge: 'В НАЛИЧИИ',
            img: p.image
        };
    });

    const jsContent = `// Product data extracted from price list
const PRODUCTS = ${JSON.stringify(jsProducts, null, 2)};

const CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];
`;
    fs.writeFileSync('./products-data.js', jsContent);
    console.log("products-data.js updated with ALL products.");

    // Update Database
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
        db.run(`DROP TABLE IF EXISTS products`);
        db.run(`CREATE TABLE products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            parent_category TEXT,
            vid TEXT,
            length TEXT,
            width TEXT,
            type TEXT,
            group_key TEXT,
            price_ton REAL,
            price_unit REAL,
            unit_label TEXT,
            weight TEXT,
            description TEXT,
            image TEXT,
            specs TEXT
        )`);

        const stmt = db.prepare(`INSERT INTO products (id, name, category, parent_category, vid, length, width, type, group_key, price_ton, price_unit, unit_label, weight, description, image, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        products.forEach(p => {
            stmt.run(p.id, p.name, p.category, p.parent_category, p.vid, p.length, p.width, p.type, p.group_key, p.price_ton, p.price_unit, p.unit_label, p.weight, p.description, p.image, p.specs);
        });
        
        stmt.finalize();
        console.log("Database successfully updated.");
    });

    db.close();
}

run().catch(console.error);



