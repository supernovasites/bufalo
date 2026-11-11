import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/live/_middleware.js';
const origin='https://bufalogrowler.com.br';
function database() {
  const sql=new DatabaseSync(':memory:');
  for(const name of ['0001_live.sql','0002_live_content.sql','0003_live_gallery.sql','0010_live_contact.sql'])sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
  return {sql,prepare(query) {
    let values=[];const statement=sql.prepare(query);
    return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},async all(){return {results:statement.all(...values)};},async run(){return statement.run(...values);}};
  }};
}
async function login(db) {
  const token='a'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
  db.sql.prepare('INSERT INTO live_sessions VALUES (?,?)').run(hash,Date.now()+60000);
  return 'admin_session='+token;
}
async function call(db,path,{body,cookie='',requestOrigin=origin,type='application/json'}={}) {
  return onRequest({env:{LIVE_DB:db},request:new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:requestOrigin,Cookie:cookie,'Content-Type':type},body:body===undefined?undefined:type==='application/json'?JSON.stringify(body):body}),next:async()=>new Response(readFileSync(new URL('../live/index.html',import.meta.url),'utf8'),{headers:{'Content-Type':'text/html'}})});
}
const jpeg=Uint8Array.from([255,216,255,224,0,1,2,3,4,5,6,7]);
test('uploads stay independent; a single saved selection controls public HTML and polling',async()=>{
  const db=database(),cookie=await login(db);
  for(const slot of [1,2])assert.equal((await call(db,'/live/api/gallery/'+slot,{body:jpeg,type:'image/jpeg',cookie})).status,200);
  let data=await (await call(db,'/live/api/gallery')).json();
  assert.equal(data.photos.length,2);assert.equal(data.moment.slot,null);
  assert.equal((await call(db,'/live/api/gallery/select',{body:{slot:1},cookie})).status,200);
  data=await (await call(db,'/live/api/gallery')).json();assert.equal(data.moment.slot,1);
  let html=await (await call(db,'/live/')).text();assert.match(html,/<img id="momento-image"[^>]*src="\/live\/api\/gallery\/1\?v=/);
  await call(db,'/live/api/gallery/select',{body:{slot:2},cookie});
  html=await (await call(db,'/live/')).text();assert.match(html,/<img id="momento-image"[^>]*src="\/live\/api\/gallery\/2\?v=/);
  const before=(await (await call(db,'/live/api/gallery')).json()).moment;
  await call(db,'/live/api/gallery/2',{body:jpeg,type:'image/jpeg',cookie});
  data=await (await call(db,'/live/api/gallery')).json();assert.equal(data.moment.slot,2);assert.notEqual(data.moment.photo_version,before.photo_version);
  const photo=await call(db,data.moment.url);assert.equal(photo.status,200);assert.deepEqual(new Uint8Array(await photo.arrayBuffer()),jpeg);
  db.sql.close();
});
test('selection and uploads reject unauthorized, cross-origin, empty slots and invalid images',async()=>{
  const db=database(),cookie=await login(db);
  assert.equal((await call(db,'/live/api/gallery/select',{body:{slot:1}})).status,401);
  assert.equal((await call(db,'/live/api/gallery/select',{body:{slot:1},cookie,requestOrigin:'https://other.test'})).status,403);
  for(const slot of [0,6,'1',null,1])assert.equal((await call(db,'/live/api/gallery/select',{body:{slot},cookie})).status,400);
  assert.equal((await call(db,'/live/api/gallery/1',{body:jpeg,type:'image/jpeg'})).status,401);
  assert.equal((await call(db,'/live/api/gallery/1',{body:new Uint8Array(20),type:'image/jpeg',cookie})).status,400);
  assert.equal((await (await call(db,'/live/api/gallery')).json()).photos.length,0);
  db.sql.close();
});
test('legacy photo remains visible until an administrator selects a gallery photo',async()=>{
  const db=database();db.sql.prepare('UPDATE live_content SET photo_version=? WHERE id=1').run('legacy');
  const data=await (await call(db,'/live/api/gallery')).json();assert.equal(data.moment.url,'/live/api/photo?v=legacy');
  const html=await (await call(db,'/live/')).text();assert.match(html,/<img id="momento-image"[^>]*src="\/live\/api\/photo\?v=legacy/);
  db.sql.close();
});
