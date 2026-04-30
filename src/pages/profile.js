/**
 * Profile page — display name, email, theme preference.
 * Reads and writes to localStorage under the key 'athena_profile'.
 * @param {HTMLElement} container
 */
export function renderProfile(container) {
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('athena_profile') || '{}'); }
    catch { return {}; }
  })();

  const profile = {
    name:  stored.name  || '',
    email: stored.email || '',
    theme: stored.theme || 'dark',
  };

  container.innerHTML = `
    <div class="page page--profile">
      <header class="page-header page-header--static">
        <h2 class="page-header__title">Profile</h2>
      </header>

      <div class="profile__body">
        <!-- Avatar -->
        <div class="profile__avatar-section">
          <div class="profile__avatar" id="profileAvatarDisplay" aria-hidden="true">
            ${profile.name ? escapeHtml(profile.name[0].toUpperCase()) : 'A'}
          </div>
          <p class="profile__avatar-hint">Your Organization Profile</p>
        </div>

        <!-- Edit form -->
        <div class="card profile__form">
          <div class="form-group">
            <label class="form-label" for="profileName">Name</label>
            <input
              class="form-input"
              id="profileName"
              type="text"
              value="${escapeAttr(profile.name)}"
              placeholder="Your name"
              autocomplete="name"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="profileEmail">Email</label>
            <input
              class="form-input"
              id="profileEmail"
              type="email"
              value="${escapeAttr(profile.email)}"
              placeholder="your@email.com"
              autocomplete="email"
              inputmode="email"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="themeSelect">Theme</label>
            <select class="form-select" id="themeSelect">
              <option value="dark"  ${profile.theme === 'dark'  ? 'selected' : ''}>Dark (Default)</option>
              <option value="light" ${profile.theme === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </div>
          <button class="btn btn--primary btn--full" id="saveProfileBtn" type="button">
            Save Profile
          </button>
        </div>

        <!-- Account info -->
        <div class="card">
          <p class="profile__stats-title">Account Info</p>
          <div class="profile__stat-row">
            <span class="profile__stat-label">App Version</span>
            <span class="profile__stat-value">1.0.0</span>
          </div>
          <div class="profile__stat-row">
            <span class="profile__stat-label">Data Storage</span>
            <span class="profile__stat-value">Supabase Cloud</span>
          </div>
          <div class="profile__stat-row">
            <span class="profile__stat-label">Auth</span>
            <span class="profile__stat-value">Anonymous</span>
          </div>
          <div class="profile__stat-row">
            <span class="profile__stat-label">AI Engine</span>
            <span class="profile__stat-value">Claude + DALL-E 3</span>
          </div>
        </div>

        <!-- Data actions -->
        <div class="card">
          <p class="profile__stats-title">Data</p>
          <button class="btn btn--ghost btn--full" id="clearSessionBtn" style="margin-top:4px;">
            Clear Session Data
          </button>
        </div>
      </div>
    </div>
  `;

  // Update avatar initial live as user types
  document.getElementById('profileName').addEventListener('input', e => {
    const val = e.target.value.trim();
    document.getElementById('profileAvatarDisplay').textContent = val ? val[0].toUpperCase() : 'A';
  });

  // Save profile to localStorage
  document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name  = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const theme = document.getElementById('themeSelect').value;

    localStorage.setItem('athena_profile', JSON.stringify({ name, email, theme }));

    const btn = document.getElementById('saveProfileBtn');
    const original = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.classList.add('btn--success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('btn--success');
    }, 2200);
  });

  // Clear session storage data
  document.getElementById('clearSessionBtn').addEventListener('click', () => {
    if (confirm('Clear all temporary session data (analysis results, captured images)? Saved projects in Supabase are not affected.')) {
      sessionStorage.clear();
      alert('Session data cleared.');
    }
  });
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
