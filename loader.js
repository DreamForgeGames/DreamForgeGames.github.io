/* loader.js
   Client-side router for clean URLs:
   - maps pathnames to /pages/<slug>.html
   - intercepts internal links and uses history API
   - supports ?p=/original/path (for 404->index redirect hosts like GitHub Pages)
*/

(function () {
  const DEBUG = true;
  const log = (...a) => { if (DEBUG) console.log('[loader]', ...a); };
  const warn = (...a) => { if (DEBUG) console.warn('[loader]', ...a); };

  // Determine the path we should render:
  // priority: query param 'p' (used by 404 redirect) -> location.pathname
  function getRequestedPath() {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('p') || params.get('path');
    if (forced) {
      try { return new URL(forced, location.origin).pathname || '/'; } catch { return forced; }
    }
    return location.pathname || '/';
  }

  // Normalize path: remove trailing slash (but keep root '/')
  function normalizePath(p) {
    if (!p) return '/';
    if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
    return p;
  }

  // Build candidate page paths and try to fetch them
  async function fetchPageForPath(pathname) {
    pathname = normalizePath(pathname);
    // if path is root, use 'home'
    const slug = (pathname === '/' ? 'home' : pathname.replace(/^\//, ''));
    const candidates = [
      `pages/${slug}.html`,
      `pages/${slug}/index.html`,
      `pages${pathname}.html`,  // in case user saved with leading slash
    ];

    for (const p of candidates) {
      try {
        const resp = await fetch(p, { cache: 'no-cache' });
        if (resp.ok) {
          const text = await resp.text();
          return { html: text, path: p };
        }
      } catch (e) {
        // network error - continue to next candidate
        warn('fetch error for', p, e);
      }
    }

    // not found -> load pages/404.html if present
    try {
      const resp404 = await fetch('pages/404.html', { cache: 'no-cache' });
      if (resp404.ok) {
        const text = await resp404.text();
        return { html: text, path: 'pages/404.html', notFound: true };
      }
    } catch (e) {
      warn('pages/404.html not available', e);
    }

    return { html: `<h2>404</h2><p>Seite ${slug} nicht gefunden.</p>`, path: null, notFound: true };
  }

  // Render the HTML into #page-content
  async function render(pathname, push = false) {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) { warn('No #page-content element'); return; }

    // optional: small loading hint
    contentEl.innerHTML = `<p class="text-center">Lade…</p>`;

    const { html, path, notFound } = await fetchPageForPath(pathname);

    contentEl.innerHTML = html;

    // Update history
    if (push) {
      try {
        window.history.pushState({}, '', pathname);
      } catch (e) {
        // some hosts may block pushState on file:// - ignore
        warn('pushState failed', e);
      }
    } else {
      // ensure the URL corresponds when arriving via ?p=...
      // (used when redirected from GitHub Pages 404.html)
      const params = new URLSearchParams(window.location.search);
      const forced = params.get('p') || params.get('path');
      if (forced) {
        try {
          const cleanPath = new URL(forced, location.origin).pathname;
          window.history.replaceState({}, '', cleanPath);
          log('Replaced URL from ?p=... to', cleanPath);
        } catch (e) {
          warn('replaceState cleanup failed', e);
        }
      }
    }

    // set active nav link
    updateActiveNav(pathname);

    // If the loaded page contains anchors and hash is present in URL, scroll there
    if (window.location.hash) {
      const id = window.location.hash;
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }

    log('rendered', pathname, '->', path, notFound ? '(404)' : '');
  }

  // Add or remove .active on nav links
  function updateActiveNav(currentPath) {
    currentPath = normalizePath(currentPath);
    document.querySelectorAll('nav a.nav-link, nav a').forEach(a => {
      try {
        const href = a.getAttribute('href') || '';
        // only handle internal links (starting with / or # or empty)
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          a.classList.remove('active'); return;
        }
        // Resolve the link's path
        const resolved = href.startsWith('/') ? href : new URL(href, location.origin + currentPath).pathname;
        if (normalizePath(resolved) === currentPath ||
          (currentPath === '/' && (href === '/' || href === '' || href === 'index.html'))) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      } catch (e) {
        a.classList.remove('active');
      }
    });
  }

  // Intercept clicks on internal links and use pushState
  function onDocumentClick(e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    // ignore external, anchors with target=_blank, download links, and hash-only anchors on same page
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('http') && !href.startsWith(location.origin)) return; // external
    if (href.startsWith('#')) {
      // in-page anchor: just allow default, will scroll to element in current content
      return;
    }

    // treat links starting with '/' as internal routes
    if (href.startsWith('/')) {
      e.preventDefault();
      const newPath = href;
      // avoid double load if same path
      if (normalizePath(newPath) !== normalizePath(location.pathname)) {
        render(newPath, true);
      } else {
        // same path but maybe with hash
        if (href.includes('#')) {
          const hash = href.split('#')[1];
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  // Handle back/forward
  window.addEventListener('popstate', () => {
    const path = getRequestedPath();
    render(path, false);
  });

  // catch clicks
  document.addEventListener('click', onDocumentClick, false);

  // Initial render
  document.addEventListener('DOMContentLoaded', () => {
    const path = getRequestedPath();
    render(path, false);
  });
})();
