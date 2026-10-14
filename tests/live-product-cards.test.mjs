import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('every catalog card has separate image and purchase links with coupons outside links',()=>{
 const html=readFileSync(new URL('../live/index.html',import.meta.url),'utf8');
 const cards=[...html.matchAll(/<article\b[^>]*class="[^"]*\bproduct\b[^"]*"[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const catalog=JSON.parse(readFileSync(new URL('../live/catalog-data.json',import.meta.url),'utf8'));
 const byUrl=new Map(catalog.products.map(p=>[p.url,p]));
 assert.equal(cards.length,catalog.categories.reduce((n,c)=>n+c.products.reduce((sum,url)=>sum+(byUrl.get(url)?.cards.length||0),0),0));
 for(const card of cards){
   assert.match(card,/<a\b[^>]*class="[^"]*product-cta/);
   for(const link of card.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g))assert.ok(!link[1].includes('with-coupon'));
   if(card.includes('data-availability="unavailable"')){assert.ok(!card.includes('class="with-coupon"'));assert.ok(card.includes('card-stock-status'));}
 }
 assert.equal(cards.filter(c=>c.includes('data-availability="unavailable"')).length,0);
 assert.ok(cards.every(c=>c.includes('data-stock="in_stock"')));
 assert.ok(!html.includes('href="https://loja.bufalogrowler.com.br/copo-surti-600ml?'));
 assert.ok(!html.includes('href="https://loja.bufalogrowler.com.br/bone-trucker-manada-bg?'));
});
test('carousel arrows recalculate when category grouping moves cards into the track',()=>{
 const buttons=[{dataset:{direction:'-1'},addEventListener(){}},{dataset:{direction:'1'},addEventListener(){},classList:{remove(){}}}];
 const track={scrollWidth:200,clientWidth:500,scrollLeft:0,addEventListener(){}};
 const row={querySelector:()=>track,querySelectorAll:()=>buttons};
 let onMutation;
 vm.runInNewContext(readFileSync(new URL('../live/product-rows.js',import.meta.url),'utf8'),{
  document:{querySelectorAll:selector=>selector==='.product-row'?[row]:[]},matchMedia:()=>({matches:true}),
  ResizeObserver:class{observe(){}},MutationObserver:class{constructor(callback){onMutation=callback;}observe(){}}
 });
 assert.equal(buttons[1].disabled,true);
 track.scrollWidth=900;onMutation();assert.equal(buttons[1].disabled,false);
 track.scrollLeft=400;onMutation();assert.equal(buttons[1].disabled,true);assert.equal(buttons[0].disabled,false);
});
