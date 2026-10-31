const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('produtos/chopeira/index.html', 'utf8');
const items = JSON.parse(html.match(/id="manada-stories-items">(.*?)<\/script>/s)[1]);
assert.equal(items.length, 13);
assert.equal(items.filter(i => i.type === 'video').length, 11);
assert.equal(items.filter(i => i.type === 'image').length, 2);
assert.ok(html.indexOf('id="manada-stories"') < html.indexOf('class="mestre-kit-banner"'));
for (const item of items) for (const src of [item.src, item.poster].filter(Boolean)) {
  assert.ok(fs.existsSync('produtos/chopeira/' + src), src);
  assert.ok(fs.existsSync('dist/produtos/chopeira/' + src), 'Published asset: ' + src);
}
function setup() {
  let now = 1, sequence = 0, observe;
  const raf = new Map(), tasks = [], all = [];
  function element(tag = 'div') {
    const el = {tag, children: [], listeners: {}, dataset: {}, attrs: {}, hidden: false,
      style: {setProperty(k,v) {this[k]=v;},removeProperty(k) {delete this[k];}},
      classList: {add(){},remove(){}}, complete: true, naturalWidth: 540,
      paused: true, duration: 17.7, currentTime: 0,
      append(child) {this.children.push(child);child.parent=this;},
      remove(){this.parent.children=this.parent.children.filter(c=>c!==this);},
      setAttribute(k,v){this.attrs[k]=v;}, removeAttribute(k){delete this.attrs[k];},
      addEventListener(k,fn){this.listeners[k]=fn;},load(){},
      play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},
      setPointerCapture(){},hasPointerCapture(){return false;},releasePointerCapture(){}};
    all.push(el);return el;
  }
  const stage=element(), count=element(), progress=element();
  const section={querySelector:s=>s.includes('count')?count:progress};
  stage.closest=()=>section;
  const document={hidden:false,modal:false,listeners:{},createElement:element,
    getElementById:id=>id==='manada-stories-stage'?stage:{textContent:JSON.stringify(items)},
    querySelector:()=>document.modal?{}:null,querySelectorAll:()=>[],
    addEventListener(k,fn){this.listeners[k]=fn;}};
  vm.runInNewContext(fs.readFileSync('produtos/chopeira/stories.js','utf8'),{document,
    window:{addEventListener(){}},MutationObserver:class{},
    IntersectionObserver:class{constructor(fn){observe=fn;}observe(){}},
    performance:{now:()=>now},requestAnimationFrame:fn=>{raf.set(++sequence,fn);return sequence;},
    cancelAnimationFrame:id=>raf.delete(id),setTimeout:fn=>tasks.push(fn)});
  const tick = ms => {now+=ms;const batch=[...raf.values()];raf.clear();batch.forEach(fn=>fn());};
  const visible = value => observe([{isIntersecting:value,intersectionRatio:value?1:0}]);
  const current = () => stage.children.find(c=>c.dataset.position==='0');
  const video = () => current().children.find(c=>c.tag==='video');
  const key = key => stage.listeners.keydown({key,preventDefault(){}});
  const pointer = (type,x,y=30) => stage.listeners[type]({button:0,pointerId:1,clientX:x,clientY:y,type,preventDefault(){}});
  return {stage,count,document,tick,visible,current,video,key,pointer,flush:()=>{while(tasks.length)tasks.shift()();}};
}
const s=setup();assert.equal(s.video().paused,true,'Do not play below the viewport');
s.visible(true);assert.equal(s.video().paused,false);
const old=s.video();old.listeners.ended();assert.equal(s.count.textContent,'02 / 13');
assert.equal(s.stage.children.filter(c=>c.children.some(n=>n.tag==='video')).length,1,'Only the current story owns a video decoder');
old.listeners.ended();assert.equal(s.count.textContent,'02 / 13','Ignore stale ended events');
s.key('ArrowRight');s.key('ArrowRight');assert.equal(s.count.textContent,'04 / 13');
assert.equal(s.video(),undefined,'Photo story uses an image');s.tick(2999);assert.equal(s.count.textContent,'04 / 13');s.tick(1);assert.equal(s.count.textContent,'05 / 13','Photos advance at three seconds');
s.key('ArrowLeft');s.tick(2000);s.visible(false);s.tick(5000);assert.equal(s.count.textContent,'04 / 13','Offscreen time does not consume a photo');s.visible(true);s.tick(999);assert.equal(s.count.textContent,'04 / 13');s.tick(1);assert.equal(s.count.textContent,'05 / 13');
s.pointer('pointerdown',200);s.pointer('pointermove',110);s.pointer('pointerup',110);s.flush();assert.equal(s.count.textContent,'06 / 13','Dragging left advances');
s.pointer('pointerdown',200);s.pointer('pointermove',205,200);s.pointer('pointerup',205,200);s.flush();assert.equal(s.count.textContent,'06 / 13','Vertical scrolling does not advance');
s.pointer('pointerdown',200);s.pointer('pointermove',100);s.pointer('pointercancel',100);s.flush();assert.equal(s.count.textContent,'06 / 13','Canceled gestures do not advance');
s.document.hidden=true;s.document.listeners.visibilitychange();assert.equal(s.video().paused,true);s.document.hidden=false;s.document.listeners.visibilitychange();assert.equal(s.video().paused,false);
s.video().listeners.error();assert.equal(s.count.textContent,'07 / 13','A failed video does not trap the queue');
const loop=setup();loop.visible(true);loop.key('ArrowLeft');assert.equal(loop.count.textContent,'13 / 13');loop.tick(3000);assert.equal(loop.count.textContent,'01 / 13','The queue loops after the final photo');
console.log('Stories checks passed: 13 media, placement, ended, 3-second photos, offscreen/hidden pause, gestures, decoder cleanup, stale events, failure recovery and wraparound.');
