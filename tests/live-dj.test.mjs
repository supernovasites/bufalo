import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {onRequest} from '../functions/live/_middleware.js';
import {onRequest as globalMiddleware} from '../functions/_middleware.js';
const read=file=>readFileSync(new URL('../'+file,import.meta.url));
test('DJ page, aliases and audio require the painel session and are not cached',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec(read('migrations/0001_live.sql').toString());
 const token='e'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
 sql.prepare('INSERT INTO live_sessions(token,expires) VALUES (?,?)').run(hash,Date.now()+60000);
 const db={prepare(query){const statement=sql.prepare(query);let values=[];return{bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;}};}};
 for(const pathname of ['/live/mesadj','/live/mesadj/','/live/mesadj.html','/live/mesadj/index.html','/live/mesadj/mesadj.js','/live/mesadj/sons/celebracao.mp3','/live/mesadj/sons/contagem-bateria.mp3','/live/mesadj/sons/fundo-chaves.mp3','/live/mesadj/sons/trilha-live.m4a']){
  for(const handler of [globalMiddleware,onRequest]){
   const request=new Request('https://www.bufalogrowler.com.br'+pathname);
   const denied=await handler({request,env:{LIVE_DB:db},next:()=>{throw new Error('Unauthenticated asset reached static serving');}});
   assert.equal(denied.status,302);assert.equal(denied.headers.get('Location'),'https://www.bufalogrowler.com.br/painel/');
  }
  const allowed=await onRequest({request:new Request('https://www.bufalogrowler.com.br'+pathname,{headers:{Cookie:'admin_session='+token}}),env:{LIVE_DB:db},next:async()=>new Response('content')});
  assert.equal(allowed.status,200);assert.match(allowed.headers.get('Cache-Control'),/no-store/);assert.match(allowed.headers.get('X-Robots-Tag'),/noindex/);
 }
 sql.prepare('UPDATE live_sessions SET expires=0').run();
 const expired=await onRequest({request:new Request('https://www.bufalogrowler.com.br/live/mesadj/sons/celebracao.mp3',{headers:{Cookie:'admin_session='+token}}),env:{LIVE_DB:db}});assert.equal(expired.status,302);sql.close();
});
function element(extra={}){
 return {textContent:'',value:'0',disabled:false,listeners:{},classList:{toggle(){}},addEventListener(type,handler){this.listeners[type]=handler;},replaceChildren(){},append(){},setAttribute(){},...extra};
}
test('DJ can mix tracks, multiply individual and master levels, pause, restart and stop all',async()=>{
 const master=element({value:'80'}),level=element(),feedback=element(),stopAll=element(),keys={},windowEvents={};
 const cards=[0,1,2,3].map(index=>{
  const controls=new Map();
  const audio=element({paused:true,ended:false,error:null,currentTime:0,duration:60,readyState:1,volume:1,loop:false,async play(){this.paused=false;this.listeners.play?.();},pause(){this.paused=true;this.listeners.pause?.();}});
  controls.set('audio',audio);controls.set('h2',element({textContent:'Track '+index}));
  for(const name of ['.play','.restart','.stop','.seek','.volume','.loop','.track-status','.track-level','.elapsed','.duration'])controls.set(name,element());
  controls.get('.volume').value=index===2?'60':index===3?'40':'100';controls.get('.loop').checked=false;
  return element({querySelector:selector=>controls.get(selector),controls});
 });
 vm.runInNewContext(read('live/mesadj/mesadj.js').toString(),{
  document:{getElementById:id=>({'master-volume':master,'master-level':level,feedback,'stop-all':stopAll}[id]),querySelectorAll:()=>cards,createTextNode:text=>text,createElement:()=>element(),addEventListener:(event,handler)=>{keys[event]=handler;}},window:{addEventListener:(event,handler)=>{windowEvents[event]=handler;}}
 });
 const control=(index,name)=>cards[index].controls.get(name),audio=index=>control(index,'audio');
 assert.ok(cards.every(card=>card.controls.get('audio').paused));assert.equal(audio(0).volume,.8);assert.equal(audio(2).volume,.48);
 await control(0,'.play').listeners.click();await control(1,'.play').listeners.click();assert.equal(audio(0).paused,false);assert.equal(audio(1).paused,false);
 control(0,'.play').listeners.click();assert.equal(audio(0).paused,true);
 audio(0).currentTime=20;await control(0,'.restart').listeners.click();assert.equal(audio(0).currentTime,0);assert.equal(audio(0).paused,false);
 master.value='50';master.listeners.input();assert.equal(audio(2).volume,.3);assert.equal(level.textContent,'50%');
 control(0,'.volume').value='40';control(0,'.volume').listeners.input();assert.equal(audio(0).volume,.2);
 control(0,'.seek').value='50';control(0,'.seek').listeners.input();assert.equal(audio(0).currentTime,30);
 control(0,'.loop').checked=true;control(0,'.loop').listeners.change();assert.equal(audio(0).loop,true);
 stopAll.listeners.click();assert.ok(cards.every(card=>{const a=card.controls.get('audio');return a.paused&&a.currentTime===0;}));
 keys.keydown({key:'3',target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(2).paused,false);
 keys.keydown({key:'Escape',target:{closest:()=>null},preventDefault(){}});assert.equal(audio(2).paused,true);
 keys.keydown({key:'4',target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(3).paused,false);
 stopAll.listeners.click();assert.equal(audio(3).paused,true);assert.equal(audio(3).currentTime,0);
 keys.keydown({key:'1',target:{closest:()=>true},preventDefault(){}});assert.equal(audio(0).paused,true);
 await control(0,'.play').listeners.click();windowEvents.pagehide();assert.equal(audio(0).paused,true);
 audio(0).play=async()=>{throw new Error('blocked');};await control(0,'.play').listeners.click();assert.match(feedback.textContent,/Não foi possível tocar/);assert.equal(audio(0).paused,true);
 audio(1).error={code:4};audio(1).listeners.error();assert.equal(control(1,'.play').disabled,true);assert.match(control(1,'.track-status').textContent,/indisponível/);
});
test('bundled DJ audio and distributed files match the source, with no automatic playback',()=>{
 const html=read('live/mesadj/index.html').toString();assert.ok(!html.includes('autoplay'));assert.equal((html.match(/<audio /g)||[]).length,4);
 for(const file of ['index.html','mesadj.css','mesadj.js','sons/celebracao.mp3','sons/contagem-bateria.mp3','sons/fundo-chaves.mp3','sons/trilha-live.m4a'])assert.deepEqual(read('live/mesadj/'+file),read('dist/live/mesadj/'+file));
 assert.match(read('painel/index.html').toString(),/href="\/live\/mesadj\/">Abrir mesa de DJ/);
});
