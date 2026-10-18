import {products as fallbackProducts} from '../_lib/store-catalog.js';
const store='https://loja.bufalogrowler.com.br';
const origins=new Set([store,'https://www.bufalogrowler.com.br','https://bufalogrowler.com.br']);
const cache=new Map();
export const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export function safeProduct(p){
 try{const url=new URL(p.url,store),image=new URL(p.image);if(url.origin!==store||image.protocol!=='https:'||!['cdn.awsli.com.br','cdn.awsli.com.br.'].includes(image.hostname)||!p.name.trim())return null;return{name:p.name.replace(/\s+/g,' ').trim().slice(0,200),url:url.href,image:image.href};}catch{return null;}
}
const reply=(request,data,status=200)=>{const origin=request.headers.get('Origin');return Response.json(data,{status,headers:{'Cache-Control':status===200?'public, max-age=60':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{})}});};
export async function onRequestGet({request}){
 const origin=request.headers.get('Origin');if(origin&&!origins.has(origin))return reply(request,{error:'Origem inválida.'},403);
 const raw=new URL(request.url).searchParams.get('q')||'';if(raw.length>80)return reply(request,{error:'Busca muito longa.'},400);
 const q=raw.trim();if(q.length<2)return reply(request,{products:[]});
 const key=normalize(q),cached=cache.get(key);if(cached?.until>Date.now())return reply(request,cached.data);
 let data;
 try{
  const response=await fetch(store+'/buscar?q='+encodeURIComponent(q),{headers:{Accept:'text/html'},signal:AbortSignal.timeout(8000),cf:{cacheTtl:120}});
  if(!response.ok)throw Error('Loja indisponível');
  const items=[];let current;
  const parser=new HTMLRewriter()
   .on('.listagem-item',{element(){current={name:'',url:'',image:''};items.push(current);}})
   .on('.listagem-item .nome-produto',{element(e){if(current)current.url=e.getAttribute('href')||'';},text(chunk){if(current)current.name+=chunk.text;}})
   .on('.listagem-item .imagem-produto img',{element(e){if(current&&!current.image)current.image=e.getAttribute('data-src')||e.getAttribute('src')||'';}});
  await parser.transform(response).text();
  const seen=new Set();const products=items.map(safeProduct).filter(p=>{if(!p||seen.has(p.url))return false;seen.add(p.url);return true;}).slice(0,6);
  data={products,source:'loja-integrada'};
 }catch{
  const words=key.split(' ').filter(Boolean);
  data={products:fallbackProducts.filter(p=>words.every(w=>normalize(p.name).includes(w))).slice(0,6).map(safeProduct).filter(Boolean),source:'catalogo-verificado'};
 }
 if(cache.size>150)cache.clear();cache.set(key,{data,until:Date.now()+60000});return reply(request,data);
}
