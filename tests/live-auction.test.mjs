import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/live/_middleware.js';
const origin='https://www.bufalogrowler.com.br';
function database(){
 const sql=new DatabaseSync(':memory:');
 for(const name of ['0001_live.sql','0002_live_content.sql','0003_live_gallery.sql','0010_live_contact.sql'])sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 return {sql,async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}},prepare(query){const statement=sql.prepare(query);let values=[];return{bind(...args){values=args;return this},async first(){return statement.get(...values)||null},async all(){return{results:statement.all(...values)}},async run(){return statement.run(...values)}}}};
}
async function admin(db){const token='b'.repeat(64);const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');db.sql.prepare('INSERT INTO live_sessions(token,expires) VALUES (?,?)').run(hash,Date.now()+60000);return 'admin_session='+token;}
async function call(db,path='',body,cookie='',from=origin){return onRequest({request:new Request(origin+'/live/api/auction'+path,{method:body===undefined?'GET':'POST',headers:{Origin:from,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)}),env:{LIVE_DB:db}});}
const proposal=(state,extra={})=>({name:'Maria da Manada',phone:'(91) 99999-1234',city:'Belém',round_id:state.round_id,product_version:state.updated_at,expected_cents:state.amount_cents,request_id:crypto.randomUUID(),...extra});
async function open(db,cookie){const r=await call(db,'/admin',{title:'Cooler Búfalo',description:'Produto da live',enabled:true},cookie);assert.equal(r.status,200);return r.json();}
test('auction starts at zero, paused, with initial product photo',async()=>{
 const db=database();const state=await(await call(db)).json();assert.equal(state.amount_cents,0);assert.equal(state.next_amount_cents,10000);assert.equal(state.enabled,false);assert.match(state.photo_url,/auction-cooler.png/);assert.deepEqual(state.bids,[]);db.sql.close();
});
test('atomic bids add exactly 100, retries are idempotent, stale simultaneous price rejects',async()=>{
 const db=database(),cookie=await admin(db),state=await open(db,cookie),first=proposal(state);
 const responses=await Promise.all([call(db,'/bid',first),call(db,'/bid',proposal(state,{name:'João'}))]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
 const updated=await(await call(db)).json();assert.equal(updated.amount_cents,10000);
 const retry=await call(db,'/bid',first);assert.equal(retry.status,200);assert.equal((await retry.json()).amount_cents,10000);
 const second=await call(db,'/bid',proposal(updated,{name:'João'}));assert.equal(second.status,201);assert.equal((await second.json()).amount_cents,20000);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM live_auction_bids').get().n,2);db.sql.close();
});
test('only the two latest names are public, complete participant details require admin session',async()=>{
 const db=database(),cookie=await admin(db);let state=await open(db,cookie);
 for(const name of ['Pessoa um','Pessoa dois','Pessoa três'])state=await(await call(db,'/bid',proposal(state,{name}))).json();
 const publicState=await(await call(db)).json();assert.deepEqual(publicState.bids.map(b=>b.name),['Pessoa três','Pessoa dois']);assert.ok(!JSON.stringify(publicState).includes('999991234'));assert.equal(publicState.bids[0].city,'Belém');assert.ok(publicState.bids.every(b=>!('phone' in b)));
 assert.equal((await call(db,'/admin')).status,401);const history=await(await call(db,'/admin',undefined,cookie)).json();assert.equal(history.total,3);assert.equal(history.history[0].city,'Belém');assert.equal(history.history[0].phone,'91999991234');db.sql.close();
});
test('reset starts new paused zero round, keeps product and history and rejects old bids',async()=>{
 const db=database(),cookie=await admin(db);let state=await open(db,cookie);state=await(await call(db,'/bid',proposal(state))).json();
 const reset=await(await call(db,'/reset',{round_id:state.round_id},cookie)).json();assert.equal(reset.amount_cents,0);assert.equal(reset.round_id,state.round_id+1);assert.equal(reset.enabled,false);assert.deepEqual(reset.bids,[]);assert.equal(reset.title,state.title);
 assert.equal((await call(db,'/bid',proposal(state))).status,409);assert.equal((await(await call(db,'/admin',undefined,cookie)).json()).total,1);
 const reopened=await open(db,cookie);assert.equal((await(await call(db,'/bid',proposal(reopened))).json()).amount_cents,10000);db.sql.close();
});
test('config, reset and photo require authentication; cross-origin bids and invalid fields reject',async()=>{
 const db=database(),cookie=await admin(db),state=await open(db,cookie);
 assert.equal((await call(db,'/admin',{title:'x',description:'',enabled:true})).status,401);assert.equal((await call(db,'/reset',{round_id:1})).status,401);
 assert.equal((await call(db,'/bid',proposal(state),'','https://other.test')).status,403);
 for(const change of [{phone:'123'},{name:''},{city:''},{expected_cents:-1},{request_id:'bad'},{round_id:1.5}])assert.equal((await call(db,'/bid',proposal(state,change))).status,400);
 assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM live_auction_bids').get().n,0);db.sql.close();
});
test('closing the live or pausing the auction prevents further bids',async()=>{
 const db=database(),cookie=await admin(db),state=await open(db,cookie);
 db.sql.prepare('UPDATE live_settings SET enabled=0 WHERE id=1').run();assert.equal((await call(db,'/bid',proposal(state))).status,409);
 db.sql.prepare('UPDATE live_settings SET enabled=1 WHERE id=1').run();await call(db,'/admin',{title:'Cooler',description:'',enabled:false},cookie);assert.equal((await call(db,'/bid',proposal(state))).status,409);db.sql.close();
});
test('changing the product requires the visitor to review the updated offer before bidding',async()=>{
 const db=database(),cookie=await admin(db),old=await open(db,cookie);
 await call(db,'/admin',{title:'Outro produto',description:'Nova oferta',enabled:true},cookie);
 assert.equal((await call(db,'/bid',proposal(old))).status,409);
 const fresh=await(await call(db)).json();assert.equal((await call(db,'/bid',proposal(fresh))).status,201);db.sql.close();
});
test('photo upload validates the actual image and serves it without exposing participant data',async()=>{
 const db=database(),cookie=await admin(db);const bytes=readFileSync(new URL('../live/assets/auction-cooler.png',import.meta.url));
 async function upload(data,auth=cookie){return onRequest({request:new Request(origin+'/live/api/auction/photo',{method:'POST',headers:{Origin:origin,'Content-Type':'image/png',Cookie:auth},body:data}),env:{LIVE_DB:db}});}
 assert.equal((await upload(bytes,'')).status,401);assert.equal((await upload(new TextEncoder().encode('not an image at all'))).status,400);assert.equal((await upload(bytes)).status,200);
 const response=await call(db,'/photo');assert.equal(response.headers.get('Content-Type'),'image/png');assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(bytes));db.sql.close();
});
test('migration is repeatable and preserves bids',async()=>{
 const db=database(),cookie=await admin(db);const state=await open(db,cookie);await call(db,'/bid',proposal(state));
 const migration=readFileSync(new URL('../migrations/0013_live_auction.sql',import.meta.url),'utf8');db.sql.exec(migration);db.sql.exec(migration);assert.equal((await(await call(db)).json()).amount_cents,10000);db.sql.close();
});
test('admin can paginate all historical bids and save accented descriptions within the limit',async()=>{
 const db=database(),cookie=await admin(db);await open(db,cookie);
 const description='á'.repeat(1500);assert.equal((await call(db,'/admin',{title:'Leilão',description,enabled:false},cookie)).status,200);
 const insert=db.sql.prepare('INSERT INTO live_auction_bids(round_id,request_id,name,phone,city,product_title,amount_cents,created_at) VALUES (1,?,?,?,?,?,?,?)');
 for(let i=1;i<=101;i++)insert.run(crypto.randomUUID(),'Participante '+i,'91999991234','Belém','Cooler',i*10000,Date.now());
 const first=await(await call(db,'/admin',undefined,cookie)).json(),last=await(await call(db,'/admin?offset=100',undefined,cookie)).json();
 assert.equal(first.history.length,100);assert.equal(last.history.length,1);assert.equal(last.total,101);assert.equal(last.history[0].amount_cents,10000);assert.equal(first.description,description);db.sql.close();
});
test('configured opening value is used before bids, increments by 100 and returns on restart',async()=>{
 const db=database(),cookie=await admin(db);
 let response=await call(db,'/admin',{title:'Cooler',description:'',enabled:true,start_cents:50000},cookie);assert.equal(response.status,200);
 let state=await response.json();assert.equal(state.amount_cents,50000);assert.equal(state.next_amount_cents,60000);
 state=await(await call(db,'/bid',proposal(state))).json();assert.equal(state.amount_cents,60000);
 const saved=await(await call(db,'/admin',{title:'Cooler',description:'',enabled:true,start_cents:25000},cookie)).json();assert.equal(saved.amount_cents,60000);assert.equal(saved.next_amount_cents,70000);
 state=await(await call(db,'/reset',{round_id:state.round_id},cookie)).json();assert.equal(state.amount_cents,25000);assert.equal(state.next_amount_cents,35000);assert.equal(state.bids.length,0);db.sql.close();
});
test('opening value validates cents and can decrease before the first bid without accepting stale proposals',async()=>{
 const db=database(),cookie=await admin(db),config={title:'Cooler',description:'',enabled:true};
 for(const start_cents of [-1,1.5,'500',null,10000000001])assert.equal((await call(db,'/admin',{...config,start_cents},cookie)).status,400);
 const old=await(await call(db,'/admin',{...config,start_cents:50000},cookie)).json();
 const fresh=await(await call(db,'/admin',{...config,start_cents:10000},cookie)).json();assert.equal(fresh.amount_cents,10000);
 assert.equal((await call(db,'/bid',proposal(old))).status,409);assert.equal((await(await call(db,'/bid',proposal(fresh))).json()).amount_cents,20000);
 const migration=readFileSync(new URL('../migrations/0014_live_auction_pricing.sql',import.meta.url),'utf8');db.sql.exec(migration);db.sql.exec(migration);assert.equal((await(await call(db)).json()).start_cents,10000);db.sql.close();
});
test('auction form is inline at the end, description follows photo, and admin activation is last',()=>{
 const html=readFileSync(new URL('../live/index.html',import.meta.url),'utf8');
 const adminHtml=readFileSync(new URL('../live/admin.html',import.meta.url),'utf8');
 assert.ok(!html.includes('id="auction-dialog"'));assert.ok(html.includes('id="auction-bid-panel"'));assert.ok(html.indexOf('id="live-auction"')>html.indexOf('id="cadastro-live"'));
 assert.ok(html.indexOf('id="auction-description"')>html.indexOf('id="auction-photo"'));assert.ok(html.indexOf('id="auction-description"')<html.indexOf('class="auction-content"'));
 assert.ok(adminHtml.indexOf('id="dashboard"')>adminHtml.indexOf('id="auction-admin"'));assert.ok(adminHtml.includes('id="auction-admin-start"'));
 const script=readFileSync(new URL('../live/homepage-shell.js',import.meta.url),'utf8');assert.ok(!script.includes('Ir para a Oferta da Manada'));
});
test('history keeps the product name for each bid after the product and round change',async()=>{
 const db=database(),cookie=await admin(db);let state=await open(db,cookie);
 await call(db,'/bid',proposal(state));await call(db,'/reset',{round_id:state.round_id},cookie);
 state=await(await call(db,'/admin',{title:'Segundo produto',description:'',enabled:true},cookie)).json();await call(db,'/bid',proposal(state));
 const history=await(await call(db,'/admin',undefined,cookie)).json();assert.deepEqual(history.history.map(b=>b.product_title),['Segundo produto','Cooler Búfalo']);
 const html=readFileSync(new URL('../live/admin.html',import.meta.url),'utf8');assert.ok(html.includes('<th>Produto da proposta</th>'));db.sql.close();
});
