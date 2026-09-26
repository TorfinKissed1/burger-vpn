// Тарифы: слайдер бургеров на Keen Slider, смена цвета карточки, цены по периодам,
// счётчик устройств для «Конструктора» и переход к оплате.
(function () {
  'use strict';

  const section = document.querySelector('[data-tariffs]');
  if (!section || typeof window.KeenSlider !== 'function') return;

  const { clamp, formatNumber, emit, replayClass, pricing, prefersReducedMotion } = window.Burger;

  // Цены и скидки — в общей таблице js/core/pricing.js, здесь только оформление карточки
  const TARIFFS = {
    personal: { devices: '01', thumbs: ['iphone'] },
    advanced: { devices: '03', thumbs: ['android-tv', 'ipad'] },
    family: { devices: '06', thumbs: ['iphone', 'ipad', 'macbook'] },
    constructor: { devices: 'до 100', thumbs: ['android-tv', 'ipad'] },
  };
  const { minDevices: DEVICES_MIN, maxDevices: DEVICES_MAX } = pricing.TARIFFS.constructor;

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
    devices: pricing.TARIFFS.constructor.devices,
  };

  // «Конструктор» считается за выбранное число устройств, остальные — за тариф целиком
  function renderPrice() {
    priceElement.textContent = `${formatNumber(pricing.total(state.tariff, state.period, state.devices))} ₽`;
    replayClass(priceElement, 'tariffs__swap');
  }

  // Кнопка на краю диапазона не выключается совсем: иначе фокус с неё пропадает
  function setUnavailable(button, unavailable) {
    button.setAttribute('aria-disabled', String(unavailable));
  }

  function renderStepper() {
    stepperValue.textContent = String(state.devices).padStart(2, '0');
    setUnavailable(minus, state.devices <= DEVICES_MIN);
    setUnavailable(plus, state.devices >= DEVICES_MAX);
  }

  function renderTariff() {
    const tariff = TARIFFS[state.tariff];
    keys.forEach((key) => {
      section.classList.toggle(`tariffs_tariff_${key}`, key === state.tariff);
      backdrops[key].classList.toggle('tariffs__backdrop_active', key === state.tariff);
    });

    nameElement.textContent = pricing.TARIFFS[state.tariff].name;
    devicesElement.textContent = tariff.devices;
    thumbsElement.replaceChildren(...tariff.thumbs.map((thumb) => {
      const image = new Image(40, 40);
      image.src = `img/devices/${thumb}.webp`;
      image.alt = '';
      image.decoding = 'async';
      return image;
    }));
    stepper.hidden = !pricing.TARIFFS[state.tariff].perDevice;

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
    setUnavailable(prevButton, index === 0);
    setUnavailable(nextButton, index === slides.length - 1);
  }

  const slider = new window.KeenSlider(sliderElement, {
    initial: keys.indexOf(state.tariff),
    loop: false,
    rubberband: true,
    defaultAnimation: { duration: prefersReducedMotion() ? 0 : 500 },
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

  function changeDevices(step) {
    const next = clamp(state.devices + step, DEVICES_MIN, DEVICES_MAX);
    if (next === state.devices) return;
    state.devices = next;
    renderStepper();
    renderPrice();
  }

  minus.addEventListener('click', () => changeDevices(-1));
  plus.addEventListener('click', () => changeDevices(1));

  section.querySelector('[data-tariff-connect]').addEventListener('click', () => {
    emit('payment:open', { ...state });
  });

  renderStepper();
  renderTariff();
})();
