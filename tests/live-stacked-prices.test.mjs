import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const html=readFileSync(new URL('../live/index.html',import.meta.url),'utf8');
const cards=[...html.matchAll(/<article\b[^>]*data-base-price="([^"]+)"[^>]*data-original-price="([^"]+)"[\s\S]*?<\/article>/g)];
test('all live cards show original price, stacked coupon and total savings',()=>{
 assert.ok(cards.length>350);
 for(const [card,base,original] of cards){
  const final=Math.round(Number(base)*80)/100;
  assert.ok(card.includes('<s>'+money(Number(original))+'</s>'));
  assert.ok(card.includes('class="price">'+money(final)));
  assert.ok(card.includes('Economize '+money(Math.round((Number(original)-final)*100)/100)));
 }
 const bubas=cards.filter(([s,b,o])=>s.includes('Garrafa Buba 355ml')&&Number(b)===119);
 assert.ok(bubas.length>=7);
 for(const [s,,o] of bubas){assert.equal(Number(o),170);assert.ok(s.includes(money(95.2)));assert.ok(s.includes(money(74.8)));}
 assert.equal(html,readFileSync(new URL('../dist/live/index.html',import.meta.url),'utf8'));
});
test('browser refinement preserves current store price and original price after repeated runs',()=>{
 const source=readFileSync(new URL('../live/preview-refinement.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('    const format ='),source.indexOf('    const topButton'));
 const nodes={'.old s':{textContent:money(170)},'.price':{},'.live-saving':{},'.badge':{}};
 const card={dataset:{basePrice:'119',originalPrice:'170',discount:'20'},querySelector:s=>nodes[s]};
 for(let i=0;i<2;i++)vm.runInNewContext(code,{document:{querySelectorAll:()=>[card]}});
 assert.equal(nodes['.old s'].textContent,money(170));assert.equal(nodes['.price'].textContent,money(95.2));assert.equal(nodes['.live-saving'].textContent,'Economize '+money(74.8));
});
