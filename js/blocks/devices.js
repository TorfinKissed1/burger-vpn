// Переключение «Устройства / OS»: панели сменяются с каскадным появлением карточек
(function () {
  'use strict';

  const section = document.querySelector('[data-devices]');
  if (!section) return;

  const tabs = section.querySelector('[data-tabs]');
  const panels = Array.from(section.querySelectorAll('[data-devices-panel]'));

  tabs.addEventListener('tabs:change', (event) => {
    const targetId = event.detail.tab.getAttribute('aria-controls');
    panels.forEach((panel) => {
      const active = panel.id === targetId;
      panel.hidden = !active;
      panel.classList.toggle('devices__grid_active', active);
    });
  });
})();
