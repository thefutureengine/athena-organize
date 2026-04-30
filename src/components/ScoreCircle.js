/**
 * ScoreCircle component.
 * SVG-based circular progress indicator (0–100).
 * Pink (#E91E63) stroke animates from 0 to the target value over 800ms.
 *
 * @param {number} score - Organization efficiency score 0–100
 * @returns {HTMLElement}
 */
export function createScoreCircle(score) {
  const SIZE = 160;
  const RADIUS = 62;
  const STROKE_WIDTH = 10;
  const CENTER = SIZE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  const wrapper = document.createElement('div');
  wrapper.className = 'score-circle-wrapper';

  wrapper.innerHTML = `
    <svg
      class="score-circle-svg"
      width="${SIZE}"
      height="${SIZE}"
      viewBox="0 0 ${SIZE} ${SIZE}"
      aria-label="Organization score: ${clampedScore} out of 100"
      role="img"
    >
      <!-- Track ring -->
      <circle
        cx="${CENTER}" cy="${CENTER}" r="${RADIUS}"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        stroke-width="${STROKE_WIDTH}"
      />
      <!-- Progress arc -->
      <circle
        class="score-circle__arc"
        cx="${CENTER}" cy="${CENTER}" r="${RADIUS}"
        fill="none"
        stroke="#E91E63"
        stroke-width="${STROKE_WIDTH}"
        stroke-linecap="round"
        stroke-dasharray="${CIRCUMFERENCE}"
        stroke-dashoffset="${CIRCUMFERENCE}"
        transform="rotate(-90 ${CENTER} ${CENTER})"
      />
    </svg>
    <div class="score-circle__overlay">
      <span class="score-circle__number" aria-hidden="true">0</span>
      <span class="score-circle__label">Score</span>
    </div>
  `;

  // Animate after first paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      const arc = wrapper.querySelector('.score-circle__arc');
      const numEl = wrapper.querySelector('.score-circle__number');

      const targetOffset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;
      arc.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)';
      arc.style.strokeDashoffset = String(targetOffset);

      // Animate the number counter
      const DURATION = 800;
      const startTime = performance.now();
      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = String(Math.round(eased * clampedScore));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 80);
  });

  return wrapper;
}
