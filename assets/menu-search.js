/* Busca por nome no catálogo da Loja Integrada, sem assistente de IA. */
(()=>{
 'use strict';
 const searchButton=document.getElementById('bg-search-toggle');
 if(searchButton&&!searchButton.querySelector('.bg-search-label')){const label=document.createElement('span');label.className='bg-search-label';label.textContent='Ache Fácil';searchButton.append(label);searchButton.setAttribute('aria-label','Ache Fácil: buscar produtos');}
 const menu=document.getElementById('mobile-menu');if(!menu||menu.dataset.searchReady)return;menu.dataset.searchReady='true';
 const form=menu.querySelector('form'),input=form?.querySelector('input[name="q"]');if(!input)return;
 const store='https://loja.bufalogrowler.com.br';
 const panel=document.createElement('section');panel.className='bg-search-results';panel.hidden=true;panel.setAttribute('aria-label','Sugestões de produtos');form.after(panel);
 input.type='search';input.autocomplete='off';input.placeholder='Digite o nome do produto';input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls','bg-search-options');input.setAttribute('aria-label','Buscar produtos na Loja Integrada');
 let timer,controller,version=0,active=-1,options=[];
 function hide(){panel.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function status(text){panel.replaceChildren();const p=document.createElement('p');p.setAttribute('role','status');p.textContent=text;panel.append(p);panel.hidden=false;input.setAttribute('aria-expanded','true');options=[];active=-1;input.removeAttribute('aria-activedescendant');}
 function results(products,query){
  panel.replaceChildren();options=[];active=-1;input.removeAttribute('aria-activedescendant');
  const list=document.createElement('div');list.id='bg-search-options';list.setAttribute('role','listbox');list.setAttribute('aria-label','Produtos encontrados');
  for(const p of products){
   let url,image;try{url=new URL(p.url);image=new URL(p.image);if(url.origin!==store||image.protocol!=='https:')continue;}catch{continue;}
   const a=document.createElement('a');a.href=url.href;a.id='bg-search-option-'+options.length;a.setAttribute('role','option');a.setAttribute('aria-selected','false');
   const img=document.createElement('img');img.src=image.href;img.alt='';img.width=48;img.height=48;img.loading='lazy';
   const name=document.createElement('span');name.textContent=p.name;a.append(img,name);list.append(a);options.push(a);
  }
  if(options.length)panel.append(list);else{const p=document.createElement('p');p.setAttribute('role','status');p.textContent='Nenhum produto encontrado. Tente outro nome.';panel.append(p);}
  const all=document.createElement('a');all.className='bg-search-all';all.href=store+'/buscar?q='+encodeURIComponent(query);all.textContent='Ver todos os resultados na loja';panel.append(all);panel.hidden=false;input.setAttribute('aria-expanded','true');
 }
 input.addEventListener('input',()=>{
  clearTimeout(timer);controller?.abort();const turn=++version,query=input.value.trim();if(query.length<2){hide();return;}status('Buscando produtos…');
  timer=setTimeout(async()=>{controller=new AbortController();try{const response=await fetch('https://www.bufalogrowler.com.br/api/catalog-search?q='+encodeURIComponent(query.slice(0,80)),{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Busca indisponível');const data=await response.json();if(turn===version)results(Array.isArray(data.products)?data.products:[],query);}catch(e){if(e.name!=='AbortError'&&turn===version){results([],query);panel.querySelector('p').textContent='Não foi possível carregar as sugestões. Use “Ver todos os resultados” para buscar na loja.';}}},280);
 });
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopPropagation();hide();return;}
  if(['ArrowDown','ArrowUp'].includes(e.key)&&!panel.hidden&&options.length){e.preventDefault();active=active<0?(e.key==='ArrowDown'?0:options.length-1):(active+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options.forEach((a,i)=>a.setAttribute('aria-selected',String(i===active)));input.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView({block:'nearest'});}
  if(e.key==='Enter'&&active>=0&&!panel.hidden){e.preventDefault();location.href=options[active].href;}
 });
 document.getElementById('bg-search-toggle')?.addEventListener('click',()=>{if(!menu.open)menu.showModal();document.getElementById('close-menu')?.focus({preventScroll:true});});
 menu.addEventListener('close',()=>{clearTimeout(timer);controller?.abort();++version;hide();});
})();
