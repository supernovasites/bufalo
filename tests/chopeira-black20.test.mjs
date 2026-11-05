import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('all twelve chopeira offers show regular and Black20 prices without weekend overwrite',()=>{
 const html=read('produtos/chopeira/index.html');
 const offers=[...html.matchAll(/<div class="black20-offer" data-black20-original="([\d.]+)">([\s\S]*?)<\/div>/g)];
 assert.equal(offers.length,12);
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
