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
  const button = document.querySelector('.welcome-play');
  if (!video) return;
  let blocked = false;
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
      blocked = false;
      if (button) button.hidden = true;
    } catch {
      // Audible autoplay may require a real click, tap, or key press.
      blocked = true;
      if (button) button.hidden = false;
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
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1;
  video.autoplay = true;
  button?.addEventListener('click', () => {
    video.muted = false;
    video.volume = 1;
    resume = true;
    start();
  });
  const retry = event => {
    if (!event.isTrusted || !blocked || !visible() ||
        event.target === video || button?.contains(event.target)) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    start();
  };
  document.addEventListener('click', retry);
  document.addEventListener('keydown', retry);
  video.addEventListener('playing', () => {
    blocked = false;
    resume = true;
    if (button) button.hidden = true;
    document.querySelectorAll('video').forEach(other => {
      if (other !== video) other.pause();
    });
  });
  video.addEventListener('pause', () => {
    if (automaticPause) automaticPause = false;
    else resume = false;
  });
  video.addEventListener('ended', () => { resume = false; });
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
