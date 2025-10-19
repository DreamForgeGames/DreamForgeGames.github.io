(function() {
    const DEBUG = true;
    const log = (...a) => { if (DEBUG) console.log('[RSS]', ...a); };

    function loadRSS() {
        log("RSS wird geladen...");
        const rssUrl = "/news.xml"; // Pfad auf GitHub Pages
        const container = document.getElementById("news-content");
        if (!container) {
            log("Div #news-content nicht gefunden");
            return;
        }
        container.innerHTML = ''; // alte Karten entfernen

        // Lade-Hinweis entfernen, falls vorhanden
        const loadingEl = document.getElementById("news-loading");
        if (loadingEl) loadingEl.remove();

        fetch(rssUrl)
            .then(res => res.text())
            .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
            .then(data => {
                const items = Array.from(data.querySelectorAll("item"))
                    .map(item => ({
                        title: item.querySelector("title").textContent,
                        link: item.querySelector("link").textContent,
                        pubDate: new Date(item.querySelector("pubDate").textContent),
                        description: item.querySelector("description").textContent
                    }))
                    .sort((a, b) => b.pubDate - a.pubDate); // Neueste zuerst

                items.forEach(it => {
                    const card = document.createElement("div");
                    card.className = "card mb-3";
                    card.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">${it.title}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${it.pubDate.toLocaleDateString()}</h6>
                            <p class="card-text">${it.description}</p>
                            <a href="${it.link}" class="card-link">Mehr lesen</a>
                        </div>
                    `;
                    container.appendChild(card);
                });

                log(`${items.length} News-Karten eingefügt`);
            })
            .catch(err => log("Fehler beim Laden des RSS-Feeds:", err));
    }

    // --- Event Listener für pageRendered ---
    document.addEventListener('pageRendered', (e) => {
        if (e.detail.path === '/news') {
            loadRSS();
        }
    });
})();
