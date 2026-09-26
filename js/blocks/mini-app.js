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

  // Свайп по телефону листает разделы: влево — следующий, вправо — предыдущий
  const device = section.querySelector('[data-mini-app-device]');
  const SWIPE_DISTANCE = 40;
  let swipe = null;

  device.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0 };
    device.setPointerCapture(event.pointerId);
    device.classList.add('mini-app__device_dragging');
  });

  device.addEventListener('pointermove', (event) => {
    if (!swipe || event.pointerId !== swipe.id) return;
    swipe.dx = event.clientX - swipe.x;
    // Телефон немного следует за пальцем, чтобы жест ощущался
    device.style.setProperty('--drag', `${Math.round(swipe.dx * 0.25)}px`);
  });

  function endSwipe(event) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const { dx } = swipe;
    const dy = event.clientY - swipe.y;
    swipe = null;
    device.classList.remove('mini-app__device_dragging');
    device.style.setProperty('--drag', '0px');
    if (event.type === 'pointerup' && Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      markTouched();
      step(dx < 0 ? 1 : -1);
    }
  }

  device.addEventListener('pointerup', endSwipe);
  device.addEventListener('pointercancel', endSwipe);

  whileVisible(section, (visible) => (visible ? startAuto() : stopAuto()), { threshold: 0.45 });

  show(tabs.querySelector('.tabs__tab_active').dataset.spot);
})();
