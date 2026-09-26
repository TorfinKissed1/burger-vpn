// Общие помощники страницы. Модули блоков берут их из window.Burger.
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const Burger = window.Burger || (window.Burger = {});
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const numberFormat = new Intl.NumberFormat('ru-RU');

  Burger.prefersReducedMotion = () => reducedMotion.matches;

  Burger.clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  Burger.lerp = (from, to, progress) => from + (to - from) * progress;

  // ru-RU разделяет разряды неразрывным пробелом, как в макете: «21 325»
  Burger.formatNumber = (value) => numberFormat.format(value);

  Burger.easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  Burger.easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  Burger.onceVisible = (element, callback, options = {}) => {
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      callback();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        callback();
      }
    }, { threshold: options.threshold ?? 0.25, rootMargin: options.rootMargin ?? '0px' });
    observer.observe(element);
  };

  Burger.whileVisible = (element, onChange, options = {}) => {
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      onChange(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => onChange(entry.isIntersecting));
    }, { threshold: options.threshold ?? 0.2 });
    observer.observe(element);
  };

  Burger.animateValue = ({ from, to, duration = 1200, easing = Burger.easeOutExpo, onUpdate, onDone }) => {
    if (Burger.prefersReducedMotion() || duration <= 0) {
      onUpdate(to);
      if (onDone) onDone();
      return () => {};
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      onUpdate(Burger.lerp(from, to, easing(progress)));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else if (onDone) {
        onDone();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  };

  // Блокировка прокрутки под окнами и меню; счётчик нужен, когда окна открываются поверх друг друга.
  // Ширину пропавшей полосы прокрутки отдаём в CSS: на неё сдвигаются страница и фиксированная шапка.
  let lockCount = 0;

  Burger.lockScroll = () => {
    lockCount += 1;
    if (lockCount > 1) return;
    const scrollbar = Math.max(window.innerWidth - root.clientWidth, 0);
    root.style.setProperty('--scrollbar-compensation', `${scrollbar}px`);
    document.body.classList.add('is-locked');
  };

  Burger.unlockScroll = () => {
    if (lockCount === 0) return;
    lockCount -= 1;
    if (lockCount > 0) return;
    document.body.classList.remove('is-locked');
    root.style.removeProperty('--scrollbar-compensation');
  };

  Burger.emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  Burger.on = (name, handler) => document.addEventListener(name, (event) => handler(event.detail));

  // Перезапуск CSS-анимации: снимаем класс, принудительно пересчитываем стили и вешаем снова
  Burger.replayClass = (element, className) => {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  };
})();
