import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../catalogo/index.html',import.meta.url),'utf8');
const evidence=JSON.parse(readFileSync(new URL('../docs/product-prices-2026-10-20.json',import.meta.url),'utf8'));
const colors=JSON.parse(home.match(/const productColors=(\{[^\n]+?\});/)[1]);
const products=JSON.parse(home.match(/const officialProducts=(\[[^\n]+?\]);/)[1]);
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const renderCode=home.slice(home.indexOf('function thermalPrice'),home.indexOf("rail.addEventListener('click',async",home.indexOf('function renderThermal')));
const listenerStart=home.indexOf("rail.addEventListener('click',event=>{",home.indexOf('selectThermal(thermalTabs['));
const listenerCode=home.slice(listenerStart,home.indexOf('function railState',listenerStart));
test('requested variant prices render and update on home color selection',()=>{
 for(const offer of evidence.offers){
  const slug=new URL(offer.url).pathname.slice(1),product={...products.find(p=>p.url===slug),defaultColor:offer.variationId};
  const priceNode={},installments={},label={},img={},photo={querySelector:()=>img,classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){}};
  const button={dataset:{color:offer.variationId},getAttribute:()=>false};
  const card={dataset:{product:'0'},querySelector:s=>s==='.photo'?photo:s==='.price'?priceNode:s==='.installments'?installments:s==='.selected-color strong'?label:{},querySelectorAll:()=>[{setAttribute(){}}]};button.closest=()=>card;
  let listener;
  const rail={innerHTML:'',addEventListener:(event,fn)=>listener=fn};
  const context=vm.createContext({officialProducts:[product],officialGroups:{garrafas:[slug]},productColors:colors,visibleProducts:[],rail,railState(){},money,Image:class{set src(value){this.onload();}}});
  vm.runInContext(renderCode+'renderThermal("garrafas");'+listenerCode,context);
  assert.ok(rail.innerHTML.includes(money(offer.price)),offer.sku+' initial');
  assert.ok(rail.innerHTML.includes('R$ '+offer.pay),offer.sku+' installments');
  listener({target:{closest:()=>button}});
  assert.ok(priceNode.innerHTML.includes(money(offer.price)),offer.sku+' selected');
  assert.equal(installments.textContent,'até 6x de R$ '+offer.pay+' sem juros');
  const regular=colors[slug].find(c=>!c.oldPrice);
  if(regular){button.dataset.color=regular.id;listener({target:{closest:()=>button}});assert.equal(priceNode.innerHTML,money(regular.price));}
 }
});
test('category selectors carry every requested available variant price and update after image load',()=>{
 const articles=[...catalog.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const script=readFileSync(new URL('../catalogo/catalogo.js',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const start=script.indexOf("document.addEventListener('click',event=>{\n  const button=event.target.closest('.catalog-card .color-swatch');");
 const end=script.indexOf('const indexLinks=',start);
 for(const offer of evidence.offers){
  const slug=new URL(offer.url).pathname.slice(1),color=colors[slug].find(c=>c.id===offer.variationId);
  const article=articles.find(c=>c.includes('href="'+offer.url+'"'));
  const tag=[...article.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).find(b=>b.includes(color.img.split('/').pop()));
  assert.ok(tag?.includes('data-color-price="'+offer.price+'"'),offer.sku);
  const button={dataset:Object.fromEntries([...tag.matchAll(/data-color-([a-z-]+)="([^"]*)"/g)].map(m=>['color'+m[1].replace(/(^|-)(\w)/g,(_,a,c)=>c.toUpperCase()),m[2]])),getAttribute:()=>false,setAttribute(){}};
  const nodes={'.price':{},'.installments':{},'.selected-color strong':{},'h3':{textContent:slug}};
  const photo={setAttribute(){},removeAttribute(){},querySelector:()=>({})};nodes['.photo']=photo;
  const card={dataset:{},querySelector:s=>nodes[s],querySelectorAll:()=>[button]};button.closest=()=>card;
  let listener;vm.runInNewContext(script.slice(start,end),{document:{addEventListener:(event,fn)=>listener=fn},Image:class{set src(value){this.onload();}}});
  listener({target:{closest:()=>button}});
  assert.ok(nodes['.price'].innerHTML.includes(money(offer.price)),offer.sku);
  assert.equal(nodes['.installments'].textContent,'até 6x de R$ '+offer.pay+' sem juros');
 }
});
test('live uses verified store price before the existing 20 percent coupon',()=>{
 const data=JSON.parse(readFileSync(new URL('../live/catalog-data.json',import.meta.url),'utf8'));
 const html=readFileSync(new URL('../live/index.html',import.meta.url),'utf8');
 for(const offer of evidence.offers){
  const option=data.products.find(p=>p.url===offer.url).cards.find(c=>c.variationIds.includes(offer.variationId));
  assert.equal(option.price,offer.price);assert.deepEqual(option.prices,[offer.price]);
  const article=[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]).find(c=>c.includes('data-variant-key="'+option.key+'"'));
  if(!data.categories.some(c=>c.products.includes(offer.url))){assert.equal(article,undefined);continue;}
  assert.ok(article,offer.sku+' exists in live');
  assert.ok(article.includes(money(Math.round(offer.price*80)/100)),offer.sku);
 }
 for(const file of ['live/index.html'])assert.equal(readFileSync(new URL('../'+file,import.meta.url),'utf8'),readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'));
});
