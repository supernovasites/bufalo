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
  assert.ok(!card.includes('class="live-saving"'));
 }
 const bubas=cards.filter(([s,b,o])=>s.includes('Garrafa Buba 355ml')&&Number(b)===119);
 assert.ok(bubas.length>=7);
 for(const [s,,o] of bubas){assert.equal(Number(o),170);assert.ok(s.includes(money(95.2)));assert.ok(!s.includes('class="live-saving"'));}
 assert.equal(html,readFileSync(new URL('../dist/live/index.html',import.meta.url),'utf8'));
});
test('browser refinement preserves current store price and original price after repeated runs',()=>{
 const source=readFileSync(new URL('../live/preview-refinement.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('    const format ='),source.indexOf('    const topButton'));
 const nodes={'.old s':{textContent:money(170)},'.price':{},'.live-saving':{},'.badge':{}};
 const card={dataset:{basePrice:'119',originalPrice:'170',discount:'20'},querySelector:s=>nodes[s]};
 for(let i=0;i<2;i++)vm.runInNewContext(code,{document:{querySelectorAll:()=>[card]}});
 assert.equal(nodes['.old s'].textContent,money(170));assert.equal(nodes['.price'].textContent,money(95.2));
});


test('catalog shows one saving badge and the combined percentage without adding discounts',()=>{
 const source=readFileSync(new URL('../live/catalog-navigation.js',import.meta.url),'utf8');
 const run=(original,final)=>{
  const badges=[];
  const node=()=>({textContent:'',className:'',classList:{add(){}},setAttribute(){}});
  const image={querySelector:s=>s==='.badge'?badges.find(b=>b.className==='badge'):badges.find(b=>b.className==='catalog-total-discount'),prepend:b=>badges.unshift(b),append:b=>badges.push(b)};
  const card={querySelector:s=>({'.old s':{textContent:money(original)},'.price':{textContent:money(final)},'.product-image':image}[s])};
  const context={document:{querySelectorAll:()=>[card],querySelector:()=>({}),createElement:node,addEventListener(){}},MutationObserver:class{observe(){}},requestAnimationFrame(){}};
  vm.runInNewContext(source,context);vm.runInNewContext(source,context);
  assert.equal(badges.length,2);
  assert.equal(badges[0].textContent,'Economize '+money(original-final));
  return badges[1].textContent;
 };
 assert.equal(run(170,95.2),'−44%');
 assert.equal(run(100,64),'−36%');
 assert.equal(run(100,80),'−20%');
});
