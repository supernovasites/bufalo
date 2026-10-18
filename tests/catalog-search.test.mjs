import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,safeProduct} from '../functions/api/catalog-search.js';
const base='https://www.bufalogrowler.com.br',store='https://loja.bufalogrowler.com.br';
const request=(q,origin=store)=>new Request(base+'/api/catalog-search?q='+encodeURIComponent(q),{headers:{Origin:origin}});
test('only public store product URLs and HTTPS CDN images are accepted',()=>{
 const p={name:'Copo Ravi',url:store+'/copo-ravi-483ml',image:'https://cdn.awsli.com.br/test.jpg'};
 assert.ok(safeProduct(p));assert.equal(safeProduct({...p,url:'https://evil.test/'}),null);assert.equal(safeProduct({...p,image:'javascript:alert(1)'}),null);
});
test('validates origin and query length before consulting the store',async()=>{
 assert.equal((await onRequestGet({request:request('ravi','https://evil.test')})).status,403);
 assert.equal((await onRequestGet({request:request('x'.repeat(81))})).status,400);
 assert.deepEqual((await (await onRequestGet({request:request('r')})).json()).products,[]);
});
test('parses streamed store cards and encodes query text',async()=>{
 const originalFetch=globalThis.fetch,originalParser=globalThis.HTMLRewriter;let fetched;
 globalThis.fetch=async url=>{fetched=url;return new Response('<html></html>');};
 globalThis.HTMLRewriter=class{
  handlers={};on(selector,handler){this.handlers[selector]=handler;return this;}
  transform(){const h=this.handlers;h['.listagem-item'].element();h['.listagem-item .nome-produto'].element({getAttribute:()=>store+'/copo-ravi-483ml'});h['.listagem-item .nome-produto'].text({text:'Copo '});h['.listagem-item .nome-produto'].text({text:'Ravi 483ml'});h['.listagem-item .imagem-produto img'].element({getAttribute:key=>key==='src'?'https://cdn.awsli.com.br/ravi.jpg':null});return new Response('');}
 };
 try{const response=await onRequestGet({request:request('ravi & copos')});const data=await response.json();assert.equal(fetched,store+'/buscar?q=ravi%20%26%20copos');assert.equal(data.source,'loja-integrada');assert.equal(data.products[0].name,'Copo Ravi 483ml');assert.equal(response.headers.get('Access-Control-Allow-Origin'),store);}finally{globalThis.fetch=originalFetch;globalThis.HTMLRewriter=originalParser;}
});
test('uses the verified catalog only when the store cannot be reached',async()=>{
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('offline');};
 try{const data=await (await onRequestGet({request:request('Jafarabadi')})).json();assert.equal(data.source,'catalogo-verificado');assert.ok(data.products.length);assert.ok(data.products.every(p=>p.name.includes('Jafarabadi')));}finally{globalThis.fetch=originalFetch;}
});
