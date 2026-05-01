/**
 * Athena Logo — a geometric stylized owl inspired by the owl of Athena
 * on classical Athenian coinage. Works at any size; pass size prop (default 24).
 * The owl face is frontal, eyes are the dominant feature, with a subtle
 * laurel/feather crown and geometric wing silhouette.
 *
 * @param {Object} opts
 * @param {number} [opts.size=24]   - width/height in px
 * @param {string} [opts.color='#E91E63']  - primary accent colour
 * @param {string} [opts.neutral='#f5f5f5'] - secondary/body colour
 * @returns {SVGElement}
 */
export function Logo({ size = 24, color = '#E91E63', neutral = '#f5f5f5' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';

  // We design on a 64×64 grid and scale via viewBox
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-label', 'Athena logo');
  svg.setAttribute('role', 'img');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('xmlns', ns);

  svg.innerHTML = `
    <!-- ── Outer circle / coin border ────────────────────────────── -->
    <circle cx="32" cy="32" r="31" fill="#1a1a1a" stroke="${color}" stroke-width="2"/>

    <!-- ── Wings (geometric trapezoids, either side of body) ─────── -->
    <path d="M10 44 L18 28 L22 44 Z" fill="${neutral}" opacity="0.18"/>
    <path d="M54 44 L46 28 L42 44 Z" fill="${neutral}" opacity="0.18"/>

    <!-- ── Body ──────────────────────────────────────────────────── -->
    <ellipse cx="32" cy="42" rx="10" ry="11" fill="${neutral}" opacity="0.12"/>
    <ellipse cx="32" cy="42" rx="10" ry="11" stroke="${neutral}" stroke-width="1" opacity="0.3"/>

    <!-- ── Facial disc ───────────────────────────────────────────── -->
    <ellipse cx="32" cy="33" rx="14" ry="15" fill="#242424" stroke="${neutral}" stroke-width="1.2" opacity="0.9"/>

    <!-- ── Ear tufts ─────────────────────────────────────────────── -->
    <path d="M22 20 L24 14 L27 20 Z" fill="${color}"/>
    <path d="M42 20 L40 14 L37 20 Z" fill="${color}"/>

    <!-- ── Left eye ──────────────────────────────────────────────── -->
    <circle cx="25" cy="32" r="7" fill="#1a1a1a" stroke="${color}" stroke-width="1.5"/>
    <circle cx="25" cy="32" r="4.5" fill="${color}" opacity="0.15"/>
    <circle cx="25" cy="32" r="3" fill="${color}"/>
    <circle cx="26.5" cy="30.5" r="1" fill="${neutral}" opacity="0.8"/>

    <!-- ── Right eye ─────────────────────────────────────────────── -->
    <circle cx="39" cy="32" r="7" fill="#1a1a1a" stroke="${color}" stroke-width="1.5"/>
    <circle cx="39" cy="32" r="4.5" fill="${color}" opacity="0.15"/>
    <circle cx="39" cy="32" r="3" fill="${color}"/>
    <circle cx="40.5" cy="30.5" r="1" fill="${neutral}" opacity="0.8"/>

    <!-- ── Beak ───────────────────────────────────────────────────── -->
    <path d="M29.5 38 L32 43 L34.5 38 Z" fill="${color}" opacity="0.85"/>

    <!-- ── Crown / laurel motif (3 stylized leaves) ──────────────── -->
    <path d="M28 19 Q26 14 22 15 Q24 20 28 19 Z" fill="${color}" opacity="0.6"/>
    <path d="M32 18 Q32 12 32 12 Q32 12 32 18 Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M36 19 Q38 14 42 15 Q40 20 36 19 Z" fill="${color}" opacity="0.6"/>

    <!-- ── Feet (tiny) ────────────────────────────────────────────── -->
    <path d="M27 52 L25 56 M27 52 L27 56 M27 52 L29 56" stroke="${neutral}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    <path d="M37 52 L35 56 M37 52 L37 56 M37 52 L39 56" stroke="${neutral}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  `;

  return svg;
}

/**
 * Returns an SVG string (for use in innerHTML / img src data URLs)
 */
export function logoSVGString({ size = 64, color = '#E91E63', neutral = '#f5f5f5' } = {}) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Athena logo" role="img">
    <circle cx="32" cy="32" r="31" fill="#1a1a1a" stroke="${color}" stroke-width="2"/>
    <path d="M10 44 L18 28 L22 44 Z" fill="${neutral}" opacity="0.18"/>
    <path d="M54 44 L46 28 L42 44 Z" fill="${neutral}" opacity="0.18"/>
    <ellipse cx="32" cy="42" rx="10" ry="11" fill="${neutral}" opacity="0.12"/>
    <ellipse cx="32" cy="42" rx="10" ry="11" stroke="${neutral}" stroke-width="1" opacity="0.3"/>
    <ellipse cx="32" cy="33" rx="14" ry="15" fill="#242424" stroke="${neutral}" stroke-width="1.2" opacity="0.9"/>
    <path d="M22 20 L24 14 L27 20 Z" fill="${color}"/>
    <path d="M42 20 L40 14 L37 20 Z" fill="${color}"/>
    <circle cx="25" cy="32" r="7" fill="#1a1a1a" stroke="${color}" stroke-width="1.5"/>
    <circle cx="25" cy="32" r="4.5" fill="${color}" opacity="0.15"/>
    <circle cx="25" cy="32" r="3" fill="${color}"/>
    <circle cx="26.5" cy="30.5" r="1" fill="${neutral}" opacity="0.8"/>
    <circle cx="39" cy="32" r="7" fill="#1a1a1a" stroke="${color}" stroke-width="1.5"/>
    <circle cx="39" cy="32" r="4.5" fill="${color}" opacity="0.15"/>
    <circle cx="39" cy="32" r="3" fill="${color}"/>
    <circle cx="40.5" cy="30.5" r="1" fill="${neutral}" opacity="0.8"/>
    <path d="M29.5 38 L32 43 L34.5 38 Z" fill="${color}" opacity="0.85"/>
    <path d="M28 19 Q26 14 22 15 Q24 20 28 19 Z" fill="${color}" opacity="0.6"/>
    <path d="M32 18 Q32 12 32 12 Q32 12 32 18 Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M36 19 Q38 14 42 15 Q40 20 36 19 Z" fill="${color}" opacity="0.6"/>
    <path d="M27 52 L25 56 M27 52 L27 56 M27 52 L29 56" stroke="${neutral}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    <path d="M37 52 L35 56 M37 52 L37 56 M37 52 L39 56" stroke="${neutral}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  </svg>`;
}
