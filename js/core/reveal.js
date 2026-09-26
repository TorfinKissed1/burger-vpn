// Плавное появление элементов с data-reveal при прокрутке
(function () {
  'use strict';

  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  items.forEach((item) => observer.observe(item));
})();
