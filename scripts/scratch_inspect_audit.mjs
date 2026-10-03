import fs from 'fs';

const results = JSON.parse(fs.readFileSync('scripts/audit_vitrine_admin_results.json', 'utf8'));

['recruitment'].forEach(catKey => {
  const cat = results[catKey];
  console.log(`\n========================================\nCAT: ${catKey} (${cat.name})\n========================================`);
  for (const dirty of cat.dirtyFiles) {
    console.log(`\n--- ${dirty.file} (${dirty.items.length} items) ---`);
    for (const item of dirty.items) {
      const cleanText = item.text.replace(/\s+/g, ' ');
      console.log(`  [L${item.line}] ${item.suggestedKey} => "${cleanText}"`);
    }
  }
});
