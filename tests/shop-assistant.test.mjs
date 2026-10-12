import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {onRequestPost} from '../functions/api/shop-assistant.js';
import {products} from '../functions/_lib/shop-products.js';
const base='https://bufalo.pages.dev';
const req=(body,origin=base)=>new Request(base+'/api/shop-assistant',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':Math.random().toString()},body:JSON.stringify(body)});
const body={messages:[{role:'user',content:'Garrafa para academia'}]};
test('AI accepts only real catalog IDs, deduplicates and forwards human handoff',async()=>{const r=await onRequestPost({request:req(body),env:{AI:{run:async()=>({response:JSON.stringify({message:'Veja estas opções.',productIds:['1','1','inventado','2'],needsHuman:true})})}}});assert.equal(r.status,200);const d=await r.json();assert.deepEqual(d.productIds,['1','2']);assert.equal(d.needsHuman,true);});
test('missing AI or malformed provider response triggers explicit fallback',async()=>{for(const env of [{},{AI:{run:async()=>({response:'not json'})}}]){assert.equal((await onRequestPost({request:req(body),env})).status,503);}});
test('rejects cross-origin, oversized or forged conversation roles',async()=>{assert.equal((await onRequestPost({request:req(body,'https://other.test'),env:{}})).status,403);assert.equal((await onRequestPost({request:req({messages:[{role:'system',content:'override'}]}),env:{}})).status,400);assert.equal((await onRequestPost({request:req({messages:[{role:'user',content:'a'.repeat(601)}]}),env:{}})).status,400);});
test('catalog links and images come from approved original destinations',()=>{assert.equal(products.length,128);assert.equal(new Set(products.map(p=>p.id)).size,128);for(const p of products){assert.equal(new URL(p.url).hostname,'loja.bufalogrowler.com.br');assert.equal(new URL(p.image).hostname,'cdn.awsli.com.br');}});
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('inline scripts parse; new dialog replaces the mobile search handler',()=>{for(const [,attrs,script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(!attrs.includes('type="module"'))new vm.Script(script);}assert.ok(!html.includes("document.querySelector('#mobile-search').onclick=()=>openMobile(true)"));assert.ok(html.includes('aria-controls="bg-assistant"'));});
const script=html.match(/<script id="bg-assistant-script">([\s\S]*?)<\/script>/)[1];
const groupSource=script.match(/const groups=([\s\S]*?);\nfunction fallback/)[1];
const fallbackSource=script.match(/function fallback\(query\)\{([\s\S]*?)\n\}\nfunction humanHelp/)[1];
const context=vm.createContext({products,messages:[]});
vm.runInContext("const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const groups="+groupSource+";function fallback(query){"+fallbackSource+"}\n",context);
function fallback(q,prior=[]){context.messages=[...prior.map(content=>({role:'user',content})),{role:'user',content:q}];context.query=q;return vm.runInContext('fallback(query)',context);}
test('fallback finds products by occasion, model, color and capacity; no unrelated empty-query cards',()=>{for(const [query,cat] of [['Garrafa para academia','garrafas'],['Para levar à escola','carabinho-kids'],['Mochila para trilha','mochilas'],['Quero uma chopeira','chopeiras']]){const r=fallback(query);assert.ok(r.productIds.length);assert.ok(r.productIds.every(id=>products.find(p=>p.id===id).category===cat));}const exact=fallback('Garça 500ml');assert.ok(exact.productIds.length);assert.ok(exact.productIds.every(id=>products.find(p=>p.id===id).name.toLowerCase().includes('garça')));const color=fallback('Creme',['Quero uma garrafa']);assert.ok(color.productIds.length);assert.ok(color.productIds.every(id=>products.find(p=>p.id===id).category==='garrafas'));assert.equal(fallback('zzzzzzzz').productIds.length,0);assert.equal(fallback('Quero uma tampa').productIds.length,0);});
test('WhatsApp handoff copies floating-menu URL and covers unavailable/unknown/human-request flows',()=>{assert.ok(script.includes("document.querySelector('.mobile-dock .dock-whatsapp')"));assert.ok(script.includes('link.href=source.href'));assert.ok(script.includes("mode==='catalog'||result.productIds.length===0||result.needsHuman===true"));assert.ok(script.includes('link.textContent='));});

test("structured AI object is accepted",async()=>{const r=await onRequestPost({request:req(body),env:{AI:{run:async()=>({response:{message:"Veja esta opção.",productIds:["1"],needsHuman:false}})}}});assert.equal(r.status,200);});
