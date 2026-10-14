const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../live/games/core.js'),'utf8'),context);const C=context.ManadaGameCore;
const ticks=(s,count,control=()=>{})=>{for(let i=0;i<count&&s.status==='running';i++){control(s);C.update(s,1/60);}};
test('runner can finish with timed jumps and fails after three collisions',()=>{
 const s=C.create('runner',()=>.5);ticks(s,2200,s=>{if(s.obstacles.some(o=>o.x>140&&o.x<185)&&s.y>=301)C.input(s,'jump');});assert.equal(s.status,'won');assert.equal(C.progress(s),1);
 const bad=C.create('runner',()=>.5);ticks(bad,2200);assert.equal(bad.status,'lost');assert.equal(bad.lives,0);
});
test('stack requires ten aligned drops and rejects a missed drop',()=>{
 const s=C.create('stack');for(let i=0;i<10;i++){s.x=s.blocks.at(-1).x;C.input(s,'drop');if(i<9)assert.equal(s.status,'running');}assert.equal(s.status,'won');
 const bad=C.create('stack');C.input(bad,'drop');assert.equal(bad.status,'lost');
});
test('memory mismatches turn back and all eight pairs complete the game',()=>{
 const s=C.create('memory',()=>.5),a=0,b=s.cards.findIndex(c=>c.face!==s.cards[a].face);C.input(s,'flip',a);C.input(s,'flip',b);ticks(s,60);assert.equal(s.cards[a].open,false);assert.equal(s.cards[b].open,false);
 for(let face=0;face<8;face++)s.cards.forEach((c,i)=>{if(c.face===face)C.input(s,'flip',i);});assert.equal(s.pairs,8);assert.equal(s.status,'won');
});
test('camp only accepts matching places and finishes after all five products',()=>{
 const s=C.create('camp');C.input(s,'select','tent');C.input(s,'place','chair');assert.equal(s.placed.length,0);
 for(const id of ['tent','chair','cooler','bag','bottle']){C.input(s,'select',id);C.input(s,'place',id);}assert.equal(s.status,'won');assert.equal(s.placed.length,5);
});
test('catch finishes after collecting fifteen items and rocks consume lives',()=>{
 const s=C.create('catch',()=>.5);ticks(s,2600);assert.equal(s.status,'won');assert.equal(s.count,15);
 const bad=C.create('catch');for(let i=0;i<3;i++){bad.items=[{x:bad.x,y:314,speed:130,rock:true}];C.update(bad,1/60);}assert.equal(bad.status,'lost');
});
test('each generated maze is traversable with three cups on its path',()=>{
 for(const random of [.1,.3,.5,.8]){const s=C.create('maze',()=>random);assert.equal(new Set(s.cups).size,3);for(let i=1;i<s.path.length;i++){const delta=s.path[i]-s.player;C.input(s,'move',{'-8':0,1:1,8:2,'-1':3}[delta]);}assert.equal(s.status,'won');assert.equal(s.collected.length,3);}
});
test('balance completes three controlled stages and pause freezes progress',()=>{
 const s=C.create('balance');ticks(s,1600,s=>C.input(s,'axis',s.angle>0?-1:1));assert.equal(s.status,'won');assert.equal(s.phase,3);
 const paused=C.create('runner');paused.paused=true;const before=paused.elapsed;ticks(paused,120);assert.equal(paused.elapsed,before);C.input(paused,'jump');assert.equal(paused.vy,0);
});
test('completion requires the real goal and no action changes a completed game',()=>{
 for(const id of ['runner','stack','memory','camp','catch','maze','balance']){const s=C.create(id);assert.equal(C.progress(s),0);s.status='won';const before=s.elapsed;C.update(s,.05);C.input(s,'axis',1);assert.equal(s.elapsed,before);assert.equal(s.axis,0);assert.equal(C.progress(s),1);}
});
