// Числа с data-count-to набегают до значения, когда попадают в экран
(function () {
  'use strict';

  const { onceVisible, animateValue, formatNumber } = window.Burger;

  document.querySelectorAll('[data-count-to]').forEach((element) => {
    const target = Number(element.dataset.countTo);
    const suffix = element.dataset.countSuffix || '';
    // Большие числа начинаем не с нуля, иначе счёт тянется слишком долго
    const from = target > 1000 ? Math.round(target * 0.92) : 0;

    element.textContent = formatNumber(from) + suffix;
    onceVisible(element, () => {
      animateValue({
        from,
        to: target,
        duration: 1600,
        onUpdate: (value) => {
          element.textContent = formatNumber(Math.round(value)) + suffix;
        },
      });
    }, { threshold: 0.6 });
  });
})();
