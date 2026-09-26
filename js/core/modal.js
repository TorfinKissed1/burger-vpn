// Диалоги: открытие, закрытие по крестику, фону и Esc, удержание фокуса внутри окна.
(function () {
  'use strict';

  const { lockScroll, unlockScroll } = window.Burger;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const CLOSE_DURATION = 450;

  let active = null;
  let returnFocus = null;

  function focusables(modal) {
    return Array.from(modal.querySelectorAll(FOCUSABLE)).filter((element) => element.offsetParent !== null);
  }

  function open(id, detail) {
    const modal = document.getElementById(id);
    if (!modal || modal === active) return;
    if (active) close({ restoreFocus: false });

    returnFocus = document.activeElement;
    active = modal;
    modal.hidden = false;
    lockScroll();

    const dialog = modal.querySelector('.modal__dialog');
    dialog.tabIndex = -1;
    modal.dispatchEvent(new CustomEvent('modal:open', { detail }));

    // Два кадра: браузер должен отрисовать окно видимым до старта перехода
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('modal_open');
      dialog.focus({ preventScroll: true });
    }));
  }

  function close({ restoreFocus = true } = {}) {
    const modal = active;
    if (!modal) return;
    active = null;
    modal.classList.remove('modal_open');
    unlockScroll();

    window.setTimeout(() => {
      if (active !== modal) {
        modal.hidden = true;
        modal.dispatchEvent(new CustomEvent('modal:close'));
      }
    }, CLOSE_DURATION);

    if (restoreFocus && returnFocus && document.contains(returnFocus)) {
      returnFocus.focus({ preventScroll: true });
    }
  }

  document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-modal-close]');
    if (closer && active && active.contains(closer)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;

    const items = focusables(active);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.Burger.modal = {
    open,
    close,
    isOpen: (id) => Boolean(active && active.id === id),
  };
})();
