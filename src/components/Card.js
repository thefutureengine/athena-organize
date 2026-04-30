/**
 * Reusable Card component.
 * Creates a styled card element with optional extra CSS classes.
 *
 * @param {string|HTMLElement} content - HTML string or DOM element to place inside
 * @param {string} [extraClass=''] - Additional CSS class names
 * @returns {HTMLElement}
 */
export function createCard(content = '', extraClass = '') {
  const card = document.createElement('div');
  card.className = ['card', extraClass].filter(Boolean).join(' ');

  if (typeof content === 'string') {
    card.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    card.appendChild(content);
  }

  return card;
}
