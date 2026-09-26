// Бесконечные анимации в блоках за экраном ставим на паузу: браузер не тратит на них кадры
(function () {
  'use strict';

  const { whileVisible } = window.Burger;

  document.querySelectorAll('[data-pause-offscreen]').forEach((element) => {
    whileVisible(element, (visible) => element.classList.toggle('is-offscreen', !visible), { threshold: 0 });
  });
})();
