import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('footer can mount in the store without replacing its header or menu',()=>{
 let html='';const placeholder={set outerHTML(value){html=value;}};
 const document={readyState:'complete',querySelector:selector=>selector==='[data-bg-footer]'?placeholder:null};
 vm.runInNewContext(readFileSync(new URL('../assets/site-shell.js',import.meta.url),'utf8'),{document,window:{}});
 assert.ok(html.includes('id="bg-site-footer"'));assert.ok(html.includes('Feito pra ser livre'));
 assert.ok(html.includes('href="https://www.bufalogrowler.com.br/"'));
 assert.ok(!html.includes('href="/bufalo"'));
});

const publicPages = ["index.html", "404.html", "catalogo/index.html", "blog/index.html", "blog/artigo.html", "manadacash/index.html", "live/index.html", "live/encerrada.html", "live/games/index.html", "manadaone/index.html", "manadaone/encerrada.html", "campanhas/cirio/index.html", "campanhas/black26/index.html", "reserva/acaibowl/index.html", "produtos/chopeira/index.html", "produtos/garrafas/index.html", "produtos/copos/index.html"];
test('all public pages load the same revalidated shell and reserve both components',()=>{
 for(const path of publicPages){
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.equal((html.match(/data-bg-header/g)||[]).length,1,path+' header');
  assert.equal((html.match(/data-bg-footer/g)||[]).length,1,path+' footer');
  assert.equal((html.match(/src="\/assets\/site-shell.js"/g)||[]).length,1,path+' script');
  assert.equal((html.match(/data-bg-shell-style href="\/assets\/site-shell.css"/g)||[]).length,1,path+' stylesheet');
  assert.ok(!html.includes('footer-payment-flags-script'),path+' has no private footer patch');
 }
});
test('shared footer includes the payment information previously limited to the homepage',()=>{
 let html='';const placeholder={set outerHTML(value){html=value;}};
 const document={readyState:'complete',querySelector:s=>s==='[data-bg-footer]'?placeholder:null};
 vm.runInNewContext(readFileSync(new URL('../assets/site-shell.js',import.meta.url),'utf8'),{document,window:{}});
 assert.ok(html.includes('Formas de pagamento'));
 assert.ok(html.includes('Google Pay'));
 assert.ok(html.includes('Apple Pay'));
});
