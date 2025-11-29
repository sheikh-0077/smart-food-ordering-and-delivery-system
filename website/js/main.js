// main.js — Navbar loader + normalizer for pages in website/components/
// ---------------------------------------------------------------------

/* =========================
   Helpers: messages & validators
   ========================= */

function showMessage(targetEl, msg, type = "info") {
  if (!targetEl) return;
  targetEl.style.display = "block";
  targetEl.style.padding = "0.75rem";
  targetEl.style.marginTop = "0.6rem";
  targetEl.style.borderRadius = "8px";
  targetEl.style.fontWeight = "600";

  if (type === "error") {
    targetEl.style.background = "#f8d7da";
    targetEl.style.color = "#842029";
  } else if (type === "success") {
    targetEl.style.background = "#d1e7dd";
    targetEl.style.color = "#0f5132";
  } else {
    targetEl.style.background = "#e7eaf0";
    targetEl.style.color = "#333";
  }

  targetEl.textContent = msg;
}

function clearMessage(targetEl) {
  if (!targetEl) return;
  targetEl.style.display = "none";
  targetEl.textContent = "";
}

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function validatePhone(phone) {
  return /^\+?[0-9\-\s]{7,15}$/.test(phone);
}

/* =========================
   Compute base (tries to detect '/website' in URL)
   If your dev server exposes the site under '/website', we use that.
   Otherwise base becomes '' (relative root).
   ========================= */
function computeBase() {
  // If pathname has '/website' segment, use '/website' as base (keeps absolute rewrites predictable)
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('website');
  if (idx !== -1) {
    return '/' + parts.slice(0, idx + 1).join('/');
  }
  // fallback: empty string -> keep relative paths (useful for file:// or different servers)
  return '';
}

/* =========================
   getNavbarPath() — deterministic path using computed base
   ========================= */
function getNavbarPath() {
  const base = computeBase(); // e.g. '/website' or ''
  // navbar lives at /website/components/navbar.html or ./components/navbar.html (when base === '')
  return base ? `${base}/components/navbar.html` : './components/navbar.html';
}

/* =========================
   DOMContentLoaded bootstrap
   ========================= */
window.addEventListener('DOMContentLoaded', () => {
  const navbarContainer = document.getElementById('navbar');
  const navbarPath = getNavbarPath();

  if (navbarContainer) {
    fetch(navbarPath)
      .then(res => {
        if (!res.ok) throw new Error(`Navbar not found at ${navbarPath} (status ${res.status})`);
        return res.text();
      })
      .then(html => {
        navbarContainer.innerHTML = html;
        initNavbarFunctions();
        // normalize links after navbar is injected
        normalizeNavbarLinksToComponents();
      })
      .catch(err => {
        console.error('Navbar failed to load:', err);
        // optionally show a small fallback UI in navbarContainer
      });
  }

  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

/* =========================
   Mobile menu toggling
   ========================= */
function initNavbarFunctions() {
  const hamburger = document.getElementById('hamburgerBtn');
  const navMenu = document.querySelector('.main-nav');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', (ev) => {
      ev.stopPropagation(); // prevent immediate document click interference
      navMenu.classList.toggle('open');
      const expanded = navMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(expanded));
    });
  }

  // close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    const nav = document.querySelector('.main-nav');
    const ham = document.getElementById('hamburgerBtn');
    if (!nav || !ham) return;
    if (!nav.contains(e.target) && !ham.contains(e.target)) {
      nav.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    }
  });
}

/* =========================
   normalizeNavbarLinksToComponents()
   Rewrites navbar links so that known page links point to:
     <base>/components/<page>.html
   Resource links (css/js/images) are rewritten to <base>/<path>
   This function is defensive and preserves query/hash fragments.
   ========================= */

function normalizeNavbarLinksToComponents() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const anchors = navbar.querySelectorAll('a[href]');
  if (!anchors || anchors.length === 0) return;

  const base = computeBase(); // computed earlier
  // Known page filenames that live inside website/components/
  const pageFiles = new Set([
    'login.html','signup.html','menu.html','profile.html','restaurants.html',
    'contact.html','forget.html','dashboard.html','index.html','index'
  ]);

  anchors.forEach(a => {
    const rawHref = a.getAttribute('href') || '';
    // preserve full external links and mailto/tel and hash-only anchors
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(rawHref)) return;

    // split off query/hash to preserve them when rewriting
    let [hrefWithoutHash, hashAndQuery] = rawHref.split(/(#|\?)/, 2).reduce((acc, part, idx, arr) => {
      // this is a little manual: we want to preserve ?... and #... exactly
      return idx === 0 ? [part, arr.slice(1).join('')] : acc;
    }, [rawHref, '']);
    // Simpler approach: use URL when possible (but relative URLs need base)
    // We'll normalize path manually:
    let cleaned = hrefWithoutHash.replace(/^\.?\//, '').replace(/^\/+/, '');

    // If empty -> treat as index
    if (cleaned === '' || cleaned.toLowerCase() === 'index' || cleaned === 'index.html') {
      const newHref = base ? `${base}/index.html` : './index.html';
      a.setAttribute('href', newHref + (hashAndQuery ? hashAndQuery : ''));
      return;
    }

    const parts = cleaned.split('/');
    const basename = parts[parts.length - 1];

    // If basename is a known page file (with or w/o .html)
    if (pageFiles.has(basename.toLowerCase())) {
      // ensure .html extension if necessary
      const nameWithExt = basename.toLowerCase().endsWith('.html') ? basename : `${basename}.html`;
      const newHref = base ? `${base}/components/${nameWithExt}` : `./components/${nameWithExt}`;
      a.setAttribute('href', newHref + (hashAndQuery ? hashAndQuery : ''));
      return;
    }

    // Otherwise treat as resource and keep path under base (preserve nested folders)
    const resourceHref = base ? `${base}/${cleaned}` : `./${cleaned}`;
    a.setAttribute('href', resourceHref + (hashAndQuery ? hashAndQuery : ''));
  });
}

/* =========================
   Expose helpers globally
   ========================= */
window.sfHelpers = {
  showMessage,
  clearMessage,
  validateEmail,
  validatePhone
};
