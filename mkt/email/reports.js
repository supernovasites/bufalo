import {escapeHtml as e} from './core.js';
const $=id=>document.getElementById(id);
const number=v=>Number(v||0).toLocaleString('pt-BR');
const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Belem'}):'—';
const percent=(n,d)=>d?(n/d*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—';
const states={draft:'Rascunho',queued:'Na fila',paused:'Pausada',completed:'Processamento concluído'};
const statuses={pending:'Aguardando envio',accepted:'Aceito pelo Resend',delivered:'Entregue ao servidor',bounced:'Rejeitado',failed:'Falha',complained:'Reclamação de spam',skipped:'Bloqueado antes do envio'};
const eventNames={accepted:'Aceito pelo Resend','email.sent':'Envio confirmado','email.delivered':'Entregue ao servidor','email.delivery_delayed':'Entrega atrasada','email.opened':'Abertura registrada','email.clicked':'Clique registrado','email.bounced':'Rejeitado','email.complained':'Reclamação de spam','email.failed':'Falha de envio','email.suppressed':'Suprimido pelo Resend'};
function cards(t){return [
  ['Destinatários',t.total,'Contatos incluídos nos disparos'],['Aceitos pelo Resend',t.sent,percent(t.sent,t.total)+' dos destinatários'],
  ['Entregues ao servidor',t.delivered,percent(t.delivered,t.sent)+' dos aceitos'],['Aberturas únicas',t.opened,percent(t.opened,t.delivered)+' dos entregues'],
  ['Cliques únicos',t.clicked,percent(t.clicked,t.delivered)+' dos entregues'],['Rejeições',t.bounced,percent(t.bounced,t.sent)+' dos aceitos'],
  ['Falhas',t.failed,'Falhas e supressões do provedor'],['Reclamações de spam',t.complained,percent(t.complained,t.sent)+' dos aceitos']
].map(([label,value,note])=>`<div class="metric-card"><span>${e(label)}</span><strong>${number(value)}</strong><small>${e(note)}</small></div>`).join('');}
function csvCell(value){let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
function download(name,rows){const text='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountReports(api,showPanel){
  let selected='',page=1,overview=null,report=null,generation=0,loading=false;
  const message=(text,error=false)=>{$('results-message').textContent=text;$('results-message').classList.toggle('error',error);};
  function drawOverview(){
    $('overview-metrics').innerHTML=cards(overview.totals);
    $('results-campaign').innerHTML='<option value="">Selecione uma campanha</option>'+overview.campaigns.map(c=>`<option value="${e(c.id)}">${e(c.name)} · ${e(states[c.status]||c.status)}</option>`).join('');$('results-campaign').value=selected;
    $('results-comparison').innerHTML=overview.campaigns.length?overview.campaigns.map(c=>`<tr><td><button type="button" class="text-button" data-report="${e(c.id)}">${e(c.name)}</button><small>${e(states[c.status]||c.status)} · ${e(c.list_name||'—')}</small></td><td>${number(c.total)}</td><td>${number(c.sent)}</td><td>${number(c.delivered)}<small>${percent(c.delivered,c.sent)}</small></td><td>${number(c.opened)}</td><td>${number(c.clicked)}</td><td>${number((c.bounced||0)+(c.failed||0))}</td></tr>`).join(''):'<tr><td colspan="7">Nenhuma campanha criada. Os testes individuais não entram nos resultados de campanhas.</td></tr>';
    $('results-updated').textContent='Atualizado em '+date(overview.updatedAt)+'. Atualização automática a cada 30 segundos enquanto esta aba estiver visível.';
  }
  function drawReport(){
    $('results-detail').hidden=!report;if(!report)return;
    const {campaign:c,totals:t}=report;
    $('results-name').textContent=c.name;$('results-status').textContent=states[c.status]||c.status;
    $('results-subject').textContent=c.subject;
    $('results-meta').textContent=`Lista: ${c.list_name||'—'} · Criada em ${date(c.created_at)} · Último evento: ${date(t.last_event_at)}`;
    $('campaign-metrics').innerHTML=cards(t);
    const stages=[['Destinatários',t.total],['Aceitos pelo Resend',t.sent],['Entregues ao servidor',t.delivered],['Abriram',t.opened],['Clicaram',t.clicked]];
    $('results-funnel').innerHTML=stages.map(([label,n])=>`<div class="funnel-row"><span>${e(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${t.total?Math.min(100,n/t.total*100):0}%"></div></div><strong>${number(n)}</strong></div>`).join('');
    $('results-queue').innerHTML=[['Aguardando envio',t.pending],['Aguardando entrega',t.awaiting],['Com atraso informado',t.delayed],['Bloqueados antes do envio',t.skipped],['Descadastrados da base',t.unsubscribed],['Aberturas totais',t.opens],['Cliques totais',t.clicks]].map(([label,n])=>`<div><span>${e(label)}</span><strong>${number(n)}</strong></div>`).join('');
    $('results-rates').textContent=`Taxa de clique entre aberturas: ${percent(t.clicked,t.opened)}. As etapas de engajamento são independentes: bloqueios de imagens podem registrar cliques sem abertura.`;
    const max=Math.max(1,...report.daily.flatMap(d=>[d.sent,d.delivered,d.opened,d.clicked]));
    $('results-daily').innerHTML=report.daily.length?report.daily.map(d=>`<tr><th scope="row">${e(d.day.split('-').reverse().join('/'))}</th>${['sent','delivered','opened','clicked'].map(k=>`<td><div class="daily-cell"><span class="daily-bar ${k}" style="width:${d[k]/max*100}%"></span><strong>${number(d[k])}</strong></div></td>`).join('')}</tr>`).join(''):'<tr><td colspan="5">Ainda não há eventos com data registrados. O histórico detalhado começa após esta atualização.</td></tr>';
    $('results-links').innerHTML=report.links.length?report.links.map(l=>`<tr><td>${e(l.url)}</td><td>${number(l.people)}</td><td>${number(l.clicks)}</td></tr>`).join(''):'<tr><td colspan="3">Nenhum clique registrado. O rastreamento precisa estar ativo no Resend.</td></tr>';
    $('results-recipients').innerHTML=report.recipients.length?report.recipients.map(r=>`<tr><td><strong>${e(r.email)}</strong><small>${e(r.name||'—')}${r.contact_status==='unsubscribed'?' · Descadastrado da base':''}</small></td><td><span class="pill report-${e(r.status)}">${e(statuses[r.status]||r.status)}</span>${r.detail?`<small>${e(r.detail)}</small>`:''}<small>ID Resend: ${e(r.provider_id||'—')}</small></td><td>${e(date(r.accepted_at))}</td><td>${e(date(r.delivered_at))}</td><td>${number(r.opens)}</td><td>${number(r.clicks)}</td><td><button type="button" class="text-button" data-events="${e(r.email)}">Ver eventos</button></td></tr>`).join(''):'<tr><td colspan="7">Nenhum destinatário encontrado para os filtros selecionados.</td></tr>';
    $('results-pagination').textContent=`${number(report.matched)} destinatários · Página ${report.page} de ${Math.max(1,report.pages)}`;
    $('results-prev').disabled=report.page<=1;$('results-next').disabled=report.page>=report.pages;
    $('results-export').disabled=!t.total;
  }
  async function load(includeOverview=true){
    const version=++generation,id=selected,params=new URLSearchParams({page:String(page),status:$('results-filter').value,search:$('results-search').value.trim()});
    loading=true;$('results-refresh').disabled=true;$('results-detail').setAttribute('aria-busy','true');
    try{
      const [all,detail]=await Promise.all([includeOverview?api('reports'):null,id?api('reports/'+id+'?'+params):null]);
      if(version!==generation)return;if(all){overview=all;drawOverview();}report=detail;drawReport();message('');
    }catch(error){if(version===generation){message(error.message,true);$('results-updated').textContent='Não foi possível atualizar. Os dados abaixo podem estar desatualizados.';}}
    finally{if(version===generation){loading=false;$('results-refresh').disabled=false;$('results-detail').setAttribute('aria-busy','false');}}
  }
  function choose(id){selected=id;page=1;report=null;drawReport();$('results-filter').value='';$('results-search').value='';$('results-events').hidden=true;showPanel('results');load();}
  document.querySelector('[data-panel="results"]').addEventListener('click',()=>load());
  document.addEventListener('click',event=>{const button=event.target.closest('[data-report]');if(button)choose(button.dataset.report);});
  $('results-campaign').addEventListener('change',()=>choose($('results-campaign').value));
  $('results-refresh').addEventListener('click',()=>load());
  $('results-filter-form').addEventListener('submit',event=>{event.preventDefault();page=1;$('results-events').hidden=true;load(false);});
  $('results-filter').addEventListener('change',()=>{page=1;$('results-events').hidden=true;load(false);});
  $('results-prev').addEventListener('click',()=>{if(page>1){page--;load(false);}});
  $('results-next').addEventListener('click',()=>{if(report&&page<report.pages){page++;load(false);}});
  $('results-recipients').addEventListener('click',async event=>{
    const button=event.target.closest('[data-events]');if(!button)return;button.disabled=true;const id=selected;
    try{const data=await api('reports/'+id+'/events?'+new URLSearchParams({email:button.dataset.events}));if(id!==selected)return;
      $('results-events').hidden=false;$('results-events-name').textContent='Eventos de '+button.dataset.events;
      $('results-event-list').innerHTML=data.events.length?data.events.map(v=>`<li><strong>${e(eventNames[v.type]||v.type)}</strong><time>${e(date(v.occurred_at))}</time>${v.detail?`<p>${e(v.detail)}</p>`:''}</li>`).join(''):'<li>Sem histórico detalhado para este contato. Eventos antigos não tinham data armazenada.</li>';
      $('results-events-name').focus();
    }catch(error){message(error.message,true);}finally{button.disabled=false;}
  });
  $('results-events-close').addEventListener('click',()=>{$('results-events').hidden=true;});
  $('results-export').addEventListener('click',async()=>{
    const button=$('results-export'),id=selected;if(!id)return;button.disabled=true;
    try{const data=await api('reports/'+id+'?'+new URLSearchParams({export:'1',status:$('results-filter').value,search:$('results-search').value.trim()}));
      download('resultados-campanha.csv',[['Campanha','Email','Nome','Status de envio','Status na base','ID Resend','Aceito em','Entregue em','Primeira abertura','Primeiro clique','Aberturas','Cliques','Último evento','Detalhe'],...data.recipients.map(r=>[data.campaign.name,r.email,r.name,statuses[r.status]||r.status,r.contact_status,r.provider_id,date(r.accepted_at),date(r.delivered_at),date(r.opened_at),date(r.clicked_at),r.opens,r.clicks,date(r.last_event_at),r.detail])]);message('Relatório CSV exportado com os filtros selecionados.');
    }catch(error){message(error.message,true);}finally{button.disabled=false;}
  });
  setInterval(()=>{if(!document.hidden&&!$('results').hidden&&!loading)load();},30000);
}
