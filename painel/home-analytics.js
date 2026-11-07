(() => {
  'use strict';
  const root = document.getElementById('homepage-analytics');
  const dash = document.getElementById('dashboard');
  if (!root || !dash) return;
  const $ = id => document.getElementById(id);
  const number = n => Number(n || 0).toLocaleString('pt-BR');
  const sectionNames = {
    'homepage':'Homepage','cabecalho':'Cabeçalho','rodape':'Rodapé','navegacao':'Navegação',
    'banner-principal':'Banner principal','aventura':'Vídeo aventura','lancamentos':'Lançamentos',
    'mais-vendidos':'Os mais pedidos','categorias':'Compre por categoria','acessorios':'Tampas e acessórios',
    'ofertas-do-mes':'Achados do mês','momentos-bufalo':'Bons encontros',
    'camping-bufalo':'Explore com a Búfalo','blog':'Blog Búfalo','moda-bufalo':'Vista Búfalo',
    'manada-instagram':'Instagram','mc-converter':'ManadaCash'
  };
  const sectionTitle = key => sectionNames[key] || (key.startsWith('popup-') ? 'Popup: ' + key.slice(6).replace(/-/g,' ') : key.replace(/-/g,' '));
  $('click-page').value = '/';
  $('click-days').value = '1';
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Belem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  for (const id of ['click-start','click-end']) { $(id).value = today; $(id).max = today; }
  function dateControls() {
    const custom = $('click-days').value === 'custom';
    $('click-start-label').hidden = !custom;
    $('click-end-label').hidden = !custom;
  }
  dateControls();
  const pageName = page => ({'/':'Homepage','/produtos/chopeira/':'Chopeira','/campanhas/black26/':'Black26','/live/':'Live'})[page] || page;
  let loaded = false, currentData = null, currentRequest = 0;
  function make(tag,cls,text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function setStatus(text, error) {
    $('click-status').textContent = text;
    $('click-status').style.color = error ? '#a32920' : '';
  }
  function bars(list, container) {
    const node = $(container);
    node.replaceChildren();
    if (!list.length) { node.append(make('p','','Sem cliques neste período.')); return; }
    const max = Math.max(1,...list.map(r => Number(r.clicks)));
    list.forEach(item => {
      const row = make('div','metric-bar-row');
      row.append(make('span','',sectionTitle(item.section)),make('strong','',number(item.clicks)));
      const track = make('div','metric-bar-track');
      const fill = make('div','metric-bar-fill');
      fill.style.width = (100 * Number(item.clicks) / max).toFixed(1) + '%';
      track.append(fill); row.append(track); node.append(row);
    });
  }
  function drawDaily(rows) {
    const root = $('click-daily');
    root.replaceChildren();
    if (!rows.length) { root.append(make('span','','Ainda sem dados.')); return; }
    const max = Math.max(1,...rows.map(row=>Number(row.clicks)));
    rows.forEach(row => {
      const day = make('div','metrics-day');
      const bar = make('div','metrics-day-bar');
      bar.style.height = (5 + 95 * Number(row.clicks)/max) + '%';
      day.title = row.day + ': ' + number(row.clicks) + ' cliques / ' + number(row.views) + ' visitas';
      day.setAttribute('aria-label',day.title);
      day.append(bar,make('span','',row.day.slice(5).replace('-','/')));
      root.append(day);
    });
  }
  function updateElements() {
    const data = currentData;
    if (!data) return;
    const value = $('click-section').value;
    const list = value === 'all' ? data.elements : data.elements.filter(item=>item.section === value);
    const body = $('click-items');
    body.replaceChildren();
    if (!list.length) {
      const td = make('td','','Nenhum clique registrado nesta seleção.');
      td.colSpan = 6;
      const tr = make('tr');tr.append(td);body.append(tr);return;
    }
    list.forEach((item,index)=>{
      const tr = make('tr');
      tr.append(make('td','',String(index+1)),make('td','',item.day ? item.day.split('-').reverse().join('/') : '—'),make('td','',item.page || '/'),make('td','',sectionTitle(item.section)));
      const name = make('td','',item.label || item.element);
      if(item.target)name.append(make('small','',item.target));
      tr.append(name,make('td','',number(item.clicks)));
      body.append(tr);
    });
  }
  function render(data) {
    currentData = data;
    const name = pageName(data.page);
    $('stats-page-title').textContent = 'Desempenho da ' + name;
    $('stats-views-title').textContent = 'Acessos únicos à ' + name;
    $('scroll-title').textContent = 'Rolagem da ' + name;
    const pageList = $('stats-pages'); pageList.replaceChildren();
    const pages = [...data.pages].filter(item=>['/','/produtos/chopeira/','/campanhas/black26/','/live/'].includes(item.page)).sort((a,b)=>Number(b.views)-Number(a.views)||a.page.localeCompare(b.page)).slice(0,5);
    if (!pages.length) pageList.append(make('p','','Nenhum acesso registrado neste período.'));
    pages.forEach((item,index)=>{
      const row = make('div','metric-bar-row');
      row.append(make('span','',(index+1) + '. ' + pageName(item.page)),make('strong','',number(item.views) + ' acessos'));
      pageList.append(row);
    });
    $('click-total').textContent = number(data.clicks);
    $('click-views').textContent = number(data.views);
    $('click-rate').textContent = data.views ? (data.clicks / data.views).toLocaleString('pt-BR',{maximumFractionDigits:2}) : '—';
    const scroll = $('scroll-milestones');
    scroll.replaceChildren();
    const scrollRows = data.scroll || [25,50,75,100].map(percent=>({percent,visits:0}));
    const scrollTotal = scrollRows.reduce((total,item)=>total + Number(item.visits || 0),0);
    scrollRows.forEach(item=>{
      const card = make('div','metric');
      card.append(make('span','metric-label',item.percent + '% — ' + (item.sections?.length ? item.sections.join(' / ') : 'Seção ainda não registrada')),make('strong','',number(item.visits)),make('small','',(scrollTotal ? 100 * Number(item.visits || 0) / scrollTotal : 0).toLocaleString('pt-BR',{maximumFractionDigits:1}) + '% dos usuários nesta faixa'));
      scroll.append(card);
    });
    const product = $('top-product');
    product.replaceChildren();
    const products = data.topProducts || (data.topProduct ? [data.topProduct] : []);
    if (products.length) {
      const list = make('ol','top-products-list');
      products.slice(0,5).forEach((item,index) => {
        const row = make('li','metric-bar-row');
        const link = make('a','top-product-link',(index+1) + '. ' + item.label);
        link.href = 'https://' + item.target;
        link.target = '_blank'; link.rel = 'noopener';
        row.append(link,make('span','top-product-count',number(item.clicks) + ' cliques')); list.append(row);
      });
      product.append(list);
    } else product.append(make('p','','Nenhum clique em produto registrado nesta seleção.'));
    bars(data.sections,$('click-sections').id);
    drawDaily(data.daily);
    const control = $('click-section');
    const previous = control.value;
    control.replaceChildren(new Option('Todas as seções','all'),...data.sections.map(item=>new Option(sectionTitle(item.section),item.section)));
    if ([...control.options].some(x=>x.value===previous)) control.value=previous;
    updateElements();
    const devices = data.devices.map(item => ({section:({desktop:'Computador',tablet:'Tablet',mobile:'Celular'})[item.device] || item.device,clicks:item.clicks}));
    const el = $('click-devices');
    el.replaceChildren();
    if (devices.length) devices.forEach(item=>{
      const row = make('div','metric-bar-row');
      row.append(make('span','',item.section),make('strong','',number(item.clicks)));
      const track = make('div','metric-bar-track'),fill=make('div','metric-bar-fill');
      fill.style.width = (data.clicks ? 100*Number(item.clicks)/data.clicks : 0) + '%';
      track.append(fill);row.append(track);el.append(row);
    });
    else el.append(make('p','','Sem dados por dispositivo.'));
    setStatus('Atualizado: ' + new Date().toLocaleString('pt-BR',{timeZone:'America/Belem'}) + ' · Horário de Belém (UTC−3).');
  }
  const surveyReasons={'produto-caro':'Preço do produto alto','frete-caro':'Frete caro','prazo-longo':'Prazo de entrega longo','outro':'Outro motivo'};
  let surveyOffset=0, surveyRequest=0;
  async function loadSurvey() {
    const requestId=++surveyRequest;
    const panel=$('survey-panel');
    panel.hidden=$('click-page').value!=='/produtos/chopeira/';
    if(panel.hidden){$('survey-rows').replaceChildren();$('survey-summary').replaceChildren();return;}
    $('survey-status').textContent='Carregando respostas…';
    $('survey-rows').replaceChildren();$('survey-summary').replaceChildren();
    $('survey-prev').disabled=true;$('survey-next').disabled=true;
    const params=new URLSearchParams({days:$('click-days').value,device:$('click-device').value,offset:String(surveyOffset)});
    if($('click-days').value==='custom'){params.set('start',$('click-start').value);params.set('end',$('click-end').value);}
    try {
      const response=await fetch('/painel/api/chopeira-surveys?'+params,{cache:'no-store',credentials:'same-origin'});
      const data=await response.json();
      if(requestId!==surveyRequest)return;
      if(response.status===401){location.href='/painel/';return;}
      if(!response.ok)throw new Error(data.error||'Não foi possível consultar as respostas.');
      const body=$('survey-rows');body.replaceChildren();
      data.rows.forEach(item=>{
        const tr=make('tr');const phone=make('td');
        const link=make('a','', '+'+item.phone);link.href='https://wa.me/'+item.phone;link.target='_blank';link.rel='noopener noreferrer';phone.append(link);
        tr.append(make('td','',new Date(item.created_at).toLocaleString('pt-BR',{timeZone:'America/Belem'})),make('td','',item.name),phone,make('td','',item.reasons.map(key=>surveyReasons[key]||key).join(', ')),make('td','',item.other||'—'));body.append(tr);
      });
      if(!data.rows.length){const tr=make('tr'),td=make('td','','Nenhuma resposta neste período.');td.colSpan=5;tr.append(td);body.append(tr);}
      const summary=$('survey-summary');summary.replaceChildren();
      data.summary.forEach(item=>{const row=make('div','metric-bar-row');row.append(make('span','',surveyReasons[item.reason]||item.reason),make('strong','',number(item.total)));summary.append(row);});
      $('survey-status').textContent=number(data.total)+' respostas'+(data.total?' · Exibindo '+(data.offset+1)+' a '+(data.offset+data.rows.length):'')+'. Uma pessoa pode selecionar vários motivos.';
      $('survey-prev').disabled=surveyOffset===0;$('survey-next').disabled=surveyOffset+data.limit>=data.total;
    }catch(error){if(requestId===surveyRequest)$('survey-status').textContent=error.message;}
  }
  $('survey-prev').addEventListener('click',()=>{surveyOffset=Math.max(0,surveyOffset-50);loadSurvey();});
  $('survey-next').addEventListener('click',()=>{surveyOffset+=50;loadSurvey();});
  async function load() {
    if (dash.hidden) return;
    surveyOffset=0;loadSurvey();
    const id = ++currentRequest;
    $('click-reload').disabled=true;
    setStatus('Carregando dados de cliques…');
    try {
      const params = new URLSearchParams({days:$('click-days').value,device:$('click-device').value,page:$('click-page').value});
      if ($('click-days').value === 'custom') {
        const start = $('click-start').value, end = $('click-end').value;
        if (!start || !end || start > end || end > today) throw new Error('Selecione um intervalo válido, até hoje.');
        params.set('start',start); params.set('end',end);
      }
      const response = await fetch('/painel/api/site-analytics?' + params,{cache:'no-store',credentials:'same-origin'});
      const json = await response.json();
      if (response.status === 401) { location.href='/painel/'; return; }
      if (!response.ok) throw new Error(json.error || 'Não foi possível consultar o relatório.');
      if (id === currentRequest) render(json);
    } catch (error) { if (id === currentRequest) setStatus(error.message,true); }
    finally { if (id === currentRequest) $('click-reload').disabled=false; }
  }
  $('click-page').addEventListener('change',()=>{ $('click-section').value='all'; load(); });
  $('click-days').addEventListener('change',()=>{dateControls();load();});
  $('click-start').addEventListener('change',load);
  $('click-end').addEventListener('change',load);
  $('click-device').addEventListener('change',load);
  $('click-section').addEventListener('change',updateElements);
  $('click-reload').addEventListener('click',load);
  function onSession() {
    if (!dash.hidden && !loaded) {loaded=true;load();}
    if (dash.hidden) {loaded=false;currentData=null;}
  }
  new MutationObserver(onSession).observe(dash,{attributes:true,attributeFilter:['hidden']});
  onSession();
})();
