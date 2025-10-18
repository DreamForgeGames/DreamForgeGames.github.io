(function() {
  // Hilfsfunktion zum Scrollen, sobald das Ziel-Element existiert
  function scrollToHash(hash) {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      // Wenn das Element noch nicht existiert (z. B. SPA lädt noch Inhalte)
      // später nochmal versuchen
      const observer = new MutationObserver(() => {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  const params = new URLSearchParams(window.location.search);
  const pathParam = params.get("p");
  const fullPath = window.location.pathname + window.location.hash;

  // 🔹 Fall 1: Direktaufruf von /about-us oder /about-us#foo → Redirect zu /?p=/about-us#foo
  if (!pathParam && window.location.pathname !== "/" && !window.location.pathname.startsWith("/index.html")) {
    const newUrl = "/?p=" + encodeURIComponent(fullPath);
    window.location.replace(newUrl);
    return;
  }

  // 🔹 Fall 2: Normaler Aufruf mit ?p= → URL wieder schön machen
  if (pathParam) {
    const decodedPath = decodeURIComponent(pathParam);
    const [cleanPath, hash] = decodedPath.split("#");
    const newUrl = cleanPath + (hash ? "#" + hash : "");

    // Ohne Neuladen URL ersetzen
    window.history.replaceState(null, "", newUrl);

    // 🔹 Jetzt kann deine App z. B. Inhalte laden
    // Hier kannst du deinen eigenen Router oder Lade-Logik anstoßen
    // loadPage(cleanPath);

    // 🔹 Falls ein Hash existiert → scrollen, sobald DOM fertig
    window.addEventListener("DOMContentLoaded", () => {
      if (hash) scrollToHash("#" + hash);
    });
  }

  // 🔹 Fall 3: Wenn jemand F5 auf /about-us drückt → GitHub Pages liefert 404,
  // daher beim nächsten Mal automatisch umleiten
  window.addEventListener("error", (event) => {
    if (event.message && event.message.includes("404") && !pathParam) {
      const newUrl = "/?p=" + encodeURIComponent(fullPath);
      window.location.replace(newUrl);
    }
  });

  // 🔹 Bonus: Wenn jemand später Hash ändert (z. B. Klick auf #foo-Link)
  window.addEventListener("hashchange", () => {
    scrollToHash(window.location.hash);
  });
})();
