export async function serveGarrafas(context) {
  const url=new URL(context.request.url);
  const suffix=url.pathname.replace(/^\/produtos\/garrafas\/?/, '');
  const files={'':'index.html','index':'index.html','index.html':'index.html','garrafas.css':'garrafas.css','poster.jpg':'poster.jpg','garrafas.mp4':'garrafas.mp4'};
  const file=files[suffix];
  if(!file)return context.next();
  url.pathname='/assets/pages/garrafas/'+file;
  return context.env.ASSETS.fetch(new Request(url,context.request));
}

