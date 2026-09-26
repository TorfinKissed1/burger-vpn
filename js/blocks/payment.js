// Окно оплаты: выбор тарифа и периода, лист с итогом и экран успешной оплаты.
// Настоящего платежа нет: это интерфейс из макета без сервера.
(function () {
  'use strict';

  const modalElement = document.getElementById('payment');
  if (!modalElement) return;

  const { modal, on, formatNumber } = window.Burger;
  const payment = modalElement.querySelector('[data-payment]');
  const plans = Array.from(modalElement.querySelectorAll('[data-plan]'));
  const periods = Array.from(modalElement.querySelectorAll('[data-weeks]'));
  const totalElement = modalElement.querySelector('[data-payment-total]');
  const sheet = modalElement.querySelector('[data-payment-sheet]');
  const success = modalElement.querySelector('[data-payment-success]');
  const sumElement = modalElement.querySelector('[data-payment-sum]');
  const paidElement = modalElement.querySelector('[data-payment-paid]');
  const planName = modalElement.querySelector('[data-payment-plan-name]');
  const periodName = modalElement.querySelector('[data-payment-period]');
  const untilElement = modalElement.querySelector('[data-payment-until]');
  const devicesElement = modalElement.querySelector('[data-payment-devices]');
  const constructorPrice = modalElement.querySelector('[data-plan="constructor"] .payment__plan-price b');
  const constructorDevices = modalElement.querySelector('[data-plan="constructor"] .payment__plan-devices');

  // Недельные цены из кадра оплаты; «Конструктор» считается за устройство
  const PLANS = {
    personal: { name: 'Личный', weekly: 84, devices: 1 },
    advanced: { name: 'Продвинутый', weekly: 252, devices: 3 },
    family: { name: 'Семья', weekly: 504, devices: 6 },
    constructor: { name: 'Конструктор', perDevice: 24, devices: 5 },
  };
  const PERIOD_BY_MONTHS = { 1: '4', 3: '13', 12: '52' };
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const state = { plan: 'advanced', weeks: 1, discount: 0 };

  const weeklyPrice = (key) => {
    const plan = PLANS[key];
    return plan.perDevice ? plan.perDevice * plan.devices : plan.weekly;
  };

  const total = () => Math.round(weeklyPrice(state.plan) * state.weeks * (1 - state.discount));

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
    plans.forEach((plan) => plan.setAttribute('aria-checked', String(plan.dataset.plan === state.plan)));
    periods.forEach((period) => period.setAttribute('aria-checked', String(Number(period.dataset.weeks) === state.weeks)));
    constructorPrice.textContent = `${formatNumber(weeklyPrice('constructor'))} ₽`;
    constructorDevices.textContent = `от 2 до 100 устройств · выбрано ${PLANS.constructor.devices}`;
    totalElement.textContent = `${formatNumber(total())} ₽`;
  }

  function selectPeriod(button) {
    state.weeks = Number(button.dataset.weeks);
    state.discount = Number(button.dataset.discount);
  }

  function showSheet() {
    const plan = PLANS[state.plan];
    const until = new Date();
    until.setDate(until.getDate() + state.weeks * 7);
    planName.textContent = plan.name;
    periodName.textContent = periods.find((period) => Number(period.dataset.weeks) === state.weeks).textContent.trim();
    untilElement.textContent = `до ${dateFormat.format(until)}`;
    devicesElement.textContent = String(plan.devices);
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

  // Из блока тарифов приходит выбранный тариф, период и число устройств
  on('payment:open', (detail = {}) => {
    if (PLANS[detail.tariff]) state.plan = detail.tariff;
    if (detail.devices) PLANS.constructor.devices = detail.devices;
    const period = periods.find((button) => button.dataset.weeks === PERIOD_BY_MONTHS[detail.period]);
    if (period) selectPeriod(period);
    hideSheet();
    success.hidden = true;
    render();
    modal.open('payment');
  });

  render();
})();
