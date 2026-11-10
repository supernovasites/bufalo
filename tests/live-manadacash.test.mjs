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
  return {sql, async batch(statements) {
    sql.exec('BEGIN');
    try { const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results; }
    catch(error) {sql.exec('ROLLBACK');throw error;}
  }, prepare(query) {
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

test('ManadaCash defaults visible, persists hidden and can be shown again',async()=>{
  const db=database(),cookie=await login(db);
  assert.equal((await (await call(db,'/live/api/state',undefined,cookie)).json()).manadacash_enabled,true);
  assert.match(await (await call(db,'/live/')).text(),/id="cadastro-live"/);
  assert.equal((await (await call(db,'/live/api/manadacash',{enabled:false},cookie)).json()).manadacash_enabled,false);
  for(const path of ['/live','/live/','/live/index','/live/index.html']) {
    const html=await (await call(db,path)).text();
    assert.doesNotMatch(html,/<section[^>]*id="cadastro-live"/);
    assert.doesNotMatch(html,/<form[^>]*id="lead-capture-form"/);
    assert.match(html,/id="live-auction"/);
    assert.match(html,/manadacash-floating.js/);
  }
  await call(db,'/live/api/content',{coupon:'LIVE20',live_date:'10/11'},cookie);
  assert.equal((await (await call(db,'/live/api/state',undefined,cookie)).json()).manadacash_enabled,false);
  await call(db,'/live/api/manadacash',{enabled:true},cookie);
  assert.match(await (await call(db,'/live/')).text(),/id="cadastro-live"/);
  db.sql.close();
});
test('ManadaCash changes require authentication, same origin and boolean value',async()=>{
  const db=database(),cookie=await login(db);
  assert.equal((await call(db,'/live/api/manadacash',{enabled:false})).status,401);
  assert.equal((await call(db,'/live/api/manadacash',{enabled:false},cookie,'https://other.test')).status,403);
  for(const enabled of [null,0,'false',{}]) assert.equal((await call(db,'/live/api/manadacash',{enabled},cookie)).status,400);
  assert.equal((await (await call(db,'/live/api/state',undefined,cookie)).json()).manadacash_enabled,true);
  db.sql.close();
});
