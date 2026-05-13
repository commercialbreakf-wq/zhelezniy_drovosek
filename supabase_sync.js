const fs = require('fs');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// CONFIGURATION
const SUPABASE_URL = 'https://drbknuvnsyonmeudoleo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmtudXZuc3lvbm1ldWRvbGVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMDgxNiwiZXhwIjoyMDk0MTg2ODE2fQ.dnQgta6bz30KP_NWmN-LOEdccSiVUxs2ZYvvOJCY8Hk';
const SMTP_PASS = 'n9CBCOuWpzfJLYuDw9d0';

const wordPath = './catalog.docx';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

const PARENT_CATEGORIES = {
    'Арматура': 'Черный металлопрокат',
    'Труба профильная': 'Трубный металлопрокат',
    'Труба ВГП': 'Трубный металлопрокат',
    'Лист горячекатаный': 'Листовой металлопрокат',
    'Лист холоднокатаный': 'Листовой металлопрокат',
    'Профнастил': 'Кровля и фасад',
    'Швеллер': 'Черный металлопрокат',
    'Балка': 'Черный металлопрокат',
    'Уголок': 'Черный металлопрокат'
};

function parseProductName(name, category) {
    let vid = '';
    let length = '';
    let width = '';
    let type = '';

    const lenMatch = name.match(/(\d+(?:[.,]\d+)?)\s*м\b(?!\w)/i);
    if (lenMatch) length = lenMatch[1].replace(',', '.') + ' м';

    const widthMatch = name.match(/(\d+)х(\d+)х(\d+(?:\.\d+)?)/i) || name.match(/(\d+)х(\d+)/i) || name.match(/(\d+(?:\.\d+)?)мм/i);
    if (widthMatch) width = widthMatch[0];

    const typeMatch = name.match(/[СC]\d{3}/i) || name.match(/Ст\d+\w*/i) || name.match(/А\d+/i) || name.match(/[СН][С]?-\d+/);
    if (typeMatch) type = typeMatch[0];

    vid = category || 'Стандарт';
    return { vid, length, width, type };
}

async function run() {
    console.log("Starting Supabase Sync from Word...");
    
    if (!fs.existsSync(wordPath)) {
        console.error("Word file not found! Please ensure 'catalog.docx' exists.");
        return;
    }

    const { value: html } = await mammoth.convertToHtml({ path: wordPath });
    const $ = cheerio.load(html);
    const products = [];
    let lineCounter = 0;
    let currentCategory = 'Прочее';

    // Iterate through all elements to maintain order and context
    $('*').each((i, el) => {
        const tagName = el.name;
        const text = $(el).text().trim();

        if (!text) return;

        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
            currentCategory = text;
            return;
        }

        if (tagName === 'p') {
            // Check if it's a product line: usually has a number at the end (price)
            const parts = text.split(/\s+/);
            if (parts.length < 2) return;

            const lastPart = parts[parts.length - 1].replace(/[^\d]/g, '');
            const priceTon = parseFloat(lastPart);

            if (isNaN(priceTon) || priceTon < 1000) {
                // Not a price or too low to be a ton price, maybe it's just text or a subcategory
                if (text.length < 50 && !text.includes(' ')) {
                     // potential subcategory or header that wasn't H1
                }
                return;
            }

            const name = text.substring(0, text.lastIndexOf(parts[parts.length - 1])).trim();
            if (!name) return;

            // Determine specific category from name or currentCategory
            let category = currentCategory;
            const KNOWN_CATS = ['Арматура', 'Балка', 'Лист', 'Труба', 'Уголок', 'Швеллер', 'Сетка', 'Профнастил', 'Катанка', 'Квадрат', 'Круг', 'Полоса'];
            for (const cat of KNOWN_CATS) {
                if (name.toLowerCase().includes(cat.toLowerCase())) {
                    category = cat;
                    break;
                }
            }
            
            if (category === 'Труба' && name.includes('проф')) category = 'Труба профильная';
            if (category === 'Труба' && (name.includes('ВГП') || name.includes('вод'))) category = 'Труба ВГП';
            if (category === 'Лист' && (name.includes('Г/К') || name.includes('горяче'))) category = 'Лист горячекатаный';
            if (category === 'Лист' && (name.includes('Х/К') || name.includes('холодно'))) category = 'Лист холоднокатаный';

            const parentCategory = PARENT_CATEGORIES[category] || 'Черный металлопрокат';
            const { vid, length, width, type } = parseProductName(name, category);

            products.push({
                id: (lineCounter++) + 1000, // Use numeric ID and increment
                name,
                category,
                parent_category: parentCategory,
                price_ton: priceTon,
                price_unit: Math.round(priceTon / 100), // Approximate price per unit if unknown
                unit_label: category.includes('Лист') ? 'ЗА М.КВ' : 'ЗА МЕТР',
                weight: '',
                vid,
                length,
                width,
                type,
                description: `Металлопрокат премиум качества: ${name}. В наличии на складе.`,
                image: CATEGORY_IMAGES[category] || '/images/products/profile_tubes_premium_1778423900429.png',
                specs: JSON.stringify([["Наименование", name], ["Категория", category], ["Базовая цена", `${priceTon} руб/т`]])
            });
        }
    });

    console.log(`Parsed ${products.length} products from Word. Uploading to Supabase...`);

    if (products.length === 0) {
        console.log("No products found to upload.");
        return;
    }

    // Clear existing products to avoid duplicates if needed, or just upsert
    // For now we just upsert.
    const chunkSize = 50;
    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const { error } = await supabase.from('products').upsert(chunk);
        if (error) {
            console.error(`Error in chunk ${i}:`, error.message);
        } else {
            console.log(`Uploaded chunk ${Math.floor(i/chunkSize) + 1}`);
        }
    }

    console.log("Supabase Sync Completed Successfully!");
}

run().catch(console.error);
