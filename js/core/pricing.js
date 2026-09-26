// Цены тарифов — одна таблица на карточку тарифов и окно оплаты, чтобы суммы совпадали.
// В макете цены между кадрами не сходятся: месячные взяты из карточек тарифов, скидки
// за 3 месяца и год — из окна оплаты. Всё условно и сверяется с заказчиком.
(function () {
  'use strict';

  const Burger = window.Burger || (window.Burger = {});

  const TARIFFS = {
    personal: { name: 'Личный', monthly: 90, devices: 1 },
    advanced: { name: 'Продвинутый', monthly: 220, devices: 3 },
    family: { name: 'Семья', monthly: 620, devices: 6 },
    constructor: { name: 'Конструктор', perDevice: 20, devices: 5, minDevices: 2, maxDevices: 100 },
  };

  // Срок в месяцах: неделя — четверть месяца. Скидка только за 3 месяца и год
  const DISCOUNTS = { 3: 0.31, 12: 0.36 };
  const WEEKS_IN_MONTH = 4;

  function monthly(key, devices) {
    const tariff = TARIFFS[key];
    return tariff.perDevice ? tariff.perDevice * (devices || tariff.devices) : tariff.monthly;
  }

  Burger.pricing = {
    TARIFFS,
    discount: (months) => DISCOUNTS[months] || 0,
    weekly: (key, devices) => Math.round(monthly(key, devices) / WEEKS_IN_MONTH),
    total: (key, months, devices) => Math.round(monthly(key, devices) * months * (1 - (DISCOUNTS[months] || 0))),
  };
})();
