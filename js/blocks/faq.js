// FAQ: аккордеон, фильтр по темам и раскладка карточек в две колонки, как в макете
(function () {
  'use strict';

  const section = document.querySelector('[data-faq]');
  if (!section) return;

  const list = section.querySelector('[data-faq-list]');
  const tabs = section.querySelector('[data-tabs]');
  const items = Array.from(list.querySelectorAll('[data-faq-item]'));
  const COLUMNS = 2;

  const columns = Array.from({ length: COLUMNS }, () => {
    const column = document.createElement('div');
    column.className = 'faq__column';
    return column;
  });
  list.classList.add('faq__list_columns');
  list.replaceChildren(...columns);

  // Раскладываем по очереди: нечётные карточки слева, чётные справа — так в макете
  function layout(visibleItems, animate) {
    columns.forEach((column) => column.replaceChildren());
    visibleItems.forEach((item, index) => {
      columns[index % COLUMNS].append(item);
      if (animate) {
        item.style.animationDelay = `${index * 50}ms`;
        window.Burger.replayClass(item, 'faq__item_appear');
      }
    });
  }

  function setOpen(item, open) {
    item.classList.toggle('faq__item_open', open);
    item.querySelector('.faq__toggle').setAttribute('aria-expanded', String(open));
  }

  items.forEach((item) => {
    item.querySelector('.faq__toggle').addEventListener('click', () => {
      setOpen(item, !item.classList.contains('faq__item_open'));
    });
  });

  tabs.addEventListener('tabs:change', (event) => {
    const topic = event.detail.tab.dataset.topic;
    const visible = items.filter((item) => item.dataset.topics.split(' ').includes(topic));
    layout(visible, true);
  });

  layout(items.filter((item) => item.dataset.topics.split(' ').includes('vpn')), false);
})();
