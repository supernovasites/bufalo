import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {onRequest} from '../functions/live/_middleware.js';
const origin = 'https://bufalogrowler.com.br';
const ids = ['tote','nag','outdoor','mestre'];
function database() {
  const sql = new DatabaseSync(':memory:');
  for (const name of ['0001_live.sql','0002_live_content.sql','0003_live_gallery.sql','0010_live_contact.sql']) sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
  return {sql, prepare(query) {
    let values = [];
    const statement = sql.prepare(query);
    return {bind(...args) {values=args;return this;}, async first() {return statement.get(...values) || null;}, async all() {return {results:statement.all(...values)};}, async run() {return statement.run(...values);}};
  }};
}
async function login(db) {
  const token = 'a'.repeat(64);
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
  db.sql.prepare('INSERT INTO live_sessions(token,expires) VALUES (?,?)').run(hash,Date.now()+60000);
  return 'admin_session='+token;
}
async function call(db,path,body,cookie='',requestOrigin=origin) {
  const request = new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:requestOrigin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
  return onRequest({request,env:{LIVE_DB:db},next:async()=>new Response(readFileSync(new URL('../live/index.html',import.meta.url),'utf8'),{headers:{'Content-Type':'text/html'}})});
}
test('four coupons persist, normalize and render independently in the live',async()=>{
  const db=database(),cookie=await login(db);
  const response=await call(db,'/live/api/challenges',{tote:' tote13 ',nag:'nag13',outdoor:'CIMO_13',mestre:'MESTRE-13'},cookie);
  assert.equal(response.status,200);
  const expected={tote:'TOTE13',nag:'NAG13',outdoor:'CIMO_13',mestre:'MESTRE-13'};
  assert.deepEqual((await response.json()).challenge_coupons,expected);
  assert.deepEqual((await (await call(db,'/live/api/state',undefined,cookie)).json()).challenge_coupons,expected);
  const html=await (await call(db,'/live/')).text();
  for(const id of ids)assert.ok(html.includes(`data-challenge-${id}-coupon="${expected[id]}"`));
  assert.ok(!html.includes('__LIVE_CHALLENGE_'));
  db.sql.close();
});
test('before configuration all challenges use the daily coupon without requiring migration',async()=>{
  const db=database();
  const html=await (await call(db,'/live/')).text();
  for(const id of ids)assert.ok(html.includes(`data-challenge-${id}-coupon="LIVEBG1609"`));
  db.sql.close();
});
test('reject unauthenticated, cross-origin and invalid coupons without saving',async()=>{
  const db=database(),cookie=await login(db),valid=Object.fromEntries(ids.map(id=>[id,'TEST13']));
  assert.equal((await call(db,'/live/api/challenges',valid)).status,401);
  assert.equal((await call(db,'/live/api/challenges',valid,cookie,'https://other.test')).status,403);
  for(const bad of ['', 'AB', 'x'.repeat(25), '<script>', null])assert.equal((await call(db,'/live/api/challenges',{...valid,nag:bad},cookie)).status,400);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name='live_challenge_coupons'").get().count,0);
  db.sql.close();
});
test('daily coupon changes preserve configured challenge coupons',async()=>{
  const db=database(),cookie=await login(db);
  await call(db,'/live/api/challenges',Object.fromEntries(ids.map(id=>[id,'CUSTOM13'])),cookie);
  const response=await call(db,'/live/api/content',{coupon:'LIVE20',live_date:'14/10'},cookie);
  assert.equal(response.status,200);
  assert.equal((await response.json()).challenge_coupons.tote,'CUSTOM13');
  db.sql.close();
});
test('admin loads saved values and publishes all four through the server',async()=>{
  const elements=new Map();
  for(const id of ['puzzle-form','puzzle-feedback','save-puzzle',...ids.flatMap(id=>['puzzle-coupon-'+id,'puzzle-coupon-preview-'+id])])elements.set(id,{value:'',disabled:true,textContent:'',addEventListener(type,handler){this[type]=handler;}});
  const saved={tote:'TOTE13',nag:'NAG13',outdoor:'CIMO13',mestre:'MESTRE13'};
  const requests=[];
  const context={document:{getElementById:id=>elements.get(id)},window:{location:{replace(){}}},fetch:async(url,options)=>{
    requests.push({url,options});
    return {ok:true,status:200,json:async()=>({coupon:'LIVE20',challenge_coupons:options.body?JSON.parse(options.body):saved})};
  }};
  vm.runInNewContext(readFileSync(new URL('../live/puzzle-admin.js',import.meta.url),'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  for(const id of ids)assert.equal(elements.get('puzzle-coupon-'+id).value,saved[id]);
  elements.get('puzzle-coupon-nag').value='novo13';
  await elements.get('puzzle-form').submit({preventDefault(){}});
  assert.equal(requests[1].url,'/live/api/challenges');
  assert.equal(JSON.parse(requests[1].options.body).nag,'NOVO13');
  assert.equal(elements.get('puzzle-coupon-preview-nag').textContent,'NOVO13');
  assert.equal(elements.get('save-puzzle').disabled,false);
});

test('closed live returns the thank-you page without challenge coupons',async()=>{
  const db=database();
  db.sql.prepare('UPDATE live_settings SET enabled=0 WHERE id=1').run();
  const request=new Request(origin+'/live/');
  const response=await onRequest({request,env:{LIVE_DB:db,ASSETS:{fetch:async()=>new Response('Obrigado pela presença',{headers:{'Content-Type':'text/html'}})}},next:async()=>{throw new Error('Active live should not render');}});
  assert.equal(response.status,200);
  assert.equal(await response.text(),'Obrigado pela presença');
  db.sql.close();
});
test('migration can be applied repeatedly before or after first save',async()=>{
  const db=database(),cookie=await login(db);
  const migration=readFileSync(new URL('../migrations/0011_live_challenge_coupons.sql',import.meta.url),'utf8');
  db.sql.exec(migration);
  await call(db,'/live/api/challenges',Object.fromEntries(ids.map(id=>[id,'TEST13'])),cookie);
  db.sql.exec(migration);
  assert.equal(db.sql.prepare('SELECT mestre FROM live_challenge_coupons WHERE id=1').get().mestre,'TEST13');
  db.sql.close();
});
