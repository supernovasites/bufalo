import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../live/catalog-data.json',import.meta.url),'utf8'));
const html=readFileSync(new URL('../live/index.html',import.meta.url),'utf8');
const required=['chopeiras','nagpro','pandhar','cutelaria','mochilas','cadeiras','garrafas','copos-bg','camisas-shorts','souvenir-e-jogos','alcas-e-bags','tampas-e-acessorios','adesivos','carabinho-kids'];
test('all 14 requested source categories render with valid unique anchor IDs',()=>{
 assert.deepEqual(data.categories.map(c=>new URL(c.url).pathname.slice(1)),required);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const c of data.categories){assert.ok(ids.includes(c.id));assert.ok(html.includes('data-category-source="'+c.url+'"'));}
 assert.ok(!html.includes('src="category-groups.js'));
});
test('every available color/model is rendered exactly once within each source category',()=>{
 const products=new Map(data.products.map(p=>[p.url,p]));
 const expected=new Map();
 for(const c of data.categories)for(const url of c.products)for(const option of products.get(url)?.cards||[])expected.set(option.key,(expected.get(option.key)||0)+1);
 const actual=new Map();for(const m of html.matchAll(/data-variant-key="([^"]+)"/g))actual.set(m[1],(actual.get(m[1])||0)+1);
 assert.deepEqual([...actual].sort(),[...expected].sort());
 assert.equal([...actual.values()].reduce((a,b)=>a+b,0),409);
 assert.equal(data.products.reduce((n,p)=>n+p.cards.length,0),387);
});
test('out-of-stock SKUs are excluded and each card retains its verified price and coupon',()=>{
 const audit=JSON.parse(readFileSync(new URL('../docs/live-catalog-exclusions-2026-10-13.json',import.meta.url),'utf8'));
 const excluded=new Set(audit.excluded.map(o=>o.sku));
 const keys=new Set();
 for(const product of data.products)for(const option of product.cards){
   assert.equal(option.stock,'in_stock');assert.ok(option.skus.length);
   assert.ok(option.skus.every(sku=>!excluded.has(sku)));
   assert.ok(Number.isFinite(option.price)&&option.price>0);
   assert.ok(option.image.startsWith('https://cdn.awsli.com.br/'));
   assert.ok(!keys.has(option.key));keys.add(option.key);
 }
 for(const m of html.matchAll(/<article\b[^>]*data-variant-key="([^"]+)"[\s\S]*?<\/article>/g)){
   const option=data.products.flatMap(p=>p.cards).find(c=>c.key===m[1]);
   assert.ok(m[0].includes('__LIVE_COUPON__'));
   assert.ok(m[0].includes((Math.round(option.price*80)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})));
 }
});
