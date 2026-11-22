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
        page:'/produtos/chopeira/',
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
