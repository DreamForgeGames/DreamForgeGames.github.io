(function() {
  function scrollToHash(hash) {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
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
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const fullPath = pathname + hash;

  // 🔹 Spezialfall: root + optional hash → nichts redirecten
  const isRootWithHash = (pathname === "/" || pathname === "/index.html") && hash;
  const isRoot = pathname === "/" || pathname === "/index.html";

  // 🔹 Fall 1: Direktaufruf von /about-us oder /about-us#foo → Redirect zu /?p=/about-us#foo
  if (!pathParam && !isRoot && !isRootWithHash) {
    const newUrl = "/?p=" + encodeURIComponent(fullPath);
    window.location.replace(newUrl);
    return;
  }

  // 🔹 Fall 2: Normaler Aufruf mit ?p= → URL wieder schön machen
  if (pathParam) {
    const decodedPath = decodeURIComponent(pathParam);
    const [cleanPath, hashPart] = decodedPath.split("#");
    const newUrl = cleanPath + (hashPart ? "#" + hashPart : "");

    // Ohne Neuladen URL ersetzen
    window.history.replaceState(null, "", newUrl);

    // Inhalte laden, z.B. dein Router
    // loadPage(cleanPath);

    // Hash scrollen
    window.addEventListener("DOMContentLoaded", () => {
      if (hashPart) scrollToHash("#" + hashPart);
    });
  }

  // 🔹 Hash nachträglich ändern (z. B. Klick auf #foo-Link)
  window.addEventListener("hashchange", () => {
    scrollToHash(window.location.hash);
  });

  // 🔹 Optional: Fallback bei 404 (GitHub Pages)
  window.addEventListener("error", (event) => {
    if (event.message && event.message.includes("404") && !pathParam) {
      const newUrl = "/?p=" + encodeURIComponent(fullPath);
      window.location.replace(newUrl);
    }
  });
})();
