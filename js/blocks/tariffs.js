// Тарифы: слайдер бургеров на Keen Slider, смена цвета карточки, цены по периодам,
// счётчик устройств для «Конструктора» и переход к оплате.
(function () {
  'use strict';

  const section = document.querySelector('[data-tariffs]');
  if (!section || typeof window.KeenSlider !== 'function') return;

  const { clamp, formatNumber, emit, replayClass } = window.Burger;

  // Цены в макете не сходятся между кадрами; здесь месячная цена из вариантов тарифов,
  // скидки за длинный период подставлены условно, их нужно сверить с заказчиком
  const TARIFFS = {
    personal: { name: 'Личный', devices: '01', price: 90, thumbs: ['iphone'] },
    advanced: { name: 'Продвинутый', devices: '03', price: 220, thumbs: ['android-tv', 'ipad'] },
    family: { name: 'Семья', devices: '06', price: 620, thumbs: ['iphone', 'ipad', 'macbook'] },
    constructor: { name: 'Конструктор', devices: 'до 100', price: 20, perDevice: true, thumbs: ['android-tv', 'ipad'] },
  };
  const DISCOUNTS = { 1: 0, 3: 0.1, 12: 0.31 };
  const DEVICES_MIN = 2;
  const DEVICES_MAX = 100;

  const sliderElement = section.querySelector('[data-tariff-slider]');
  const slides = Array.from(sliderElement.querySelectorAll('[data-tariff]'));
  const keys = slides.map((slide) => slide.dataset.tariff);
  const backdrops = Object.fromEntries(keys.map((key) => [key, section.querySelector(`.tariffs__backdrop_${key}`)]));
  const nameElement = section.querySelector('[data-tariff-name]');
  const priceElement = section.querySelector('[data-tariff-price]');
  const devicesElement = section.querySelector('[data-tariff-devices]');
  const thumbsElement = section.querySelector('[data-tariff-thumbs]');
  const stepper = section.querySelector('[data-tariff-stepper]');
  const stepperValue = section.querySelector('[data-stepper-value]');
  const minus = section.querySelector('[data-stepper-minus]');
  const plus = section.querySelector('[data-stepper-plus]');
  const periods = section.querySelector('[data-tariff-periods]');
  const prevButton = section.querySelector('[data-tariff-prev]');
  const nextButton = section.querySelector('[data-tariff-next]');

  const state = {
    tariff: 'advanced',
    period: 1,
    devices: 5,
  };

  function priceFor(key, period) {
    const discount = DISCOUNTS[period] || 0;
    return Math.round(TARIFFS[key].price * period * (1 - discount));
  }

  function renderPrice() {
    const tariff = TARIFFS[state.tariff];
    const prefix = tariff.perDevice ? 'от ' : '';
    priceElement.textContent = `${prefix}${formatNumber(priceFor(state.tariff, state.period))} ₽`;
    replayClass(priceElement, 'tariffs__swap');
  }

  function renderStepper() {
    stepperValue.textContent = String(state.devices).padStart(2, '0');
    minus.disabled = state.devices <= DEVICES_MIN;
    plus.disabled = state.devices >= DEVICES_MAX;
  }

  function renderTariff() {
    const tariff = TARIFFS[state.tariff];
    keys.forEach((key) => {
      section.classList.toggle(`tariffs_tariff_${key}`, key === state.tariff);
      backdrops[key].classList.toggle('tariffs__backdrop_active', key === state.tariff);
    });

    nameElement.textContent = tariff.name;
    devicesElement.textContent = tariff.devices;
    thumbsElement.replaceChildren(...tariff.thumbs.map((thumb) => {
      const image = new Image(40, 40);
      image.src = `img/devices/${thumb}.webp`;
      image.alt = '';
      image.decoding = 'async';
      return image;
    }));
    stepper.hidden = !tariff.perDevice;

    replayClass(nameElement, 'tariffs__swap');
    renderPrice();
  }

  // Масштаб, сдвиг и наклон слайда зависят от расстояния до центра
  function updateSlides(slider) {
    slider.track.details.slides.forEach((detail, index) => {
      const offset = (detail.distance + detail.size / 2 - 0.5) / detail.size;
      const distance = Math.min(Math.abs(offset), 1);
      slides[index].style.setProperty('--distance', distance.toFixed(3));
      slides[index].style.setProperty('--offset', clamp(offset, -1.5, 1.5).toFixed(3));
    });
  }

  function updateArrows(slider) {
    const index = slider.track.details.rel;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
  }

  const slider = new window.KeenSlider(sliderElement, {
    initial: keys.indexOf(state.tariff),
    loop: false,
    rubberband: true,
    slides: { origin: 'center', perView: 1.93, spacing: 0 },
    // На ПК слайдер занимает половину правой части экрана тарифов — бургеры крупнее
    breakpoints: {
      '(min-width: 1024px)': { slides: { origin: 'center', perView: 1.3, spacing: 0 } },
    },
    created(instance) {
      updateSlides(instance);
      updateArrows(instance);
    },
    detailsChanged: updateSlides,
    slideChanged(instance) {
      state.tariff = keys[instance.track.details.rel];
      renderTariff();
      updateArrows(instance);
    },
  });

  // Клик по боковому бургеру доводит его в центр
  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      if (index !== slider.track.details.rel) slider.moveToIdx(index);
    });
  });

  prevButton.addEventListener('click', () => slider.prev());
  nextButton.addEventListener('click', () => slider.next());

  periods.addEventListener('tabs:change', (event) => {
    state.period = Number(event.detail.tab.dataset.period);
    renderPrice();
  });

  minus.addEventListener('click', () => {
    state.devices = clamp(state.devices - 1, DEVICES_MIN, DEVICES_MAX);
    renderStepper();
  });

  plus.addEventListener('click', () => {
    state.devices = clamp(state.devices + 1, DEVICES_MIN, DEVICES_MAX);
    renderStepper();
  });

  section.querySelector('[data-tariff-connect]').addEventListener('click', () => {
    emit('payment:open', { ...state });
  });

  renderStepper();
  renderTariff();
})();
