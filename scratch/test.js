const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.document = dom.window.document;
global.Node = dom.window.Node;

const parseLyricsString = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  
  const isHtml = /<[a-z][\s\S]*>/i.test(htmlString);
  if (!isHtml) return htmlString;
  
  const div = document.createElement('div');
  div.innerHTML = htmlString
    .replace(/<\/?(p|div)[^>]*>/gi, (match) => match.startsWith('</') ? '<br/>' : '')
    .replace(/&nbsp;/gi, ' ');
    
  const blocks = [];
  let currentLineText = "";
  let currentLineHasBold = false;
  let hasAnyPuxador = false;

  const traverse = (node, isBold) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        currentLineText += text;
        if (isBold && text.trim().length > 0) {
          currentLineHasBold = true;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName.toLowerCase() === 'br') {
        commitLine();
      } else {
        const isNodeBold = isBold || 
                           node.tagName.toLowerCase() === 'b' || 
                           node.tagName.toLowerCase() === 'strong' ||
                           (node.style && node.style.fontWeight && (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 600)) ||
                           (node.className && (node.className.includes('font-bold') || node.className.includes('font-black')));

        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i], isNodeBold);
        }
      }
    }
  };

  const commitLine = () => {
    const textContent = currentLineText.trim();
    if (!textContent) {
      blocks.push(' ');
    } else {
      if (currentLineHasBold) {
        blocks.push({ puxador: textContent });
        hasAnyPuxador = true;
      } else {
        blocks.push({ coro: textContent });
      }
    }
    currentLineText = "";
    currentLineHasBold = false;
  };

  traverse(div, false);
  commitLine();
  
  if (!hasAnyPuxador) {
    return htmlString; // Fallback to raw string if no bold found
  }
  
  while (blocks.length > 0 && (typeof blocks[blocks.length - 1] === 'string' && blocks[blocks.length - 1].trim() === '')) {
    blocks.pop(); // Clean trailing empty spaces
  }
  
  return blocks;
};

console.log(parseLyricsString(`
<p>
  <b>Line 1<br>Line 2</b>
</p>
<p>
  Line 3<br>
  <strong>Line 4</strong>
</p>
`));

console.log(parseLyricsString(`<b>Bold but split<br/>across lines</b><br/>Coro part`));
