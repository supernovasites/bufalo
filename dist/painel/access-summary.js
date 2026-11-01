(() => {
  const root=document.getElementById('site-access-summary'),dash=document.getElementById('dashboard');
  if(!root||!dash)return;
  const $=id=>document.getElementById(id);
  let requestId=0,loaded=false;
  async function load(){
    if(dash.hidden)return;
    const id=++requestId;
    $('summary-reload').disabled=true;
    $('summary-status').textContent='Carregando acessos…';
    try{
      const r=await fetch('/painel/api/site-analytics?days='+$('summary-days').value+'&device=all&page=all',{cache:'no-store',credentials:'same-origin'});
      const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível consultar os acessos.');
      if(id!==requestId||dash.hidden)return;
      const list=$('summary-pages');list.replaceChildren();
      const pages=[...data.pages].filter(p=>Number(p.views)>0).sort((a,b)=>Number(b.views)-Number(a.views)||a.page.localeCompare(b.page)).slice(0,5);
      if(!pages.length){const empty=document.createElement('p');empty.textContent='Nenhum acesso registrado neste período.';list.append(empty);}
      for(const [index,page] of pages.entries()){
        const row=document.createElement('div');row.className='metric-bar-row';
        const name=document.createElement('span'),count=document.createElement('strong');
        name.textContent=(index+1)+'. '+(page.page==='/'?'Homepage':page.page);
        count.textContent=Number(page.views||0).toLocaleString('pt-BR');
        row.append(name,count);list.append(row);
      }
      $('summary-status').textContent='Atualizado: '+new Date().toLocaleString('pt-BR',{timeZone:'America/Belem'});
    }catch(e){if(id===requestId)$('summary-status').textContent=e.message;}
    finally{if(id===requestId)$('summary-reload').disabled=false;}
  }
  $('summary-days').addEventListener('change',load);$('summary-reload').addEventListener('click',load);
  const session=()=>{if(!dash.hidden&&!loaded){loaded=true;load();}if(dash.hidden){loaded=false;++requestId;$('summary-pages').replaceChildren();}};
  new MutationObserver(session).observe(dash,{attributes:true,attributeFilter:['hidden']});session();
})();