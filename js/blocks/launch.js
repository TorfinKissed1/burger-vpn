// «Потяни, чтобы включить»: ручку VPN тянут вправо, после конца дорожки открывается окно подключения.
(function () {
  'use strict';

  const section = document.querySelector('[data-launch]');
  if (!section) return;

  const { clamp, modal } = window.Burger;
  const track = section.querySelector('[data-swipe]');
  const knob = section.querySelector('[data-swipe-knob]');
  const DONE_AT = 0.8;
  const CLICK_TOLERANCE = 6;

  let dragging = false;
  let startX = 0;
  let shift = 0;
  let moved = 0;
  let completed = false;

  const maxShift = () => {
    const padding = parseFloat(getComputedStyle(track).paddingLeft) * 2;
    return track.clientWidth - knob.offsetWidth - padding;
  };

  function setShift(value) {
    shift = value;
    const max = maxShift();
    track.style.setProperty('--drag', `${shift}px`);
    track.style.setProperty('--progress', max > 0 ? (shift / max).toFixed(3) : '0');
  }

  function reset() {
    completed = false;
    track.classList.remove('launch__switch_done');
    setShift(0);
  }

  function complete() {
    if (completed) return;
    completed = true;
    track.classList.add('launch__switch_done');
    setShift(maxShift());
    window.setTimeout(() => modal.open('activation', { source: 'launch' }), 420);
  }

  knob.addEventListener('pointerdown', (event) => {
    if (completed || event.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = event.clientX - shift;
    knob.setPointerCapture(event.pointerId);
    track.classList.add('launch__switch_dragging');
  });

  knob.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const next = clamp(event.clientX - startX, 0, maxShift());
    moved = Math.max(moved, Math.abs(next - shift));
    setShift(next);
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('launch__switch_dragging');
    const max = maxShift();
    if (max > 0 && shift / max >= DONE_AT) complete();
    else if (moved > CLICK_TOLERANCE) setShift(0);
  }

  knob.addEventListener('pointerup', endDrag);
  knob.addEventListener('pointercancel', endDrag);

  // Нажатие без перетаскивания (мышь, тап, Enter/Space) тоже включает
  knob.addEventListener('click', () => {
    if (moved > CLICK_TOLERANCE) {
      moved = 0;
      return;
    }
    complete();
  });

  document.getElementById('activation').addEventListener('modal:close', () => {
    if (completed) window.setTimeout(reset, 300);
  });

  window.addEventListener('resize', () => {
    if (completed) setShift(maxShift());
  });
})();
