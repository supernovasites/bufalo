export async function onRequestGet(context) {
  const cf = context.request.cf || {};
  return new Response(JSON.stringify({
    country: cf.country || '',
    region: cf.regionCode || ''
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
