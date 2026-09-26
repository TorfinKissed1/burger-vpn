// Переключение «Устройства / OS»: панели сменяются с каскадным появлением карточек
(function () {
  'use strict';

  const section = document.querySelector('[data-devices]');
  if (!section) return;

  const tabs = section.querySelector('[data-tabs]');
  const panels = Array.from(section.querySelectorAll('[data-devices-panel]'));

  function show(targetId) {
    panels.forEach((panel) => {
      const active = panel.id === targetId;
      panel.hidden = !active;
      panel.classList.toggle('devices__panel_active', active);
    });
  }

  // Без скриптов видны обе панели, поэтому неактивную прячем здесь
  show(tabs.querySelector('[aria-selected="true"]').getAttribute('aria-controls'));

  tabs.addEventListener('tabs:change', (event) => show(event.detail.tab.getAttribute('aria-controls')));
})();
