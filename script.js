function loadGoogleTranslate() {
  const btn = document.getElementById('translate-btn');
  if (btn) btn.style.display = 'none';

  const container = document.getElementById('google_translate_element');
  if (container) container.style.display = 'block';

  // Callback für Google Translate
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'en', // Originalsprache
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      includedLanguages: 'de,fr,es,it,pt,ja,zh-CN,ru', // nur diese Sprachen
      autoDisplay: false
    }, 'google_translate_element');
  };

  // Script dynamisch nachladen
  if (!document.querySelector('script[src*="translate_a/element.js"]')) {
    const script = document.createElement('script');
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  } else {
    // Falls Script schon geladen ist, sofort init aufrufen
    window.googleTranslateElementInit();
  }
}

// Klick-Event
document.getElementById('translate-btn')?.addEventListener('click', loadGoogleTranslate);
