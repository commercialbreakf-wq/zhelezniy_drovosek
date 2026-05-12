const fs = require('fs');
const priceListPath = './Прайс-лист.md';

const content = fs.readFileSync(priceListPath, 'utf8');
const lines = content.split('\n');

const armaturaLines = lines.filter(l => l.includes('Арматура'));
console.log("Found " + armaturaLines.length + " lines with 'Арматура'");
console.log(armaturaLines.slice(0, 10));

const testMatch = "Арматура 6мм А240 6м".match(/(\d+)мм/);
console.log("Regex test '6мм': " + (testMatch ? testMatch[1] : 'null'));
