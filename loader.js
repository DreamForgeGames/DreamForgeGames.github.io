(function() {
  const DEBUG = true;
  const log = (...a) => { if (DEBUG) console.log('[router]', ...a); };

  // --- Hilfsfunktionen ---
  function scrollToHash(hash) {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function normalizePath(p) {
    if (!p) return '/';
    if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
    return p;
  }

  async function fetchPageForPath(pathname) {
    pathname = normalizePath(pathname);
    const slug = pathname === '/' ? 'home' : pathname.replace(/^\//, '');
    const candidates = [
      `pages/${slug}.html`,
      `pages/${slug}/index.html`,
      `pages${pathname}.html`
    ];
    for (const p of candidates) {
      try {
        const resp = await fetch(p, { cache: 'no-cache' });
        if (resp.ok) return { html: await resp.text(), path: p };
      } catch {}
    }
    try {
      const resp404 = await fetch('pages/404.html', { cache: 'no-cache' });
      if (resp404.ok) return { html: await resp404.text(), path: 'pages/404.html', notFound: true };
    } catch {}
    return { html: `<h2>404</h2><p>Seite ${slug} nicht gefunden.</p>`, path: null, notFound: true };
  }

  function setActiveNav(path) {
    const links = document.querySelectorAll('.navbar-nav .nav-link');
    const cleanPath = normalizePath(path);

    links.forEach(link => {
      const href = normalizePath(link.getAttribute('href') || '');
      if (href === cleanPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // --- Main Render-Funktion ---
  async function render(path) {
    const [cleanPath, hash] = path.split('#');
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;

    contentEl.innerHTML = `<p class="text-center">Lade…</p>`;
    const { html } = await fetchPageForPath(cleanPath);
    contentEl.innerHTML = html;

    // Meta-Titel setzen
    const tempDoc = document.createElement('div');
    tempDoc.innerHTML = html;
    const metaTitle = tempDoc.querySelector('meta[name="page-title"]')?.getAttribute('content');
    document.title = metaTitle ? `${metaTitle} | DreamForge Games` : 'DreamForge Games';

    // Navbar .active setzen
    setActiveNav(cleanPath);

    // URL aktualisieren
    window.history.replaceState({}, '', cleanPath + (hash ? '#' + hash : ''));

    // Scrollen
    if (hash) scrollToHash('#' + hash);

    log('Rendered', cleanPath, metaTitle ? `Title: ${metaTitle}` : '(no title)');

    // --- Custom Event: pageRendered ---
    const event = new CustomEvent('pageRendered', { detail: { path: cleanPath } });
    document.dispatchEvent(event);

  }

  function getRequestedPath() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) return decodeURIComponent(p);
    return window.location.pathname + window.location.hash;
  }

  // --- Link-Handling ---
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('http') && !href.startsWith(location.origin)) return;
    if (!href.startsWith('/')) return;

    e.preventDefault();
    render(href);
  });

  // --- Popstate für Browser-Navigation ---
  window.addEventListener('popstate', () => render(getRequestedPath()));

  // --- Initial render ---
  document.addEventListener('DOMContentLoaded', () => render(getRequestedPath()));
})();
