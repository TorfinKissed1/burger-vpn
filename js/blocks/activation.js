// Окно бесплатного подключения: счётчик включений, разлёт иконок сервисов и форма контакта.
// Формы на сервер нет: окно только показывает интерфейс из макета.
(function () {
  'use strict';

  const modalElement = document.getElementById('activation');
  if (!modalElement) return;

  const { modal, formatNumber, replayClass, prefersReducedMotion } = window.Burger;
  const dialog = modalElement.querySelector('[data-activation]');
  const countElement = modalElement.querySelector('[data-activation-count]');
  const burst = modalElement.querySelector('[data-activation-burst]');
  const knob = modalElement.querySelector('.activation__knob');
  const form = modalElement.querySelector('[data-activation-form]');
  const input = form.querySelector('input');
  const error = modalElement.querySelector('[data-activation-error]');
  const text = modalElement.querySelector('[data-activation-text]');
  const done = modalElement.querySelector('[data-activation-done]');
  const contactOutput = modalElement.querySelector('[data-activation-contact]');
  const launchCount = document.querySelector('[data-launch-count]');

  const BURST_ICONS = ['youtube', 'telegram', 'instagram', 'whatsapp', 'spotify', 'chatgpt', 'discord', 'facebook', 'notion', 'tiktok', 'sweden', 'uae'];
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const USERNAME = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

  let activations = 21325;

  function showBurst() {
    burst.replaceChildren();
    if (prefersReducedMotion()) return;
    BURST_ICONS.forEach((name, index) => {
      const icon = new Image();
      icon.src = `img/services/${name}.webp`;
      icon.alt = '';
      icon.className = 'activation__burst-icon';
      // Иконки разлетаются веером вверх от ручки
      const angle = (-165 + (150 / (BURST_ICONS.length - 1)) * index + (Math.random() * 14 - 7)) * (Math.PI / 180);
      const distance = 70 + Math.random() * 70;
      icon.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      icon.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
      icon.style.setProperty('--rot', `${Math.round(Math.random() * 60 - 30)}deg`);
      icon.style.setProperty('--size', `${26 + Math.round(Math.random() * 22)}px`);
      icon.style.setProperty('--delay', `${0.75 + index * 0.04}s`);
      burst.append(icon);
    });
  }

  function resetForm() {
    form.hidden = false;
    text.hidden = false;
    done.hidden = true;
    error.textContent = '';
    input.value = '';
    input.removeAttribute('aria-invalid');
  }

  modalElement.addEventListener('modal:open', () => {
    activations += 1;
    countElement.textContent = formatNumber(activations);
    if (launchCount) launchCount.textContent = formatNumber(activations);
    resetForm();

    requestAnimationFrame(() => {
      const switchElement = knob.parentElement;
      const padding = parseFloat(getComputedStyle(switchElement).paddingLeft) * 2;
      knob.style.setProperty('--knob-shift', `${switchElement.clientWidth - knob.offsetWidth - padding}px`);
      replayClass(countElement, 'activation__count_bump');
      showBurst();
    });
  });

  modalElement.addEventListener('modal:close', () => {
    burst.replaceChildren();
    dialog.scrollTop = 0;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    const valid = EMAIL.test(value) || USERNAME.test(value);
    if (!valid) {
      error.textContent = value
        ? 'Проверьте адрес почты или username в Telegram'
        : 'Введите username в Telegram или e-mail';
      input.setAttribute('aria-invalid', 'true');
      replayClass(input, 'activation__input_invalid');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    contactOutput.textContent = value.includes('@') && !value.startsWith('@') ? value : `@${value.replace(/^@/, '')}`;
    form.hidden = true;
    text.hidden = true;
    done.hidden = false;
    done.querySelector('button').focus({ preventScroll: true });
  });

  input.addEventListener('input', () => {
    if (!error.textContent) return;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-activation-open]')) modal.open('activation');
  });
})();
