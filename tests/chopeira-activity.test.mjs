import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
globalThis.crypto??=webcrypto;
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('functions/api/chopeira-activity.js',root),'utf8');
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source.replace(/^import .*;$/m,"const ensureHomepageStats=async()=>{};const belemDay=()=> '2026-11-14';")).toString('base64'));
const writes=[];
const db={prepare(sql){return {bind(...args){writes.push({sql,args});return this},async run(){},async first(){return {total:sql.includes('active_visitors')?4:18}}}},async batch(queries){return queries}};
const request=(body,origin='https://example.com')=>new Request('https://example.com/api/chopeira-activity',{method:'POST',headers:{Origin:origin},body:JSON.stringify(body)});
const visitor='12345678-1234-1234-1234-123456789abc';
let response=await onRequest({request:request({visitor}),env:{LIVE_DB:db}});
assert.equal(response.status,200);assert.deepEqual(await response.json(),{available:true,viewers:4,activeWindowSeconds:90});
const write=writes.find(x=>x.sql.startsWith('INSERT'));assert.equal(write.args[0].length,64);assert.notEqual(write.args[0],visitor);
assert.equal((await onRequest({request:request({visitor},'https://other.com'),env:{LIVE_DB:db}})).status,403);
assert.equal((await onRequest({request:request({visitor:'invalid'}),env:{LIVE_DB:db}})).status,400);
assert.equal((await onRequest({request:request({visitor}),env:{}})).status,503);
const client=await readFile(new URL('produtos/chopeira/activity-popup.js',root),'utf8');
async function render(data,random=.999){
 const elements=new Map();for(const key of ['.chopeira-activity-message','.chopeira-activity-detail','button','a'])elements.set(key,{});
 let visible=false;const toast={setAttribute(){},querySelector:s=>elements.get(s),classList:{add(){visible=true},remove(){visible=false}},contains:()=>false};
 const timers=[],storage={getItem:()=>null,setItem(){}};
 const context={crypto:webcrypto,localStorage:storage,sessionStorage:storage,AbortController,Date,Math:Object.assign(Object.create(Math),{random:()=>random}),document:{hidden:false,createElement:()=>toast,body:{append(){}},querySelector:()=>null,addEventListener(){}},fetch:async()=>({ok:true,json:async()=>data}),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval(){},clearInterval(){},addEventListener(){}};
 vm.runInNewContext(client,context);await new Promise(resolve=>setImmediate(resolve));const delay=4000;const first=timers.find(x=>x.ms===delay);assert.ok(first,'initial delay uses an allowed interval');first.fn();return {elements,timers,visible};
}
for(const random of [0,.25,.5,.999]){
 const {elements,timers,visible}=await render({available:true,viewers:4,visitorsToday:18},random);
 assert.equal(elements.get('.chopeira-activity-message').textContent,'4 usuários estão visualizando esta página');assert.equal(visible,true);
 const hide=timers.find(x=>x.ms===2000);assert.ok(hide);hide.fn();assert.ok(timers.filter(x=>x.ms===4000).length>=2,'next delay uses the same allowed list');
}
let out=await render({available:true,viewers:1});assert.equal(out.elements.get('.chopeira-activity-message').textContent,'1 usuário está visualizando esta página');
for(const data of [{available:false},{available:true,viewers:0},{available:true,viewers:-2},{available:true,viewers:1.5}]){out=await render(data);assert.equal(out.visible,false);}
assert.ok(!client.includes('visitorsToday'));assert.ok(!client.includes('Escolher minha chopeira'));assert.ok(!client.includes('pessoas visitaram hoje'));
console.log('PASS: real viewer counts only; singular/plural; invalid or unavailable counts stay hidden; visible for 2 seconds plus 4 hidden seconds, 10 displays per minute; dismiss and API validation preserved.');
