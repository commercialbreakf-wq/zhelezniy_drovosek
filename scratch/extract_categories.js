const fs = require('fs');
const content = fs.readFileSync('C:/Users/egas1/Downloads/Stitch_/products-data.js', 'utf8');
const catMatches = content.match(/"category":\s*"([^"]+)"/g);
const categories = [...new Set(catMatches.map(m => m.match(/"([^"]+)"$/)[1]))];
console.log('CATEGORIES:');
console.log(JSON.stringify(categories, null, 2));

const pCatMatches = content.match(/"parentCategory":\s*"([^"]+)"/g);
const parentCategories = [...new Set(pCatMatches.map(m => m.match(/"([^"]+)"$/)[1]))];
console.log('PARENT CATEGORIES:');
console.log(JSON.stringify(parentCategories, null, 2));
