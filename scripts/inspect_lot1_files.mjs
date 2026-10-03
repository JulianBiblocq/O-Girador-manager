import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/studio_lot1_items_assigned.json', 'utf8'));

console.log('=== NEWSLETTER ===');
for (const [file, items] of Object.entries(data.newsletter)) {
  console.log(`\n--- ${file} (${items.length}) ---`);
  items.forEach(it => {
    console.log(`  L${it.line} [${it.type}] (${it.assignedKey}) -> "${it.text.replace(/\r?\n/g, '\\n')}"`);
  });
}

console.log('\n=== PHOTOS ===');
for (const [file, items] of Object.entries(data.photos)) {
  console.log(`\n--- ${file} (${items.length}) ---`);
  items.forEach(it => {
    console.log(`  L${it.line} [${it.type}] (${it.assignedKey}) -> "${it.text.replace(/\r?\n/g, '\\n')}"`);
  });
}
