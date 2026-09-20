const local = ['localhost','127.0.0.1'].includes(location.hostname);
const seedUrl = '/blog/posts.json';
const apiUrl = '/blog/api/posts';
const dateLabel = value => { const d = new Date(`${value}T12:00:00`); return Number.isNaN(d.valueOf()) ? '' : new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric'}).format(d); };
const articleUrl = slug => `/blog/artigo.html?post=${encodeURIComponent(slug)}`;
export async function loadPosts() {
  if (local) {
    const seed = await fetch(seedUrl).then(r => r.json());
    const edited = JSON.parse(localStorage.getItem('bufalo_blog_preview_v2') || '{}');
    return [...seed.filter(post => !(post.slug in edited)),...Object.values(edited)].filter(post => post.status !== 'draft').sort((a,b) => b.date.localeCompare(a.date));
  }
  const result = await fetch(apiUrl,{cache:'no-store'});
  if (!result.ok) throw Error('Não foi possível carregar os posts.');
  return (await result.json()).posts;
}
export function card(post) {
  const a = document.createElement('a'); a.className='blog-card';a.href=articleUrl(post.slug);
  const img = document.createElement('img'); img.src=post.image;img.alt=post.imageAlt||'';img.loading='lazy';a.append(img);
  const content=document.createElement('div');content.className='blog-card-content';
  const tag=document.createElement('span');tag.className='tag';tag.textContent=post.category;
  const title=document.createElement('h3');title.textContent=post.title;
  const excerpt=document.createElement('p');excerpt.textContent=post.excerpt;
  const read=document.createElement('small');read.innerHTML='Ler história <span aria-hidden="true">→</span>';
  content.append(tag,title,excerpt,read);a.append(content);return a;
}
async function renderList() {
  const list=document.getElementById('blog-list');if(!list)return;
  try{const posts=await loadPosts();list.replaceChildren(...posts.map(card));if(!posts.length)list.textContent='Ainda não há histórias publicadas.';}
  catch{list.textContent='Não foi possível carregar as histórias. Tente novamente mais tarde.';}
}
async function renderArticle() {
  const root=document.getElementById('article');if(!root)return;
  const slug=new URLSearchParams(location.search).get('post');
  try{const post=(await loadPosts()).find(item=>item.slug===slug);if(!post)throw Error('Artigo não encontrado.');
    document.title=`${post.title} — Blog Búfalo`;
    document.querySelector('meta[name="description"]').content=post.excerpt;
    const back=document.createElement('a');back.href='/blog/';back.className='text-link';back.textContent='← Todas as histórias';
    const tag=document.createElement('p');tag.className='eyebrow';tag.style.marginTop='36px';tag.textContent=post.category;
    const h=document.createElement('h1');h.textContent=post.title;
    const lead=document.createElement('p');lead.className='lead';lead.textContent=post.excerpt;
    const meta=document.createElement('p');meta.className='article-meta';meta.textContent=dateLabel(post.date);
    const img=document.createElement('img');img.src=post.image;img.alt=post.imageAlt||'';
    const body=document.createElement('div');body.className='article-body';for(const paragraph of post.body.split(/\n\s*\n/)){if(!paragraph.trim())continue;const p=document.createElement('p');p.textContent=paragraph.trim();body.append(p)}
    const end=document.createElement('div');end.className='article-end';const more=document.createElement('a');more.href='/blog/';more.className='text-link';more.textContent='Ver mais histórias →';end.append(more);if(post.sourceUrl){const source=document.createElement('p');const link=document.createElement('a');link.href=post.sourceUrl;link.target='_blank';link.rel='noopener';link.className='text-link';link.textContent='Leia a publicação original na loja Búfalo ↗';source.append(link);end.append(source)}
    root.replaceChildren(back,tag,h,lead,meta,img,body,end);
  }catch{root.innerHTML='<a class="text-link" href="/blog/">← Todas as histórias</a><h1>Artigo não encontrado</h1><p>Volte ao blog para escolher outra história.</p>';}
}
renderList();renderArticle();

