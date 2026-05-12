const fs = require('fs');
const path = 'C:/Users/egas1/Downloads/Stitch_/products-data.js';
let content = fs.readFileSync(path, 'utf8');

let dataStr = content.trim();
const startMarker = 'const PRODUCTS = ';
const startIdx = dataStr.indexOf(startMarker);
if (startIdx !== -1) {
    dataStr = dataStr.substring(startIdx + startMarker.length);
}

const endMarker = '];';
const endIdx = dataStr.indexOf(endMarker);
if (endIdx !== -1) {
    dataStr = dataStr.substring(0, endIdx + 1);
}

try {
    const products = JSON.parse(dataStr);
    console.log('Parsed ' + products.length + ' products.');
    
    const mapping = {
        'Арматура а1': '/images/products/steel_rebar_premium.png',
        'Арматура а3': '/images/products/steel_rebar_premium.png',
        'Балка': '/images/products/steel_beams_premium_1778423982429.png',
        'Лист хк': '/images/products/cold_rolled_sheets_premium_1778423951350.png',
        'профиль квадратная': '/images/products/profile_tubes_premium_1778423900429.png',
        'Труба профильная прямоугольная': '/images/products/profile_tubes_premium_1778423900429.png',
        'Труба эсв': '/images/products/vgp_pipes_premium_1778423885236.png',
        'Труба вгп': '/images/products/vgp_pipes_premium_1778423885236.png',
        'Уголок': '/images/products/steel_angles_premium_1778423996872.png',
        'Швеллер': '/images/products/steel_channels_premium_1778424020131.png',
        'Профнастил окрашенный': '/images/products/corrugated_sheets_premium.png',
        'полиэстер односторонний 0.4мм': '/images/products/corrugated_sheets_premium.png',
        'Профнастил оцинкованный 0.4мм': '/images/products/corrugated_sheets_premium.png',
        'Сетка 3 м': '/images/products/steel_mesh_premium_1778423969480.png',
        'Сетка 4 м': '/images/products/steel_mesh_premium_1778423969480.png',
        'Сетка 5 м': '/images/products/steel_mesh_premium_1778423969480.png',
        'Сетка 8 м': '/images/products/steel_mesh_premium_1778423969480.png'
    };

    products.forEach(p => {
        if (mapping[p.category]) {
            p.img = mapping[p.category];
        } else {
            if (p.parentCategory === 'Листовой металлопрокат') {
                 p.img = '/images/products/hot_rolled_sheets_premium_1778423920658.png';
            } else if (p.parentCategory === 'Трубный металлопрокат') {
                 p.img = '/images/products/vgp_pipes_premium_1778423885236.png';
            }
        }
    });

    const newContent = 'const PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n\nconst CATEGORIES = [...new Set(PRODUCTS.map(p => p.category))];\n';
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Successfully updated products-data.js with premium images.');
} catch (e) {
    console.error('Failed to parse JSON:');
    console.error(e.message);
    console.log('Data string start:', dataStr.substring(0, 100));
    console.log('Data string end:', dataStr.substring(dataStr.length - 100));
}
