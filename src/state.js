/**
 * Global application state — a plain JS object shared across pages.
 * No framework reactivity needed; pages read/write directly and
 * trigger their own DOM updates.
 */
export const state = {
  /** Base64-encoded JPEG of the currently captured photo (no data-URL prefix) */
  currentPhoto: null,

  /** Analysis result from analyze-photo function: { score, issues, summary } */
  analysis: null,

  /** Array of product objects from search-products function */
  recommendations: [],

  /** DALL-E 3 generated "after" image URL */
  afterImageUrl: null,

  /** Supabase project ID after save */
  projectId: null,
};
