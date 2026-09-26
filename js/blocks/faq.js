// FAQ: аккордеон, фильтр по темам и раскладка карточек по колонкам (две на телефоне, три на ПК)
(function () {
  'use strict';

  const section = document.querySelector('[data-faq]');
  if (!section) return;

  const list = section.querySelector('[data-faq-list]');
  const tabs = section.querySelector('[data-tabs]');
  const items = Array.from(list.querySelectorAll('[data-faq-item]'));
  // На ПК блок во всю ширину, туда помещаются три колонки
  const wide = window.matchMedia('(min-width: 1024px)');
  let columns = [];
  let visible = items.filter((item) => item.dataset.topics.split(' ').includes('vpn'));

  list.classList.add('faq__list_columns');

  // В две колонки кладём по очереди — ровно как в макете. В три — в самую короткую,
  // иначе обе открытые карточки попадают в первую колонку и она вытягивается
  function columnFor(index) {
    if (columns.length === 2) return columns[index % 2];
    return columns.reduce((shortest, column) => (column.offsetHeight < shortest.offsetHeight ? column : shortest));
  }

  function layout(visibleItems, animate) {
    const count = wide.matches ? 3 : 2;
    if (columns.length !== count) {
      columns = Array.from({ length: count }, () => {
        const column = document.createElement('div');
        column.className = 'faq__column';
        return column;
      });
      list.replaceChildren(...columns);
    }
    columns.forEach((column) => column.replaceChildren());
    visibleItems.forEach((item, index) => {
      columnFor(index).append(item);
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
    visible = items.filter((item) => item.dataset.topics.split(' ').includes(topic));
    layout(visible, true);
  });

  wide.addEventListener('change', () => layout(visible, false));

  layout(visible, false);
})();
