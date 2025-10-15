  // script.js
  // Lädt template.html (Fragment) und ersetzt #page-content mit: NAV + MAIN#page-content(with original content) + FOOTER
  // Hinweise: template.html muss im selben Verzeichnis liegen. Bootstrap & style.css müssen im <head> sein.

  (async function() {
    const DEBUG = true;
    const TEMPLATE_PATH = 'template.html'; // RELATIV (kein führendes /)

    function log(...args) { if (DEBUG) console.log('[template]', ...args); }
    function warn(...args) { if (DEBUG) console.warn('[template]', ...args); }
    function error(...args) { if (DEBUG) console.error('[template]', ...args); }

    if (document.readyState === 'loading') {
      await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
    }

    try {
      const currentPageEl = document.getElementById('page-content');
      if (!currentPageEl) {
        warn('Kein Element mit id="page-content" gefunden. Abbruch.');
        return;
      }

      // Speichere lokalen Inhalt (wird in das Template eingefügt)
      const originalHTML = currentPageEl.innerHTML;

      log('Lade Template von', TEMPLATE_PATH);
      const resp = await fetch(TEMPLATE_PATH, { cache: 'no-cache' });
      if (!resp.ok) {
        warn('Template konnte nicht geladen werden:', resp.status, resp.statusText);
        return;
      }
      const tplText = await resp.text();

      // Template parsen (als Dokumentfragment)
      const parser = new DOMParser();
      const tplDoc = parser.parseFromString(tplText, 'text/html');

      const tplNav = tplDoc.querySelector('nav');
      const tplMain = tplDoc.querySelector('#page-content');
      const tplFooter = tplDoc.querySelector('footer');

      // Baue Fragment: nav, main (mit original content), footer
      const frag = document.createDocumentFragment();

      if (tplNav) {
        frag.appendChild(tplNav.cloneNode(true));
      } else {
        log('Keine NAV im Template gefunden.');
      }

      // main: wenn template ein #page-content enthält, nutze es; sonst erstelle neu
      let newMain;
      if (tplMain) {
        newMain = tplMain.cloneNode(true);
        newMain.innerHTML = originalHTML;
        frag.appendChild(newMain);
      } else {
        newMain = document.createElement('main');
        newMain.id = 'page-content';
        newMain.innerHTML = originalHTML;
        frag.appendChild(newMain);
      }

      if (tplFooter) {
        frag.appendChild(tplFooter.cloneNode(true));
      } else {
        log('Kein FOOTER im Template gefunden.');
      }

      // Ersetze das alte page-content Element mit dem neuen Fragment (nav+main+footer)
      currentPageEl.replaceWith(frag);
      log('Template erfolgreich eingebunden.');

      // Aktiven Nav-Link setzen
      (function setActiveNav() {
        const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        document.querySelectorAll('nav a').forEach(a => {
          const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
          if (!href) { a.classList.remove('active'); return; }
          if (href === path || (href === 'index.html' && (path === '' || path === 'index.html'))) {
            a.classList.add('active');
          } else {
            a.classList.remove('active');
          }
        });
      })();

    } catch (e) {
      error('Fehler im Template-Loader:', e);
    }
  })();
