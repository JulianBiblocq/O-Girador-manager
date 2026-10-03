import fs from 'fs';

const audit = JSON.parse(fs.readFileSync('scripts/audit_studio_results.json', 'utf8'));

console.log('=== NEWSLETTER REMAINING ===');
audit.poleSummary.newsletter.dirtyFiles.forEach(f => {
  console.log(f.file, f.items.length);
  f.items.forEach(it => {
    console.log(`  L${it.line} [${it.type}] "${it.text.replace(/\r?\n/g, ' ')}" (${it.context})`);
  });
});

console.log('\n=== PHOTOS REMAINING ===');
audit.poleSummary.photos.dirtyFiles.forEach(f => {
  console.log(f.file, f.items.length);
  f.items.forEach(it => {
    console.log(`  L${it.line} [${it.type}] "${it.text.replace(/\r?\n/g, ' ')}" (${it.context})`);
  });
});
