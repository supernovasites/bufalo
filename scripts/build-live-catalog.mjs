import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const data=JSON.parse(readFileSync(path.join(root,'live/catalog-data.json'),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const slugify=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const byUrl=new Map(data.products.map(p=>[p.url,{...p,cards:p.cards.filter(option=>option.stock==='in_stock')}]));
let rowCount=0,cardCount=0;
function card(product,option){
  cardCount++;
  const link=new URL(product.url);
  link.searchParams.set('utm_source','pagina_live');link.searchParams.set('utm_medium','referral');link.searchParams.set('utm_campaign','LiveshopBG');link.searchParams.set('utm_content',option.key);
  const href=escape(link.href);
  const label=option.label?`<p class="banni-color">${escape(option.label)}</p>`:'';
  const sizes=option.sizes.length?`<p class="live-card-sizes">Tamanhos: ${escape(option.sizes.join(' · '))}</p>`:'';
  const illustrative=option.illustrative?'<p class="card-image-note">Imagem ilustrativa do modelo</p>':'';
  return `<article class="product banni-card" data-discount="20" data-product-name="${escape(product.name)}" data-variant-key="${escape(option.key)}" data-stock="in_stock"><a class="product-photo-link" href="${href}" target="_blank" rel="noopener noreferrer" draggable="false"><div class="product-image"><span class="badge">−20%</span><img src="${escape(option.image)}" alt="${escape(product.name+(option.label?' — '+option.label:'')+(option.illustrative?' (imagem ilustrativa)':''))}" width="400" height="400" loading="lazy" decoding="async" draggable="false"></div></a><div class="product-info"><h3>${escape(product.name)}</h3>${label}${sizes}${illustrative}<p class="old"><span class="sr">Preço sem o cupom: </span>${option.priceFrom?'A partir de ':''}<s>${money(option.price)}</s></p><p class="price">${money(Math.round(option.price*80)/100)}</p><p class="with-coupon">com o cupom <strong>__LIVE_COUPON__</strong></p><a class="product-cta" href="${href}" target="_blank" rel="noopener noreferrer">Compre com desconto</a></div></article>`;
}
function rowsFor(category){
  const products=category.products.map(url=>byUrl.get(url)).filter(p=>p?.cards.length);
  const total=products.reduce((n,p)=>n+p.cards.length,0);
  if(total<=25)return [{id:category.id+'-produtos',name:'Modelos e cores',products}];
  const individual=products.filter(p=>p.cards.length>=4).map(p=>({id:category.id+'-'+slugify(new URL(p.url).pathname),name:p.name,products:[p]}));
  const other=products.filter(p=>p.cards.length<4);
  if(other.length)individual.push({id:category.id+'-mais-modelos',name:'Mais modelos',products:other});
  return individual;
}
function rowHtml(row){
  rowCount++;
  const track=row.id+'-carousel';
  return `<section class="product-row" aria-labelledby="${row.id}"><div class="product-row-heading"><div><h3 class="category-title" id="${row.id}">${escape(row.name)}</h3></div><div class="row-navigation"><button class="row-arrow" type="button" data-direction="-1" aria-controls="${track}" aria-label="Ver opções anteriores de ${escape(row.name)}">‹</button><button class="row-arrow" type="button" data-direction="1" aria-controls="${track}" aria-label="Ver próximas opções de ${escape(row.name)}">›</button></div></div><div class="product-track" id="${track}" tabindex="0" role="group" aria-label="${escape(row.name)}">${row.products.map(p=>p.cards.map(o=>card(p,o)).join('\n')).join('\n')}</div></section>`;
}
const navigation=`<nav class="live-catalog-nav" aria-label="Categorias da live">${data.categories.map(c=>`<a href="#${c.id}">${escape(c.title)}</a>`).join('')}</nav>`;
const groups=data.categories.map(category=>{
 const rows=rowsFor(category);
 const count=category.products.reduce((n,url)=>n+(byUrl.get(url)?.cards.length||0),0);
 const nav=rows.length>1?`<nav class="live-subcategory-nav" aria-label="Modelos de ${escape(category.title)}">${rows.map(r=>`<a href="#${r.id}">${escape(r.name)}</a>`).join('')}</nav>`:'';
 return `<section class="live-category-group" id="${category.id}" data-category-source="${escape(category.url)}" aria-labelledby="${category.id}-title"><header class="live-category-header"><p class="eyebrow">${count} opções</p><h2 id="${category.id}-title">${escape(category.title)}</h2><p><a href="${escape(category.url)}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${escape(category.title)} na loja">Ver na loja ↗</a></p></header>${nav}${rows.map(rowHtml).join('\n')}</section>`;
}).join('\n');
const catalog=`<section class="selection" aria-labelledby="products-title"><div class="selection-head"><div><p class="eyebrow">FAVORITOS DA MANADA</p><h2 id="products-title">Escolha sua próxima companhia.</h2></div><p class="selection-note">Seleção da live · 20% com o cupom</p></div>${navigation}\n${groups}</section>`;
const target=path.join(root,'live/index.html');
let html=readFileSync(target,'utf8');
const start=html.indexOf('<section class="selection"');
if(start<0)throw new Error('Catalog section not found');
let depth=0,end=-1;
const sections=/<\/?section\b[^>]*>/g;sections.lastIndex=start;
for(let m;(m=sections.exec(html));){depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=sections.lastIndex;break;}}
if(end<0)throw new Error('Catalog section not closed');
html=html.slice(0,start)+catalog+html.slice(end);
html=html.replace(/<script\b[^>]*src="category-groups\.js[^\"]*"[^>]*><\/script>/g,'');
html=html.replace(/href="category-groups\.css[^\"]*"/,'href="category-groups.css?v=20261013-mobile-copy"');
writeFileSync(target,html);
copyFileSync(target,path.join(root,'dist/live/index.html'));
console.log(JSON.stringify({categories:data.categories.length,rows:rowCount,cards:cardCount,uniqueModels:data.products.length}));
