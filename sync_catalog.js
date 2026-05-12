const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const path = require('path');

const dbPath = './database.sqlite';
const DOCX_PATH = './catalog.docx';
const XML_PATH = './каталог.xml';

const CATEGORY_IMAGES = {
    'Арматура': '/images/rebar.png',
    'Балка': '/images/beams.png',
    'Лист': '/images/sheets.png',
    'Труба': '/images/tubes.png',
    'Уголок': '/images/angles.png',
    'Швеллер': '/images/beams.png',
    'Сетка': '/images/rebar.png',
    'Профнастил': '/images/sheets.png',
    'Проф лист': '/images/sheets.png',
    'Профиль': '/images/tubes.png'
};

const PARENT_CATEGORIES = {
    'Арматура': 'Черный металлопрокат',
    'Балка': 'Черный металлопрокат',
    'Лист': 'Листовой металлопрокат',
    'Труба': 'Трубный металлопрокат',
    'Уголок': 'Черный металлопрокат',
    'Швеллер': 'Черный металлопрокат',
    'Сетка': 'Черный металлопрокат',
    'Профнастил': 'Кровля и фасад',
    'Проф лист': 'Кровля и фасад',
    'Профиль': 'Трубный металлопрокат'
};

function parseProductName(name, category, subtype) {
    let vid = subtype || '';
    let length = '';
    let width = '';
    let type = '';

    // Remove category and subtype from name to avoid false matches in dimensions
    let cleanName = name;
    if (category) cleanName = cleanName.replace(new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    if (subtype) cleanName = cleanName.replace(new RegExp(subtype.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');

    // 1. Extract Length (e.g., 6 м, 11.7 м)
    const lenMatch = cleanName.match(/(\d+(?:[.,]\d+)?)\s*м\b/i);
    if (lenMatch) {
        length = lenMatch[1].replace(',', '.') + ' м';
        cleanName = cleanName.replace(lenMatch[0], '');
    }

    // 2. Extract Type (e.g., А1, А3, 09Г2С, Ст3) - common steel grades
    const typeMatch = cleanName.match(/[аa][135]/i) || name.match(/[аa][135]/i) || name.match(/09Г2С/i) || name.match(/Ст\d+/i);
    if (typeMatch) {
        type = typeMatch[0].toUpperCase();
    }

    // 3. Extract Dimensions (e.g., 40 20 1.5 or 100*50*3 or 10x10)
    // Look for patterns like "40 20 1.5" or "100*50"
    const dimsMatch = cleanName.match(/(\d+(?:[.,]\d+)?)\s*[*хx\s/]\s*(\d+(?:[.,]\d+)?)(?:\s*[*хx\s/]\s*(\d+(?:[.,]\d+)?))?/i);
    if (dimsMatch) {
        // Ensure it's not just a single number
        if (dimsMatch[2]) {
            width = dimsMatch[1].replace(',', '.') + 'x' + dimsMatch[2].replace(',', '.') + (dimsMatch[3] ? 'x' + dimsMatch[3].replace(',', '.') : '') + ' мм';
        } else {
            width = dimsMatch[1].replace(',', '.') + ' мм';
        }
    } else {
        // Try single number dimensions (e.g., "Балка 10")
        const singleDim = cleanName.match(/\b(\d+(?:[.,]\d+)?)\b/);
        if (singleDim && !length) {
            width = singleDim[1].replace(',', '.') + ' мм';
        }
    }

    // If vid is still empty, use remaining cleanName
    if (!vid) {
        vid = cleanName.replace(/[*хx]/g, '').replace(/\s+/g, ' ').trim() || 'Стандарт';
    }

    return { vid, length, width, type };
}

async function sync() {
    console.log("Starting Refined Word Catalog Sync...");
    
    const prices = new Map();
    if (fs.existsSync(XML_PATH)) {
        const xml = fs.readFileSync(XML_PATH, 'utf8');
        const $ = cheerio.load(xml, { xmlMode: true });
        $('Row').each((i, row) => {
            const cells = $(row).find('Cell Data');
            if (cells.length >= 3) {
                const name = $(cells[1]).text().trim().toLowerCase();
                const t1 = $(cells[2]).text();
                const p1 = parseFloat(parseFloat(t1.replace(/[^\d.,]/g, '').replace(',', '.')).toFixed(2)) || 0;
                let p2 = 0;
                if (cells[4]) {
                    const t2 = $(cells[4]).text();
                    p2 = parseFloat(parseFloat(t2.replace(/[^\d.,]/g, '').replace(',', '.')).toFixed(2)) || 0;
                }
                if (name) prices.set(name, { p1, p2 });
            }
        });
    }

    const result = await mammoth.convertToHtml({path: DOCX_PATH});
    const html = result.value;
    const $ = cheerio.load(html);
    
    const products = [];
    let currentCategory = 'Металлопрокат';
    let currentSubtype = '';
    let counter = 0;

    $('*').each((i, el) => {
        const tagName = el.tagName;
        const text = $(el).text().trim();
        
        if (!text || text === 'Виды:') return;

        if (tagName === 'h1') {
            currentCategory = text;
            currentSubtype = '';
        } else if (tagName === 'h2') {
            currentSubtype = text;
        } else if (tagName === 'p') {
            const name = text;
            const { vid, length, width, type } = parseProductName(name, currentCategory, currentSubtype);
            
            const priceData = prices.get(name.toLowerCase()) || { p1: 58000 + (Math.random() * 5000), p2: 180 + (Math.random() * 40) };
            
            const nameLower = name.toLowerCase();
            let displayCategory = currentSubtype || currentCategory;
            
            // Try to infer category from name first for better precision
            if (nameLower.includes('арматур')) {
                if (nameLower.includes('а1') || nameLower.includes('a1')) displayCategory = 'Арматура А1';
                else if (nameLower.includes('а3') || nameLower.includes('a3')) displayCategory = 'Арматура А3';
                else displayCategory = 'Арматура';
            }
            else if (nameLower.includes('балка')) displayCategory = 'Балка';
            else if (nameLower.includes('швеллер')) displayCategory = 'Швеллер';
            else if (nameLower.includes('уголок')) displayCategory = 'Уголок';
            else if (nameLower.includes('лист')) {
                if (nameLower.includes('хк') || nameLower.includes('х/к') || nameLower.includes('хг') || nameLower.includes('холодно')) {
                    displayCategory = 'Лист холоднокатаный';
                } else {
                    return; // Skip other sheet types
                }
            }
            else if (nameLower.includes('труб') || nameLower.includes('профиль')) {
                if (nameLower.includes('эсв')) displayCategory = 'Труба электросварная';
                else if (nameLower.includes('вгп')) displayCategory = 'Труба ВГП';
                else displayCategory = 'Труба профильная';
            }
            else if (nameLower.includes('проф') || nameLower.includes('полиэстер') || nameLower.includes('оцинков')) {
                if (nameLower.includes('оцинков')) displayCategory = 'Профнастил оцинкованный';
                else if (nameLower.includes('полиэстер')) displayCategory = 'Полиэстер';
                else if (nameLower.includes('окрашен')) displayCategory = 'Профнастил окрашенный';
                else displayCategory = 'Профнастил';
            }
            else if (nameLower.includes('сетка')) displayCategory = 'Сетка';
            else {
                // Fallback to normalized heading logic if name is generic
                const lowerDc = displayCategory.toLowerCase();
                if (lowerDc.includes('арматура')) displayCategory = 'Арматура';
                else if (lowerDc.includes('балка')) displayCategory = 'Балка';
                else if (lowerDc.includes('лист')) displayCategory = 'Листовой прокат';
                else if (lowerDc.includes('труб') || lowerDc.includes('профиль')) displayCategory = 'Труба профильная';
                else if (lowerDc.includes('уголок')) displayCategory = 'Уголок';
                else if (lowerDc.includes('швеллер')) displayCategory = 'Швеллер';
                else if (lowerDc.includes('сетка')) displayCategory = 'Сетка';
                else if (lowerDc.includes('проф')) displayCategory = 'Профнастил';
                else displayCategory = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
            }
            
            const parentCategory = (() => {
                const dc = displayCategory.toLowerCase();
                if (dc.includes('лист')) return 'Листовой металлопрокат';
                if (dc.includes('труб') || dc.includes('профиль')) return 'Трубный металлопрокат';
                if (dc.includes('проф') || dc.includes('полиэстер')) return 'Кровля и фасад';
                return 'Черный металлопрокат';
            })();
            
            products.push({
                id: `docx-${counter++}`,
                name,
                category: displayCategory,
                parent_category: parentCategory,
                vid, length, width, type,
                group_key: `${displayCategory}|${vid}`,
                price_ton: parseFloat(priceData.p1.toFixed(2)),
                price_unit: parseFloat(priceData.p2.toFixed(2)),
                weight: '1.00 т',
                description: `Качественный металлопрокат: ${name}. В наличии на складе.`,
                image: CATEGORY_IMAGES[displayCategory] || '/images/tubes.png',
                specs: JSON.stringify([
                    ["Наименование", name],
                    ["Тип/Марка", type || 'Сталь 3'],
                    ["Размер", width || 'Стандарт'],
                    ["Длина", length || '6 м']
                ])
            });
        }
    });

    const db = new sqlite3.Database(dbPath);
    await new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);
            db.run(`DELETE FROM products`);
            const stmt = db.prepare(`INSERT INTO products (id, name, category, parent_category, vid, length, width, type, group_key, price_ton, price_unit, unit_label, weight, description, image, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            products.forEach(p => {
                let unit_label = 'ЗА МЕТР';
                if (p.category.includes('Лист') || p.category.includes('Сетка') || p.category.includes('Проф')) unit_label = 'ЗА М.КВ';
                stmt.run(p.id, p.name, p.category, p.parent_category, p.vid, p.length, p.width, p.type, p.group_key, p.price_ton, p.price_unit, unit_label, p.weight, p.description, p.image, p.specs);
            });
            stmt.finalize();
            db.run(`COMMIT`, (err) => err ? reject(err) : resolve());
        });
    });
    db.close();
    console.log(`Sync complete. Loaded ${products.length} products.`);

    const jsList = products.map(p => ({
        id: p.id, category: p.category, name: p.name, priceTonNum: p.price_ton, priceUnit: p.price_unit.toLocaleString('ru-RU'), img: p.image
    }));
    fs.writeFileSync('./products-data.js', `const PRODUCTS = ${JSON.stringify(jsList, null, 2)};`);
}

sync().catch(console.error);
