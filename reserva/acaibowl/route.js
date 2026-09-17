import {html,css,js} from './content.js';
import {handleReservation} from './reservation.js';
import {endpoint} from './integration.js';
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
export async function onRequest({request}){
 const path=new URL(request.url).pathname.replace(/\/$/,'');
 if(path==='/reserva/acaibowl/api/reserva')return handleReservation(request,endpoint);
 if(!['GET','HEAD'].includes(request.method))return new Response('Método não permitido',{status:405});
 const routes={'/reserva/acaibowl':[html,'text/html; charset=utf-8'],'/reserva/acaibowl/index.html':[html,'text/html; charset=utf-8'],'/reserva/acaibowl/styles.css':[css,'text/css; charset=utf-8'],'/reserva/acaibowl/form.js':[js,'text/javascript; charset=utf-8']};
 const entry=routes[path];if(!entry)return new Response('Página não encontrada',{status:404});
 return new Response(request.method==='HEAD'?null:entry[0],{headers:{...headers,'Content-Type':entry[1],'Cache-Control':'no-cache'}});
}

