import {LIMITS,starter,escapeHtml as e,validateContent,renderEmail,contactsFromRows,parseCsv} from './core.js';
const $=id=>document.getElementById(id);
const fields=['name','subject','preheader','heading','body','layout','imageUrl','imageAlt','buttonText','buttonUrl'];
const statusNames={draft:'Rascunho',queued:'Na fila',paused:'Pausada',completed:'Processamento concluído'};
const countNames={pending:'Aguardando',accepted:'Aceitos',delivered:'Entregues',bounced:'Rejeitados',complained:'Reclamações',failed:'Falhas',skipped:'Bloqueados'};
let state={config:{ready:false,address:''},templates:[],lists:[],campaigns:[]},templateId=null,campaign=null,rows=[],workbook=null,parsed=null,importedListId=null,running=false;
function feedback(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
async function api(path,payload){
  const response=await fetch('/mkt/email/api/'+path,{method:payload===undefined?'GET':'POST',headers:payload===undefined?{}:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload),cache:'no-store'});
  if(response.status===401){location.assign('/painel/');throw new Error('Entre novamente no painel.');}
  let data;try{data=await response.json();}catch{throw new Error('Não foi possível acessar o servidor. Atualize a página e tente novamente.');}
  if(!response.ok)throw new Error(data.error||'Não foi possível concluir.');return data;
}
function action(id,handler){$(id).addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;try{await handler();}catch(error){feedback(error.message,true);}finally{button.disabled=false;updateButtons();}});}
function content(){return Object.fromEntries(fields.map(key=>[key,$(key).value]));}
function setContent(value){for(const key of fields)$(key).value=value[key]??'';preview();}
function preview(){
  const value=content();$('preview-subject').textContent=value.subject||'Assunto da mensagem';$('preview-preheader').textContent=value.preheader;
  $('email-preview').srcdoc=renderEmail(value,{address:state.config.address||'Endereço da empresa · configure antes do envio'}).html;
  $('campaign-message').innerHTML=`<strong>${e(value.name||'Sua mensagem')}</strong><small>Assunto: ${e(value.subject||'Preencha no editor')}</small>`;
}
function showPanel(id){for(const name of ['create','contacts','campaigns'])$(name).hidden=name!==id;document.querySelectorAll('[data-panel]').forEach(button=>{const active=button.dataset.panel===id;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.panel)));
function updateButtons(){
  $('send-test').disabled=!state.config.ready;
  $('start-campaign').disabled=!state.config.ready||!campaign||campaign.status!=='draft'||running;
  $('continue-campaign').disabled=!state.config.ready||running;
  $('save-campaign').disabled=running;
  $('new-message').disabled=running;$('load-template').disabled=running;
  $('import-contacts').disabled=!parsed?.contacts.length||!$('import-consent').checked;
}
async function refresh(){state=await api('state');renderState();}
function renderState(){
  $('connection').textContent=state.config.ready?'Envio configurado':'Envio não configurado';$('connection').classList.toggle('off',!state.config.ready);
  $('setup').hidden=state.config.ready;$('setup-message').textContent=state.config.missing?.length?'Falta configurar: '+state.config.missing.join(' · ')+'.':'';
  const selectedTemplate=$('template-picker').value,selectedList=$('campaign-list').value;
  $('template-picker').innerHTML='<option value="">Escolha um template</option>'+state.templates.map(t=>`<option value="${e(t.id)}">${e(t.name)}</option>`).join('');$('template-picker').value=selectedTemplate;
  $('campaign-list').innerHTML='<option value="">Selecione uma lista</option>'+state.lists.map(l=>`<option value="${e(l.id)}">${e(l.name)} · ${l.active} ativos</option>`).join('');$('campaign-list').value=selectedList;
  $('lists').innerHTML=state.lists.length?state.lists.map(l=>`<div class="saved-item"><strong>${e(l.name)}</strong><p>${l.total} contatos · ${l.active} ativos<br>Origem: ${e(l.source)}</p><span class="pill">Importada em ${new Date(l.created_at).toLocaleDateString('pt-BR')}</span></div>`).join(''):'<p class="empty">Nenhuma lista importada.</p>';
  $('campaign-history').innerHTML=state.campaigns.length?state.campaigns.map(c=>`<div class="saved-item"><strong>${e(c.name)}</strong><p>${e(statusNames[c.status]||c.status)} · ${new Date(c.updated_at).toLocaleDateString('pt-BR')}</p><button class="text-button" type="button" data-campaign="${e(c.id)}">Abrir campanha</button></div>`).join(''):'<p class="empty">Nenhuma campanha criada.</p>';
  preview();updateButtons();
}
$('campaign-history').addEventListener('click',async event=>{const button=event.target.closest('[data-campaign]');if(!button||running)return;try{campaign=await api('campaigns/'+button.dataset.campaign);setContent(campaign.content);$('campaign-list').value=campaign.list_id;templateId=null;renderCampaign();feedback('Campanha carregada. O conteúdo de campanhas iniciadas fica preservado.');}catch(error){feedback(error.message,true);}});
function renderCampaign(){
  $('campaign-detail').hidden=!campaign;if(!campaign)return;
  $('campaign-name').textContent=campaign.name;$('campaign-status').textContent=statusNames[campaign.status]||campaign.status;
  $('campaign-counts').innerHTML=Object.entries(campaign.counts).map(([name,count])=>`<span><strong>${count}</strong>${e(countNames[name]||name)}</span>`).join('')||'<span>Destinatários serão definidos ao iniciar.</span>';
  $('start-campaign').hidden=campaign.status!=='draft';$('continue-campaign').hidden=!['queued','paused'].includes(campaign.status);
  $('pause-campaign').hidden=!['queued','paused'].includes(campaign.status)||campaign.status==='paused';
  if(campaign.status==='completed')$('delivery-progress').textContent='Todos os lotes foram processados. Atualize os resultados para consultar as confirmações de entrega.';
  updateButtons();
}
for(const key of fields)$(key).addEventListener('input',preview);
$('preview-width').addEventListener('change',()=>{$('email-preview').classList.toggle('mobile',$('preview-width').value==='mobile');$('preview-label').textContent=$('preview-width').value==='mobile'?'Celular':'Desktop';});
action('new-message',async()=>{templateId=null;campaign=null;setContent({...starter,name:'Nova mensagem'});renderCampaign();feedback('Nova mensagem criada.');});
action('load-template',async()=>{const value=state.templates.find(t=>t.id===$('template-picker').value);if(!value)throw new Error('Escolha um template salvo.');templateId=value.id;setContent(value.content);feedback('Template carregado.');});
$('editor-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const result=await api('templates',{id:templateId,content:validateContent(content())});templateId=result.id;await refresh();$('template-picker').value=templateId;feedback('Template salvo. Nenhum email foi enviado.');}catch(error){feedback(error.message,true);}finally{button.disabled=false;}});
function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
action('download-html',async()=>{const value=validateContent(content());download('email-bufalo.html',renderEmail(value,{address:state.config.address||'CONFIGURE O ENDEREÇO DA EMPRESA'}).html,'text/html;charset=utf-8');feedback('HTML exportado para revisão. O descadastro será personalizado somente no disparo pelo painel.');});
action('send-test',async()=>{if(!$('test-email').reportValidity()||!$('test-email').value)throw new Error('Informe o email de teste.');await api('test',{email:$('test-email').value,content:validateContent(content())});feedback('Email de teste aceito pelo Resend. Confira a caixa de entrada e o spam.');});

$('contact-file').addEventListener('change',async()=>{
  workbook=null;rows=[];parsed=null;importedListId=null;$('mapping').hidden=true;updateButtons();
  const file=$('contact-file').files[0];if(!file)return;
  try{
    if(file.size>LIMITS.fileBytes)throw new Error('O arquivo deve ter até 2 MB.');
    if(!/\.(csv|xlsx|xls)$/i.test(file.name))throw new Error('Escolha um CSV, XLSX ou XLS.');
    if(/\.csv$/i.test(file.name)){
      let text=await file.text();if(text.includes('\uFFFD'))text=new TextDecoder('windows-1252').decode(await file.arrayBuffer());rows=parseCsv(text);$('sheet-picker').innerHTML='<option>Arquivo CSV</option>';$('sheet-picker').disabled=true;
    }else{
      if(!window.XLSX)throw new Error('O leitor Excel não carregou. Atualize a página.');
      workbook=window.XLSX.read(await file.arrayBuffer(),{type:'array',dense:true,sheetRows:LIMITS.rows+2,cellHTML:false,cellFormula:false,bookVBA:false});
      $('sheet-picker').disabled=false;$('sheet-picker').innerHTML=workbook.SheetNames.map(name=>`<option value="${e(name)}">${e(name)}</option>`).join('');readSheet();
    }
    $('mapping').hidden=false;$('list-name').value=file.name.replace(/\.[^.]+$/,'').slice(0,120);$('import-consent').checked=false;mapColumns();feedback('Arquivo lido localmente. Revise as colunas antes de importar.');
  }catch(error){feedback(error.message,true);}
});
function readSheet(){if(!workbook)return;rows=window.XLSX.utils.sheet_to_json(workbook.Sheets[$('sheet-picker').value],{header:1,defval:'',raw:false,blankrows:false});}
function mapColumns(){
  if(rows.length<2)throw new Error('O arquivo precisa ter cabeçalho e pelo menos um contato.');
  if(rows.length>LIMITS.rows+1)throw new Error('Use arquivos com até 5.000 contatos.');
  const options=rows[0].map((name,i)=>`<option value="${i}">${e(String(name||`Coluna ${i+1}`).slice(0,100))}</option>`).join('');
  $('email-column').innerHTML=options;$('name-column').innerHTML='<option value="-1">Sem nome</option>'+options;
  const normalized=rows[0].map(v=>String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s_-]/g,''));
  const emailIndex=normalized.findIndex(n=>['email','emailaddress','enderecoemail'].includes(n));$('email-column').value=String(Math.max(0,emailIndex));
  $('name-column').value=String(normalized.findIndex(n=>['nome','name','firstname','nomecompleto'].includes(n)));validateRows();
}
$('sheet-picker').addEventListener('change',()=>{try{readSheet();mapColumns();importedListId=null;}catch(error){feedback(error.message,true);}});
for(const id of ['email-column','name-column'])$(id).addEventListener('change',()=>{importedListId=null;validateRows();});
function validateRows(){
  parsed=contactsFromRows(rows.slice(1),Number($('email-column').value),Number($('name-column').value));
  $('import-stats').innerHTML=`<span><strong>${parsed.contacts.length}</strong>válidos</span><span><strong>${parsed.duplicates}</strong>duplicados</span><span><strong>${parsed.invalid.length}</strong>inválidos</span>`;
  $('invalid-rows').textContent=parsed.invalid.length?`Linhas inválidas: ${parsed.invalid.slice(0,20).join(', ')}${parsed.invalid.length>20?'…':''}. Elas não serão importadas.`:'';
  $('contact-sample').innerHTML=parsed.contacts.slice(0,5).map(c=>`<tr><td>${e(c.email)}</td><td>${e(c.name||'—')}</td></tr>`).join('');updateButtons();
}
$('import-consent').addEventListener('change',updateButtons);
action('import-contacts',async()=>{
  if(!parsed?.contacts.length||!$('import-consent').checked)throw new Error('Revise os contatos e confirme a autorização.');
  const name=$('list-name').value.trim(),source=$('list-source').value.trim();if(!name||!source)throw new Error('Informe o nome da lista e a origem da autorização.');
  $('mapping').classList.add('loading');
  try{
    let result;
    for(let i=0;i<parsed.contacts.length;i+=LIMITS.importBatch){result=await api('import',{name,source,consent:true,listId:importedListId,contacts:parsed.contacts.slice(i,i+LIMITS.importBatch)});importedListId=result.listId;$('import-progress').textContent=`${Math.min(i+LIMITS.importBatch,parsed.contacts.length)} de ${parsed.contacts.length} contatos processados…`;}
    await refresh();$('campaign-list').value=importedListId;$('import-progress').textContent=`Lista salva: ${result.total} contatos, ${result.active} ativos. Descadastros e bloqueios foram preservados.`;feedback('Importação concluída. Nenhum email foi enviado.');
  }catch(error){await refresh().catch(()=>{});throw new Error(error.message+(importedListId?' Parte da lista já foi salva. Clique em importar novamente para retomar sem duplicar.':''));}
  finally{$('mapping').classList.remove('loading');}
});
action('save-campaign',async()=>{
  const current=campaign?.status==='draft'?campaign.id:undefined;
  const result=await api('campaigns',{id:current,listId:$('campaign-list').value,content:validateContent(content())});campaign=await api('campaigns/'+result.id);renderCampaign();await refresh();feedback('Campanha salva como rascunho. O envio ainda não começou.');
});
action('start-campaign',async()=>{
  campaign=await api('campaigns/'+campaign.id);renderCampaign();
  const list=state.lists.find(l=>l.id===campaign.list_id);
  $('confirm-summary').textContent=`Campanha: ${campaign.name}. Assunto: ${campaign.content.subject}. Lista: ${list?.name||'selecionada'}, até ${list?.active||0} contatos ativos.`;
  $('confirm-word').value='';$('send-consent').checked=false;$('confirm-dialog').showModal();
});
$('cancel-send').addEventListener('click',()=>$('confirm-dialog').close());
$('confirm-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.submitter;button.disabled=true;
  try{campaign=await api(`campaigns/${campaign.id}/start`,{confirm:$('confirm-word').value,consent:$('send-consent').checked});$('confirm-dialog').close();renderCampaign();await refresh();await runQueue();}catch(error){feedback(error.message,true);}finally{button.disabled=false;}
});
async function runQueue(){
  if(running)return;running=true;updateButtons();
  const id=campaign.id;
  try{
    while(running&&campaign.status==='queued'){
      $('delivery-progress').textContent='Processando próximo lote. Mantenha esta aba aberta.';
      campaign=await api(`campaigns/${id}/process`,{});renderCampaign();
      if(campaign.status==='queued')await new Promise(resolve=>setTimeout(resolve,1200));
    }
    if(campaign.status==='completed')feedback('Lotes processados. As confirmações de entrega aparecerão no relatório.');
  }catch(error){feedback(error.message,true);$('delivery-progress').textContent='Envio interrompido. Confira o aviso antes de continuar.';}
  finally{running=false;updateButtons();await refresh().catch(()=>{});}
}
action('continue-campaign',async()=>{campaign=await api('campaigns/'+campaign.id);if(campaign.status==='paused')campaign=await api(`campaigns/${campaign.id}/resume`,{});renderCampaign();await runQueue();});
action('pause-campaign',async()=>{running=false;campaign=await api(`campaigns/${campaign.id}/pause`,{});renderCampaign();feedback('Campanha pausada. Um lote em processamento ainda pode terminar.');});
action('refresh-campaign',async()=>{campaign=await api('campaigns/'+campaign.id);renderCampaign();await refresh();feedback('Resultados atualizados.');});
setContent(starter);refresh().catch(error=>{feedback(error.message,true);$('connection').textContent='Conexão indisponível';});
