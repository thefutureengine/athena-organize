/**
 * BeforeAfterSlider component.
 * Drag-to-reveal slider comparing a before and after image.
 * Uses clip-path for pixel-perfect clipping without image distortion.
 * White 4px divider line with circular handle.
 *
 * @param {string} beforeUrl - URL or data-URI for the "before" image
 * @param {string} afterUrl  - URL or data-URI for the "after" image
 * @returns {HTMLElement}
 */
export function createBeforeAfterSlider(beforeUrl, afterUrl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'before-after-slider';

  wrapper.innerHTML = `
    <div class="bas__container" role="img" aria-label="Before and after comparison slider">
      <!-- After image (full width, underneath) -->
      <img class="bas__img bas__img--after" src="${afterUrl}" alt="After organization" draggable="false" />
      <!-- Before image (clipped on the right) -->
      <img class="bas__img bas__img--before" src="${beforeUrl}" alt="Before organization" draggable="false" />
      <!-- Divider + handle -->
      <div class="bas__divider" role="slider" aria-label="Comparison slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
        <div class="bas__handle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l-5-6 5-6" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 6l5 6-5 6" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="bas__labels" aria-hidden="true">
      <span class="bas__label">Before</span>
      <span class="bas__label">After</span>
    </div>
  `;

  const container = wrapper.querySelector('.bas__container');
  const beforeImg = wrapper.querySelector('.bas__img--before');
  const divider = wrapper.querySelector('.bas__divider');

  let isDragging = false;
  let percentage = 50;

  function setPosition(pct) {
    percentage = Math.min(97, Math.max(3, pct));
    // Clip-path hides the right portion of the before image
    beforeImg.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    divider.style.left = `${percentage}%`;
    divider.setAttribute('aria-valuenow', String(Math.round(percentage)));
  }

  function getPercent(clientX) {
    const rect = container.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // Initialize
  setPosition(50);

  // Mouse events
  divider.addEventListener('mousedown', e => {
    isDragging = true;
    e.preventDefault();
  });
  container.addEventListener('mousedown', e => {
    isDragging = true;
    setPosition(getPercent(e.clientX));
    e.preventDefault();
  });

  // Touch events
  divider.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });
  container.addEventListener('touchstart', e => {
    isDragging = true;
    setPosition(getPercent(e.touches[0].clientX));
  }, { passive: true });

  // Keyboard accessibility
  divider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { setPosition(percentage - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPosition(percentage + 5); e.preventDefault(); }
  });

  // Global move/end listeners
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    setPosition(getPercent(e.clientX));
  });
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    setPosition(getPercent(e.touches[0].clientX));
  }, { passive: true });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  return wrapper;
}
