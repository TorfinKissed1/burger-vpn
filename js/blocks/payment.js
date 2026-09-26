// Окно оплаты: выбор тарифа и периода, лист с итогом и экран успешной оплаты.
// Настоящего платежа нет: это интерфейс из макета без сервера.
(function () {
  'use strict';

  const modalElement = document.getElementById('payment');
  if (!modalElement) return;

  const { modal, on, formatNumber, pricing } = window.Burger;
  const payment = modalElement.querySelector('[data-payment]');
  const plans = Array.from(modalElement.querySelectorAll('[data-plan]'));
  const periods = Array.from(modalElement.querySelectorAll('[data-months]'));
  const totalElement = modalElement.querySelector('[data-payment-total]');
  const sheet = modalElement.querySelector('[data-payment-sheet]');
  const success = modalElement.querySelector('[data-payment-success]');
  const sumElement = modalElement.querySelector('[data-payment-sum]');
  const paidElement = modalElement.querySelector('[data-payment-paid]');
  const planName = modalElement.querySelector('[data-payment-plan-name]');
  const periodName = modalElement.querySelector('[data-payment-period]');
  const untilElement = modalElement.querySelector('[data-payment-until]');
  const devicesElement = modalElement.querySelector('[data-payment-devices]');
  const constructorDevices = modalElement.querySelector('[data-plan="constructor"] .payment__plan-devices');
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Цены — из общей таблицы js/core/pricing.js: в списке недельная цена, итог — за выбранный срок
  const state = { plan: 'advanced', months: 0.25, devices: pricing.TARIFFS.constructor.devices };

  const devicesOf = (key) => (pricing.TARIFFS[key].perDevice ? state.devices : pricing.TARIFFS[key].devices);
  const total = () => pricing.total(state.plan, state.months, devicesOf(state.plan));

  // Рубль набираем чуть мельче цифр, как в макете
  function setSum(element, value) {
    const currency = document.createElement('span');
    currency.className = 'payment__currency';
    currency.textContent = ' ₽';
    element.replaceChildren(formatNumber(value), currency);
  }

  function devicesLabel(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} устройство`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} устройства`;
    return `${count} устройств`;
  }

  function render() {
    plans.forEach((plan) => {
      const key = plan.dataset.plan;
      plan.setAttribute('aria-checked', String(key === state.plan));
      plan.querySelector('.payment__plan-price b').textContent = `${formatNumber(pricing.weekly(key, devicesOf(key)))} ₽`;
    });
    periods.forEach((period) => period.setAttribute('aria-checked', String(Number(period.dataset.months) === state.months)));
    constructorDevices.textContent = `от 2 до 100 устройств · выбрано ${state.devices}`;
    totalElement.textContent = `${formatNumber(total())} ₽`;
  }

  function selectPeriod(button) {
    state.months = Number(button.dataset.months);
  }

  function showSheet() {
    const until = new Date();
    if (state.months < 1) until.setDate(until.getDate() + 7);
    else until.setMonth(until.getMonth() + state.months);
    planName.textContent = pricing.TARIFFS[state.plan].name;
    periodName.textContent = periods.find((period) => Number(period.dataset.months) === state.months).textContent.trim();
    untilElement.textContent = `до ${dateFormat.format(until)}`;
    devicesElement.textContent = String(devicesOf(state.plan));
    setSum(sumElement, total());
    sheet.hidden = false;
    payment.classList.add('payment_sheet-open');
    sheet.querySelector('[data-payment-confirm]').focus({ preventScroll: true });
  }

  function hideSheet() {
    sheet.hidden = true;
    payment.classList.remove('payment_sheet-open');
  }

  plans.forEach((plan) => plan.addEventListener('click', () => {
    state.plan = plan.dataset.plan;
    render();
  }));

  periods.forEach((period) => period.addEventListener('click', () => {
    selectPeriod(period);
    render();
  }));

  modalElement.querySelector('[data-payment-next]').addEventListener('click', showSheet);
  modalElement.querySelector('[data-payment-back]').addEventListener('click', hideSheet);

  modalElement.querySelector('[data-payment-confirm]').addEventListener('click', () => {
    setSum(paidElement, total());
    sheet.hidden = true;
    success.hidden = false;
    success.querySelector('[data-payment-finish]').focus({ preventScroll: true });
  });

  modalElement.querySelector('[data-payment-finish]').addEventListener('click', () => modal.close());

  modalElement.addEventListener('modal:close', () => {
    hideSheet();
    success.hidden = true;
  });

  // Из блока тарифов приходит выбранный тариф, срок в месяцах и число устройств
  on('payment:open', (detail = {}) => {
    if (pricing.TARIFFS[detail.tariff]) state.plan = detail.tariff;
    if (detail.devices) state.devices = detail.devices;
    const period = periods.find((button) => Number(button.dataset.months) === Number(detail.period));
    if (period) selectPeriod(period);
    hideSheet();
    success.hidden = true;
    render();
    modal.open('payment');
  });

  render();
})();
