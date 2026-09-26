// Окно оплаты: выбор тарифа и периода, лист с итогом и экран успешной оплаты.
// Настоящего платежа нет: это интерфейс из макета без сервера.
(function () {
  'use strict';

  const modalElement = document.getElementById('payment');
  if (!modalElement) return;

  const { modal, on, formatNumber, pricing } = window.Burger;
  const payment = modalElement.querySelector('[data-payment]');
  const screen = modalElement.querySelector('[data-payment-screen]');
  const plans = Array.from(modalElement.querySelectorAll('[data-plan]'));
  const periods = Array.from(modalElement.querySelectorAll('[data-months]'));
  const nextButton = modalElement.querySelector('[data-payment-next]');
  const totalElement = modalElement.querySelector('[data-payment-total]');
  const sheet = modalElement.querySelector('[data-payment-sheet]');
  const success = modalElement.querySelector('[data-payment-success]');
  const sumElement = modalElement.querySelector('[data-payment-sum]');
  const paidElement = modalElement.querySelector('[data-payment-paid]');
  const planName = modalElement.querySelector('[data-payment-plan-name]');
  const periodName = modalElement.querySelector('[data-payment-period]');
  const untilElement = modalElement.querySelector('[data-payment-until]');
  const devicesElement = modalElement.querySelector('[data-payment-devices]');
  const tariffBlock = modalElement.querySelector('[data-payment-tariff]');
  const tariffName = modalElement.querySelector('[data-payment-tariff-name]');
  const tariffImage = modalElement.querySelector('[data-payment-tariff-image]');
  const shorterButtons = Array.from(modalElement.querySelectorAll('[data-payment-shorter]'));
  const longerButtons = Array.from(modalElement.querySelectorAll('[data-payment-longer]'));
  const constructorDevices = modalElement.querySelector('[data-plan="constructor"] .payment__plan-devices');
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Цены — из общей таблицы js/core/pricing.js: в списке недельная цена, итог — за выбранный срок
  const state = { plan: 'advanced', months: 0.25, devices: pricing.TARIFFS.constructor.devices };
  const MONTHS = periods.map((period) => Number(period.dataset.months));

  const devicesOf = (key) => (pricing.TARIFFS[key].perDevice ? state.devices : pricing.TARIFFS[key].devices);
  const total = () => pricing.total(state.plan, state.months, devicesOf(state.plan));

  // Рубль набираем чуть мельче цифр, как в макете
  function setSum(element, value) {
    const currency = document.createElement('span');
    currency.className = 'payment__currency';
    currency.textContent = ' ₽';
    element.replaceChildren(formatNumber(value), currency);
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

  function renderSheet() {
    const until = new Date();
    if (state.months < 1) until.setDate(until.getDate() + 7);
    else until.setMonth(until.getMonth() + state.months);
    const name = pricing.TARIFFS[state.plan].name;
    planName.textContent = name;
    periodName.textContent = periods.find((period) => Number(period.dataset.months) === state.months).textContent.trim();
    untilElement.textContent = `до ${dateFormat.format(until)}`;
    devicesElement.textContent = String(devicesOf(state.plan));
    tariffName.textContent = name;
    Object.keys(pricing.TARIFFS).forEach((key) => tariffBlock.classList.toggle(`payment__tariff_plan_${key}`, key === state.plan));
    tariffImage.src = `img/tariffs/${state.plan}.webp`;
    const index = MONTHS.indexOf(state.months);
    shorterButtons.forEach((button) => { button.disabled = index === 0; });
    longerButtons.forEach((button) => { button.disabled = index === MONTHS.length - 1; });
    setSum(sumElement, total());
  }

  // Поверх экрана выбора — лист или экран успеха: окно наверх, экран под ними недоступен для Tab
  function cover(layer, className) {
    payment.scrollTop = 0;
    payment.classList.add(className);
    screen.inert = true;
    layer.hidden = false;
  }

  function showSheet() {
    renderSheet();
    cover(sheet, 'payment_sheet-open');
    sheet.querySelector('[data-payment-confirm]').focus({ preventScroll: true });
  }

  function hideSheet({ restoreFocus = true } = {}) {
    const hadFocus = sheet.contains(document.activeElement);
    sheet.hidden = true;
    payment.classList.remove('payment_sheet-open');
    screen.inert = false;
    if (restoreFocus && hadFocus) nextButton.focus({ preventScroll: true });
  }

  function changePeriod(step) {
    const index = MONTHS.indexOf(state.months) + step;
    if (index < 0 || index >= MONTHS.length) return;
    state.months = MONTHS[index];
    render();
    renderSheet();
  }

  plans.forEach((plan) => plan.addEventListener('click', () => {
    state.plan = plan.dataset.plan;
    render();
  }));

  periods.forEach((period) => period.addEventListener('click', () => {
    state.months = Number(period.dataset.months);
    render();
  }));

  shorterButtons.forEach((button) => button.addEventListener('click', () => changePeriod(-1)));
  longerButtons.forEach((button) => button.addEventListener('click', () => changePeriod(1)));

  nextButton.addEventListener('click', showSheet);
  modalElement.querySelector('[data-payment-back]').addEventListener('click', () => hideSheet());

  // Нажатие на затемнённый экран вне листа тоже возвращает к выбору тарифа. Экран под листом
  // inert и сам событий не получает, поэтому слушаем всё окно
  payment.addEventListener('pointerdown', (event) => {
    if (!sheet.hidden && !sheet.contains(event.target)) hideSheet();
  });

  modalElement.querySelector('[data-payment-confirm]').addEventListener('click', () => {
    setSum(paidElement, total());
    hideSheet({ restoreFocus: false });
    cover(success, 'payment_success-open');
    success.querySelector('[data-payment-finish]').focus({ preventScroll: true });
  });

  // «Создать профиль» открывает бота в новой вкладке, окно при этом закрываем
  modalElement.querySelector('[data-payment-finish]').addEventListener('click', () => modal.close());

  function reset() {
    hideSheet({ restoreFocus: false });
    success.hidden = true;
    payment.classList.remove('payment_success-open');
    screen.inert = false;
  }

  modalElement.addEventListener('modal:close', reset);

  // Esc внутри листа возвращает к выбору тарифа, а не закрывает всё окно
  modalElement.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || sheet.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    hideSheet();
  }, true);

  // Из блока тарифов приходит выбранный тариф, срок в месяцах и число устройств
  on('payment:open', (detail = {}) => {
    if (pricing.TARIFFS[detail.tariff]) state.plan = detail.tariff;
    if (detail.devices) state.devices = detail.devices;
    if (MONTHS.includes(Number(detail.period))) state.months = Number(detail.period);
    reset();
    render();
    modal.open('payment');
  });

  render();
})();
