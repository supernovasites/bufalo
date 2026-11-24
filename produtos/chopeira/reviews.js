(() => {
'use strict';
const rail=document.getElementById('chopeira-review-list');if(!rail)return;
const makeCard=review=>{
 const card=document.createElement('article');card.className='review-card';
 const photo=document.createElement('img');photo.className='review-card-photo';photo.loading='lazy';photo.decoding='async';photo.alt='Foto da chopeira de '+String(review.name??'');photo.src='/api/chopeira-review-photo?id='+encodeURIComponent(review.id);
 const copy=document.createElement('div');copy.className='review-card-copy';
 const score=Math.max(0,Math.min(10,Number(review.score)||0));
 const rating=document.createElement('span');rating.className='review-card-stars';rating.setAttribute('role','img');rating.setAttribute('aria-label',score+' de 10, equivalente a '+(score/2).toLocaleString('pt-BR')+' de 5 estrelas');rating.style.setProperty('--rating',(score*10)+'%');rating.textContent='★★★★★';
 const name=document.createElement('h3');name.className='review-card-name';name.textContent=String(review.name??'');
 const text=document.createElement('p');text.className='review-card-text';text.textContent=String(review.review??'');
 copy.append(text);card.append(name,photo,rating,copy);return card;
};
fetch('/api/chopeira-reviews',{headers:{Accept:'application/json'}}).then(response=>{if(!response.ok)throw new Error('load');return response.json();}).then(data=>{
 const rows=Array.isArray(data.reviews)?data.reviews:[];rail.replaceChildren();
 if(!rows.length){const empty=document.createElement('p');empty.className='reviews-empty';empty.textContent='As avaliações autorizadas serão exibidas aqui.';rail.append(empty);return;}
 rows.forEach(row=>rail.append(makeCard(row)));
}).catch(()=>{rail.replaceChildren();const error=document.createElement('p');error.className='reviews-error';error.textContent='As avaliações não estão disponíveis agora. Tente novamente em instantes.';rail.append(error);});
})();