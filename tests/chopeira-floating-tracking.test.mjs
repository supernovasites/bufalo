import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/home-clicks.js','utf8');
for(const pathname of ['/chopeira/','/produtos/chopeira/']) {
 const events=[],listeners={};
 let now=1000;
 class Element {}
 const action=new Element();
 Object.assign(action,{className:'faq-shortcut',textContent:'Tirar dúvida',matches(s){return s==='.'+this.className},closest(){return null}});
 const icon=new Element();icon.closest=()=>action;
 vm.runInNewContext(source,{Element,Date:{now:()=>now},window:{scrollY:0,addEventListener(){}},document:{documentElement:{scrollHeight:5000},body:{scrollHeight:5000},readyState:'complete',addEventListener:(n,f)=>listeners[n]=f},location:{hostname:'bufalogrowler.com.br',pathname},innerWidth:400,innerHeight:1000,navigator:{sendBeacon:(u,b)=>{events.push(b.data);return true}},Blob:class{constructor(p){this.data=JSON.parse(p[0])}},localStorage:{getItem:()=>'',setItem(){}},requestAnimationFrame:f=>f()});
 const click=()=>listeners.click({isTrusted:true,target:icon});
 click();click();
 assert.equal(events.length,1);
 assert.equal(events[0].label,'Tirar dúvida');
 assert.equal(events[0].key,'floating:tirar-duvida');
 action.className='negotiation-trigger';
 for(const text of ['O Frete está caro?','O Prazo está longo?','O Preço está alto?']) {now+=1000;action.textContent=text;click();}
 assert.equal(events.length,4);
 for(const event of events){assert.equal(event.page,'/produtos/chopeira/');assert.equal(event.section,'botoes-flutuantes');assert.equal(event.kind,'click');}
 assert.ok(events.slice(1).every(e=>e.key==='floating:frete-caro' && e.label===events[1].label));
}
console.log('PASS: floating buttons, nested icon clicks, rotating labels, deduplication and both Chopeira routes.');
