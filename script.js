
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'de,fr,es,it,ja,id', // Sprachen, die du erlauben willst
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'translate-container');
}
