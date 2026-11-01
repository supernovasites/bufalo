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
      td.colSpan = 4;
      const tr = make('tr');tr.append(td);body.append(tr);return;
    }
    list.forEach((item,index)=>{
      const tr = make('tr');
      tr.append(make('td','',String(index+1)),make('td','',sectionTitle(item.section)));
      const name = make('td','',item.label || item.element);
      if(item.target)name.append(make('small','',item.target));
      tr.append(name,make('td','',number(item.clicks)));
      body.append(tr);
    });
  }
  function render(data) {
    currentData = data;
    $('click-total').textContent = number(data.clicks);
    $('click-views').textContent = number(data.views);
    $('click-rate').textContent = data.views ? (data.clicks / data.views).toLocaleString('pt-BR',{maximumFractionDigits:2}) : '—';
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
    setStatus('Atualizado: ' + new Date().toLocaleString('pt-BR') + ' · Horário de Belém (UTC−3).');
  }
  async function load() {
    if (dash.hidden) return;
    const id = ++currentRequest;
    $('click-reload').disabled=true;
    setStatus('Carregando dados de cliques…');
    try {
      const params = new URLSearchParams({days:$('click-days').value,device:$('click-device').value});
      const response = await fetch('/painel/api/home-analytics?' + params,{cache:'no-store',credentials:'same-origin'});
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Não foi possível consultar o relatório.');
      if (id === currentRequest) render(json);
    } catch (error) { if (id === currentRequest) setStatus(error.message,true); }
    finally { if (id === currentRequest) $('click-reload').disabled=false; }
  }
  $('click-days').addEventListener('change',load);
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
