// Mini-App: вкладки и стрелки наводят «прожектор» на нужную часть экрана телефона.
// В макете нарисован только экран «Друзья», поэтому разделы показываем зонами этого экрана.
(function () {
  'use strict';

  const section = document.querySelector('[data-mini-app]');
  if (!section) return;

  const { selectTab, whileVisible, prefersReducedMotion } = window.Burger;
  const tabs = section.querySelector('[data-tabs]');
  const caption = section.querySelector('[data-mini-app-caption]');
  const tabList = Array.from(tabs.querySelectorAll('[role="tab"]'));
  const CAPTIONS = {
    control: 'Включайте и выключайте VPN одной кнопкой',
    friends: 'Смотрите, сколько друзей уже с вами',
    gifts: 'Дарите VPN друзьям прямо из приложения',
  };
  const AUTO_INTERVAL = 4200;
  let autoTimer = 0;
  let touched = false;
  let autoStep = false;

  // Подпись объявляется скринридеру только после действия пользователя, а не при автолистании
  function show(spot) {
    Object.keys(CAPTIONS).forEach((key) => section.classList.toggle(`mini-app_spot_${key}`, key === spot));
    caption.setAttribute('aria-live', autoStep ? 'off' : 'polite');
    caption.textContent = CAPTIONS[spot];
  }

  function currentIndex() {
    return tabList.findIndex((tab) => tab.classList.contains('tabs__tab_active'));
  }

  function step(delta) {
    const next = (currentIndex() + delta + tabList.length) % tabList.length;
    selectTab(tabs, next);
  }

  function stopAuto() {
    window.clearInterval(autoTimer);
    autoTimer = 0;
  }

  // Пока пользователь не трогал блок, разделы листаются сами
  function startAuto() {
    stopAuto();
    if (touched || prefersReducedMotion()) return;
    autoTimer = window.setInterval(() => {
      autoStep = true;
      step(1);
      autoStep = false;
    }, AUTO_INTERVAL);
  }

  function markTouched() {
    touched = true;
    stopAuto();
  }

  tabs.addEventListener('tabs:change', (event) => show(event.detail.tab.dataset.spot));
  // Любое касание или фокус внутри блока останавливает автолистание насовсем
  section.addEventListener('pointerdown', markTouched);
  section.addEventListener('focusin', markTouched);

  section.querySelector('[data-mini-app-prev]').addEventListener('click', () => {
    markTouched();
    step(-1);
  });

  section.querySelector('[data-mini-app-next]').addEventListener('click', () => {
    markTouched();
    step(1);
  });

  whileVisible(section, (visible) => (visible ? startAuto() : stopAuto()), { threshold: 0.45 });

  show(tabs.querySelector('.tabs__tab_active').dataset.spot);
})();
