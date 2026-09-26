// Числа с data-count-to набегают до значения, когда попадают в экран
(function () {
  'use strict';

  const { onceVisible, animateValue, formatNumber } = window.Burger;

  document.querySelectorAll('[data-count-to]').forEach((element) => {
    const suffix = element.dataset.countSuffix || '';
    // Большие числа начинаем не с нуля, иначе счёт тянется слишком долго
    const initial = Number(element.dataset.countTo);
    const from = initial > 1000 ? Math.round(initial * 0.92) : 0;

    element.textContent = formatNumber(from) + suffix;
    onceVisible(element.closest('svg') || element, () => {
      animateValue({
        from,
        to: Number(element.dataset.countTo),
        duration: 1600,
        onUpdate: (value) => {
          element.textContent = formatNumber(Math.round(value)) + suffix;
        },
      });
    }, { threshold: 0.6 });
  });
})();
