// Облако сервисов «выстреливает» иконками, когда блок появляется в экране
(function () {
  'use strict';

  const section = document.querySelector('[data-services]');
  if (!section) return;

  window.Burger.onceVisible(section, () => section.classList.add('services_visible'), { threshold: 0.2 });
})();
