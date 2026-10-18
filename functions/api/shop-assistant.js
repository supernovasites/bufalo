const disabled=()=>Response.json({error:'Assistente de compras desativado. Use a busca de produtos.'},{status:410,headers:{'Cache-Control':'no-store'}});
export const onRequestGet=disabled;
export const onRequestPost=disabled;
