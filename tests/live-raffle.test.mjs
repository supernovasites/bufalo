import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/live/_middleware.js';
import {participantNames} from '../lib/live-raffle.js';
const origin='https://www.bufalogrowler.com.br';
function database(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync(new URL('../migrations/0001_live.sql',import.meta.url),'utf8'));
 return {sql,prepare(query){const statement=sql.prepare(query);let values=[];return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},async run(){return statement.run(...values);}};}};
}
async function admin(db){const token='c'.repeat(64);const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');db.sql.prepare('INSERT INTO live_sessions(token,expires) VALUES (?,?)').run(hash,Date.now()+60000);return 'admin_session='+token;}
async function call(db,path='/live/api/raffle',body,cookie='',from=origin){return onRequest({request:new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:from,Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env:{LIVE_DB:db},next:async()=>new Response('<html>private</html>',{headers:{'Content-Type':'text/html'}})});}
async function action(db,cookie,state,action,extra={}){const response=await call(db,'/live/api/raffle/admin',{action,revision:state.revision,...extra},cookie);assert.equal(response.status,200,await response.clone().text());return response.json();}
test('raffle pages and private state require the painel session, including aliases',async()=>{
 const db=database(),cookie=await admin(db);
 for(const path of ['/live/sorteio','/live/sorteio/','/live/sorteio.html','/live/sorteio/index.html']){
  const denied=await call(db,path);assert.equal(denied.status,302);assert.equal(denied.headers.get('Location'),origin+'/painel/');
  const allowed=await call(db,path,undefined,cookie);assert.equal(allowed.status,200);assert.match(allowed.headers.get('Cache-Control'),/no-store/);assert.match(allowed.headers.get('X-Robots-Tag'),/noindex/);
 }
 assert.equal((await call(db,'/live/api/raffle/admin')).status,401);
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'clear-winners',revision:0})).status,401);
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'draw',revision:0,names:'Ana'},cookie,'https://other.test')).status,403);
 db.sql.close();
});
test('three confirmed results are published in order; pending names and participant lists stay private',async()=>{
 const db=database(),cookie=await admin(db);
 let state=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();
 for(let slot=1;slot<=3;slot++){
  state=await action(db,cookie,state,'draw',{names:'Ana\nBruno\nCarla'});
  let publicState=await(await call(db)).json();assert.equal(publicState.winners.length,slot-1);assert.ok(!('participants' in publicState));assert.ok(!('candidate' in publicState));
  const candidate=state.candidate;
  const reloaded=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();assert.equal(reloaded.candidate,candidate);
  state=await action(db,cookie,state,'confirm');assert.equal(state.winners.at(-1).slot,slot);assert.equal(state.winners.at(-1).name,candidate);
  publicState=await(await call(db)).json();assert.deepEqual(publicState.winners,state.winners);
 }
 assert.equal(new Set(state.winners.map(w=>w.name)).size,3);
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'draw',revision:state.revision,names:'Outra pessoa'},cookie)).status,409);
 state=await action(db,cookie,state,'clear-winners');assert.deepEqual(state.winners,[]);assert.equal(state.candidate,null);assert.deepEqual((await(await call(db)).json()).winners,[]);
 db.sql.close();
});
test('reroll does not publish, clearing names invalidates the candidate, empty input is rejected',async()=>{
 const db=database(),cookie=await admin(db);let state=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();
 state=await action(db,cookie,state,'draw',{names:'Ana\nBruno'});state=await action(db,cookie,state,'draw',{names:'Carla'});assert.equal(state.candidate,'Carla');assert.deepEqual((await(await call(db)).json()).winners,[]);
 state=await action(db,cookie,state,'clear-participants');assert.deepEqual(state.participants,[]);assert.equal(state.candidate,null);
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'confirm',revision:state.revision},cookie)).status,409);
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'draw',revision:state.revision,names:' \n'},cookie)).status,400);
 db.sql.close();
});
test('concurrent and stale confirmations cannot fill two slots or undo a reset',async()=>{
 const db=database(),cookie=await admin(db);let state=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();
 state=await action(db,cookie,state,'draw',{names:'Ana\nBruno'});
 const confirmations=await Promise.all([1,2].map(()=>call(db,'/live/api/raffle/admin',{action:'confirm',revision:state.revision},cookie)));
 assert.deepEqual(confirmations.map(r=>r.status).sort(),[200,409]);
 let latest=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();assert.equal(latest.winners.length,1);
 latest=await action(db,cookie,latest,'clear-winners');
 assert.equal((await call(db,'/live/api/raffle/admin',{action:'confirm',revision:state.revision},cookie)).status,409);
 assert.deepEqual((await(await call(db)).json()).winners,[]);db.sql.close();
});
test('names are normalized, bounded and migrations preserve existing results',async()=>{
 assert.deepEqual(participantNames(' Ana Silva \nana   silva\nBruno'),['ana silva','Bruno']);
 assert.throws(()=>participantNames('a'.repeat(121)));assert.throws(()=>participantNames(Array(5002).fill('Ana').join('\n')));
 const db=database(),cookie=await admin(db);let state=await(await call(db,'/live/api/raffle/admin',undefined,cookie)).json();
 state=await action(db,cookie,state,'draw',{names:'<script>alert(1)</script>'});state=await action(db,cookie,state,'confirm');
 const migration=readFileSync(new URL('../migrations/0015_live_raffle.sql',import.meta.url),'utf8');db.sql.exec(migration);db.sql.exec(migration);assert.deepEqual((await(await call(db)).json()).winners,state.winners);db.sql.close();
});
test('public markup removes acai and hero purchase buttons and distributed files match source',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const html=read('live/index.html');assert.ok(!html.includes('id="acai-pre-venda"'));assert.ok(!html.includes('class="hero-actions"'));assert.ok(!html.includes('class="button hero-link"'));
 for(const time of ['15h15','16h','16h40'])assert.ok(html.includes(time));
 for(const file of ['live/index.html','live/homepage-shell.js','live/admin.html','live/raffle.css','live/raffle-public.js','live/sorteio/index.html','live/sorteio/sorteio.css','live/sorteio/sorteio.js','painel/index.html'])assert.equal(read(file),read('dist/'+file));
 assert.match(read('live/raffle-public.js'),/name.textContent=text/);
 assert.match(read('painel/index.html'),/href="\/live\/sorteio\/"/);
});
