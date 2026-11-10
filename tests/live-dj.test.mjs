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
 const cards=Array.from({length:11},(_,index)=>{
  const controls=new Map();
  const audio=element({paused:true,ended:false,error:null,currentTime:0,duration:60,readyState:1,volume:1,loop:false,async play(){this.paused=false;this.listeners.play?.();},pause(){this.paused=true;this.listeners.pause?.();}});
  controls.set('audio',audio);controls.set('h2',element({textContent:'Track '+index}));
  for(const name of ['.play','.restart','.stop','.seek','.volume','.loop','.track-status','.track-level','.elapsed','.duration'])controls.set(name,element());
  controls.get('.volume').value=index===2?'60':index===3?'40':'100';controls.get('.loop').checked=index===0;
  return element({dataset:index===0?{loopEnd:'30'}:index===3?{startAt:'10'}:{},querySelector:selector=>controls.get(selector),closest:()=>({getAttribute:()=>index<4?'background-title':'effects-title'}),controls});
 });
 vm.runInNewContext(read('live/mesadj/mesadj.js').toString(),{
  document:{getElementById:id=>({'master-volume':master,'master-level':level,feedback,'stop-all':stopAll}[id]),querySelectorAll:()=>cards,createTextNode:text=>text,createElement:()=>element(),addEventListener:(event,handler)=>{keys[event]=handler;}},window:{addEventListener:(event,handler)=>{windowEvents[event]=handler;}}
 });
 const control=(index,name)=>cards[index].controls.get(name),audio=index=>control(index,'audio');
 assert.ok(cards.every(card=>card.controls.get('audio').paused));assert.ok(Math.abs(audio(0).volume-.024)<1e-9);assert.ok(Math.abs(audio(2).volume-.024)<1e-9);assert.ok(cards.every((card,index)=>Math.abs(card.controls.get('audio').volume-(index<4?.024:.16))<1e-9));
 assert.equal(control(0,'.volume').max,'3');assert.equal(control(3,'.volume').max,'3');assert.equal(control(4,'.volume').max,'20');assert.equal(control(4,'.track-level').textContent,'20%');
 await control(0,'.play').listeners.click();await control(1,'.play').listeners.click();assert.equal(audio(0).paused,true);assert.equal(audio(1).paused,false); await control(4,'.play').listeners.click(); await control(5,'.play').listeners.click(); assert.equal(audio(1).paused,false);assert.equal(audio(4).paused,false);assert.equal(audio(4).paused,false); await control(0,'.play').listeners.click();assert.equal(audio(1).paused,true);assert.equal(audio(4).paused,false);
 control(0,'.play').listeners.click();assert.equal(audio(0).paused,true);
 audio(0).currentTime=20;await control(0,'.restart').listeners.click();assert.equal(audio(0).currentTime,0);assert.equal(audio(0).paused,false);
 await control(3,'.play').listeners.click();assert.equal(audio(3).currentTime,10);audio(3).currentTime=24;control(3,'.play').listeners.click();await control(3,'.play').listeners.click();assert.equal(audio(3).currentTime,24);await control(3,'.restart').listeners.click();assert.equal(audio(3).currentTime,10);control(3,'.stop').listeners.click();assert.equal(audio(3).currentTime,10);
 await control(0,'.restart').listeners.click();
 assert.equal(audio(0).loop,true);
 audio(0).currentTime=29.9;audio(0).listeners.timeupdate();assert.equal(audio(0).currentTime,29.9);
 audio(0).currentTime=30;audio(0).listeners.timeupdate();assert.equal(audio(0).currentTime,0);assert.equal(audio(0).paused,false);
 assert.equal(control(0,'.duration').textContent,'0:30');
 audio(0).currentTime=30.4;audio(0).listeners.timeupdate();assert.equal(audio(0).currentTime,0);
 control(0,'.seek').value='50';control(0,'.seek').listeners.input();assert.equal(audio(0).currentTime,15);
 audio(0).pause();audio(0).currentTime=30;audio(0).listeners.timeupdate();assert.equal(audio(0).currentTime,30);assert.equal(audio(0).paused,true);
 await control(0,'.play').listeners.click();assert.equal(audio(0).currentTime,0);assert.equal(audio(0).paused,false);
 control(0,'.loop').checked=false;control(0,'.loop').listeners.change();
 audio(0).currentTime=31;audio(0).listeners.timeupdate();assert.equal(audio(0).currentTime,31);assert.equal(control(0,'.duration').textContent,'1:00');
 audio(1).currentTime=31;audio(1).listeners.timeupdate();assert.equal(audio(1).currentTime,31);
 master.value='50';master.listeners.input();assert.equal(audio(2).volume,.015);assert.equal(level.textContent,'50%');
 control(0,'.volume').value='40';control(0,'.volume').listeners.input();assert.equal(audio(0).volume,.015); control(0,'.volume').value='1';control(0,'.volume').listeners.input();assert.equal(audio(0).volume,.005);
 control(4,'.volume').value='100';control(4,'.volume').listeners.input();assert.equal(audio(4).volume,.1);control(4,'.volume').value='10';control(4,'.volume').listeners.input();assert.equal(audio(4).volume,.05);control(4,'.volume').value='0';control(4,'.volume').listeners.input();assert.equal(audio(4).volume,0);control(0,'.seek').value='50';control(0,'.seek').listeners.input();assert.equal(audio(0).currentTime,30);
 control(0,'.loop').checked=true;control(0,'.loop').listeners.change();assert.equal(audio(0).loop,true);
 stopAll.listeners.click();assert.ok(cards.every((card,index)=>{const a=card.controls.get('audio');return a.paused&&a.currentTime===(index===3?10:0);}));
 keys.keydown({key:'1',target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(0).paused,false);
 keys.keydown({key:'Escape',target:{closest:()=>null},preventDefault(){}});assert.equal(audio(0).paused,true);
 keys.keydown({key:'2',target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(1).paused,false);
 for(let digit=1;digit<=9;digit++){
  keys.keydown({key:String(digit),code:'Digit'+digit,target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(digit-1).paused,false);stopAll.listeners.click();
 }
 for(let digit=1;digit<=2;digit++){
  keys.keydown({key:['!','@','#','$','%'][digit-1],code:'Digit'+digit,shiftKey:true,target:{closest:()=>null},preventDefault(){}});await new Promise(setImmediate);assert.equal(audio(digit+8).paused,false);
  keys.keydown({key:String(digit),code:'Digit'+digit,shiftKey:true,target:{closest:()=>null},preventDefault(){}});assert.equal(audio(digit+8).paused,true);
 }
 keys.keydown({key:'6',code:'Digit6',shiftKey:true,target:{closest:()=>null},preventDefault(){throw new Error('Unassigned shortcut');}});
 stopAll.listeners.click();assert.equal(audio(3).paused,true);assert.equal(audio(3).currentTime,10);
 keys.keydown({key:'1',target:{closest:()=>true},preventDefault(){}});assert.equal(audio(0).paused,true);
 await control(0,'.play').listeners.click();windowEvents.pagehide();assert.equal(audio(0).paused,true);
 audio(0).play=async()=>{throw new Error('blocked');};await control(0,'.play').listeners.click();assert.match(feedback.textContent,/Não foi possível tocar/);assert.equal(audio(0).paused,true);
 audio(1).error={code:4};audio(1).listeners.error();assert.equal(control(1,'.play').disabled,true);assert.match(control(1,'.track-status').textContent,/indisponível/);
});
test('bundled DJ audio and distributed files match the source, with no automatic playback',()=>{
 const html=read('live/mesadj/index.html').toString();assert.ok(!html.includes('data-track="celebracao"'));assert.ok(!html.includes('data-track="contagem"'));assert.ok(!html.includes('autoplay'));assert.match(html,/data-track="cris-anuncia-pos-live"/);assert.ok(html.includes('>Cris anuncia Pos Live</h2>'));assert.match(html,/data-track="foguinho" data-loop-end="30"/);assert.match(html,/<input class="loop" type="checkbox" checked> Repetir primeiros 30 segundos/);assert.equal((html.match(/data-loop-end=/g)||[]).length,1);assert.equal((html.match(/<audio /g)||[]).length,11);assert.ok(!html.includes('data-track="espera-sorteio"'));for(const id of ['explosao-curta','explosao','vencedor-sfx','risadinha'])assert.ok(!html.includes('data-track="'+id+'"'));
 for(const match of html.matchAll(/<audio[^>]+src="([^"]+)"/g)){const path=match[1].slice(1);assert.ok(read(path).length>0);assert.deepEqual(read(path),read('dist/'+path));}
 for(const file of ['index.html','mesadj.css','mesadj.js','sons/celebracao.mp3','sons/contagem-bateria.mp3','sons/fundo-chaves.mp3','sons/trilha-live.m4a','sons/trilha-espera-sorteio.mp3'])assert.deepEqual(read('live/mesadj/'+file),read('dist/live/mesadj/'+file));
 assert.match(read('painel/index.html').toString(),/href="\/live\/mesadj\/">Abrir mesa de DJ/);
});
