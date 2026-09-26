// Шапка прячется при прокрутке вниз и возвращается при прокрутке вверх; логотип открывает меню разделов.
(function () {
  'use strict';

  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-menu]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const page = document.querySelector('main');
  if (!header || !menu || !toggle) return;

  const { lockScroll, unlockScroll } = window.Burger;
  const HIDE_AFTER = 160;
  // Мелкие сдвиги прокрутки шапку не трогают: браузер сам подправляет прокрутку,
  // когда меняется высота блоков (FAQ, вкладки), и шапка от этого дёргалась
  const DIRECTION_THRESHOLD = 12;
  const MENU_CLOSE_DURATION = 450;
  let turnY = window.scrollY;
  let ticking = false;
  let menuOpen = false;
  let hideTimer = 0;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    if (menuOpen || y <= HIDE_AFTER) {
      header.classList.remove('header_hidden');
      turnY = y;
      return;
    }
    const shift = y - turnY;
    if (Math.abs(shift) < DIRECTION_THRESHOLD) return;
    header.classList.toggle('header_hidden', shift > 0);
    turnY = y;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    window.clearTimeout(hideTimer);
    menu.hidden = false;
    header.classList.remove('header_hidden');
    header.classList.add('header_menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    // Tab не должен уходить на страницу под подложкой
    if (page) page.inert = true;
    lockScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('menu_open')));
    const firstLink = menu.querySelector('[data-menu-link]');
    if (firstLink) firstLink.focus({ preventScroll: true });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('menu_open');
    header.classList.remove('header_menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (page) page.inert = false;
    unlockScroll();
    hideTimer = window.setTimeout(() => {
      if (!menuOpen) menu.hidden = true;
    }, MENU_CLOSE_DURATION);
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));

  // Пока открыто меню, прокрутка заблокирована: сначала закрываем, потом едем к разделу
  function goTo(link) {
    closeMenu({ restoreFocus: false });
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    const behavior = window.Burger.prefersReducedMotion() ? 'auto' : 'smooth';
    requestAnimationFrame(() => target.scrollIntoView({ behavior, block: 'start' }));
    history.replaceState(null, '', link.getAttribute('href'));
  }

  menu.addEventListener('click', (event) => {
    if (event.target.closest('[data-menu-close]')) {
      closeMenu();
      return;
    }
    const link = event.target.closest('[data-menu-link]');
    if (!link) return;
    event.preventDefault();
    goTo(link);
  });

  // Ссылки в самой шапке («?», Telegram) при открытом меню тоже его закрывают
  header.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !menuOpen) return;
    if (link.getAttribute('href').startsWith('#')) {
      event.preventDefault();
      goTo(link);
      return;
    }
    closeMenu({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuOpen) closeMenu();
  });

  // Любая кнопка «Free VPN» и подобные открывают окно подключения; меню при этом закрываем
  document.addEventListener('click', (event) => {
    if (menuOpen && event.target.closest('[data-activation-open]')) closeMenu({ restoreFocus: false });
  }, true);
})();
