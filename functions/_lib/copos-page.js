export async function serveCopos(context) {
  const url=new URL(context.request.url);
  const suffix=url.pathname.replace(/^\/produtos\/copos\/?/, '');
  const files={'':'index.html','index':'index.html','index.html':'index.html','copos.css':'copos.css','poster.jpg':'poster.jpg','copos.mp4':'copos.mp4'};
  const file=files[suffix];
  if(!file)return context.next();
  url.pathname='/assets/pages/copos/'+file;
  return context.env.ASSETS.fetch(new Request(url,context.request));
}
