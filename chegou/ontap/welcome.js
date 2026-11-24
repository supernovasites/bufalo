/* No media requests while the FAQ is collapsed; playback is always user initiated. */
(() => {
  'use strict';
  const questions = [...document.querySelectorAll('.kundi-faq-list details[data-faq]')];
  function trackFaqClick(question) {
    const topic = question.dataset.faq;
    const device = matchMedia('(max-width: 600px)').matches ? 'mobile' :
      matchMedia('(max-width: 1024px)').matches ? 'tablet' : 'desktop';
    const label = question.querySelector('summary')?.textContent.trim() || topic;
    fetch('/api/home-analytics', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      keepalive: true,
      body: JSON.stringify({
        kind:'click',
        page:'/chegou/ontap/',
        device,
        section:'tirar-duvidas',
        key:'faq-' + topic,
        label,
        target:''
      })
    }).catch(() => {});
  }
  questions.forEach(question => {
    const video = question.querySelector('.faq-video');
    if (!video) return;
    question.addEventListener('toggle', () => {
      if (!question.open) {
        video.pause();
        return;
      }
      trackFaqClick(question);
      questions.forEach(other => {
        if (other !== question && other.open) {
          other.open = false;
          other.querySelector('.faq-video')?.pause();
        }
      });
      if (!video.getAttribute('src')) {
        video.poster = video.dataset.poster;
        video.src = video.dataset.src;
      }
    });
    video.addEventListener('play', () => {
      document.querySelectorAll('video').forEach(other => {
        if (other !== video) other.pause();
      });
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) questions.forEach(question => question.querySelector('.faq-video')?.pause());
  });
})();

(() => {
  const video = document.getElementById('welcome-video');
  if (!video) return;
  let starting = false;
  let resume = true;
  let automaticPause = false;
  const visible = () => {
    const rect = video.getBoundingClientRect();
    return !document.hidden && rect.bottom > 0 && rect.top < innerHeight &&
      rect.right > 0 && rect.left < innerWidth;
  };
  const start = async () => {
    if (!visible() || starting || !video.paused) return;
    starting = true;
    try {
      await video.play();
    } catch {
      // Expose native playback controls only when autoplay cannot start.
      video.controls = true;
    } finally {
      starting = false;
    }
  };
  const sync = () => {
    if (visible()) {
      if (resume && !video.ended) start();
    } else if (!video.paused) {
      resume = true;
      automaticPause = true;
      video.pause();
    }
  };
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 1;
  video.autoplay = true;
  video.controls = false;
  let audioEnabled = false;
  let audioStarting = false;
  const enableAudio = async event => {
    if (!event.isTrusted || audioEnabled || audioStarting || !visible() ||
        !resume || video.ended) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    audioStarting = true;
    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      audioEnabled = true;
    } catch {
      // Scroll may be rejected as an audio gesture. Retry on the next tap.
      video.muted = true;
      await start();
    } finally { audioStarting = false; }
  };
  ['touchstart', 'touchend', 'click', 'keydown'].forEach(name => {
    document.addEventListener(name, enableAudio, {passive: true});
  });
  ['scroll', 'touchmove', 'wheel'].forEach(name => {
    window.addEventListener(name, enableAudio, {passive: true});
  });
  video.addEventListener('playing', () => {
    resume = true;
    video.controls = false;
    document.querySelectorAll('video').forEach(other => {
      if (other !== video) other.pause();
    });
  });
  video.addEventListener('pause', () => {
    if (automaticPause) automaticPause = false;
    else if (!audioStarting) resume = false;
  });
  video.addEventListener('ended', () => { resume = false; video.controls = true; });
  document.querySelectorAll('.faq-video').forEach(other => {
    other.addEventListener('play', () => { resume = false; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(sync, {threshold: [0, 0.2]}).observe(video);
  } else {
    window.addEventListener('scroll', sync, {passive: true});
    window.addEventListener('resize', sync, {passive: true});
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  start();
})();
