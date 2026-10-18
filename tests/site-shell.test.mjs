import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('footer can mount in the store without replacing its header or menu',()=>{
 let html='';const placeholder={set outerHTML(value){html=value;}};
 const document={readyState:'complete',querySelector:selector=>selector==='[data-bg-footer]'?placeholder:null};
 vm.runInNewContext(readFileSync(new URL('../assets/site-shell.js',import.meta.url),'utf8'),{document});
 assert.ok(html.includes('id="bg-site-footer"'));assert.ok(html.includes('Feito pra ser livre'));
 assert.ok(html.includes('href="https://www.bufalogrowler.com.br/"'));
 assert.ok(!html.includes('href="/bufalo"'));
});
