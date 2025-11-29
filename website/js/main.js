// Robust navbar loader + helpers
// --------------------------------------------------
// Utility: show/clear messages (kept for compatibility)
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

// computeBase and relative prefix helpers (kept to support your link normalization logic)
function computeBase() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('website');
  if (idx !== -1) return '/' + parts.slice(0, idx + 1).join('/');
  return '';
}
function computeRelativePrefixes() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const compIdx = parts.indexOf('components');
  const toWebsiteRoot = './';
  const toComponentsRoot = './components/';
  if (compIdx === -1) return { toWebsiteRoot, toComponentsRoot };
  const depthAfterComponents = parts.length - compIdx;
  const upsToComponentsRoot = Math.max(0, depthAfterComponents - 2);
  const upsToWebsiteRoot = Math.max(0, depthAfterComponents - 1);
  return {
    toWebsiteRoot: '../'.repeat(upsToWebsiteRoot) || './',
    toComponentsRoot: '../'.repeat(upsToComponentsRoot) + 'components/'
  };
}

// normalizeNavbarLinksToComponents: adjusts anchor hrefs inside injected navbar so they point to component pages
function normalizeNavbarLinksToComponents() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const anchors = navbar.querySelectorAll('a[href]');
  if (!anchors.length) return;
  const base = computeBase();
  const prefixes = computeRelativePrefixes();
  const pageFiles = new Set(['login.html','signup.html','menu.html','profile.html','restaurants.html','contact.html','forget.html','dashboard.html']);
  anchors.forEach(a => {
    const rawHref = (a.getAttribute('href') || '').trim();
    if (!rawHref) return;
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(rawHref)) return;
    if (/^[a-zA-Z]:\\/.test(rawHref)) return;
    const q = rawHref.indexOf('?');
    const h = rawHref.indexOf('#');
    let splitAt = -1;
    if (q !== -1 && h !== -1) splitAt = Math.min(q, h);
    else splitAt = Math.max(q, h);
    const hrefWithoutExtras = splitAt === -1 ? rawHref : rawHref.slice(0, splitAt);
    const extras = splitAt === -1 ? '' : rawHref.slice(splitAt);
    let cleaned = hrefWithoutExtras.replace(/^\.?\//, '').replace(/^\/+/, '');
    if (!cleaned || cleaned === 'index' || cleaned === 'index.html') {
      a.setAttribute('href', base ? `${base}/index.html${extras}` : `${prefixes.toWebsiteRoot}index.html${extras}`);
      return;
    }
    const parts = cleaned.split('/');
    const basename = parts[parts.length - 1].toLowerCase();
    if (pageFiles.has(basename) || pageFiles.has(basename.replace('.html',''))) {
      const name = basename.endsWith('.html') ? basename : basename + '.html';
      const folder = name.replace('.html', '');
      if (base) {
        a.setAttribute('href', `${base}/components/${folder}/${name}${extras}`);
      } else {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const compIdxNow = pathParts.indexOf('components');
        if (compIdxNow === -1) {
          a.setAttribute('href', `${prefixes.toComponentsRoot}${folder}/${name}${extras}`);
        } else {
          const depthAfterComponents = pathParts.length - compIdxNow;
          const ups = Math.max(0, depthAfterComponents - 2);
          a.setAttribute('href', `${'../'.repeat(ups)}${folder}/${name}${extras}`);
        }
      }
      return;
    }
    if (base) {
      a.setAttribute('href', `${base}/${cleaned}${extras}`);
    } else {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const compIdxNow = pathParts.indexOf('components');
      if (compIdxNow === -1) {
        a.setAttribute('href', `${prefixes.toWebsiteRoot}${cleaned}${extras}`);
      } else {
        const depthAfterComponents = pathParts.length - compIdxNow;
        const ups = Math.max(0, depthAfterComponents - 1);
        a.setAttribute('href', `${'../'.repeat(ups)}${cleaned}${extras}`);
      }
    }
  });
}

