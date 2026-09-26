// Кешбэк: шкала-«радуга» заполняется, когда ведёшь пальцем по сцене, и переключает уровни.
(function () {
  'use strict';

  const section = document.querySelector('[data-cashback]');
  if (!section) return;

  const { clamp, lerp, onceVisible, animateValue, easeInOutCubic, replayClass } = window.Burger;
  const stage = section.querySelector('[data-cashback-stage]');
  const gauge = section.querySelector('[data-cashback-gauge]');
  const levelElement = section.querySelector('[data-cashback-level]');
  const rewardElement = section.querySelector('[data-cashback-reward]');
  const rewardLabel = section.querySelector('[data-cashback-reward-label]');
  const friendsElement = section.querySelector('[data-cashback-friends]');

  // Геометрия шкалы в координатах макета (сцена 440×372, центр дуги — центр круга с засечками)
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CENTER_X = 220;
  const CENTER_Y = 223;
  const TICKS = 72;
  const TICK_START = 207;
  const TICK_STEP = 1.87;
  const TICK_INNER = 195;
  const TICK_OUTER = 205;
  const MARKER_RADIUS = 216;
  const IDLE_COLOR = 'rgba(0, 0, 0, 0.1)';

  // Пороги уровней в засечках: 0, 5, 15 и 30 друзей
  const LEVELS = [
    { from: 0, friends: 0, color: '#0c0c0c', angle: 204.8, label: '0', reward: '14', rewardLabel: 'Дней VPN', friendsLabel: '0+' },
    { from: 15, friends: 5, color: '#c4d82b', angle: 232.6, label: '5', reward: '30', rewardLabel: 'Кешбэк ₽', friendsLabel: '5+' },
    { from: 45, friends: 15, color: '#ff8b4d', angle: 289.9, label: '15', reward: '40', rewardLabel: 'Кешбэк ₽', friendsLabel: '15+' },
    { from: 70, friends: 30, color: '#fe2dea', angle: 336.3, label: '30', reward: '50', rewardLabel: 'Кешбэк ₽', friendsLabel: '30+' },
  ];
  const INITIAL_PROGRESS = 49;

  const point = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return [CENTER_X + radius * Math.cos(rad), CENTER_Y + radius * Math.sin(rad)];
  };

  const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  function mix(colorA, colorB, t) {
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    return `rgb(${a.map((value, i) => Math.round(lerp(value, b[i], t))).join(' ')})`;
  }

  // Цвет заполненной засечки плавно идёт от тёмного к лаймовому, оранжевому и розовому
  function tickColor(index) {
    for (let i = 0; i < LEVELS.length - 1; i += 1) {
      const start = LEVELS[i].from;
      const end = LEVELS[i + 1].from;
      if (index < end) return mix(LEVELS[i].color, LEVELS[i + 1].color, (index - start) / (end - start));
    }
    return LEVELS[LEVELS.length - 1].color;
  }

  function create(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  const ticks = [];
  const markers = [];

  for (let i = 0; i < TICKS; i += 1) {
    const angle = TICK_START + i * TICK_STEP;
    const [x1, y1] = point(angle, TICK_INNER);
    const [x2, y2] = point(angle, TICK_OUTER);
    const tick = create('line', { class: 'cashback__tick', x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), stroke: IDLE_COLOR });
    ticks.push({ element: tick, color: tickColor(i) });
    gauge.append(tick);
  }

  LEVELS.forEach((level) => {
    const [x, y] = point(level.angle, MARKER_RADIUS);
    const group = create('g', { transform: `rotate(${(level.angle + 90).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})` });
    const width = level.label.length > 1 ? 19 : 14;
    const pill = create('rect', { class: 'cashback__marker-pill', x: (x - width / 2).toFixed(2), y: (y - 6.5).toFixed(2), width, height: 13, rx: 6.5, fill: '#dddddd' });
    const text = create('text', { class: 'cashback__marker-text', x: x.toFixed(2), y: (y + 3.2).toFixed(2), 'text-anchor': 'middle' });
    text.textContent = level.label;
    group.append(pill, text);
    gauge.append(group);
    markers.push(pill);
  });

  const thumbHalo = create('circle', { class: 'cashback__thumb-halo', r: 13, fill: '#ff2486' });
  const thumb = create('circle', { class: 'cashback__thumb', r: 7, fill: '#ffffff', stroke: '#0c0c0c', 'stroke-width': 3 });
  gauge.append(thumbHalo, thumb);

  let progress = 0;
  let levelIndex = -1;

  function friendsFor(value) {
    for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
      if (value >= LEVELS[i].from) {
        const next = LEVELS[i + 1];
        if (!next) return LEVELS[i].friends + Math.round((value - LEVELS[i].from) / 2);
        return Math.round(lerp(LEVELS[i].friends, next.friends, (value - LEVELS[i].from) / (next.from - LEVELS[i].from)));
      }
    }
    return 0;
  }

  function setLevel(index) {
    if (index === levelIndex) return;
    levelIndex = index;
    const level = LEVELS[index];
    LEVELS.forEach((_, i) => section.classList.toggle(`cashback_level_${i + 1}`, i === index));
    levelElement.textContent = String(index + 1);
    rewardElement.textContent = level.reward;
    rewardLabel.textContent = level.rewardLabel;
    friendsElement.textContent = level.friendsLabel;
    replayClass(rewardElement, 'cashback__bump');
    replayClass(friendsElement, 'cashback__bump');
  }

  function setProgress(value) {
    progress = clamp(value, 0, TICKS);
    const filled = Math.round(progress);
    ticks.forEach((tick, i) => tick.element.setAttribute('stroke', i < filled ? tick.color : IDLE_COLOR));
    markers.forEach((pill, i) => pill.setAttribute('fill', progress >= LEVELS[i].from ? LEVELS[i].color : '#dddddd'));

    const [thumbX, thumbY] = point(TICK_START + Math.max(progress - 0.5, 0) * TICK_STEP, (TICK_INNER + TICK_OUTER) / 2);
    thumb.setAttribute('cx', thumbX.toFixed(2));
    thumb.setAttribute('cy', thumbY.toFixed(2));
    thumb.setAttribute('stroke', filled > 0 ? ticks[Math.min(filled, TICKS) - 1].color : LEVELS[0].color);
    thumbHalo.setAttribute('cx', thumbX.toFixed(2));
    thumbHalo.setAttribute('cy', thumbY.toFixed(2));

    let index = 0;
    LEVELS.forEach((level, i) => {
      if (progress >= level.from) index = i;
    });
    setLevel(index);

    const friends = friendsFor(progress);
    stage.setAttribute('aria-valuenow', String(friends));
    stage.setAttribute('aria-valuetext', `${friends} друзей, уровень ${index + 1} из ${LEVELS.length}`);
  }

  // Палец ведём слева направо: горизонталь сцены пересчитываем в засечку под пальцем
  const [arcLeft] = point(TICK_START, TICK_OUTER);
  const [arcRight] = point(TICK_START + (TICKS - 1) * TICK_STEP, TICK_OUTER);

  function progressFromPointer(event) {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 440;
    return ((x - arcLeft) / (arcRight - arcLeft)) * TICKS;
  }

  let dragging = false;
  let stopDemo = () => {};

  function touch() {
    stopDemo();
    section.classList.add('cashback_touched');
  }

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    touch();
    dragging = true;
    stage.setPointerCapture(event.pointerId);
    setProgress(progressFromPointer(event));
  });

  stage.addEventListener('pointermove', (event) => {
    if (dragging) setProgress(progressFromPointer(event));
  });

  const endDrag = () => {
    dragging = false;
  };

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  stage.addEventListener('keydown', (event) => {
    const steps = { ArrowRight: 3, ArrowUp: 3, ArrowLeft: -3, ArrowDown: -3, PageUp: 15, PageDown: -15 };
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      touch();
      setProgress(event.key === 'Home' ? 0 : TICKS);
      return;
    }
    if (!(event.key in steps)) return;
    event.preventDefault();
    touch();
    setProgress(progress + steps[event.key]);
  });

  setProgress(INITIAL_PROGRESS);

  // При первом показе шкала сама заполняется от нуля — подсказка, что её можно тянуть
  onceVisible(stage, () => {
    if (section.classList.contains('cashback_touched')) return;
    setProgress(0);
    stopDemo = animateValue({
      from: 0,
      to: INITIAL_PROGRESS,
      duration: 2200,
      easing: easeInOutCubic,
      onUpdate: setProgress,
    });
  }, { threshold: 0.5 });
})();
