// Заставка «Смахните вверх»: жест вверх раздувает каплю в стеклянный купол, купол сжимается
// в шар, шар линзой проходит над заголовком и лопается облаком иконок вокруг кнопки питания.
(function () {
  'use strict';

  const intro = document.querySelector('[data-intro]');
  if (!intro) return;

  const { clamp, prefersReducedMotion } = window.Burger;
  const stage = intro.querySelector('[data-intro-stage]');
  const trigger = intro.querySelector('[data-intro-trigger]');
  const title = intro.querySelector('[data-intro-title]');

  // Раскадровка из макета, кадры 259–269 и 344. Время T: от 0 до 1 его ведёт жест,
  // дальше сцена доигрывает сама. Координаты — пиксели кадра 440 от низа статус-бара,
  // у свечения — проценты от размера шара.
  const TRACKS = {
    logo: [[0, { y: 329, o: 1 }], [0.36, { y: 282, o: 1 }], [0.55, { y: 282, o: 0.3 }], [0.95, { y: 282, o: 0 }]],
    hint: [[0, { y: 0, o: 1 }], [0.36, { y: -20, o: 1 }], [0.72, { y: -20, o: 1 }], [0.95, { y: -20, o: 0 }]],
    blob: [[0, { o: 1, s: 1 }], [0.2, { o: 1, s: 1.02 }], [0.38, { o: 0, s: 1.06 }]],
    touch: [[0, { o: 0 }], [0.1, { o: 1 }], [0.28, { o: 0.7 }], [0.42, { o: 0 }]],
    bubble: [
      [0.2, { x: -80, y: 562, d: 601, o: 0 }],
      [0.38, { x: -80, y: 551, d: 601, o: 1 }],
      [0.55, { x: -80, y: 505, d: 601, o: 1 }],
      [0.75, { x: -40, y: 495, d: 521, o: 1 }],
      [1, { x: 3, y: 478, d: 434, o: 1 }],
      [1.3, { x: 54, y: 447, d: 331, o: 1 }],
      [1.55, { x: 79.5, y: 387, d: 282, o: 1 }],
      [1.78, { x: 109, y: 388, d: 223, o: 1 }],
      [1.95, { x: 112, y: 331, d: 217, o: 1 }],
      [2.12, { x: 170, y: 257, d: 100, o: 1 }],
      [2.2, { x: 170, y: 257, d: 100, o: 0 }],
    ],
    glow: [
      [0.42, { x: 17.5, y: -19.8, w: 64.9, h: 31.9, o: 0, cut: 0 }],
      [0.55, { x: 17.5, y: -19.8, w: 64.9, h: 31.9, o: 1, cut: 0 }],
      [0.75, { x: -7.7, y: -24.6, w: 115, h: 44.9, o: 1, cut: 0 }],
      [1, { x: -22.4, y: -16.4, w: 144.7, h: 66.4, o: 1, cut: 0.6 }],
      [1.3, { x: -2.1, y: 13, w: 105.7, h: 68.9, o: 1, cut: 1 }],
      [1.55, { x: 14.2, y: 42, w: 71.3, h: 46.1, o: 0.9, cut: 1 }],
      [1.72, { x: 14.2, y: 52, w: 71.3, h: 46.1, o: 0, cut: 1 }],
    ],
    title: [[1.6, { cy: 529, fs: 30, o: 0 }], [1.78, { cy: 529, fs: 30, o: 1 }], [1.95, { cy: 455, fs: 40, o: 1 }], [2.3, { cy: 415, fs: 41, o: 1 }]],
    lens: [[1.6, { o: 0 }], [1.76, { o: 1 }], [2.06, { o: 1 }], [2.14, { o: 0 }]],
  };

  // Сколько секунд идёт каждый участок после жеста: T → время от T = 1
  const SCHEDULE = [[1, 0], [1.3, 0.38], [1.55, 0.7], [1.78, 1], [1.95, 1.35], [2.12, 1.65], [2.3, 1.95]];
  const TOUCH_AT = 0.1;
  const RELEASE_AT = 0.45;
  const BURST_AT = 2.08;
  const DONE_AT = 2.3;
  // Полный жест — чуть больше трети высоты сцены
  const SWIPE_SHARE = 0.38;
  const TAP_DISTANCE = 8;
  // Сколько пикселей прокрутки колесом равно полному жесту
  const WHEEL_TRAVEL = 700;
  const HINT_DELAY = 2600;
  const HINT_EVERY = 7000;

  // Монотонная кубическая интерполяция: движение проходит через кадры макета
  // без рывков на стыках и без выбросов за их значения
  function curve(times, values) {
    const count = times.length;
    const slopes = [];
    for (let i = 0; i < count - 1; i += 1) slopes.push((values[i + 1] - values[i]) / (times[i + 1] - times[i]));
    const tangents = times.map((_, i) => {
      if (i === 0 || i === count - 1) return 0;
      const before = slopes[i - 1];
      const after = slopes[i];
      if (before * after <= 0) return 0;
      const h0 = times[i] - times[i - 1];
      const h1 = times[i + 1] - times[i];
      const w1 = 2 * h1 + h0;
      const w2 = h1 + 2 * h0;
      return (w1 + w2) / (w1 / before + w2 / after);
    });

    return (time) => {
      if (time <= times[0]) return values[0];
      if (time >= times[count - 1]) return values[count - 1];
      let i = 0;
      while (time > times[i + 1]) i += 1;
      const h = times[i + 1] - times[i];
      const s = (time - times[i]) / h;
      const s2 = s * s;
      const s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * values[i]
        + (s3 - 2 * s2 + s) * h * tangents[i]
        + (-2 * s3 + 3 * s2) * values[i + 1]
        + (s3 - s2) * h * tangents[i + 1];
    };
  }

  // Переменные пишем прямо тем элементам, которые их читают. Запись на всю сцену заставляла
  // пересчитывать стили всех её потомков, включая тридцать иконок облака, на каждом кадре
  const TARGETS = {
    logo: ['.intro__logo'],
    hint: ['[data-intro-trigger]'],
    blob: ['.intro__blob'],
    touch: ['.intro__blob'],
    bubble: ['.intro__bubble'],
    glow: ['.intro__bubble'],
    title: ['[data-intro-title]', '.intro__bubble'],
    lens: ['.intro__bubble'],
  };

  const channels = [];
  Object.entries(TRACKS).forEach(([name, frames]) => {
    const times = frames.map(([time]) => time);
    const targets = TARGETS[name].map((selector) => stage.querySelector(selector));
    Object.keys(frames[0][1]).forEach((key) => {
      channels.push({
        property: `--${name}-${key}`,
        opacity: key === 'o',
        targets,
        sample: curve(times, frames.map(([, values]) => values[key])),
      });
    });
  });

  let time = 0;
  let state = 'idle';
  let burst = false;
  let frame = 0;
  // Куда тянет жест; сцена догоняет его плавно, без дрожи от пальца и шагов колеса
  let target = 0;

  function render(value) {
    time = value;
    channels.forEach((channel) => {
      const sampled = channel.sample(time);
      const value = (channel.opacity ? clamp(sampled, 0, 1) : sampled).toFixed(3);
      channel.targets.forEach((element) => element.style.setProperty(channel.property, value));
    });
    if (!burst && time >= BURST_AT) {
      burst = true;
      intro.classList.add('intro_burst');
    }
  }

  function setState(next) {
    state = next;
    intro.classList.toggle('intro_idle', state === 'idle');
    intro.classList.toggle('intro_playing', state === 'playing');
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function tween(duration, sample, onDone) {
    stop();
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      render(sample(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        if (onDone) onDone();
      }
    };
    frame = requestAnimationFrame(tick);
  }

  function follow() {
    const next = time + (target - time) * 0.3;
    render(Math.abs(target - next) < 0.0005 ? target : next);
    frame = requestAnimationFrame(follow);
  }

  function steer(value) {
    if (state !== 'dragging') {
      stop();
      setState('dragging');
    }
    target = clamp(value, 0, 1);
    if (!frame) frame = requestAnimationFrame(follow);
  }

  function finish(focusTitle) {
    setState('done');
    intro.classList.add('intro_burst', 'intro_done');
    if (focusTitle) title.focus({ preventScroll: true });
  }

  function play() {
    if (state === 'playing' || state === 'done') return;
    const focusTitle = document.activeElement === trigger;
    setState('playing');

    if (prefersReducedMotion()) {
      stop();
      render(DONE_AT);
      finish(focusTitle);
      return;
    }

    // Недотянутый жест добегает до конца за долю секунды, дальше идёт расписание
    const from = Math.max(time, target);
    const lead = (1 - from) * 0.45;
    const points = lead > 0.01 ? [[from, 0], ...SCHEDULE.map(([value, seconds]) => [value, seconds + lead])] : SCHEDULE;
    const seconds = points.map(([, at]) => at);
    const timeline = curve(seconds, points.map(([value]) => value));
    const total = seconds[seconds.length - 1];
    tween(total * 1000, (progress) => timeline(progress * total), () => finish(focusTitle));
  }

  function release() {
    if (target >= RELEASE_AT) {
      play();
      return;
    }
    const from = time;
    setState('idle');
    target = 0;
    tween(250 + from * 500, (progress) => from * Math.pow(1 - progress, 3));
  }

  // Палец или мышь: тянем вверх, отпустили за порогом — доигрываем, короткое касание тоже запускает
  let pointer = null;

  intro.addEventListener('pointerdown', (event) => {
    if (state === 'playing' || state === 'done' || !event.isPrimary || event.button !== 0) return;
    const base = Math.max(time, TOUCH_AT);
    pointer = {
      id: event.pointerId,
      startY: event.clientY,
      startTime: performance.now(),
      distance: 0,
      base,
      travel: stage.getBoundingClientRect().height * SWIPE_SHARE,
    };
    intro.setPointerCapture(event.pointerId);
    steer(base);
  });

  intro.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const shift = pointer.startY - event.clientY;
    pointer.distance = Math.max(pointer.distance, Math.abs(shift));
    steer(pointer.base + shift / pointer.travel);
  });

  function endPointer(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const tap = event.type === 'pointerup'
      && pointer.distance < TAP_DISTANCE
      && performance.now() - pointer.startTime < 500;
    pointer = null;
    if (tap) {
      play();
      return;
    }
    release();
  }

  intro.addEventListener('pointerup', endPointer);
  intro.addEventListener('pointercancel', endPointer);

  // Колесо и тачпад: прокрутка вниз работает как жест вверх
  let wheelTimer = 0;
  intro.addEventListener('wheel', (event) => {
    if (state === 'playing' || state === 'done') return;
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    steer(Math.max(state === 'dragging' ? target : time, TOUCH_AT) + delta / WHEEL_TRAVEL);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      if (state === 'dragging' && !pointer) release();
    }, 220);
  }, { passive: false });

  // Клавиатура: кнопка-подсказка и стрелка вверх запускают всю сцену
  trigger.addEventListener('click', (event) => {
    if (event.detail === 0) play();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && state === 'idle') {
      event.preventDefault();
      play();
    }
  });

  // Пока сцену не трогают, капля иногда сама вздрагивает — подсказка, что её можно тянуть
  function hint() {
    if (state !== 'idle' || prefersReducedMotion()) return;
    tween(1300, (progress) => Math.sin(progress * Math.PI) * 0.16);
  }

  render(0);
  setState('idle');
  window.setTimeout(function repeat() {
    hint();
    if (state !== 'done') window.setTimeout(repeat, HINT_EVERY);
  }, HINT_DELAY);
})();
