// Шаги подключения по очереди подсвечиваются, пока блок виден; клик выбирает шаг и
// останавливает автосмену, наведение мыши ставит её на паузу
(function () {
  'use strict';

  const section = document.querySelector('[data-steps]');
  if (!section) return;

  const { whileVisible, prefersReducedMotion } = window.Burger;
  const steps = Array.from(section.querySelectorAll('[data-step]'));
  const INTERVAL = 2600;
  let current = 0;
  let timer = 0;
  let visible = false;
  let paused = false;
  let touched = false;

  function activate(index) {
    current = index;
    steps.forEach((step, i) => step.classList.toggle('steps__item_active', i === index));
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
  }

  function start() {
    stop();
    if (!visible || paused || touched || prefersReducedMotion()) return;
    timer = window.setInterval(() => activate((current + 1) % steps.length), INTERVAL);
  }

  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      touched = true;
      stop();
      activate(index);
    });
  });

  section.addEventListener('pointerenter', () => {
    paused = true;
    stop();
  });

  section.addEventListener('pointerleave', () => {
    paused = false;
    start();
  });

  whileVisible(section, (isVisible) => {
    visible = isVisible;
    if (isVisible) start();
    else stop();
  }, { threshold: 0.35 });
})();
