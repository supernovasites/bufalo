/* No media requests while the FAQ is collapsed; playback is always user initiated. */
(() => {
  'use strict';
  const questions = [...document.querySelectorAll('.kundi-faq-list details[data-faq]')];
  questions.forEach(question => {
    const video = question.querySelector('.faq-video');
    if (!video) return;
    question.addEventListener('toggle', () => {
      if (!question.open) {
        video.pause();
        return;
      }
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
