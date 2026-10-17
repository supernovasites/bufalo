export const LIMITS = {fileBytes: 2 * 1024 * 1024, rows: 5000, importBatch: 250};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  const local=email.split('@')[0];
  return email.length <= 254 && local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) ? email : null;
}
export function safeUrl(value, optional = true) {
  if (!value && optional) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !/[\s\x00-\x1f]/.test(value) && value.length <= 1500 ? url.href : null;
  } catch { return null; }
}
export function validateContent(value) {
  const fields = {name:120, subject:150, preheader:180, heading:160, body:12000, buttonText:60, buttonUrl:1500, imageUrl:1500, imageAlt:180};
  if (!value || typeof value !== 'object') throw new Error('Conteúdo inválido.');
  const result = {};
  for (const [key,max] of Object.entries(fields)) {
    if (typeof value[key] !== 'string' || value[key].length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value[key])) throw new Error(`Revise o campo ${key}.`);
    result[key] = value[key].trim();
  }
  if (!result.name || !result.subject || !result.heading || !result.body) throw new Error('Preencha nome, assunto, título e mensagem.');
  if (/[\r\n]/.test(result.subject)) throw new Error('O assunto deve ter uma linha.');
  if (!['editorial','product','letter'].includes(value.layout)) throw new Error('Template inválido.');
  result.layout = value.layout;
  for (const key of ['buttonUrl','imageUrl']) if (safeUrl(result[key]) === null) throw new Error('Use endereços HTTPS válidos.');
  if (Boolean(result.buttonText) !== Boolean(result.buttonUrl)) throw new Error('Preencha o texto e o endereço do botão.');
  if (result.imageUrl && !result.imageAlt) throw new Error('Descreva a imagem para quem usa leitor de tela.');
  return result;
}
export function contactsFromRows(rows, emailColumn, nameColumn = -1) {
  const contacts = [], invalid = [], seen = new Set(); let duplicates = 0, empty = 0;
  rows.forEach((row,index) => {
    if (!row.some(v => String(v ?? '').trim())) { empty++; return; }
    const email = normalizeEmail(row[emailColumn]);
    if (!email) { invalid.push(index + 2); return; }
    if (seen.has(email)) { duplicates++; return; }
    seen.add(email);
    contacts.push({email, name: String(row[nameColumn] ?? '').trim().replace(/[\x00-\x1f]/g,'').slice(0,100)});
  });
  return {contacts, invalid, duplicates, empty};
}
export function parseCsv(text) {
  text = text.replace(/^\uFEFF/,'');
  const line = text.split(/\r?\n/)[0], counts = [',',';','\t'].map(d => [d,line.split(d).length]);
  const delimiter = counts.sort((a,b)=>b[1]-a[1])[0][0];
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){cell+='"';i++;}else if(quoted || !cell)quoted=!quoted;else cell+=c; }
    else if(c===delimiter && !quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r') && !quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=c;
    if(rows.length>LIMITS.rows+1)throw new Error(`Use arquivos com até ${LIMITS.rows} contatos.`);
  }
  if(quoted)throw new Error('CSV com aspas sem fechamento.');
  if(cell || row.length){row.push(cell);rows.push(row);}
  return rows;
}
export const starter = {
  name:'Novidade para a manada', subject:'Uma novidade para acompanhar você', preheader:'Conheça a próxima companhia para a sua rotina.',
  heading:'Sua próxima companhia.', body:'Olá, {{nome}}!\n\nTem novidade na Búfalo. Feita para acompanhar seus momentos, da cidade à próxima aventura.\n\nConheça todos os detalhes na nossa loja.',
  layout:'product', imageUrl:'https://www.bufalogrowler.com.br/assets/acai-bowl/magenta.jpg', imageAlt:'Açaí Bowl Búfalo magenta',
  buttonText:'Conheça na loja', buttonUrl:'https://loja.bufalogrowler.com.br/acai-bowl-500ml'
};
export function renderEmail(content, {name='pessoa da manada', unsubscribeUrl='https://www.bufalogrowler.com.br/mkt/email/unsubscribe', address='Configure o endereço da empresa antes de enviar.'} = {}) {
  const personal = text => String(text).replaceAll('{{nome}}',name || 'pessoa da manada');
  const e = text => escapeHtml(personal(text));
  const url = safeUrl(content.buttonUrl) || '', image = safeUrl(content.imageUrl) || '';
  const paragraphs = content.body.split(/\n\s*\n/).map(p=>`<p style="margin:0 0 18px;line-height:1.7">${e(p).replaceAll('\n','<br>')}</p>`).join('');
  const photo = image && content.layout !== 'letter' ? `<tr><td style="padding:${content.layout==='product'?'24px 32px 0':'0 32px 24px'}"><img src="${escapeHtml(image)}" alt="${e(content.imageAlt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0"></td></tr>` : '';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(content.subject)}</title></head><body style="margin:0;padding:0;background:#f3f4f2;font-family:Arial,Helvetica,sans-serif;color:#142e32"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${e(content.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f2"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:white"><tr><td style="padding:26px 32px;background:#142e32;color:white;font-size:22px;font-weight:800;letter-spacing:3px">BÚFALO <span style="font-size:10px;letter-spacing:2px">GROWLER</span></td></tr><tr><td style="padding:32px 32px 22px"><p style="font-size:10px;letter-spacing:2px;color:#617273">COM VOCÊ, LÁ FORA.</p><h1 style="font-size:30px;line-height:1.15;letter-spacing:-1px;margin:14px 0 0">${e(content.heading)}</h1></td></tr>${photo}<tr><td style="padding:0 32px 28px;font-size:16px">${paragraphs}${url ? `<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#ff9b52" style="padding:15px 22px;border-radius:2px"><a href="${escapeHtml(url)}" style="color:#142e32;font-weight:700;text-decoration:none">${e(content.buttonText)}</a></td></tr></table>` : ''}</td></tr><tr><td style="padding:24px 32px;border-top:1px solid #dce0df;color:#617273;font-size:12px;line-height:1.6">Búfalo Growler<br>${escapeHtml(address)}<br>Você recebe este email porque autorizou comunicações da Búfalo.<br><a href="${escapeHtml(safeUrl(unsubscribeUrl,false)||'https://www.bufalogrowler.com.br/')}" style="color:#142e32">Não quero receber estes emails</a></td></tr></table></td></tr></table></body></html>`;
  const text = `${personal(content.heading)}\n\n${personal(content.body)}${url ? `\n\n${personal(content.buttonText)}: ${url}` : ''}\n\nBúfalo Growler\n${address}\nDescadastrar: ${unsubscribeUrl}`;
  return {html,text,subject:personal(content.subject)};
}
