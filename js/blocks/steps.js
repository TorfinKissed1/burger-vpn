// Шаги подключения подсвечиваются вслед за прокруткой: активен шаг, ближайший к линии
// чуть ниже середины экрана
(function () {
  'use strict';

  const section = document.querySelector('[data-steps]');
  if (!section) return;

  const steps = Array.from(section.querySelectorAll('[data-step]'));
  const FOCUS_LINE = 0.55;
  let current = -1;
  let ticking = false;

  function activate(index) {
    if (index === current) return;
    current = index;
    steps.forEach((step, i) => step.classList.toggle('steps__item_active', i === index));
  }

  function update() {
    ticking = false;
    const line = window.innerHeight * FOCUS_LINE;
    let closest = 0;
    let best = Infinity;
    steps.forEach((step, index) => {
      const rect = step.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - line);
      if (distance < best) {
        best = distance;
        closest = index;
      }
    });
    activate(closest);
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();
