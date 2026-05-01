// =================================================================
//  audio.js — Spraakuitvoer via Web Speech API
//  Werkt offline in alle moderne browsers, gratis, geen mp3 nodig
//  Voorkeur: Google Nederlands → premium stemmen → Vlaams → Nederlands
// =================================================================

window.AudioEngine = (function() {
  let nlStem = null;
  let stemmenGeladen = false;

  // Voorkeurslijst (in volgorde): natuurlijke vrouwenstemmen krijgen voorrang
  const PREMIUM_STEMMEN_NL = [
    // Google Chrome — natuurlijke vrouwenstem (online)
    'Google Nederlands',
    // Microsoft Edge — neural Natural voices (Windows)
    'Microsoft Dena Online (Natural) - Dutch (Netherlands)',
    'Microsoft Fenna Online (Natural) - Dutch (Netherlands)',
    'Microsoft Maarten Online (Natural) - Dutch (Netherlands)',
    // macOS / iOS — vrouwelijke Vlaamse/Nederlandse stemmen
    'Ellen',     // Vlaams (vrouw)
    'Claire',    // Nederlands (vrouw)
    // macOS / iOS — mannelijke fallback
    'Xander',    // Nederlands (man)
    'Pieter',    // Vlaams (man)
  ];

  function kiesBesteStem() {
    if (!window.speechSynthesis) return null;
    const stemmen = window.speechSynthesis.getVoices();
    if (stemmen.length === 0) return null;

    // 1) Premium stemmen op naam (beste kwaliteit)
    for (const naam of PREMIUM_STEMMEN_NL) {
      const match = stemmen.find(s => s.name === naam || s.name.includes(naam));
      if (match) return match;
    }

    // 2) Vlaams (Belgisch Nederlands), liefst lokaal
    const vlaamsLokaal = stemmen.find(s => s.lang === 'nl-BE' && s.localService);
    if (vlaamsLokaal) return vlaamsLokaal;
    const vlaams = stemmen.find(s => s.lang === 'nl-BE');
    if (vlaams) return vlaams;

    // 3) Nederlands lokaal
    const nederlandsLokaal = stemmen.find(s => s.lang === 'nl-NL' && s.localService);
    if (nederlandsLokaal) return nederlandsLokaal;
    const nederlands = stemmen.find(s => s.lang === 'nl-NL');
    if (nederlands) return nederlands;

    // 4) Iedere nl- variant
    return stemmen.find(s => s.lang.startsWith('nl')) || null;
  }

  function laadStemmen() {
    nlStem = kiesBesteStem();
    stemmenGeladen = nlStem !== null;
    if (nlStem) {
      console.log('[audio] Stem gekozen:', nlStem.name, '(' + nlStem.lang + ')');
    }
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    laadStemmen();
    window.speechSynthesis.onvoiceschanged = laadStemmen;
  }

  function voorbewerkTekst(tekst) {
    let t = tekst;
    t = t.replace(/\.\.\./g, '');     // verwijder placeholders
    t = t.replace(/\s+/g, ' ').trim(); // normaliseer whitespace
    t = t.replace(/\.+$/, '');         // eindpunt weg (geeft soms rare uitspraak)
    return t;
  }

  function spreek(tekst, opties = {}) {
    if (!window.speechSynthesis) {
      console.warn('Spraak wordt niet ondersteund in deze browser.');
      return;
    }
    window.speechSynthesis.cancel();

    // Stemmen kunnen pas later geladen zijn — probeer opnieuw als nodig
    if (!stemmenGeladen) laadStemmen();

    const teSpreken = voorbewerkTekst(tekst);
    if (!teSpreken) return;

    const u = new SpeechSynthesisUtterance(teSpreken);
    u.lang = nlStem ? nlStem.lang : 'nl-NL';
    if (nlStem) u.voice = nlStem;
    u.rate = opties.snelheid || 0.95;   // iets sneller dan vroeger
    u.pitch = opties.toon || 1.05;      // licht hoger = warmer voor kinderen
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

  // Debug-functie — toont alle Nederlandse stemmen + welke gekozen is
  function lijstStemmen() {
    if (!window.speechSynthesis) return [];
    const stemmen = window.speechSynthesis.getVoices().filter(s => s.lang.startsWith('nl'));
    console.table(stemmen.map(s => ({
      naam: s.name,
      taal: s.lang,
      lokaal: s.localService,
      gekozen: s === nlStem ? '✓' : ''
    })));
    return stemmen;
  }

  return { spreek, stop, lijstStemmen };
})();
