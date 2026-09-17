const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleReservation(request,endpoint){
 if(request.method!=='POST')return json({ok:false},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({ok:false},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({ok:false},415);
 const reader=request.body?.getReader();if(!reader)return json({ok:false},400);
 let length=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>4096){await reader.cancel();return json({ok:false},413);}chunks.push(value);}
 let data;try{data=JSON.parse(new TextDecoder().decode(Uint8Array.from(chunks.flatMap(c=>Array.from(c)))));}catch{return json({ok:false},400);}
 const nome=String(data.nome||'').trim(),telefone=String(data.telefone||'').replace(/\D/g,''),email=String(data.email||'').trim().toLowerCase();
 if(data.website||nome.length<2||nome.length>100||!/^\d{10,15}$/.test(telefone)||email.length>160||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||data.consent!==true)return json({ok:false},400);
 if(!endpoint)return json({ok:false},503);
 try{
  const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome,telefone,email,consent:true}),signal:AbortSignal.timeout(20000)});
  if(!result.ok)return json({ok:false},502);
  const payload=await result.json();
  if(payload.ok!==true)return json({ok:false},502);
  return json({ok:true});
 }catch{return json({ok:false},502);}
}

