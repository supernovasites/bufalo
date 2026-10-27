import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('reveal starts one minute, expiry plays once, mute and editing reset the clock',async()=>{
  const nodes=new Map(),intervals=new Map();let now=0,seq=0,sounds=0;
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:true,value:'',checked:true,style:{},listeners:{},
      classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){this.listeners[type]=fn},
      getContext(){return null;},getBoundingClientRect(){return {width:300,height:100};}});
    return nodes.get(id);
  };
  class AudioContext {
    sampleRate=100;
    resume(){return Promise.resolve();}
    createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
    createBufferSource(){return {connect(){},start(){sounds++;},stop(){}};}
  }
  vm.runInNewContext(readFileSync(new URL('../live/sorteio/sorteio.js',import.meta.url),'utf8'),{
    document:{getElementById:node,querySelectorAll:()=>[]},window:{addEventListener(){},AudioContext},
    Date:{now:()=>now},setInterval:fn=>{intervals.set(++seq,fn);return seq;},clearInterval:id=>intervals.delete(id),
    fetch:async url=>url.includes('/sons/')?{ok:false}:Response.json({candidate:'Ana',revision:1,participants:['Ana'],winners:[]})
  });
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(node('claim-clock').hidden,true);
  node('reveal-name').listeners.click();
  assert.equal(node('claim-time').textContent,'01:00');assert.equal(node('claim-clock').hidden,false);
  now=30000;for(const fn of intervals.values())fn();
  assert.equal(node('claim-time').textContent,'00:30');
  node('reveal-name').listeners.click();assert.equal(node('claim-time').textContent,'00:30');
  now=60000;for(const fn of [...intervals.values()])fn();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(node('claim-time').textContent,'00:00');assert.equal(node('claim-status').textContent,'Tempo encerrado');
  assert.equal(sounds,1);assert.equal(intervals.size,0);
  node('names').value='Outra pessoa';node('names').listeners.input();
  assert.equal(node('claim-clock').hidden,true);
  node('names').value='Ana';node('names').listeners.input();node('reveal-name').listeners.click();
  node('sound').checked=false;node('sound').listeners.change();
  now=120000;for(const fn of [...intervals.values()])fn();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(sounds,1);
});
