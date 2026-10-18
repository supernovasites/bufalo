import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../assets/cart-count.js',import.meta.url),'utf8');
const store='https://loja.bufalogrowler.com.br',home='https://www.bufalogrowler.com.br';
function setup(origin,{bridge=false,native=null}={}){
 const listeners={},posts=[],observers=[],children=[];let badge=null,label='';
 const peer={postMessage:(data,target)=>posts.push({data,target})};
 const link={querySelector:()=>badge,append:e=>badge=e,setAttribute:(key,value)=>{if(key==='aria-label')label=value;}};
 const document={readyState:'complete',visibilityState:'visible',referrer:home+'/',body:{append:e=>children.push(e)},querySelector:()=>native,querySelectorAll:()=>[link],addEventListener:(type,fn)=>listeners[type]=fn,createElement:tag=>({tag,style:{},contentWindow:peer,setAttribute(){},addEventListener(type,fn){this[type]=fn;},textContent:''})};
 const context={document,location:{origin,search:bridge?'?bg_cart_count=1':''},parent:peer,URL,URLSearchParams,Set,Number,Date,crypto:{randomUUID:()=> 'test-nonce'},addEventListener:(type,fn)=>listeners[type]=fn,MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}}};
 context.window=context;
 vm.runInNewContext(code,context);
 return{listeners,posts,observers,children,peer,badge:()=>badge,label:()=>label,document};
}
test('store mirrors native quantities and updates when cart initializes later',()=>{
 const native={textContent:'0'},s=setup(store,{native});assert.equal(s.badge().textContent,'0');
 native.textContent='3';s.observers[0]();assert.equal(s.badge().textContent,'3');assert.match(s.label(),/3 itens/);
 native.textContent='invalid';s.observers[0]();assert.equal(s.badge().textContent,'3');
});
test('store bridge rejects foreign origins and unrelated message sources',()=>{
 const s=setup(store,{bridge:true,native:{textContent:'2'}});s.posts.length=0;
 const data={type:'bg:cart-request',nonce:'request'};
 s.listeners.message({origin:'https://example.com',source:s.peer,data});assert.equal(s.posts.length,0);
 s.listeners.message({origin:home,source:{},data});assert.equal(s.posts.length,0);
 s.listeners.message({origin:home,source:s.peer,data});assert.equal(s.posts.at(-1).data.count,2);assert.equal(s.posts.at(-1).target,home);
});
test('homepage accepts only its store frame and matching request token',()=>{
 const s=setup(home);const data={type:'bg:cart-count',nonce:'test-nonce',count:4};
 s.listeners.message({origin:'https://example.com',source:s.peer,data});assert.equal(s.badge(),null);
 s.listeners.message({origin:store,source:{},data});assert.equal(s.badge(),null);
 s.listeners.message({origin:store,source:s.peer,data:{...data,nonce:'wrong'}});assert.equal(s.badge(),null);
 s.listeners.message({origin:store,source:s.peer,data});assert.equal(s.badge().textContent,'4');
 s.listeners.message({origin:store,source:s.peer,data:{...data,count:-1}});assert.equal(s.badge().textContent,'4');
});
