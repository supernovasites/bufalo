import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('all seventeen chopeira offers show regular and Black20 prices without weekend overwrite',()=>{
 const html=read('produtos/chopeira/index.html');
 const offers=[...html.matchAll(/<div class="black20-offer" data-black20-original="([\d.]+)">([\s\S]*?)<\/div>/g)];
 assert.equal(offers.length,17);
 for(const [,original,body] of offers){
  const currency=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
  assert.ok(body.includes('<s>'+currency(Number(original))+'</s>'));
  assert.ok(body.includes(currency(Math.round(Number(original)*80)/100)));
  assert.match(body,/type="button" aria-label="Copiar cupom Black20"/);
 }
 assert.ok(!html.includes('src="kit-price.js'));
 for(const f of ['index.html','black20.js','black20.css'])assert.equal(read('produtos/chopeira/'+f),read('dist/produtos/chopeira/'+f));
});
test('copies exact coupon and announces success or a failed fallback',async()=>{
 for(const fail of [false,true]){
  let click,copied,removed=false;const status={};
  const button={parentElement:{querySelector:()=>status},addEventListener:(_,fn)=>click=fn,focus(){}};
  vm.runInNewContext(read('produtos/chopeira/black20.js'),{navigator:{clipboard:{writeText:async value=>{if(fail)throw Error();copied=value;}}},window:{},document:{querySelectorAll:()=>[button],body:{append(){}},createElement:()=>({style:{},setAttribute(){},select(){},remove(){removed=true;}}),execCommand:()=>false}});
  await click();
  if(fail){assert.equal(removed,true);assert.match(status.textContent,/Digite Black20/);}else{assert.equal(copied,'Black20');assert.match(status.textContent,/Cupom copiado/);}
 }
});

test('2L variants show 1245 regular and 996 with coupon; popup has functional controls',()=>{
 const html=read('produtos/chopeira/index.html');
 assert.equal((html.match(/data-black20-original="1245"/g)||[]).length,6);
 assert.equal((html.match(/R\$\s*996,00/g)||[]).length,6);
 assert.equal((html.match(/class="black20-condition"/g)||[]).length,17);
 assert.match(html,/<dialog class="black20-popup"/);
 assert.match(html,/class="black20-popup-shop bw-cta"/);
 for(const f of ['black20-popup.js','images/black20-popup-weekend-original-20261105.png']){
  if(f.endsWith('.js'))assert.equal(read('produtos/chopeira/'+f),read('dist/produtos/chopeira/'+f));
  else assert.deepEqual(readFileSync(new URL('produtos/chopeira/'+f,root)),readFileSync(new URL('dist/produtos/chopeira/'+f,root)));
 }
});
test('popup opens once per session without blocking on silent decorative video',()=>{
 let opened=0,timer;const storage=new Map(),handlers={};
 const popup={showModal(){opened++},querySelector(){return {addEventListener(){}}},addEventListener(e,fn){handlers[e]=fn}};
 const context={document:{getElementById:()=>popup,querySelector:()=>null,querySelectorAll:()=>[{paused:false,controls:false,muted:true}],body:{style:{overflow:''}},hidden:false},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>timer=fn};
 vm.runInNewContext(read('produtos/chopeira/black20-popup.js'),context);timer();assert.equal(opened,1);timer();assert.equal(opened,1);handlers.close();assert.equal(context.document.body.style.overflow,'');
});

test('2L colors are individual linked variants starting pink then black; chocolate 3.5L is present',()=>{
 const html=read('produtos/chopeira/index.html');
 const cards=[...html.matchAll(/<section class="ontap-product[^"]*" id="(ontap-2l-[^"]+)"[\s\S]*?<\/section>/g)];
 assert.deepEqual(cards.map(c=>c[1]),['ontap-2l-rosa','ontap-2l-preta','ontap-2l-azul','ontap-2l-verde','ontap-2l-mostarda','ontap-2l-urucum']);
 for(const c of cards){assert.match(c[0],/bufaloontap2l\?sku=OnTap2L-/);assert.match(c[0],/-oficial.png/);}
 assert.match(html,/id="ontap-35-chocolate"/);
 const data=JSON.parse(read('produtos/chopeira/products.json'));
 assert.equal(data.products.filter(p=>p.slug.startsWith('ontap-2l-')).length,6);
 assert.ok(data.products.every(p=>p.specs?.length));
 assert.match(html,/Black Búfalo\.<br><span>Seu brinde,/);
});
