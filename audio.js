// =================================================================
//  audio.js — Spraakuitvoer via Web Speech API
//  Werkt offline in alle moderne browsers, gratis, geen mp3 nodig
// =================================================================

window.AudioEngine = (function() {
  let nlStem = null;
  let stemmenGeladen = false;

  function laadStemmen() {
    if (!window.speechSynthesis) return;
    const stemmen = window.speechSynthesis.getVoices();
    nlStem = stemmen.find(s => s.lang === 'nl-NL') ||
             stemmen.find(s => s.lang === 'nl-BE') ||
             stemmen.find(s => s.lang.startsWith('nl')) ||
             null;
    stemmenGeladen = true;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    laadStemmen();
    window.speechSynthesis.onvoiceschanged = laadStemmen;
  }

  function spreek(tekst, opties = {}) {
    if (!window.speechSynthesis) {
      console.warn('Spraak wordt niet ondersteund in deze browser.');
      return;
    }
    window.speechSynthesis.cancel();
    if (!stemmenGeladen) laadStemmen();

    // Verwijder placeholder ... uit zin voor uitspraak
    const teSpreken = tekst.replace(/\.\.\./g, '');

    const u = new SpeechSynthesisUtterance(teSpreken);
    u.lang = 'nl-NL';
    if (nlStem) u.voice = nlStem;
    u.rate = opties.snelheid || 0.85;
    u.pitch = opties.toon || 1.0;
    u.volume = 1.0;

    if (opties.opStart) u.onstart = opties.opStart;
    if (opties.opEinde) u.onend = opties.opEinde;

    window.speechSynthesis.speak(u);
  }

  function stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  return { spreek, stop };
})();
