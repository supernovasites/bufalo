const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
(async () => {
  const listeners = {}, page = {}, popup = {}, lifecycle = {};
  let attempts = 0;
  const video = {paused:true, muted:false, play(){attempts++;return attempts===1 ? Promise.reject(new Error('Autoplay deferred')) : (this.paused=false,Promise.resolve());},pause(){this.paused=true;},addEventListener(name,fn){listeners[name]=fn;}};
  const document={hidden:false,getElementById:id=>id==='hero-video'?video:{addEventListener:(name,fn)=>popup[name]=fn},addEventListener:(name,fn)=>page[name]=fn};
  vm.runInNewContext(fs.readFileSync('produtos/chopeira/hero-video.js','utf8'),{document,window:{addEventListener:(name,fn)=>lifecycle[name]=fn}});
  await Promise.resolve();
  assert.equal(attempts,1);
  listeners.canplay();assert.equal(video.paused,false);assert.equal(video.muted,true);assert.equal(video.playsInline,true);
  document.hidden=true;page.visibilitychange();assert.equal(video.paused,true);popup.close();assert.equal(attempts,2,'Do not play in a hidden tab');
  document.hidden=false;popup.close();assert.equal(video.paused,false,'Resume after closing the offer');
  video.paused=true;page.pointerdown();assert.equal(video.paused,false,'Retry within a modal user gesture');
  video.paused=true;lifecycle.pageshow();assert.equal(video.paused,false,'Resume on restored navigation');
  const html=fs.readFileSync('produtos/chopeira/index.html','utf8');assert.match(html, /id="hero-video" src="media\/ontap-hero-1080p.mp4" autoplay muted loop playsinline/);
  console.log('Hero checks passed: early source discovery, autoplay rejection recovery, popup gestures/close, hidden tab and restored navigation.');
})();
