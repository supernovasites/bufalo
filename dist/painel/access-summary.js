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
      const pages=[...new Set([...["/blog/artigo.html","/blog/","/campanhas/black26/","/campanhas/cirio/","/catalogo/","/","/live/encerrada.html","/live/games/","/live/","/manadacash/","/manadaone/encerrada.html","/manadaone/","/mc/","/produtos/chopeira/","/produtos/copos/","/produtos/garrafas/","/reserva/acaibowl/"],...data.pages.map(p=>p.page)])];
      pages.sort((a,b)=>(data.pages.find(p=>p.page===b)?.views||0)-(data.pages.find(p=>p.page===a)?.views||0));
      for(const page of pages){
        const row=document.createElement('div');row.className='metric-bar-row';
        const name=document.createElement('span'),count=document.createElement('strong');
        name.textContent=page==='/'?'Homepage':page;
        count.textContent=Number(data.pages.find(p=>p.page===page)?.views||0).toLocaleString('pt-BR');
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