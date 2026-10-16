async function checkCurl() {
  const urls = [
    'https://organizador.o-girador.com/?groupe=Samambaia',
    'https://organizador.o-girador.com/?groupe=sambabulles',
    'https://organizador.o-girador.com/rejoindre/Samambaia',
    'https://organizador.o-girador.com/rejoindre/sambabulles'
  ];
  for (const url of urls) {
    console.log('\n--- Checking', url, '---');
    const res = await fetch(url, { headers: { 'User-Agent': 'WhatsApp/2.21.12.21 A' } });
    const text = await res.text();
    const ogTitle = text.match(/<meta property="og:title" content="(.*?)"/);
    const ogImage = text.match(/<meta property="og:image" content="(.*?)"/);
    console.log('Status:', res.status);
    console.log('og:title:', ogTitle ? ogTitle[1] : 'NOT FOUND');
    console.log('og:image:', ogImage ? ogImage[1] : 'NOT FOUND');
  }
}
checkCurl().catch(console.error);
