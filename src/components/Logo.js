/**
 * Athena Logo — a clean monogram "A" inspired by classical Greek
 * letterforms. Designed to read clearly at avatar size (24px) and
 * still look elegant at icon size (192px+).
 *
 * @param {Object} opts
 * @param {number} [opts.size=24]
 * @param {string} [opts.color='#E91E63']
 * @param {string} [opts.neutral='#f5f5f5']  // unused but kept for API compat
 * @returns {SVGElement}
 */
export function Logo({ size = 24, color = '#E91E63' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-label', 'Athena');
  svg.setAttribute('role', 'img');
  svg.setAttribute('fill', 'none');

  svg.innerHTML = `
    <!-- Outer ring frame -->
    <circle cx="32" cy="32" r="30" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.85"/>

    <!-- Stylized capital A — pediment + crossbar -->
    <path d="M16 48 L32 14 L48 48"
          fill="none"
          stroke="${color}"
          stroke-width="3.5"
          stroke-linejoin="round"
          stroke-linecap="round"/>

    <!-- Crossbar -->
    <line x1="22" y1="37" x2="42" y2="37"
          stroke="${color}"
          stroke-width="2.5"
          stroke-linecap="round"/>

    <!-- Apex accent dot (classical diacritical / star above the A) -->
    <circle cx="32" cy="8" r="1.6" fill="${color}" opacity="0.9"/>
  `;

  return svg;
}

/** SVG string variant for use in innerHTML / data URLs. */
export function logoSVGString({ size = 64, color = '#E91E63' } = {}) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Athena" role="img">
    <circle cx="32" cy="32" r="30" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.85"/>
    <path d="M16 48 L32 14 L48 48" fill="none" stroke="${color}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
    <line x1="22" y1="37" x2="42" y2="37" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="8" r="1.6" fill="${color}" opacity="0.9"/>
  </svg>`;
}
