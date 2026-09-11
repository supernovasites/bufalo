import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=wranglerRequire('miniflare');
const bindings=Object.fromEntries(readFileSync(resolve('.dev.vars'),'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)]}));
const mf=new Miniflare(convertV4MiniflareOptions({host:'127.0.0.1',port:8787,cf:false,d1Persist:resolve('.local-state/d1'),r2Persist:resolve('.local-state/r2'),workers:[{name:'bufalo-preview',modules:true,script:readFileSync(resolve('src/worker.mjs'),'utf8'),compatibilityDate:'2026-09-11',compatibilityFlags:['nodejs_compat'],bindings,d1Databases:{DB:'bufalo-preview'},r2Buckets:['MEDIA'],assets:{directory:resolve('public'),binding:'ASSETS',run_worker_first:true,routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}}}]}));
await mf.ready;
const db=await mf.getD1Database('DB');
const exists=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'").first();
if(!exists){const sql=readFileSync(resolve('migrations/0001_initial.sql'),'utf8');for(const statement of sql.split(';').filter(s=>s.trim()))await db.prepare(statement).run();}
for(const statement of readFileSync(resolve('migrations/0002_admin_password.sql'),'utf8').split(';').filter(s=>s.trim()))await db.prepare(statement).run();
const n=await db.prepare('SELECT COUNT(*) AS n FROM banners').first();
if(!n.n&&!bindings.ADMIN_PASSWORD_HASH){const r=await mf.dispatchFetch('http://127.0.0.1:8787/api/admin/seed',{method:'POST',headers:{Origin:'http://127.0.0.1:8787'}});if(!r.ok)throw new Error(await r.text());}
console.log('Prévia pronta: http://127.0.0.1:8787/admin');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void mf.dispose().then(()=>process.exit(0)));