// dirnameFromPath + simple resolver fallback (kept but prefer new URL when possible)
function dirnameFromPath(path) {
  if (!path) return '';
  return path.replace(/\/[^\/]*$/, '');
}
function resolveRelativeTo(fromDir, raw) {
  if (!raw) return raw;
  if (/^(https?:\/\/|\/\/|data:|mailto:|tel:|#)/i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  const base = fromDir || './';
  try {
    return new URL(raw, base).href;
  } catch (e) {
    const stack = (base + '/' + raw).split('/');
    const out = [];
    for (let i = 0; i < stack.length; i++) {
      const part = stack[i];
      if (part === '' || part === '.') continue;
      if (part === '..') {
        if (out.length) out.pop();
        continue;
      }
      out.push(part);
    }
    return out.length ? './' + out.join('/') : './';
  }
}

// This function will resolve using new URL (preferred) but fall back gracefully.
function resolveWithBase(raw, baseUrl) {
  if (!raw) return raw;
  if (/^(https?:|\/\/|data:|mailto:|tel:|#)/i.test(raw)) return raw;
  try { return new URL(raw, baseUrl).href; } catch(e) { return resolveRelativeTo(dirnameFromPath(baseUrl || ''), raw); }
}

// Normalize images, styles, scripts inside the injected navbar fragment.
// Ensures styles are appended to document head; resolves relative paths to the fetched base URL.
function normalizeNavbarResources(navbarElement, navbarFetchUrl) {
  if (!navbarElement || !navbarFetchUrl) return;
  const head = document.head || document.getElementsByTagName('head')[0];

  // images
  navbarElement.querySelectorAll('img[src]').forEach(img => {
    const raw = (img.getAttribute('src') || '').trim();
    if (!raw) return;
    if (/^(https?:\/\/|data:|\/\/)/i.test(raw)) return;
    img.setAttribute('src', resolveWithBase(raw, navbarFetchUrl));
  });

  // styles: gather hrefs, remove link nodes from fragment, append resolved to document head
  const cssHrefs = [];
  navbarElement.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
    const raw = (link.getAttribute('href') || '').trim();
    link.remove();
    if (!raw) return;
    if (/^(https?:\/\/|\/\/)/i.test(raw)) {
      cssHrefs.push(raw);
    } else {
      cssHrefs.push(resolveWithBase(raw, navbarFetchUrl));
    }
  });
  cssHrefs.forEach(href => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    head.appendChild(l);
  });

  // scripts: resolve relative src attributes so if later appended they will fetch correctly
  navbarElement.querySelectorAll('script[src]').forEach(s => {
    const raw = (s.getAttribute('src') || '').trim();
    if (!raw) return;
    if (/^(https?:\/\/|\/\/)/i.test(raw)) return;
    s.setAttribute('src', resolveWithBase(raw, navbarFetchUrl));
  });
}

// When a fragment contains inline <script> tags, setting innerHTML won't execute them.
// This helper will find inline scripts and re-create them so they execute.
function executeInlineScripts(container) {
  const inlineScripts = [];
  container.querySelectorAll('script').forEach(script => {
    const src = script.getAttribute('src');
    if (src) {
      // skip external scripts here; they remain in DOM and will be handled if needed
      return;
    }
    inlineScripts.push(script.textContent || script.innerText || '');
    script.remove();
  });
  inlineScripts.forEach(code => {
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.text = code;
    document.body.appendChild(s);
    // Optionally remove after execution
    setTimeout(() => { document.body.removeChild(s); }, 0);
  });
}

// init navbar interactive behaviors (hamburger toggle, click-outside)
function initNavbarFunctions() {
  const hamburger = document.getElementById('hamburgerBtn');
  const navMenu = document.querySelector('.main-nav');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', (ev) => {
      ev.stopPropagation();
      navMenu.classList.toggle('open');
      const expanded = navMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(expanded));
    });
  }
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

// Try an array of possible paths; return first successful response.text() + res.url
async function fetchFirst(paths = []) {
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res && res.ok) {
        const html = await res.text();
        return { html, baseUrl: res.url };
      }
    } catch (e) {
      // try next
    }
  }
  throw new Error('None of the navbar paths worked');
}

// Determine candidate navbar paths to try based on current location
function candidateNavbarPaths() {
  // common candidates (relative + absolute-ish)
  const candidates = [
    './components/navbar/navbar.html',
    'components/navbar/navbar.html',
    './navbar/navbar.html',
    './components/navbar.html',
    '/website/components/navbar/navbar.html',
    '/components/navbar/navbar.html'
  ];
  return candidates;
}

// Main loader: fetch, inject, normalize, init
window.addEventListener('DOMContentLoaded', async () => {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  try {
    const candidates = candidateNavbarPaths();
    const { html, baseUrl } = await fetchFirst(candidates);
    // create a temp container to parse safely
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // normalize resource references in the fragment
    normalizeNavbarResources(temp, baseUrl);

    // move parsed fragment into actual container
    navbarContainer.innerHTML = temp.innerHTML;

    // execute inline scripts that were in the fragment
    executeInlineScripts(navbarContainer);

    // normalize links to component pages (this logic depends on your site layout)
    normalizeNavbarLinksToComponents();

    // init UI behaviors (hamburger, click-close)
    initNavbarFunctions();
  } catch (err) {
    console.error('Navbar load error:', err);
    // Optionally inform users visually:
    // showMessage(document.getElementById('someMsgEl'), 'Navbar failed to load', 'error');
  }

  // year in footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // expose helpers if other scripts need them
  window.sfHelpers = {
    showMessage,
    clearMessage,
    validateEmail,
    validatePhone
  };
});
