import { campaignEnabled } from '../../_lib/campaigns.js';
export async function onRequest(context) {
  if (!(await campaignEnabled(context.env.LIVE_DB, 'cirio'))) {
    return new Response(null, {status:302, headers:{Location:new URL('/', context.request.url).href, 'Cache-Control':'no-store, max-age=0'}});
  }
  const url=new URL(context.request.url);
  const page=['/campanhas/cirio','/campanhas/cirio/','/campanhas/cirio/index','/campanhas/cirio/index.html'].includes(url.pathname);
  if(page)url.pathname='/assets/pages/cirio/index.html';
  const response = page ? await context.env.ASSETS.fetch(new Request(url,context.request)) : await context.next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
}
