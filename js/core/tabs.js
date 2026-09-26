// Сегментный переключатель: двигает подложку под активной вкладкой
// и сообщает блокам о смене событием tabs:change.
(function () {
  'use strict';

  const getTabs = (tabs) => Array.from(tabs.querySelectorAll('[role="tab"]'));

  function placeIndicator(tabs, tab) {
    const indicator = tabs.querySelector('.tabs__indicator');
    if (!indicator || !tab) return;
    indicator.style.setProperty('--tab-x', `${tab.offsetLeft}px`);
    indicator.style.setProperty('--tab-width', `${tab.offsetWidth}px`);
  }

  function select(tabs, tab, { focus = false, silent = false } = {}) {
    const list = getTabs(tabs);
    list.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('tabs__tab_active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    placeIndicator(tabs, tab);
    if (focus) tab.focus();
    if (!silent) {
      tabs.dispatchEvent(new CustomEvent('tabs:change', {
        bubbles: true,
        detail: { tab, index: list.indexOf(tab) },
      }));
    }
  }

  function init(tabs) {
    const initial = tabs.querySelector('.tabs__tab_active') || getTabs(tabs)[0];
    const indicator = tabs.querySelector('.tabs__indicator');

    if (indicator) {
      indicator.style.transition = 'none';
      placeIndicator(tabs, initial);
      requestAnimationFrame(() => {
        indicator.style.transition = '';
      });
    }

    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || tab.classList.contains('tabs__tab_active')) return;
      select(tabs, tab);
    });

    tabs.addEventListener('keydown', (event) => {
      const list = getTabs(tabs);
      const current = list.indexOf(document.activeElement);
      if (current === -1) return;
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: list.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      const next = (moves[event.key] + list.length) % list.length;
      if (next === current) return;
      select(tabs, list[next], { focus: true });
    });

    // Ширина вкладок меняется после загрузки шрифтов и при ресайзе
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => placeIndicator(tabs, tabs.querySelector('.tabs__tab_active'))).observe(tabs);
    }
  }

  document.querySelectorAll('[data-tabs]').forEach(init);

  window.Burger.selectTab = (tabs, index, options) => {
    const tab = getTabs(tabs)[index];
    if (tab) select(tabs, tab, options);
  };
})();
