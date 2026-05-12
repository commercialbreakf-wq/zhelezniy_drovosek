const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './database.sqlite';
const priceListPath = './Прайс-лист.md';

const CATEGORY_IMAGES = {
    'Арматура': '/images/products/steel_rebar_premium.png',
    'Катанка': '/images/products/wire_rod_premium_1778423828914.png',
    'Квадрат': '/images/products/square_steel_premium_1778423850615.png',
    'Круг': '/images/products/round_steel_premium_1778423868660.png',
    'Полоса': '/images/products/hot_rolled_sheets_premium_1778423920658.png',
    'Труба ВГП': '/images/products/vgp_pipes_premium_1778423885236.png',
    'Труба профильная': '/images/products/profile_tubes_premium_1778423900429.png',
    'Лист горячекатаный': '/images/products/hot_rolled_sheets_premium_1778423920658.png',
    'Лист холоднокатаный': '/images/products/cold_rolled_sheets_premium_1778423951350.png',
    'Балка': '/images/products/steel_beams_premium_1778423982429.png',
    'Уголок': '/images/products/steel_angles_premium_1778423996872.png',
    'Швеллер': '/images/products/steel_channels_premium_1778424020131.png',
    'Сетка': '/images/products/steel_mesh_premium_1778423969480.png',
    'Профнастил': '/images/products/corrugated_sheets_premium.png',
    'Кровля': '/images/products/corrugated_sheets_premium.png'
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
        if (line.startsWith('|') && line.includes('---')) {
            let prevLine = lines[i-1] ? lines[i-1].trim() : '';
            if (prevLine.startsWith('|')) {
                let catPart = prevLine.split('|')[1].trim();
                if (catPart && !catPart.includes('цена') && !catPart.includes('руб') && !catPart.includes('Метров')) {
                    currentCategory = catPart;
                }
            }
            continue;
        }

        // Table row with data
        if (line.startsWith('|') && !line.includes('----') && !line.includes('Цена') && !line.includes('цена') && !line.includes('руб/')) {
            const parts = line.split('|').map(p => p.trim()).filter((p, idx) => idx > 0); // Skip first empty part if it starts with |
            
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

                let unitLabel = 'ЗА МЕТР';
                if (dbCategory.includes('Лист')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Сетка')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Профнастил')) unitLabel = 'ЗА М.КВ';
                if (dbCategory.includes('Кровля')) unitLabel = 'ЗА М.КВ';
                if (currentCategory.includes('Доборные')) unitLabel = 'ЗА ШТ';
                if (currentCategory.includes('Лягушка')) unitLabel = 'ЗА ШТ';

                const id = `${dbCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${lineCounter++}`;

                const specs = [["Наименование", name], ["Категория", dbCategory]];
                const diaMatch = name.match(/(\d+(?:\.\d+)?)\s*мм/i);
                if (diaMatch) specs.push(["Диаметр/Толщина", diaMatch[1] + " мм"]);
                const lenMatch = name.match(/(\d+(?:\.\d+)?)\s*м/i);
                if (lenMatch && !name.includes('мм')) specs.push(["Длина", lenMatch[1] + " м"]);

                products.push({
                    id,
                    name,
                    category: dbCategory,
                    price_ton: priceTon,
                    price_unit: priceUnit || (priceTon / 100), 
                    unit_label: unitLabel,
                    weight: weight,
                    description: `Промышленный стандарт: ${name}. Категория: ${dbCategory}. Прямые поставки от металлургических заводов. Весь товар сертифицирован по ГОСТ. Гарантия прочности и долговечности.`,
                    image: CATEGORY_IMAGES[dbCategory] || '/images/tubes.png',
                    specs: JSON.stringify(specs)
                });
            }
        }
    }

    const priorityCategories = ['Арматура', 'Труба профильная', 'Балка', 'Швеллер', 'Уголок', 'Лист горячекатаный', 'Труба ВГП', 'Катанка', 'Квадрат', 'Круг', 'Полоса'];
    
    products.sort((a, b) => {
        const aIndex = priorityCategories.indexOf(a.category);
        const bIndex = priorityCategories.indexOf(b.category);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
    });

    const finalProducts = products.slice(0, 150);

    console.log(`Extracted ${finalProducts.length} products.`);

    // Update products-data.js for frontend consistency
    const productsDataPath = './products-data.js';
    const jsProducts = finalProducts.map(p => {
        const specs = JSON.parse(p.specs);
        return {
            id: p.id,
            category: p.category,
            name: p.name,
            length: specs.find(s => s[0] === 'Длина') ? specs.find(s => s[0] === 'Длина')[1] : '',
            standard: 'ГОСТ / ТУ',
            steel: 'Ст3сп5 / 09Г2С',
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
    fs.writeFileSync(productsDataPath, jsContent);
    console.log("products-data.js updated.");

    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
        db.run(`DELETE FROM products`);
        db.run(`DELETE FROM categories`);

        const stmt = db.prepare(`INSERT INTO products (id, name, category, price_ton, price_unit, unit_label, weight, description, image, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        finalProducts.forEach(p => {
            stmt.run(p.id, p.name, p.category, p.price_ton, p.price_unit, p.unit_label, p.weight, p.description, p.image, p.specs);
        });
        
        stmt.finalize();

        const categories = [...new Set(finalProducts.map(p => p.category))];
        const catStmt = db.prepare(`INSERT INTO categories (name) VALUES (?)`);
        categories.forEach(c => catStmt.run(c));
        catStmt.finalize();

        console.log("Database successfully updated with 150 items.");
    });

    db.close();
}

run().catch(console.error);



