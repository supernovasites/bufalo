import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {submitNps,adminNps,validateNps,ensureNps} from '../functions/_lib/chopeira-nps.js';
import {sha,ensureTeam} from '../functions/_lib/team-auth.js';
class D1 {
 constructor(){this.raw=new DatabaseSync(':memory:');}
 prepare(sql){const db=this.raw;let values=[];return {bind(...v){values=v;return this;},async run(){return db.prepare(sql).run(...values);},async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values)};}};}
 async batch(queries){this.raw.exec('BEGIN');try{const out=[];for(const q of queries)out.push(await q.run());this.raw.exec('COMMIT');return out;}catch(e){this.raw.exec('ROLLBACK');throw e;}}
}
const payload=(extra={})=>({id:crypto.randomUUID(),name:'Maria Silva',email:'maria@example.com',phone:'(91) 99999-1234',score:10,review:'Gostei muito da chopeira.',improvement:'Mais opções de cores.',final_review:'Recomendo!',device:'mobile',consent:true,consentVersion:'review-publication-20261124',...extra});
const submit=(db,data,photo=new Blob([Uint8Array.from([255,216,255,224,0,1,2,3,4,5,6,7])],{type:'image/jpeg'}),origin='https://bufalo.test')=>{const body=new FormData();body.set('data',JSON.stringify(data));if(photo)body.set('photo',photo,'foto.jpg');return submitNps({env:{LIVE_DB:db},request:new Request('https://bufalo.test/api/chopeira-nps',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1'},body})});};
async function admin(db,query=''){const token='a'.repeat(64);await ensureTeam(db);await db.prepare('INSERT OR IGNORE INTO live_sessions VALUES (?,?)').bind(await sha(token),Date.now()+100000).run();return adminNps({env:{LIVE_DB:db},request:new Request('https://bufalo.test/painel/api/chopeira-nps'+query,{headers:{Cookie:'admin_session='+token}})});}
test('validates required contact fields, score bounds and consent',()=>{
 assert.ok(validateNps(payload({score:0})));assert.ok(validateNps(payload({score:10})));
 for(const change of [{score:-1},{score:11},{score:7.5},{score:'9'},{email:'bad'},{phone:'123'},{name:''},{review:''},{consent:false},{consentVersion:'old'},{website:'spam'},{improvement:''},{improvement:'   '},{improvement:undefined},{improvement:'x'.repeat(3001)},{final_review:123}])assert.equal(validateNps(payload(change)),null);
});
test('stores review and private photo atomically; duplicate retry is idempotent',async()=>{
 const db=new D1(),data=payload(),bytes=Uint8Array.from([255,216,255,224,0,1,2,3,4,5,6,7]);
 assert.equal((await submit(db,data,new Blob([bytes],{type:'image/jpeg'}))).status,201);
 assert.equal((await submit(db,data)).status,200);
 const listed=await (await admin(db,'?days=1&device=mobile')).json();
 assert.equal(listed.total,1);assert.equal(listed.rows[0].improvement,data.improvement);assert.equal(listed.rows[0].final_review,data.final_review);assert.equal(listed.rows[0].publication_authorized,1);assert.equal(db.raw.prepare('SELECT version FROM chopeira_nps_consents').get().version,'review-publication-20261124');assert.equal(listed.rows[0].has_photo,1);assert.equal(listed.rows[0].email,data.email);assert.equal(listed.rows[0].phone,'5591999991234');
 const photo=await admin(db,'/photo?id='+data.id);assert.equal(photo.status,200);assert.deepEqual(new Uint8Array(await photo.arrayBuffer()),bytes);assert.equal(photo.headers.get('Cache-Control'),'no-store');
});
test('rejects forged files, cross-origin submissions and unauthenticated reads',async()=>{
 const db=new D1();
 assert.equal((await submit(db,payload(),new Blob(['<svg>bad</svg>'],{type:'image/jpeg'}))).status,415);
 assert.equal((await submit(db,payload(),null,'https://evil.test')).status,403);
 for(const route of ['', '/photo?id='+crypto.randomUUID()])assert.equal((await adminNps({env:{LIVE_DB:db},request:new Request('https://bufalo.test/painel/api/chopeira-nps'+route)})).status,401);
});
test('NPS uses promoters minus detractors, with device/date filters and pagination',async()=>{
 const db=new D1();await ensureNps(db);
 for(const score of [10,9,8,6,0])assert.equal((await submit(db,payload({score}))).status,201);
 let out=await (await admin(db,'?days=1')).json();assert.equal(out.total,5);assert.equal(out.nps,0);assert.equal(out.promoters,2);assert.equal(out.passives,1);assert.equal(out.detractors,2);
 out=await (await admin(db,'?days=1&device=desktop')).json();assert.equal(out.total,0);assert.equal(out.nps,null);
 out=await (await admin(db,'?days=1&offset=3')).json();assert.equal(out.rows.length,2);assert.equal(out.total,5);
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);db.raw.prepare('UPDATE chopeira_nps SET day=?').run(yesterday);
 out=await (await admin(db,'?days=1')).json();assert.equal(out.total,0);
});
test('limits excessive submissions and rejects oversized uploads',async()=>{
 const db=new D1();for(let i=0;i<10;i++)assert.equal((await submit(db,payload())).status,201);
 assert.equal((await submit(db,payload())).status,429);
 assert.equal((await submit(new D1(),payload(),new Blob([new Uint8Array(260000)],{type:'image/jpeg'}))).status,413);
});

test('requires a photo for new submissions',async()=>{assert.equal((await submit(new D1(),payload(),null)).status,400);assert.equal((await submit(new D1(),payload(),new Blob([],{type:'image/jpeg'}))).status,400);});
