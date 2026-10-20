import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {onRequest as panel} from '../functions/painel/_middleware.js';
import {onRequest as reserve} from '../functions/reserva/acaibowl/_middleware.js';
import {campaignEnabled} from '../functions/_lib/campaigns.js';
const origin='https://www.bufalogrowler.com.br';
function database(initial={}){
 const values=new Map(Object.entries(initial));let authenticated=true;
 return {values,set authenticated(value){authenticated=value},prepare(sql){let bindings=[];return {
  bind(...args){bindings=args;return this;},
  async first(){if(sql.includes('live_sessions'))return authenticated?{token:'session'}:null;if(sql.includes('campaign_settings'))return values.has(bindings[0])?{enabled:values.get(bindings[0])}:null;throw Error(sql);},
  async run(){if(sql.startsWith('INSERT INTO campaign_settings'))values.set(bindings[0],bindings[1]);return {success:true};}
 };}};
}
const request=(method='GET',payload,requestOrigin=origin,auth=true)=>new Request(origin+'/painel/api/campaigns',{method,headers:{...(auth?{Cookie:'admin_session='+'a'.repeat(64)}:{}),Origin:requestOrigin,'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload)});
const call=(db,req)=>panel({request:req,env:{LIVE_DB:db},next:()=>new Response('panel')});
test('campaign API lists both campaigns and persists each activation independently',async()=>{
 const db=database();let response=await call(db,request());assert.equal(response.status,200);
 let data=await response.json();assert.deepEqual(data.campaigns.map(c=>[c.slug,c.enabled]),[['cirio',true],['acaibowl',true]]);
 assert.equal(data.campaigns[1].path,'/reserva/acaibowl/');
 for(const enabled of [false,true]){
  response=await call(db,request('POST',{slug:'acaibowl',enabled}));assert.equal(response.status,200);data=await response.json();assert.equal(data.campaigns[1].enabled,enabled);assert.equal(data.campaigns[0].enabled,true);
 }
 await call(db,request('POST',{slug:'cirio',enabled:false}));assert.equal(await campaignEnabled(db,'acaibowl'),true);assert.equal(await campaignEnabled(db,'cirio'),false);
});
test('campaign writes require a valid session, same origin, registered slug and boolean',async()=>{
 const db=database();
 assert.equal((await call(db,request('POST',{slug:'acaibowl',enabled:false},origin,false))).status,401);
 db.authenticated=false;assert.equal((await call(db,request())).status,401);db.authenticated=true;
 assert.equal((await call(db,request('POST',{slug:'acaibowl',enabled:false},'https://other.example'))).status,403);
 for(const payload of [{slug:'unknown',enabled:false},{slug:'acaibowl',enabled:'false'},null])assert.equal((await call(db,request('POST',payload))).status,400);
 assert.equal(db.values.size,0);
});
test('disabled reservation routes redirect before rendering or accepting a reservation',async()=>{
 const db=database({acaibowl:0});let visited=0;
 for(const path of ['/reserva/acaibowl','/reserva/acaibowl/','/reserva/acaibowl/index.html','/reserva/acaibowl/?utm_source=test','/reserva/acaibowl/api/reserva']){
  const response=await reserve({request:new Request(origin+path,{method:path.endsWith('/api/reserva')?'POST':'GET'}),env:{LIVE_DB:db},next:()=>{visited++;return new Response('reservation');}});
  assert.equal(response.status,302);assert.equal(response.headers.get('Location'),origin+'/');assert.match(response.headers.get('Cache-Control'),/no-store/);
 }
 assert.equal(visited,0);
});
test('reactivation resumes the reservation and responses cannot cache an outdated state',async()=>{
 const db=database({acaibowl:0});
 await call(db,request('POST',{slug:'acaibowl',enabled:true}));
 const response=await reserve({request:new Request(origin+'/reserva/acaibowl/'),env:{LIVE_DB:db},next:()=>new Response('reservation',{headers:{'Content-Type':'text/html'}})});
 assert.equal(response.status,200);assert.equal(await response.text(),'reservation');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal(response.headers.get('Content-Type'),'text/html');
 assert.equal(await campaignEnabled(database(),'acaibowl'),true);
 assert.equal(await campaignEnabled(undefined,'acaibowl'),true);
 assert.equal(await campaignEnabled({prepare(){return {bind(){return this},async first(){throw Error('no such table: campaign_settings')}}}},'acaibowl'),true);
});
test('panel loads both controls, toggles Açaí Bowl and restores its button after API failure',async()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:'',classList:{toggle(){}},listeners:{},addEventListener(event,fn){this.listeners[event]=fn}});return nodes.get(id)};
 const state={cirio:true,acaibowl:true};let fail=false;const writes=[];
 const fetch=async(url,options)=>{
  if(url.endsWith('/session'))return Response.json({authenticated:true});
  if(options.method==='POST'){
   const payload=JSON.parse(options.body);writes.push(payload);
   if(fail)return Response.json({error:'Falha ao salvar.'},{status:503});
   state[payload.slug]=payload.enabled;
  }
  return Response.json({campaigns:Object.entries(state).map(([slug,enabled])=>({slug,enabled}))});
 };
 vm.runInNewContext(readFileSync(new URL('../painel/painel.js',import.meta.url),'utf8'),{document:{getElementById:node},fetch});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(node('acaibowl-status').textContent,'Página ativa.');assert.equal(node('acaibowl-toggle').disabled,false);
 await node('acaibowl-toggle').listeners.click();assert.deepEqual(writes[0],{slug:'acaibowl',enabled:false});assert.equal(state.cirio,true);assert.match(node('acaibowl-status').textContent,/Página desativada/);assert.match(node('acaibowl-toggle').textContent,/Reativar/);
 fail=true;await node('acaibowl-toggle').listeners.click();assert.equal(node('acaibowl-toggle').disabled,false);assert.equal(state.acaibowl,false);assert.equal(node('feedback').textContent,'Falha ao salvar.');
 fail=false;await node('acaibowl-toggle').listeners.click();assert.equal(state.acaibowl,true);
 const html=readFileSync(new URL('../painel/index.html',import.meta.url),'utf8');assert.ok(html.includes('id="acaibowl-toggle"'));assert.equal(html,readFileSync(new URL('../dist/painel/index.html',import.meta.url),'utf8'));
 assert.equal(readFileSync(new URL('../painel/painel.js',import.meta.url),'utf8'),readFileSync(new URL('../dist/painel/painel.js',import.meta.url),'utf8'));
});
