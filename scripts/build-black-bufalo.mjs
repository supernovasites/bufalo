import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
let html=await fs.readFile(root+'live/index.html','utf8');
if(html.includes('<section class="black-bufalo"')){const start=html.indexOf('<section class="black-bufalo"');const end=html.indexOf('<section class="live-category-group" id="live-chopeiras"',start);html=html.slice(0,start)+html.slice(end);html=html.replace('<a href="#black-bufalo">Black Búfalo</a>','').replace('<link rel="stylesheet" href="black-bufalo.css?v=20261027">','');}
const data=JSON.parse(await fs.readFile(root+'live/catalog-data.json','utf8'));
html=html.replaceAll('<link rel="stylesheet" href="black-bufalo.css?v=20261027">','');
const home=await fs.readFile(root+'index.html','utf8');
const extra=JSON.parse([...home.matchAll(/const productColors=(\{.*?\});/gs)].at(-1)[1]);
const catalog=data.products;
const groups=[
 ['Alfazema','Chetwode Blue','#e8e4fa','#6860ab',['Caneca Bhadawari 710ml','Copo Niliravi 900ml','Copo Pand 750ml','Growler Palitano 1,350L']],
 ['Amarelo','Gorse','#fff0b3','#947000',['Garrafa Buba 355ml','Growler Mediterrâneo 1,9L']],
 ['Areia','Ash','#eee5d5','#84735a',['Garrafa Buba 355ml','Growler Palitano 1,350L']],
 ['Citrus','Electric Lime','#ecf5c2','#677d14',['Caneca Bhadawari 710ml','Copo Niliravi 900ml','Garrafa Buba 355ml','Growler Mediterrâneo 1,9L']],
 ['Laranja','Coral','#ffe0cf','#b95128',['Caneca Bhadawari 710ml','Copo Banni 350ml','Garrafa Buba 355ml','Growler Mediterrâneo 1,9L']],
 ['Pistache','Olive Green','#e3ecd7','#5a713c',['Garrafa Buba 355ml','Garrafa Harpuri 750ml','Garrafa Jafarabadi 1L','Garrafa Murrah 540ml','Growler Palitano 1,350L']],
 ['Pitaya','Persian Pink','#f9dced','#ac407c',['Copo Niliravi 900ml','Copo Pand 750ml','Garrafa Buba 355ml','Garrafa Jafarabadi 1L','Growler Palitano 1,350L']]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const norm=s=>s.toLowerCase().replace('chetewode','chetwode').replace('persia pink','persian pink');
const missing=[];
function find(name,technical){
 let p=catalog.find(p=>p.name===name);
 if(p){const exact=p.cards.find(c=>norm(c.label)===norm(technical)||norm(c.label)===norm(technical+'/'+technical));const split=p.cards.find(c=>norm(c.label.split('/')[0])===norm(technical));if(exact||split)return {...p,option:exact||split};}
 const slug=name.startsWith('Copo Niliravi')?'copo-nilliravi-900ml':name.startsWith('Copo Banni')?'copo-banni-350ml':null;
 const opt=extra[slug]?.find(c=>norm(c.name||c.label)===norm(technical));
 if(opt)return {name,url:'https://loja.bufalogrowler.com.br/'+slug,option:{label:technical,image:opt.img,price:opt.price,key:slug+'--'+opt.id,stock:'in_stock'}};
 return null;
}
function card(name,technical,color){
 const p=find(name,technical);
 if(!p){missing.push(color+' — '+name);return `<article class="product banni-card black-pending"><div class="product-image"><span class="pending-mark" aria-hidden="true">BÚFALO</span></div><div class="product-info"><h3>${esc(name)}</h3><p class="banni-color">${color}</p><p class="black-pending-note">Variação a confirmar no catálogo</p></div></article>`;}
 const o=p.option,href=p.url+'?utm_source=pagina_live&amp;utm_medium=referral&amp;utm_campaign=BlackBufalo&amp;utm_content='+esc(o.key);
 return `<article class="product banni-card" data-discount="20" data-product-name="${esc(name)}" data-variant-key="${esc(o.key)}" data-stock="${o.stock}"><a class="product-photo-link" href="${href}" target="_blank" rel="noopener noreferrer"><div class="product-image"><span class="badge">−20%</span><img src="${esc(o.image)}" alt="${esc(name+' — '+color)}" width="400" height="400" loading="lazy" decoding="async"></div></a><div class="product-info"><h3>${esc(name)}</h3><p class="banni-color"><span class="black-dot" aria-hidden="true"></span>${color}</p><p class="old"><s>${money(o.price)}</s></p><p class="price">${money(Math.round(o.price*80)/100)}</p><p class="with-coupon">com o cupom <strong>__LIVE_COUPON__</strong></p><a class="product-cta" href="${href}" target="_blank" rel="noopener noreferrer">Compre com desconto</a></div></article>`;
}
const rows=groups.map(([color,technical,bg,accent,names],i)=>{
 const id='black-cor-'+i;
 return `<section class="product-row black-color-row" style="--color-bg:${bg};--color-accent:${accent}" aria-labelledby="${id}"><div class="product-row-heading"><div><span class="black-row-number">0${i+1} / ESCOLHA SUA COR</span><h3 class="category-title" id="${id}">${color}<span class="black-row-count">${names.length} modelos</span></h3></div><div class="row-navigation"><button class="row-arrow" type="button" data-direction="-1" aria-controls="${id}-track" aria-label="Ver produtos anteriores em ${color}">‹</button><button class="row-arrow" type="button" data-direction="1" aria-controls="${id}-track" aria-label="Ver próximos produtos em ${color}">›</button></div></div><div class="product-track" id="${id}-track" tabindex="0" role="group" aria-label="Produtos em ${color}">${names.map(name=>card(name,technical,color)).join('')}</div></section>`;
}).join('\n');
const section=`<section class="black-bufalo" id="black-bufalo" aria-labelledby="black-bufalo-title"><header class="black-heading"><div><p class="eyebrow">SUAS CORES FAVORITAS. A MESMA MANADA.</p><h2 id="black-bufalo-title">Black Búfalo<span>.</span></h2></div><p>Encontre sua cor.<br>Combine seus favoritos.</p></header>${rows}</section>`;
if(html.includes('id="black-bufalo"'))throw Error('Section already exists');
html=html.replace('<section class="live-category-group" id="live-chopeiras"',section+'\n<section class="live-category-group" id="live-chopeiras"');
html=html.replace('<a href="#live-chopeiras">','<a href="#black-bufalo">Black Búfalo</a><a href="#live-chopeiras">');
html=html.replace('</head>','<link rel="stylesheet" href="black-bufalo.css?v=20261027"></head>');
await fs.writeFile(root+'live/index.html',html);await fs.writeFile(root+'dist/live/index.html',html);
await fs.writeFile(root+'live/black-bufalo-config.json',JSON.stringify({groups,missing},null,2));

console.log(JSON.stringify({requested:26,matched:26-missing.length,missing}));
