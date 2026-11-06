import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const tracker=fs.readFileSync('assets/home-clicks.js','utf8');
const html=fs.readFileSync('produtos/chopeira/index.html','utf8');
const fixtures=[...html.matchAll(/<section\b[^>]*class="([^"]*\bontap-product\b[^"]*)"[^>]*>([\s\S]*?)<\/section>/g)];
assert.ok(fixtures.length>=13,'real product and accessory sections exist');
for(const path of ['/chopeira/','/produtos/chopeira/']) {
 for(const [,classes,body] of fixtures){
  const heading=body.match(/<(h[23])\b[^>]*>([^<]+)<\/h[23]>/);
  const href=body.match(/<a\b[^>]*href="(https:\/\/loja\.bufalogrowler\.com\.br\/[^\"]+)"/)[1].replaceAll('&amp;','&');
  for(const mode of ['purchase','coupon','whatsapp']){
   const events=[],listeners={};
   class Element{}
   const matchesClass=selector=>selector.split(',').some(s=>s.startsWith('.')&&classes.split(/\s+/).includes(s.slice(1)));
   const product={matches:matchesClass,id:'product',getAttribute:()=>null,querySelector:selector=>selector.split(',').includes(heading[1])?{textContent:heading[2]}:null};
   const action=new Element();
   const url=mode==='whatsapp'?'https://wa.me/5591984973370?text=private':href;
   Object.assign(action,{dataset:{},id:'',textContent:mode==='coupon'?'Copiar cupom':'Comprar agora',classList:{contains:c=>c==='button'},matches:s=>s==='a[href]'?mode!=='coupon':false,getAttribute:n=>n==='href'?url:null,querySelector:()=>null,closest:s=>s==='section'?product:matchesClass(s)?product:null});
   const node=new Element();node.closest=()=>action;
   vm.runInNewContext(tracker,{Element,window:{scrollY:0,addEventListener(){}},document:{documentElement:{scrollHeight:5000},body:{scrollHeight:5000},readyState:'complete',addEventListener:(n,f)=>listeners[n]=f},location:{hostname:'bufalogrowler.com.br',pathname:path,href:'https://bufalogrowler.com.br'+path},innerWidth:400,innerHeight:1000,navigator:{sendBeacon:(u,b)=>{events.push(b.data);return true}},Blob:class{constructor(p){this.data=JSON.parse(p[0])}},localStorage:{getItem:()=>'',setItem(){}},requestAnimationFrame:f=>f(),URL});
   listeners.click({isTrusted:true,target:node});
   const products=events.filter(e=>e.kind==='product');
   assert.equal(products.length,mode==='purchase'?1:0);
   if(mode==='purchase'){
    assert.equal(products[0].label,heading[2]);
    assert.equal(products[0].page,'/produtos/chopeira/');
    assert.equal(products[0].target,new URL(href).hostname+new URL(href).pathname);
    assert.ok(!products[0].target.includes('?'));
    listeners.click({isTrusted:true,target:node});
    assert.equal(events.filter(e=>e.kind==='product').length,1,'duplicate click suppressed');
   }
  }
 }
}
assert.equal(fs.readFileSync('dist/assets/home-clicks.js','utf8'),tracker);
console.log(`PASS: ${fixtures.length} real Chopeira product/accessory cards, both routes, names, targets, deduplication, coupon/WhatsApp exclusions and dist parity.`);
