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

  // Check at startup: if URL has ?p=..., immediately clean it up
  (function cleanInitialUrl() {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('p') || params.get('path');
    if (forced) {
      try {
        const cleanPath = new URL(forced, location.origin).pathname;
        // Replace the URL without reloading
        window.history.replaceState({}, '', cleanPath);
        log('Initial ?p= cleaned ->', cleanPath);
      } catch (e) {
        warn('Failed to clean initial ?p=', e);
      }
    }
  })();

  // Determine which path to render
  function getRequestedPath() {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('p') || params.get('path');
    if (forced) {
      try { return new URL(forced, location.origin).pathname || '/'; } catch { return forced; }
    }
    return location.pathname || '/';
  }

  function normalizePath(p) {
    if (!p) return '/';
    if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
    return p;
  }

  async function fetchPageForPath(pathname) {
    pathname = normalizePath(pathname);
    const slug = (pathname === '/' ? 'home' : pathname.replace(/^\//, ''));
    const candidates = [
      `pages/${slug}.html`,
      `pages/${slug}/index.html`,
      `pages${pathname}.html`,
    ];

    for (const p of candidates) {
      try {
        const resp = await fetch(p, { cache: 'no-cache' });
        if (resp.ok) {
          const text = await resp.text();
          return { html: text, path: p };
        }
      } catch (e) {
        warn('fetch error for', p, e);
      }
    }

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

  async function render(pathname, push = false) {
    const contentEl = document.getElementById('page-content');
    if (!contentEl) { warn('No #page-content element'); return; }

    contentEl.innerHTML = `<p class="text-center">Lade…</p>`;
    const { html, path, notFound } = await fetchPageForPath(pathname);
    contentEl.innerHTML = html;

    if (push) {
      try {
        window.history.pushState({}, '', pathname);
      } catch (e) {
        warn('pushState failed', e);
      }
    } else {
      // clean ?p= param when arriving via redirect
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

    updateActiveNav(pathname);

    if (window.location.hash) {
      const id = window.location.hash;
      const target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }

    log('rendered', pathname, '->', path, notFound ? '(404)' : '');
  }

  function updateActiveNav(currentPath) {
    currentPath = normalizePath(currentPath);
    document.querySelectorAll('nav a.nav-link, nav a').forEach(a => {
      try {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          a.classList.remove('active'); return;
        }
        const resolved = href.startsWith('/') ? href : new URL(href, location.origin + currentPath).pathname;
        if (normalizePath(resolved) === currentPath ||
          (currentPath === '/' && (href === '/' || href === '' || href === 'index.html'))) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      } catch {
        a.classList.remove('active');
      }
    });
  }

  function onDocumentClick(e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('http') && !href.startsWith(location.origin)) return;
    if (href.startsWith('#')) return;

    if (href.startsWith('/')) {
      e.preventDefault();
      const newPath = href;
      if (normalizePath(newPath) !== normalizePath(location.pathname)) {
        render(newPath, true);
      } else if (href.includes('#')) {
        const hash = href.split('#')[1];
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  window.addEventListener('popstate', () => {
    const path = getRequestedPath();
    render(path, false);
  });

  document.addEventListener('click', onDocumentClick, false);

  document.addEventListener('DOMContentLoaded', () => {
    const path = getRequestedPath();
    render(path, false);
  });
})();
