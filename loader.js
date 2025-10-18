(function() {
  const DEBUG = true;
  const log = (...a) => { if (DEBUG) console.log('[router]', ...a); };

  // Hilfsfunktion: scrollen zu Hash
  function scrollToHash(hash) {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // Holen des aktuellen Pfads, inklusive ?p=
  function getRequestedPath() {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('p');
    if (forced) return decodeURIComponent(forced);
    return window.location.pathname + window.location.hash;
  }

  // Prüfen, ob wir ?p= redirect benötigen (GitHub Pages)
  (function checkRedirect() {
    const params = new URLSearchParams(window.location.search);
    const pathParam = params.get('p');

    const pathname = window.location.pathname;
    const hash = window.location.hash;

    // Nur redirecten, wenn:
    // - nicht root
    // - kein pathParam vorhanden
    if (!pathParam && pathname !== '/' && !pathname.startsWith('/index.html')) {
      const newUrl = '/?p=' + encodeURIComponent(pathname + hash);
      window.location.replace(newUrl);
    }
  })();

  // SPA Render-Funktion
  async function render(path) {
    const [cleanPath, hash] = path.split('#');

    // Hier deine Seiten laden Logik, z.B.
    const contentEl = document.getElementById('page-content');
    if (!contentEl) return;

    contentEl.innerHTML = `<p>Lade ${cleanPath}…</p>`;

    // fetchPageForPath wie gehabt
    const slug = cleanPath === '/' ? 'home' : cleanPath.replace(/^\//, '');
    const candidates = [
      `pages/${slug}.html`,
      `pages/${slug}/index.html`,
      `pages${cleanPath}.html`
    ];

    let html = `<h2>404</h2><p>Seite ${slug} nicht gefunden.</p>`;
    for (const p of candidates) {
      try {
        const resp = await fetch(p, { cache: 'no-cache' });
        if (resp.ok) { html = await resp.text(); break; }
      } catch {}
    }

    contentEl.innerHTML = html;

    // History sauber setzen (wenn von ?p=)
    if (window.location.search.includes('?p=')) {
      window.history.replaceState({}, '', cleanPath + (hash ? '#' + hash : ''));
    }

    // Scrollen zu Hash
    if (hash) scrollToHash('#' + hash);
  }

  // Interne Links abfangen
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('http') && !href.startsWith(location.origin)) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (!href.startsWith('/')) return;

    e.preventDefault();
    render(href);
  });

  // Back/Forward
  window.addEventListener('popstate', () => render(getRequestedPath()));

  // Initial render
  document.addEventListener('DOMContentLoaded', () => {
    render(getRequestedPath());
  });
})();
