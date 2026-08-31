// =================================================================
//  app.js — Hoofdlogica Anders Leren (kind-app)
// =================================================================

// Helper: filter ontbrekende thema's en waarschuw
function _veiligThemas(verwacht) {
  return verwacht
    .map(([naam, bestand]) => {
      const t = window[naam];
      if (!t) console.warn(`[app] Thema niet geladen: ${naam} — bestand themas/${bestand} ontbreekt of heeft een fout.`);
      return t;
    })
    .filter(t => t && t.id);
}

// Startpakket — eerste thema voor anderstalige nieuwkomers (~20 essentiële items)
const THEMAS_STARTPAKKET = _veiligThemas([
  ['THEMA_STARTPAKKET', 'startpakket.js'],
]);

// Leerlijn-thema's — in volgorde van eenvoud
const THEMAS_WOORDEN = _veiligThemas([
  ['THEMA_WOORDEN_KLAS', 'woorden-klas.js'],
  ['THEMA_WOORDEN_LICHAAM', 'woorden-lichaam.js'],
  ['THEMA_WOORDEN_ETEN', 'woorden-eten.js'],
  ['THEMA_WOORDEN_FAMILIE', 'woorden-familie.js'],
  ['THEMA_WOORDEN_THUIS', 'woorden-thuis.js'],
  ['THEMA_WOORDEN_DIEREN', 'woorden-dieren.js'],
  ['THEMA_WOORDEN_CIJFERS', 'woorden-cijfers.js'],
  ['THEMA_WOORDEN_KLEUREN', 'woorden-kleuren.js'],
  ['THEMA_WOORDEN_VORMEN', 'woorden-vormen.js'],
  ['THEMA_WOORDEN_DOEN', 'woorden-doen.js'],
]);

const THEMAS_ZINNEN = _veiligThemas([
  ['THEMA_ZINNEN_SCHOOL', 'zinnen-school.js'],
  ['THEMA_ZINNEN_BELEEFD', 'zinnen-beleefd.js'],
  ['THEMA_ZINNEN_GEVOEL', 'zinnen-gevoel.js'],
  ['THEMA_ZINNEN_HULP', 'zinnen-hulp.js'],
  ['THEMA_ZINNEN_TIJD', 'zinnen-tijd.js'],
]);

const ALLE_THEMAS = [...THEMAS_STARTPAKKET, ...THEMAS_WOORDEN, ...THEMAS_ZINNEN];

// State
let huidigThema = null;
let kijkenIndex = 0;
let oefenItem = null;
let score = 0;
let gebruikteOefenIndices = [];

// Centrale helper: pas Woordenbeheer toe op een basispakket-thema.
// Geeft een nieuw thema-object terug met overrides + eigen items.
// Gebruik dit overal waar je 'thema.items' nodig hebt — niet alleen voor renderen.
function verrijkThema(thema) {
  if (!thema) return thema;
  if (window.Woordenbeheer && Woordenbeheer.pasToeOpThema) {
    return Woordenbeheer.pasToeOpThema(thema);
  }
  return thema;
}

// Centrale helper: actieve items voor het huidige kind in dit thema.
// Volgorde:
//   1. Woordenbeheer toepassen (overrides + verbergen + eigen items)
//   2. Categorieën-filter van het kind toepassen
function getActieveItems(thema) {
  if (!thema || !thema.items) return [];
  const verrijkt = verrijkThema(thema);
  if (window.Voortgang && Voortgang.filterItemsOpCategorieen) {
    return Voortgang.filterItemsOpCategorieen(verrijkt);
  }
  return verrijkt.items;
}


// Toets-state
const TOETS_AANTAL = 10;
let toetsVragen = [];
let toetsFoutIds = []; // ids die fout waren in deze toetsronde
let toetsHuidig = 0;
let toetsJuist = 0;
let toetsItem = null;

// =================================================================
//  TAAK-FLOW
// =================================================================
//
// Stuurt het kind door de fases van een taak: leren → luisteren-oefenen
// → luisteren-toets → lezen-oefenen → lezen-toets → schrijven-oefenen
// → schrijven-toets → klaar. Welke fases er zijn, hangt af van wat de
// leerkracht aanvinkte (vaardigheden + toetsen).
//
// State:
//   - taakModus = true zodra het kind in een taak zit
//   - taakHuidigeFase = string-ID van de huidige fase
//   - taakItems = items van de taak (uit het thema gefilterd op woordIds)
//   - taakLeerIndex = welk item is zichtbaar in leren-fase
//   - taakOefItem = huidig item in oefen-fase
//
// Belangrijk: in oefen- en toets-fases speelt audio NIET automatisch.
// Het kind moet zelf op de hoorknop klikken om het woord te horen.

let taakModus = false;
let taakHuidigeFase = null;
let taakItems = [];
let taakLeerIndex = 0;
let taakOefItem = null;

// Intro-tussenschermen per fase. Bevat de fases die het kind al "gepasseerd" is via
// de intro. Voorkomt dat intro telkens opnieuw verschijnt als kind tussen fases heen-
// en-weer gaat (bv. bij teruggaan vanuit de toets naar de oef).
let _taakIntroBezocht = new Set();
// Onthoudt naar welke "echte" fase de intro doorschakelt (na klik op Begin)
let _taakIntroDoorNaar = null;
// Markeer of we een taak hernemen — voor 'Welkom terug!' op het eerstvolgende intro-scherm
let _taakHernemen = false;

// Helper: zoek het thema-object op basis van id
function _vindThema(themaId) {
  return ALLE_THEMAS.find(t => t.id === themaId);
}

// Helper: items van de huidige taak (gefilterd uit thema)
function _taakItems(taak, thema) {
  if (!taak || !thema) return [];
  const verrijkt = verrijkThema(thema);
  const set = new Set(taak.woordIds || []);
  return verrijkt.items.filter(it => set.has(it.id));
}

// Bouw de lijst van fases waar het kind doorheen moet, op basis van wat de
// leerkracht heeft aangevinkt. 'leren' staat altijd vooraan, 'klaar' altijd achteraan.
// Per aangevinkte vaardigheid komt eerst de oef-fase, dan eventueel de toets-fase.
function _taakFasenLijst(taak) {
  const fasen = ['leren'];
  const vaardigheden = Array.isArray(taak.vaardigheden) ? taak.vaardigheden : ['luisteren'];
  const toetsen = new Set(Array.isArray(taak.toetsen) ? taak.toetsen : ['luisteren']);
  // Vaste volgorde: luisteren → lezen → schrijven (alleen aangevinkte erbij)
  ['luisteren', 'lezen', 'schrijven'].forEach(v => {
    if (vaardigheden.indexOf(v) === -1) return;
    fasen.push(v + '-oef');
    if (toetsen.has(v)) fasen.push(v + '-toets');
  });
  fasen.push('klaar');
  return fasen;
}

// Vind de volgende fase na een gegeven fase-ID
function _volgendeFase(huidigeFase, taak) {
  const fasen = _taakFasenLijst(taak);
  const idx = fasen.indexOf(huidigeFase);
  if (idx === -1 || idx === fasen.length - 1) return 'klaar';
  return fasen[idx + 1];
}

// Vind de vorige fase voor een gegeven fase-ID
function _vorigeFase(huidigeFase, taak) {
  const fasen = _taakFasenLijst(taak);
  const idx = fasen.indexOf(huidigeFase);
  if (idx <= 0) return null;
  return fasen[idx - 1];
}

// Hoofdknop op startscherm: taak-knop. Toont de taak-zone als er een taak is,
// of verbergt hem als er geen is.
function rendererTaakZone() {
  const zone = document.getElementById('taak-zone');
  if (!zone) return;

  const taak = Voortgang.getTaak();
  if (!taak || !taak.themaId || !Array.isArray(taak.woordIds) || taak.woordIds.length === 0) {
    zone.style.display = 'none';
    return;
  }
  const thema = _vindThema(taak.themaId);
  if (!thema) {
    zone.style.display = 'none';
    return;
  }

  // Vul UI
  const themaNaamEl = document.getElementById('taak-thema-naam');
  const aantalEl = document.getElementById('taak-aantal');
  const statusEl = document.getElementById('taak-status');
  const routeEl = document.getElementById('taak-route');
  const knop = zone.querySelector('.taak-knop-groot');

  if (themaNaamEl) themaNaamEl.textContent = `${thema.emoji} ${thema.naam}`;
  if (aantalEl) {
    const n = taak.woordIds.length;
    aantalEl.textContent = n === 1 ? '1 woord' : `${n} woorden`;
  }
  if (routeEl) {
    const namen = {klikspel:'Klikspel',verbinden:'Verbinden',verslepen:'Verslepen','woord-beeld':'Woord → beeld',overtypen:'Overtypen'};
    const stappen = ['Kijken'];
    (taak.vaardigheden || []).forEach(v => {
      (taak['oefenvormen_' + v] || []).forEach(vorm => stappen.push(namen[vorm] || vorm));
      if ((taak.toetsen || []).includes(v)) stappen.push('Toets ' + v);
    });
    routeEl.textContent = stappen.join(' → ');
  }
  zone.style.display = '';

  // Status-overlay onderaan de knop (voltooid / moeilijk)
  if (statusEl) {
    if (taak.status === 'voltooid') {
      statusEl.style.display = '';
      statusEl.className = 'taak-status voltooid';
      statusEl.innerHTML = `<span class="taak-status-emoji">🏆</span><span class="taak-status-tekst">Klaar! Vraag aan je juf voor een nieuwe taak.</span>`;
      if (knop) knop.classList.add('voltooid');
    } else if (taak.status === 'moeilijk' || taak.status === 'haperde') {
      statusEl.style.display = '';
      statusEl.className = 'taak-status haperde';
      statusEl.innerHTML = `<span class="taak-status-emoji">💪</span><span class="taak-status-tekst">Probeer nog eens!</span>`;
      if (knop) knop.classList.remove('voltooid');
    } else {
      statusEl.style.display = 'none';
      if (knop) knop.classList.remove('voltooid');
    }
  }
}

// Wordt aangeroepen als kind op de grote oranje taak-knop klikt.
function startTaak() {
  const taak = Voortgang.getTaak();
  if (!taak || !taak.themaId) return;

  const thema = _vindThema(taak.themaId);
  if (!thema) {
    alert('Het thema van je taak is niet gevonden. Vraag aan je juf.');
    return;
  }

  // Bepaal start-fase op basis van vorige sessie:
  //   - voltooid/moeilijk/haperde → reset, helemaal opnieuw vanaf 'leren'
  //   - bezig + fase 'leren' → gewoon bij 'leren' starten (nog niets gedaan)
  //   - bezig + oef-fase → daar verder hernemen
  //   - bezig + toets-fase → terug naar bijhorende oef-fase (toets opnieuw)
  let startFase = 'leren';
  let isHernemen = false;

  if (taak.status === 'voltooid' || taak.status === 'moeilijk' || taak.status === 'haperde') {
    Voortgang.updateTaak({
      status: 'bezig',
      huidigeFase: 'leren',
      foutWoordenLaatsteToets: [],
      aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 }
    });
    startFase = 'leren';
  } else if (taak.huidigeFase && taak.huidigeFase !== 'leren') {
    // Hernemen: pak de bewaarde fase, of bij toets terug naar oef
    let f = taak.huidigeFase;
    // Negeer 'intro:'-prefix en 'klaar' (die mogen we niet als startpunt nemen)
    if (typeof f === 'string' && f.startsWith('intro:')) {
      f = f.replace('intro:', '');
    }
    if (f === 'klaar') {
      f = 'leren';
    } else if (typeof f === 'string' && f.endsWith('-toets')) {
      // Toets opnieuw → terug naar oef
      f = f.replace('-toets', '-oef');
    }
    if (f !== 'leren') {
      startFase = f;
      isHernemen = true;
    }
  }

  huidigThema = thema;
  taakModus = true;
  taakItems = _taakItems(Voortgang.getTaak(), thema);
  // Reset intro-bezoeken bij elke start (zodat tussenscherm bij hernemen ook getoond wordt)
  _taakIntroBezocht = new Set();
  _taakIntroDoorNaar = null;
  // Markeer of dit een hernemen is, voor het 'Welkom terug!' bericht in de intro
  _taakHernemen = isHernemen;

  if (taakItems.length === 0) {
    alert('Er zijn geen woorden in je taak. Vraag aan je juf.');
    taakModus = false;
    return;
  }

  taakStartFase(startFase);
}

// Centrale fase-router
function taakStartFase(fase) {
  // INTRO-LOGICA: voor elke oef- of toets-fase tonen we eerst een tussenscherm,
  // tenzij het kind die al heeft gezien. Bezoeken worden bijgehouden in
  // _taakIntroBezocht zodat de intro niet telkens opnieuw verschijnt.
  if (_isIntroFase(fase) && !_taakIntroBezocht.has(fase)) {
    _taakIntroDoorNaar = fase;
    taakHuidigeFase = 'intro:' + fase;
    taakToonIntro(fase);
    return;
  }

  taakHuidigeFase = fase;
  Voortgang.updateTaak({ huidigeFase: fase });

  if (fase === 'leren') {
    taakLeerIndex = 0;
    taakRendererLeren();
    toonScherm('scherm-taak-leren');
  } else if (fase === 'luisteren-oef') {
    taakStartLuisterenOefenen();
  } else if (fase === 'luisteren-toets') {
    taakStartLuisterenToets();
  } else if (fase === 'lezen-oef') {
    taakStartLezenOefenen();
  } else if (fase === 'lezen-toets') {
    taakStartLezenToets();
  } else if (fase === 'schrijven-oef') {
    taakStartSchrijvenOefenen();
  } else if (fase === 'schrijven-toets') {
    taakStartSchrijvenToets();
  } else if (fase === 'klaar') {
    taakToonKlaar();
  }
}

// =================================================================
//  PREVIEW-SKIP — alleen voor leerkracht in preview-modus
// =================================================================
// Roept de leerkracht aan vanuit de preview-popup (via iframe.contentWindow).
// Logica:
//   - Als we in een oefen-fase zijn met meerdere oefenvormen (bv. luisteren-oef
//     met klikspel + verbinden + verslepen), spring naar de volgende oefenvorm
//     door de ronde-teller te verhogen.
//   - Als we al de laatste oefenvorm hebben gehad, of als er maar 1 oefenvorm
//     is, spring naar de volgende fase.
window.taakPreviewVolgendeOefenvorm = function() {
  if (!window.Voortgang || !Voortgang.isPreviewModus || !Voortgang.isPreviewModus()) {
    console.warn('Preview-skip alleen beschikbaar in preview-modus');
    return;
  }
  const taak = Voortgang.getTaak();
  if (!taak) return;
  if (!taakModus || !Array.isArray(taakItems) || taakItems.length === 0) {
    startTaak();
    return;
  }

  // Bepaal huidige doel-fase (negeer 'intro:'-prefix)
  let huidigeFase = taakHuidigeFase || taak.huidigeFase || 'leren';
  if (typeof huidigeFase === 'string' && huidigeFase.startsWith('intro:')) {
    huidigeFase = huidigeFase.replace('intro:', '');
    // Oefenvorm-intro's gebruiken bv. "luisteren-oef:verbinden". Voor de
    // router blijft dit dezelfde basisfase "luisteren-oef".
    if (huidigeFase.includes(':')) huidigeFase = huidigeFase.split(':')[0];
  }

  // Welke vaardigheid hoort bij deze fase?
  let vaardigheid = null;
  if (huidigeFase.indexOf('luisteren') === 0) vaardigheid = 'luisteren';
  else if (huidigeFase.indexOf('lezen') === 0) vaardigheid = 'lezen';
  else if (huidigeFase.indexOf('schrijven') === 0) vaardigheid = 'schrijven';

  // Is dit een oef-fase met meerdere oefenvormen?
  const isOefFase = huidigeFase.endsWith('-oef');
  if (isOefFase && vaardigheid) {
    const veld = 'oefenvormen_' + vaardigheid;
    const aangevinkt = Array.isArray(taak[veld]) ? taak[veld] : [];
    if (aangevinkt.length > 1) {
      // Bepaal huidige oefenvorm-index
      const r = _ruweRonde(vaardigheid);
      const huidigeIdx = (r - 1) % aangevinkt.length;
      const isLaatste = (huidigeIdx === aangevinkt.length - 1);
      if (!isLaatste) {
        // Volgende oefenvorm: ronde-teller met 1 verhogen → cyclus rolt door
        if (!taak.rondeStatus) taak.rondeStatus = {};
        if (!taak.rondeStatus[vaardigheid]) {
          taak.rondeStatus[vaardigheid] = { huidigeRonde: 1, behandeldDezeRonde: [] };
        }
        taak.rondeStatus[vaardigheid].huidigeRonde =
          (taak.rondeStatus[vaardigheid].huidigeRonde || 1) + 1;
        taak.rondeStatus[vaardigheid].behandeldDezeRonde = [];
        // Reset de bezochte-intro's voor deze oefenvorm zodat intro opnieuw verschijnt
        if (typeof _taakIntroBezocht !== 'undefined' && _taakIntroBezocht.clear) {
          // We laten de fase-intro's staan, alleen de oefenvorm-specifieke intro's wissen
          const teVerwijderen = [];
          _taakIntroBezocht.forEach(s => { if (s.indexOf(':') !== -1) teVerwijderen.push(s); });
          teVerwijderen.forEach(s => _taakIntroBezocht.delete(s));
        }
        // Herstart de fase — die zal nu de volgende oefenvorm pakken
        taakStartFase(huidigeFase);
        return;
      }
    }
  }

  // Anders: spring naar volgende fase
  const volgende = _volgendeFase(huidigeFase, taak);
  if (volgende) taakStartFase(volgende);
};

// Helper: welke fases krijgen een intro-tussenscherm?
// Uitzondering: 'luisteren-oef' krijgt GEEN algemene intro meer, want daar volgt
// meteen daarna een oefenvorm-specifieke intro (Klikspel/Verbinden/Verslepen).
// Dat dubbele uitleg-scherm was overbodig en verwarrend.
// 'lezen-oef' en 'schrijven-oef' hebben geen sub-varianten en krijgen wel hun
// eigen intro.
function _isIntroFase(fase) {
  return [
    'lezen-oef',     'lezen-toets',
    'schrijven-oef', 'schrijven-toets',
    'luisteren-toets'
  ].indexOf(fase) !== -1;
}

// Bij klik op een fase-terug-knop: ga één fase terug volgens de fase-lijst.
function taakFaseTerug() {
  const taak = Voortgang.getTaak();
  if (!taak) return;
  // Bij intro: terug naar de fase die voor de "echte" doel-fase kwam
  if (typeof taakHuidigeFase === 'string' && taakHuidigeFase.startsWith('intro:')) {
    const doelFase = taakHuidigeFase.replace('intro:', '');
    const vorige = _vorigeFase(doelFase, taak);
    if (vorige) taakStartFase(vorige);
    return;
  }
  const vorige = _vorigeFase(taakHuidigeFase, taak);
  if (vorige) taakStartFase(vorige);
}

// =================================================================
//  TAAK-INTRO  (tussenscherm met groot icoon, uitleg en demo per fase)
// =================================================================
//
// Configuratie per fase: titel die het kind ziet, kort hoorbare uitleg en
// een demo-bouw-functie die het mini-voorbeeld animeert.

const TAAK_INTRO_CONFIG = {
  'luisteren-oef': {
    icoon: '👂',
    kop: '👂 Mijn taak — luisteren',
    titel: 'Nu gaan we luisteren',
    uitleg: 'Hoor het woord. Klik dan op het juiste woord.',
    bouwDemo: _bouwDemoLuisterenOef
  },
  'luisteren-oef:klikspel': {
    icoon: '🎯',
    kop: '👂 Mijn taak — klikspel',
    titel: 'Klikspel',
    uitleg: 'Hoor het woord. Klik op het juiste woord uit de lijst.',
    bouwDemo: _bouwDemoLuisterenOef
  },
  'luisteren-oef:verbinden': {
    icoon: '🔗',
    kop: '👂 Mijn taak — verbinden',
    titel: 'Verbinden',
    uitleg: 'Verbind elk woord met het juiste beeld. Klik eerst op een woord, dan op het beeld.',
    bouwDemo: _bouwDemoLuisterenVerbinden
  },
  'luisteren-oef:verslepen': {
    icoon: '🤚',
    kop: '👂 Mijn taak — verslepen',
    titel: 'Verslepen',
    uitleg: 'Sleep het juiste woord naar het lege vak naast het beeld.',
    bouwDemo: _bouwDemoLuisterenVerslepen
  },
  'luisteren-toets': {
    icoon: '🎯',
    kop: '🎯 Mijn taak — luistertoets',
    titel: 'Toets luisteren',
    uitleg: 'Hoor het woord. Klik op het juiste beeld. Goed nadenken!',
    bouwDemo: _bouwDemoLuisterenToets
  },
  'lezen-oef': {
    icoon: '👁️',
    kop: '👁️ Mijn taak — lezen',
    titel: 'Nu gaan we lezen',
    uitleg: 'Lees het woord. Klik op het juiste beeld.',
    bouwDemo: _bouwDemoLezenOef
  },
  'lezen-toets': {
    icoon: '🎯',
    kop: '🎯 Mijn taak — leestoets',
    titel: 'Toets lezen',
    uitleg: 'Lees het woord. Klik op het juiste beeld. Goed nadenken!',
    bouwDemo: _bouwDemoLezenOef
  },
  'schrijven-oef': {
    icoon: '✍️',
    kop: '✍️ Mijn taak — schrijven',
    titel: 'Nu gaan we schrijven',
    uitleg: 'Kijk naar het woord. Het verdwijnt na drie seconden. Typ het woord daarna over.',
    bouwDemo: _bouwDemoSchrijvenOef
  },
  'schrijven-toets': {
    icoon: '🎯',
    kop: '🎯 Mijn taak — schrijftoets',
    titel: 'Toets schrijven',
    uitleg: 'Kijk naar het beeld. Typ het juiste woord. Je krijgt één kans!',
    bouwDemo: _bouwDemoSchrijvenToets
  }
};

function taakToonIntro(fase) {
  const cfg = TAAK_INTRO_CONFIG[fase];
  if (!cfg) {
    // Geen config: skip intro, ga direct door
    _taakIntroBezocht.add(fase);
    taakStartFase(fase);
    return;
  }
  // Vul de elementen
  const kopEl    = document.getElementById('taak-intro-kop');
  const icoonEl  = document.getElementById('taak-intro-icoon');
  const titelEl  = document.getElementById('taak-intro-titel');
  const uitlegEl = document.getElementById('taak-intro-uitleg');
  const demoEl   = document.getElementById('taak-intro-demo');
  const welkomEl = document.getElementById('taak-intro-welkom');

  if (kopEl)    kopEl.textContent    = cfg.kop;
  if (icoonEl)  icoonEl.textContent  = cfg.icoon;
  if (titelEl)  titelEl.textContent  = cfg.titel;
  if (uitlegEl) uitlegEl.textContent = cfg.uitleg;

  // Welkom-terug-bericht alleen tonen bij eerste intro na hernemen
  let welkomTerug = false;
  if (welkomEl) {
    if (_taakHernemen) {
      welkomEl.textContent = `🌱 Welkom terug! We gaan verder bij ${cfg.titel.toLowerCase()}.`;
      welkomEl.style.display = '';
      welkomTerug = true;
      // Reset zodat dit bericht maar 1× verschijnt
      _taakHernemen = false;
    } else {
      welkomEl.style.display = 'none';
      welkomEl.textContent = '';
    }
  }

  if (demoEl) {
    demoEl.innerHTML = '';
    if (typeof cfg.bouwDemo === 'function') {
      cfg.bouwDemo(demoEl);
    }
  }
  toonScherm('scherm-taak-intro');
  // Audio-uitleg automatisch afspelen (zachtjes met kleine vertraging).
  // Bij welkom-terug: spreek eerst de welkom-zin, dan de uitleg
  setTimeout(() => {
    if (taakModus && typeof taakHuidigeFase === 'string' && taakHuidigeFase.startsWith('intro:')) {
      if (welkomTerug) {
        AudioEngine.spreek('Welkom terug! ' + cfg.uitleg);
      } else {
        AudioEngine.spreek(cfg.uitleg);
      }
    }
  }, 400);
}

function taakIntroHoorUitleg() {
  const fase = _taakIntroDoorNaar;
  if (!fase) return;
  const cfg = TAAK_INTRO_CONFIG[fase];
  if (cfg) AudioEngine.spreek(cfg.uitleg);
}

function taakIntroVerder() {
  const sleutel = _taakIntroDoorNaar;
  if (!sleutel) return;
  _taakIntroBezocht.add(sleutel);
  _taakIntroDoorNaar = null;
  // Sub-key zoals 'luisteren-oef:verbinden' → terug naar de basis-fase
  // 'luisteren-oef' zodat de oefenvorm-router opnieuw draait en de juiste
  // oefenvorm start (zonder weer naar de intro te springen).
  if (typeof sleutel === 'string' && sleutel.indexOf(':') !== -1) {
    const basisFase = sleutel.split(':')[0];
    taakStartFase(basisFase);
    return;
  }
  taakStartFase(sleutel);
}

function taakIntroAnnuleer() {
  taakVerlaten();
}

// =================================================================
//  TAAK-INTRO DEMO-BOUWERS
// =================================================================
//
// Elke demo-bouwer bouwt een statisch voorbeeld in de demo-container.
// We gebruiken bewuste, kort-cyclische CSS-animaties zodat het kind ziet
// hoe de oefening werkt — geen echte interactie, puur ter illustratie.
// Voorbeelden gebruiken het eerste item uit het taak-thema (of fallback).

function _demoVoorbeelditem() {
  // Pak het eerste item uit de huidige taak; fallback naar een neutraal voorbeeld
  if (taakItems && taakItems.length > 0) return taakItems[0];
  return { tekst: 'het boek', beeld: '📚', kort: 'boek', id: 'demo' };
}

function _demoExtraItems(uitsluit, n) {
  // Pak n extra items uit het thema voor afleiders, vermijd het hoofd-item
  if (!huidigThema) return [];
  const verrijkt = verrijkThema(huidigThema);
  const pool = (verrijkt.items || []).filter(it => it.id !== uitsluit.id).slice(0, n);
  // Als er onvoldoende items zijn, vul aan met dummies
  while (pool.length < n) {
    pool.push({ tekst: '...', beeld: '❔', kort: '...', id: 'dummy-' + pool.length });
  }
  return pool;
}

// LUISTEREN-OEF demo: kind hoort woord, kiest juiste woord-knop.
// Demo: toont een beeld bovenaan, daaronder 4 woord-knoppen, met een zwevend
// vingertje dat naar het juiste woord beweegt en "klikt".
function _bouwDemoLuisterenOef(container) {
  // Welke oefenvorm staat klaar voor de eerstvolgende ronde?
  const oefenvorm = _kiesOefenvormVoorRonde('luisteren');
  if (oefenvorm === 'verbinden') {
    _bouwDemoLuisterenVerbinden(container);
    return;
  }
  if (oefenvorm === 'verslepen') {
    _bouwDemoLuisterenVerslepen(container);
    return;
  }
  // Default = klikspel
  const item = _demoVoorbeelditem();
  const afl = _demoExtraItems(item, 3);
  const opties = [item, ...afl];
  // Schud niet — we willen het juiste antwoord op een vaste positie voor de demo
  // Plaats het juiste op positie 1 (tweede knop) zodat de animatie naar daar wijst
  const juistIdx = 1;
  const geordend = [opties[1], opties[0], opties[2], opties[3]];

  let html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld — klikspel:</div>
      <div class="demo-luister-beeld">${Picto.html(item, { grootte: 64 })}</div>
      <div class="demo-luister-opties">
  `;
  geordend.forEach((opt, i) => {
    html += `<div class="demo-knop ${i === juistIdx ? 'demo-juist' : ''}">${opt.tekst}</div>`;
  });
  html += `
      </div>
      <div class="demo-vinger" style="--demo-target-x: 25%;">👆</div>
      <div class="demo-pijl">↑ klik op het juiste woord</div>
    </div>
  `;
  container.innerHTML = html;
}

// Demo voor verbinden: 3 paren, 1 ervan al getekend met groene lijn
function _bouwDemoLuisterenVerbinden(container) {
  const item = _demoVoorbeelditem();
  const extra = _demoExtraItems(item, 2);
  const items = [item, ...extra];
  // Geschudde rechter kolom voor demo
  const beelden = [items[1], items[0], items[2]];
  let html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld — verbinden:</div>
      <div class="demo-verbinden">
        <div class="demo-verbinden-kolommen">
          <div class="demo-verbinden-kolom">`;
  items.forEach((it, i) => {
    html += `<div class="demo-verbinden-kaart ${i === 0 ? 'demo-juist' : ''}">${it.tekst}</div>`;
  });
  html += `
          </div>
          <div class="demo-verbinden-kolom">`;
  beelden.forEach((it, i) => {
    // Beeld 1 (item.tekst beeld) staat op positie 1 (tweede)
    const isJuist = (it.id === item.id);
    html += `<div class="demo-verbinden-kaart ${isJuist ? 'demo-juist' : ''}">${Picto.html(it, { grootte: 32 })}</div>`;
  });
  html += `
          </div>
        </div>
      </div>
      <div class="demo-pijl">↑ verbind elk woord met het juiste beeld</div>
    </div>
  `;
  container.innerHTML = html;
}

// Demo voor verslepen: beeld bovenaan met pijl die naar juist woord wijst
function _bouwDemoLuisterenVerslepen(container) {
  const item = _demoVoorbeelditem();
  const afl = _demoExtraItems(item, 3);
  const opties = [item, afl[0], afl[1], afl[2]];
  let html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld — verslepen:</div>
      <div class="demo-verslepen-beeld">${Picto.html(item, { grootte: 56 })}</div>
      <div class="demo-verslepen-pijl">⬇</div>
      <div class="demo-verslepen-zones">`;
  opties.forEach((opt, i) => {
    const isJuist = (opt.id === item.id);
    html += `<div class="demo-verslepen-zone ${isJuist ? 'demo-juist' : ''}">${opt.tekst}</div>`;
  });
  html += `
      </div>
      <div class="demo-pijl">sleep het juiste woord naar het lege vak</div>
    </div>
  `;
  container.innerHTML = html;
}

// LUISTEREN-TOETS demo: kind hoort woord, kiest juiste BEELD (4 beelden).
function _bouwDemoLuisterenToets(container) {
  const item = _demoVoorbeelditem();
  const afl = _demoExtraItems(item, 3);
  const geordend = [afl[0], item, afl[1], afl[2]];
  const juistIdx = 1;

  let html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld:</div>
      <div class="demo-toets-woord">${item.tekst}</div>
      <div class="demo-toets-beelden">
  `;
  geordend.forEach((opt, i) => {
    html += `<div class="demo-beeld-knop ${i === juistIdx ? 'demo-juist' : ''}">${Picto.html(opt, { grootte: 36 })}</div>`;
  });
  html += `
      </div>
      <div class="demo-vinger" style="--demo-target-x: 38%;">👆</div>
      <div class="demo-pijl">↑ klik op het juiste beeld</div>
    </div>
  `;
  container.innerHTML = html;
}

// LEZEN-OEF/TOETS demo: kind ziet woord groot, kiest juiste beeld uit 4.
function _bouwDemoLezenOef(container) {
  const item = _demoVoorbeelditem();
  const afl = _demoExtraItems(item, 3);
  const geordend = [afl[0], item, afl[1], afl[2]];
  const juistIdx = 1;

  let html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld:</div>
      <div class="demo-lezen-woord">${item.tekst}</div>
      <div class="demo-toets-beelden">
  `;
  geordend.forEach((opt, i) => {
    html += `<div class="demo-beeld-knop ${i === juistIdx ? 'demo-juist' : ''}">${Picto.html(opt, { grootte: 36 })}</div>`;
  });
  html += `
      </div>
      <div class="demo-vinger" style="--demo-target-x: 38%;">👆</div>
      <div class="demo-pijl">↑ klik op het juiste beeld</div>
    </div>
  `;
  container.innerHTML = html;
}

// SCHRIJVEN-OEF demo: animatie 3 sec woord zichtbaar, dan verdwijnt het, dan
// tikt een vingertje het in het typvak.
function _bouwDemoSchrijvenOef(container) {
  const item = _demoVoorbeelditem();
  const html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld:</div>
      <div class="demo-schrijven-rij">
        <div class="demo-beeld-mini">${Picto.html(item, { grootte: 40 })}</div>
        <div class="demo-schrijven-woord-knipper">${item.tekst}</div>
      </div>
      <div class="demo-schrijven-input-rij">
        <div class="demo-input-vak"><span class="demo-getypt"></span><span class="demo-cursor">|</span></div>
      </div>
      <div class="demo-pijl">het woord verdwijnt na 3 seconden — typ het over</div>
    </div>
  `;
  container.innerHTML = html;
  // Animatie: simuleer dat het woord wordt getypt nadat het zichtbaar verdween
  const getyptEl = container.querySelector('.demo-getypt');
  if (!getyptEl) return;
  const target = item.tekst;
  let i = 0;
  // Wacht 3.2s totdat woord "verdwijnt" via CSS, dan typen
  setTimeout(() => {
    if (!container.isConnected) return;
    const interval = setInterval(() => {
      if (!container.isConnected) { clearInterval(interval); return; }
      i++;
      if (i > target.length) {
        clearInterval(interval);
        // Loop opnieuw na pauze
        setTimeout(() => {
          if (!container.isConnected) return;
          getyptEl.textContent = '';
          // Herstart full demo via reload van bouw-demo
          _bouwDemoSchrijvenOef(container);
        }, 1500);
        return;
      }
      getyptEl.textContent = target.substring(0, i);
    }, 220);
  }, 3200);
}

// SCHRIJVEN-TOETS demo: enkel beeld + typvak — geen woord-3s-zichtbaar fase.
function _bouwDemoSchrijvenToets(container) {
  const item = _demoVoorbeelditem();
  const html = `
    <div class="demo-blok">
      <div class="demo-label">Voorbeeld:</div>
      <div class="demo-beeld-mini-groot">${Picto.html(item, { grootte: 56 })}</div>
      <div class="demo-schrijven-input-rij">
        <div class="demo-input-vak"><span class="demo-getypt"></span><span class="demo-cursor">|</span></div>
      </div>
      <div class="demo-pijl">typ het juiste woord — één kans</div>
    </div>
  `;
  container.innerHTML = html;
  // Type-animatie zonder vooraf-zichtbaar woord
  const getyptEl = container.querySelector('.demo-getypt');
  if (!getyptEl) return;
  const target = item.tekst;
  let i = 0;
  setTimeout(() => {
    if (!container.isConnected) return;
    const interval = setInterval(() => {
      if (!container.isConnected) { clearInterval(interval); return; }
      i++;
      if (i > target.length) {
        clearInterval(interval);
        setTimeout(() => {
          if (!container.isConnected) return;
          getyptEl.textContent = '';
          _bouwDemoSchrijvenToets(container);
        }, 1500);
        return;
      }
      getyptEl.textContent = target.substring(0, i);
    }, 220);
  }, 600);
}

// Verlaat de taak en ga terug naar startscherm.
function taakVerlaten() {
  taakModus = false;
  taakHuidigeFase = null;
  taakItems = [];
  taakLeerIndex = 0;
  taakOefItem = null;
  _taakIntroBezocht = new Set();
  _taakIntroDoorNaar = null;
  _taakHernemen = false;
  if (taakSchrijvenWoordTimer) {
    clearTimeout(taakSchrijvenWoordTimer);
    taakSchrijvenWoordTimer = null;
  }
  AudioEngine.stop();
  naarStart();
}

// =================================================================
//  TAAK FASE 1 — LEREN  (audio mag automatisch)
// =================================================================
function taakRendererLeren() {
  if (taakItems.length === 0) return;
  const item = taakItems[taakLeerIndex];
  const taak = Voortgang.getTaak();

  const taakToontZin = !!(taak && taak.zinscontext && item.zin && item.zin.trim());
  document.getElementById('taak-leer-beeld').innerHTML = Picto.html(item, { zin: taakToontZin });
  document.getElementById('taak-leer-woord').textContent = item.tekst;

  // Zin tonen indien zinscontext aan en zin bestaat
  const zinEl = document.getElementById('taak-leer-zin');
  const zinKnop = document.getElementById('taak-leer-zin-knop');
  const toonZin = taakToontZin;
  if (zinEl) {
    zinEl.style.display = toonZin ? '' : 'none';
    zinEl.textContent = toonZin ? item.zin : '';
  }
  if (zinKnop) zinKnop.style.display = toonZin ? '' : 'none';

  // Tellers
  document.getElementById('taak-leer-huidig').textContent = taakLeerIndex + 1;
  document.getElementById('taak-leer-totaal').textContent = taakItems.length;

  // Vorige/volgende-knoppen
  const vorigeKnop = document.getElementById('taak-leer-vorige');
  const volgendeKnop = document.getElementById('taak-leer-volgende');
  if (vorigeKnop) vorigeKnop.disabled = (taakLeerIndex === 0);
  if (volgendeKnop) {
    if (taakLeerIndex >= taakItems.length - 1) {
      volgendeKnop.textContent = '▶ Verder';
      volgendeKnop.classList.add('eind');
    } else {
      volgendeKnop.textContent = 'Volgende →';
      volgendeKnop.classList.remove('eind');
    }
  }

  // Registreer gezien (gebruik bestaande sterren-systeem voor stats)
  Voortgang.registreerGezien(huidigThema.id, item.id);

  // Audio: mag automatisch in leren-fase
  spreekVeilig(item.tekst, 300);
}

function taakLeerHoorWoord() {
  if (taakItems[taakLeerIndex]) AudioEngine.spreek(taakItems[taakLeerIndex].tekst);
}

function taakLeerHoorZin() {
  const item = taakItems[taakLeerIndex];
  if (item && item.zin) AudioEngine.spreek(item.zin);
}

function taakLeerVorige() {
  if (taakLeerIndex > 0) {
    taakLeerIndex--;
    taakRendererLeren();
  }
}

function taakLeerVolgende() {
  if (taakLeerIndex >= taakItems.length - 1) {
    // Einde leren → volgende fase volgens fase-lijst
    const taak = Voortgang.getTaak();
    taakStartFase(_volgendeFase('leren', taak));
    return;
  }
  taakLeerIndex++;
  taakRendererLeren();
}

// =================================================================
//  TAAK FASE 2 — LUISTEREN-OEFENEN  (klikspel, stilte, audio op vraag)
// =================================================================
function taakStartLuisterenOefenen() {
  const taak = Voortgang.getTaak();
  // Eerst: zijn alle rondes voorbij? Dan door naar volgende fase.
  const ruwe = _ruweRonde('luisteren');
  const max = _maxRondesVoor('luisteren');
  if (ruwe > max) {
    taakStartFase(_volgendeFase('luisteren-oef', taak));
    return;
  }

  // Pak een woord dat nog niet behandeld is in de huidige ronde
  const item = _kiesVolgendOefenItem('luisteren');
  if (!item) {
    // Geen kandidaten in deze ronde → volgende fase volgens lijst
    taakStartFase(_volgendeFase('luisteren-oef', taak));
    return;
  }

  // Welke oefenvorm voor deze ronde?
  const oefenvorm = _kiesOefenvormVoorRonde('luisteren');

  // INTRO bij elke nieuwe oefenvorm tonen — niet enkel bij fase-wissel.
  // Sleutel = 'luisteren-oef:<oefenvorm>'. Als nog niet bezocht, eerst intro.
  const introSleutel = 'luisteren-oef:' + oefenvorm;
  if (!_taakIntroBezocht.has(introSleutel)) {
    _taakIntroDoorNaar = introSleutel;
    taakHuidigeFase = 'intro:' + introSleutel;
    taakToonIntro(introSleutel);
    return;
  }

  taakOefItem = item;

  if (oefenvorm === 'verbinden') {
    taakStartLuisterenVerbinden();
  } else if (oefenvorm === 'verslepen') {
    taakStartLuisterenVerslepen();
  } else {
    // Default = klikspel
    taakRendererLuisterenOefenen();
    toonScherm('scherm-taak-oefenen');
  }
}

// Bepaal welke oefenvorm we in de huidige ronde gebruiken voor een vaardigheid.
// We cyclen door de aangevinkte oefenvormen op basis van de RUWE ronde-waarde
// (niet geclampt aan max), zodat de cyclus correct doorrolt.
function _kiesOefenvormVoorRonde(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak) return 'klikspel';
  const veld = 'oefenvormen_' + vaardigheid;
  const aangevinkt = Array.isArray(taak[veld]) ? taak[veld] : [];
  if (aangevinkt.length === 0) {
    // Default per vaardigheid
    if (vaardigheid === 'luisteren') return 'klikspel';
    if (vaardigheid === 'lezen')     return 'woord-beeld';
    if (vaardigheid === 'schrijven') return 'overtypen';
  }
  if (aangevinkt.length === 1) return aangevinkt[0];
  // Cyclisch op basis van RAW ronde, zodat ronde 1 → idx 0, ronde 2 → idx 1, enz.
  const r = _ruweRonde(vaardigheid);
  const idx = (r - 1) % aangevinkt.length;
  return aangevinkt[idx];
}

// Kies item dat nog niet "zit" op een vaardigheid. Geeft null als alles zit.
// Drempel: hoe vaak moet een woord juist zijn op deze vaardigheid voor het kind
// door mag naar de toets/volgende fase?
//   - luisteren / lezen → 3× juist (snelle keuzeoefeningen)
//   - schrijven         → 2× juist standaard, 3× als kind het ooit fout had
//                         (schrijven duurt lang dus minder herhalingen tenzij nodig)
function _drempelVoor(vaardigheid, woordData) {
  // (Behouden voor backwards compatibility maar nu enkel relevant voor schrijven.)
  if (vaardigheid !== 'schrijven') return 3;
  const fout = (woordData && woordData.schrijven_fout) || 0;
  return fout > 0 ? 3 : 2;
}

// Maximum aantal rondes per vaardigheid in deze taak.
//   - luisteren / lezen: altijd 3
//   - schrijven: 2 standaard, 3 als er minstens één woord ooit fout is geweest
function _maxRondesVoor(vaardigheid) {
  if (vaardigheid !== 'schrijven') return 3;
  const taak = Voortgang.getTaak();
  if (!taak || !taakItems) return 2;
  const heeftFout = taakItems.some(it => {
    const d = taak.perWoord && taak.perWoord[it.id];
    return d && (d.schrijven_fout || 0) > 0;
  });
  return heeftFout ? 3 : 2;
}

// Bepaal in welke ronde het kind nu zit. Ronde-status wordt nu rechtstreeks
// uit taak.rondeStatus[vaardigheid] gehaald (niet meer afgeleid uit juist-tellers).
function _huidigeRonde(vaardigheid) {
  const taak = Voortgang.getTaak();
  const max = _maxRondesVoor(vaardigheid);
  if (!taak || !taak.rondeStatus || !taak.rondeStatus[vaardigheid]) {
    return { huidig: 1, max };
  }
  const huidig = Math.min(taak.rondeStatus[vaardigheid].huidigeRonde || 1, max);
  return { huidig, max };
}

// Geeft de raw ronde-waarde uit de taak-state, NIET geclampt aan max.
// Gebruikt door de router om te detecteren "we zijn voorbij alle rondes → klaar".
function _ruweRonde(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak || !taak.rondeStatus || !taak.rondeStatus[vaardigheid]) return 1;
  return taak.rondeStatus[vaardigheid].huidigeRonde || 1;
}

// Update de ronde-badge in een oefen-scherm.
function _updateRondeBadge(badgeId, vaardigheid) {
  const el = document.getElementById(badgeId);
  if (!el) return;
  const r = _huidigeRonde(vaardigheid);
  el.textContent = `Ronde ${r.huidig} van ${r.max}`;
}

// Welke woorden moet het kind in de huidige ronde nog behandelen?
// Standaard: alle woorden uit de taak die nog niet behandeld zijn deze ronde.
// Speciaal: bij schrijven ronde 3 → alleen woorden met schrijven_fout > 0.
function _resterendeWoordenInRonde(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak) return [];
  const r = _huidigeRonde(vaardigheid);
  // Klaar als we voorbij de max-ronde zijn
  if (r.huidig > r.max) return [];

  const status = taak.rondeStatus && taak.rondeStatus[vaardigheid];
  const behandeld = status && Array.isArray(status.behandeldDezeRonde)
                       ? status.behandeldDezeRonde : [];

  // Welke woorden komen in deze ronde aan bod?
  let pool;
  if (vaardigheid === 'schrijven' && r.huidig === 3) {
    // Ronde 3 schrijven: enkel fout-woorden
    pool = taakItems.filter(it => {
      const d = taak.perWoord && taak.perWoord[it.id];
      return d && (d.schrijven_fout || 0) > 0;
    });
  } else {
    pool = [...taakItems];
  }

  // Filter de al-behandelde uit
  return pool.filter(it => behandeld.indexOf(it.id) === -1);
}

// Wrapper: registreer juist/fout antwoord én markeer woord als behandeld in
// huidige ronde. Geeft true terug als de ronde door dit antwoord werd afgerond.
async function _registreerAntwoord(woordId, vaardigheid, isJuist) {
  if (isJuist) {
    await Voortgang.registreerJuistInTaak(woordId, vaardigheid);
  } else {
    await Voortgang.registreerFoutInTaak(woordId, vaardigheid);
  }
  // Markeer behandeld — pas door naar volgende ronde als alle woorden behandeld zijn
  const woordIds = _woordIdsVoorRonde(vaardigheid);
  const result = await Voortgang.registreerWoordBehandeldInRonde(woordId, vaardigheid, woordIds);
  return result.rondeAfgerond;
}

// Bereken voortgang in oefen-fase op basis van ronde + behandelde woorden.
// Returns { klaar, totaal } voor in voortgangsbalk + teller.
function _voortgangVoorVaardigheid(vaardigheid) {
  const taak = Voortgang.getTaak();
  const r = _huidigeRonde(vaardigheid);
  // Totaal = aantal woorden × max-rondes (= alle "stappen" die kind moet doen)
  const totaal = (taakItems ? taakItems.length : 0) * r.max;
  // Klaar = (afgewerkte rondes × aantal woorden) + behandeld in huidige ronde
  const status = taak && taak.rondeStatus && taak.rondeStatus[vaardigheid];
  const behandeld = status && Array.isArray(status.behandeldDezeRonde) ? status.behandeldDezeRonde.length : 0;
  const huidigRonde = Math.min(r.huidig, r.max);
  const klaar = ((huidigRonde - 1) * (taakItems ? taakItems.length : 0)) + behandeld;
  return { klaar, totaal };
}

function _kiesVolgendOefenItem(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak) return null;
  const r = _huidigeRonde(vaardigheid);
  if (r.huidig > r.max) return null; // alle rondes klaar

  let resterend = _resterendeWoordenInRonde(vaardigheid);

  // Als deze ronde leeg is (alle woorden behandeld), forceren we doorgang naar
  // de volgende ronde. Dit kan gebeuren als rondestatus stale is.
  if (resterend.length === 0) {
    return null;
  }

  // Vorig item uitsluiten als er meer dan 1 kandidaat is — voorkomt dat
  // hetzelfde woord 2x na elkaar komt
  const vorigeId = taakOefItem ? taakOefItem.id : null;
  if (vorigeId && resterend.length > 1) {
    const zonderVorige = resterend.filter(it => it.id !== vorigeId);
    if (zonderVorige.length > 0) resterend = zonderVorige;
  }

  return resterend[Math.floor(Math.random() * resterend.length)];
}

// Welke woord-IDs horen in de huidige ronde aan bod te komen?
// Wordt gebruikt om te detecteren wanneer een ronde compleet is.
function _woordIdsVoorRonde(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak) return [];
  const r = _huidigeRonde(vaardigheid);
  if (vaardigheid === 'schrijven' && r.huidig === 3) {
    return taakItems
      .filter(it => {
        const d = taak.perWoord && taak.perWoord[it.id];
        return d && (d.schrijven_fout || 0) > 0;
      })
      .map(it => it.id);
  }
  return taakItems.map(it => it.id);
}

function taakRendererLuisterenOefenen() {
  if (!taakOefItem) return;
  const taak = Voortgang.getTaak();

  // Beeld in het oefen-scherm
  document.getElementById('taak-oef-beeld').innerHTML = Picto.html(taakOefItem);

  // Voortgang: gebruik ronde-gebaseerde berekening
  const v = _voortgangVoorVaardigheid('luisteren');
  document.getElementById('taak-oef-klaar').textContent = v.klaar;
  document.getElementById('taak-oef-totaal').textContent = v.totaal;
  // Voortgangsbalk
  const pct = v.totaal > 0 ? (v.klaar / v.totaal) * 100 : 0;
  const balk = document.getElementById('taak-oef-balk');
  if (balk) balk.style.width = pct + '%';
  // Ronde-badge
  _updateRondeBadge('taak-oef-ronde', 'luisteren');

  // Bouw 4 woord-knoppen: het juiste + 3 afleiders uit het thema
  const verrijkt = verrijkThema(huidigThema);
  const beschikbAfl = verrijkt.items.filter(x => x.id !== taakOefItem.id);
  const afl = [];
  while (afl.length < 3 && beschikbAfl.length > 0) {
    const idx = Math.floor(Math.random() * beschikbAfl.length);
    afl.push(beschikbAfl[idx]);
    beschikbAfl.splice(idx, 1);
  }
  const opties = [taakOefItem, ...afl].sort(() => Math.random() - 0.5);

  const div = document.getElementById('taak-oef-opties');
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'optie-knop';
    k.textContent = opt.tekst;
    k.onclick = () => taakKiesOefAntwoord(k, opt);
    div.appendChild(k);
  });

  // Belangrijk: GEEN automatische audio in oefen-fase.
  // Kind moet zelf op hoorknop klikken om het woord te horen.
}

function taakOefHoor() {
  if (taakOefItem) AudioEngine.spreek(taakOefItem.tekst);
}

async function taakKiesOefAntwoord(knop, gekozen) {
  document.querySelectorAll('#taak-oef-opties .optie-knop').forEach(k => k.disabled = true);

  const isJuist = (gekozen.id === taakOefItem.id);
  if (isJuist) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('#taak-oef-opties .optie-knop').forEach(k => {
      if (k.textContent === taakOefItem.tekst) k.classList.add('juist');
    });
    Voortgang.registreerFout(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  }
  await _registreerAntwoord(taakOefItem.id, 'luisteren', isJuist);

  setTimeout(() => {
    if (!taakModus) return;
    taakStartLuisterenOefenen(); // herhaalt: kies volgende
  }, 1400);
}

// =================================================================
//  TAAK FASE 3 — MINI-TOETS LUISTEREN  (klikspel zonder feedback)
// =================================================================
let taakToetsLijst = [];
let taakToetsIdx = 0;
let taakToetsJuist = 0;
let taakToetsFoutIds = [];

function taakStartLuisterenToets() {
  taakToetsLijst = [...taakItems].sort(() => Math.random() - 0.5);
  taakToetsIdx = 0;
  taakToetsJuist = 0;
  taakToetsFoutIds = [];
  document.getElementById('taak-toets-totaal').textContent = taakToetsLijst.length;
  taakRendererToets();
  toonScherm('scherm-taak-toets');
}

// Gebruik eerst afleiders uit de gekozen taak. Alleen bij minder dan vier
// taakwoorden vullen we aan met beelden uit hetzelfde thema.
function _taakToetsBeeldOpties(item) {
  const kandidaten = [];
  const gezien = new Set([item.id]);
  [...taakItems, ...verrijkThema(huidigThema).items].forEach(opt => {
    if (!opt || gezien.has(opt.id) || _zijnVisueelVerwarrend(item, opt)) return;
    gezien.add(opt.id);
    kandidaten.push(opt);
  });
  return [item, ...kandidaten.sort(() => Math.random() - .5).slice(0, 3)]
    .sort(() => Math.random() - .5);
}

// Sommige verwantschappen zijn op een los portret niet eerlijk uit elkaar te
// houden (bv. broer/neef). Zet zulke beelden nooit samen in een beeldvraag.
function _zijnVisueelVerwarrend(a, b) {
  if (!a || !b) return false;
  return (Array.isArray(a.visueelVerwarrendMet) && a.visueelVerwarrendMet.includes(b.id)) ||
         (Array.isArray(b.visueelVerwarrendMet) && b.visueelVerwarrendMet.includes(a.id));
}

function taakRendererToets() {
  const item = taakToetsLijst[taakToetsIdx];
  if (!item) return;
  document.getElementById('taak-toets-huidig').textContent = taakToetsIdx + 1;

  // Luistertoets: toon het geschreven woord niet.
  const beeldEl = document.getElementById('taak-toets-beeld');
  if (beeldEl) {
    beeldEl.innerHTML = '<div class="taak-toets-luisterteken"><span>👂</span><strong>Luister en kies het juiste beeld</strong></div>';
  }

  // Voortgangsbalk
  const pct = (taakToetsIdx / taakToetsLijst.length) * 100;
  const balk = document.getElementById('taak-toets-balk');
  if (balk) balk.style.width = pct + '%';

  // 4 opties als BEELDEN (niet als woordknoppen): het juiste + 3 afleiders
  const opties = _taakToetsBeeldOpties(item);

  const div = document.getElementById('taak-toets-opties');
  div.innerHTML = '';
  div.className = 'taak-toets-beeld-rij'; // andere layout dan optie-rij
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'taak-toets-beeld-knop';
    k.innerHTML = Picto.html(opt, { grootte: 80 });
    k.dataset.id = opt.id;
    k.onclick = () => taakKiesToetsAntwoord(k, opt, item);
    div.appendChild(k);
  });

  setTimeout(() => {
    if (taakModus && taakToetsLijst[taakToetsIdx] === item) taakToetsHoor();
  }, 180);
}

function taakToetsHoor() {
  const item = taakToetsLijst[taakToetsIdx];
  if (item) AudioEngine.spreek(item.tekst);
}

async function taakKiesToetsAntwoord(knop, gekozen, juistItem) {
  document.querySelectorAll('#taak-toets-opties .taak-toets-beeld-knop').forEach(k => k.disabled = true);

  if (gekozen.id === juistItem.id) {
    taakToetsJuist++;
    Voortgang.registreerJuist(huidigThema.id, juistItem.id);
  } else {
    if (taakToetsFoutIds.indexOf(juistItem.id) === -1) taakToetsFoutIds.push(juistItem.id);
    Voortgang.registreerFout(huidigThema.id, juistItem.id);
  }
  knop.classList.add('gekozen');

  setTimeout(() => {
    if (!taakModus) return;
    taakToetsIdx++;
    if (taakToetsIdx >= taakToetsLijst.length) {
      taakEindigToets('luisteren');
    } else {
      taakRendererToets();
    }
  }, 650);
}

// =================================================================
//  TAAK FASE — LUISTEREN-VERBINDEN  (woord ↔ beeld lijntjes trekken)
// =================================================================
//
// Pedagogisch: kind ziet 4-5 woorden links en de bijhorende beelden rechts
// (geschud). Klikken op een woord-kaart, dan op een beeld-kaart → lijntje.
// Als alle paren gelegd: knop "Klaar" → controle.
// Score: per juist verbonden paar +1 op luisteren_juist (max bereikt drempel).

let _verbindenItems = [];          // de woorden waarmee we werken (max 5)
let _verbindenBeelden = [];        // geschudde versie voor rechter kolom
let _verbindenGekozenWoord = null; // huidig geselecteerde woord-id (wachtend op beeld)
let _verbindenLijntjes = {};       // map van woordId → beeldId (voorgestelde paren)
let _verbindenGroepjesQueue = [];  // wachtrij van groepjes voor deze ronde

// Verdeel een woord-array in groepjes met max-grootte. Gelijk verdelen.
// Bv. 8 woorden, max 5: → [4,4]. 7: → [4,3]. 6: → [3,3]. 9: → [5,4]. 10: → [5,5].
function _verbindenGroepjes(items, maxPerGroep) {
  const n = items.length;
  if (n <= maxPerGroep) return [items];
  // Bepaal aantal groepjes (= ceil)
  const aantal = Math.ceil(n / maxPerGroep);
  // Probeer gelijk verdelen
  const basis = Math.floor(n / aantal);
  const rest = n % aantal;
  const groepjes = [];
  let i = 0;
  for (let g = 0; g < aantal; g++) {
    const grootte = basis + (g < rest ? 1 : 0);
    groepjes.push(items.slice(i, i + grootte));
    i += grootte;
  }
  return groepjes;
}

function _verbindenVeiligeGroepjes(items, maxPerGroep) {
  const groepen = [];
  items.forEach(item => {
    let groep = groepen.find(g =>
      g.length < maxPerGroep && !g.some(ander => _zijnVisueelVerwarrend(item, ander))
    );
    if (!groep) {
      groep = [];
      groepen.push(groep);
    }
    groep.push(item);
  });
  return groepen;
}

function taakStartLuisterenVerbinden() {
  const taak = Voortgang.getTaak();
  if (!taak) return;
  // Pak ALLE woorden die nog niet hun drempel hebben (niet maar 5!)
  const sleutel = 'luisteren_juist';
  const kandidaten = taakItems.filter(it => {
    const data = taak.perWoord && taak.perWoord[it.id] ? taak.perWoord[it.id] : null;
    const teller = data ? (data[sleutel] || 0) : 0;
    const drempel = _drempelVoor('luisteren', data);
    return teller < drempel;
  });
  if (kandidaten.length === 0) {
    taakStartFase(_volgendeFase('luisteren-oef', taak));
    return;
  }
  // Als slechts 1 kandidaat over: val terug op klikspel (verbinden heeft min 2 paren nodig)
  if (kandidaten.length < 2) {
    taakOefItem = kandidaten[0];
    taakRendererLuisterenOefenen();
    toonScherm('scherm-taak-oefenen');
    return;
  }
  // Verdeel in groepjes (max 5 per scherm) en zet als queue
  // Schud eerst zodat de groepjes elke ronde anders zijn
  const geschud = [...kandidaten].sort(() => Math.random() - 0.5);
  _verbindenGroepjesQueue = _verbindenVeiligeGroepjes(geschud, 5);
  _toonVolgendVerbindenGroepje();
}

// Toont het volgende groepje uit de queue. Als de queue leeg is, gaan we
// naar de volgende oefenvorm/fase.
function _toonVolgendVerbindenGroepje() {
  if (!_verbindenGroepjesQueue || _verbindenGroepjesQueue.length === 0) {
    // Alle groepjes klaar → terug naar router voor volgende ronde of fase
    taakStartLuisterenOefenen();
    return;
  }
  const groep = _verbindenGroepjesQueue.shift();
  _verbindenItems = groep;
  _verbindenBeelden = [...groep].sort(() => Math.random() - 0.5);
  _verbindenGekozenWoord = null;
  _verbindenLijntjes = {};
  taakRendererVerbinden();
  toonScherm('scherm-taak-verbinden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => _renderVerbindenLijnen());
  });
}

function taakRendererVerbinden() {
  const taak = Voortgang.getTaak();
  if (!taak) return;

  // Voortgangsteller — ronde-gebaseerd
  const v = _voortgangVoorVaardigheid('luisteren');
  document.getElementById('taak-verbinden-klaar').textContent = v.klaar;
  document.getElementById('taak-verbinden-totaal').textContent = v.totaal;
  const balk = document.getElementById('taak-verbinden-balk');
  if (balk) balk.style.width = (v.totaal > 0 ? (v.klaar / v.totaal) * 100 : 0) + '%';
  _updateRondeBadge('taak-verbinden-ronde', 'luisteren');

  // Bouw woorden-kolom (links) en beelden-kolom (rechts)
  const woordKol = document.getElementById('verbinden-kolom-woorden');
  const beeldKol = document.getElementById('verbinden-kolom-beelden');
  if (!woordKol || !beeldKol) return;
  woordKol.innerHTML = '';
  beeldKol.innerHTML = '';

  _verbindenItems.forEach(it => {
    const w = document.createElement('button');
    w.className = 'verbinden-kaart verbinden-woord';
    w.dataset.woordId = it.id;
    w.innerHTML = `<span class="verbinden-tekst">${it.tekst}</span>
                   <span class="verbinden-knoppunt"></span>`;
    w.onclick = () => taakVerbindenKlikWoord(it.id);
    woordKol.appendChild(w);
  });

  _verbindenBeelden.forEach(it => {
    const b = document.createElement('button');
    b.className = 'verbinden-kaart verbinden-beeld';
    b.dataset.beeldId = it.id;
    b.innerHTML = `<span class="verbinden-knoppunt"></span>
                   <span class="verbinden-pic">${Picto.html(it, { grootte: 88 })}</span>`;
    b.onclick = () => taakVerbindenKlikBeeld(it.id);
    beeldKol.appendChild(b);
  });

  // Reset SVG
  const svg = document.getElementById('verbinden-lijnen');
  if (svg) svg.innerHTML = '';

  // Klaar-knop disabled tot alle paren gelegd zijn
  _updateVerbindenKlaarKnop();
}

function taakVerbindenKlikWoord(woordId) {
  // Als dit woord al een lijn heeft → koppel los
  if (_verbindenLijntjes[woordId]) {
    delete _verbindenLijntjes[woordId];
    _verbindenGekozenWoord = woordId;
    _renderVerbindenSelectie();
    _renderVerbindenLijnen();
    _updateVerbindenKlaarKnop();
    return;
  }
  _verbindenGekozenWoord = woordId;
  _renderVerbindenSelectie();
}

function taakVerbindenKlikBeeld(beeldId) {
  // Als dit beeld al gekoppeld is aan een woord → koppel los
  const reedsGekoppeldWoord = Object.keys(_verbindenLijntjes).find(wId => _verbindenLijntjes[wId] === beeldId);
  if (reedsGekoppeldWoord) {
    delete _verbindenLijntjes[reedsGekoppeldWoord];
    _renderVerbindenLijnen();
    _renderVerbindenSelectie();
    _updateVerbindenKlaarKnop();
    return;
  }
  // Anders: koppel huidig gekozen woord aan dit beeld
  if (!_verbindenGekozenWoord) return;
  _verbindenLijntjes[_verbindenGekozenWoord] = beeldId;
  _verbindenGekozenWoord = null;
  _renderVerbindenSelectie();
  _renderVerbindenLijnen();
  _updateVerbindenKlaarKnop();
}

function _renderVerbindenSelectie() {
  // Markeer geselecteerd woord
  document.querySelectorAll('.verbinden-woord').forEach(el => {
    if (el.dataset.woordId === _verbindenGekozenWoord) {
      el.classList.add('geselecteerd');
    } else {
      el.classList.remove('geselecteerd');
    }
    if (_verbindenLijntjes[el.dataset.woordId]) {
      el.classList.add('gekoppeld');
    } else {
      el.classList.remove('gekoppeld');
    }
  });
  // Markeer gekoppelde beelden
  const gekoppeldeBeelden = new Set(Object.values(_verbindenLijntjes));
  document.querySelectorAll('.verbinden-beeld').forEach(el => {
    if (gekoppeldeBeelden.has(el.dataset.beeldId)) {
      el.classList.add('gekoppeld');
    } else {
      el.classList.remove('gekoppeld');
    }
  });
}

function _renderVerbindenLijnen() {
  const wrap = document.getElementById('verbinden-wrap');
  const svg = document.getElementById('verbinden-lijnen');
  if (!wrap || !svg) return;
  // Update SVG-grootte
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrapRect.width);
  svg.setAttribute('height', wrapRect.height);
  svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);
  svg.innerHTML = '';

  Object.keys(_verbindenLijntjes).forEach(woordId => {
    const beeldId = _verbindenLijntjes[woordId];
    const woordEl = document.querySelector(`.verbinden-woord[data-woord-id="${woordId}"]`);
    const beeldEl = document.querySelector(`.verbinden-beeld[data-beeld-id="${beeldId}"]`);
    if (!woordEl || !beeldEl) return;
    const wPunt = woordEl.querySelector('.verbinden-knoppunt');
    const bPunt = beeldEl.querySelector('.verbinden-knoppunt');
    if (!wPunt || !bPunt) return;
    const wRect = wPunt.getBoundingClientRect();
    const bRect = bPunt.getBoundingClientRect();
    const x1 = wRect.left + wRect.width / 2 - wrapRect.left;
    const y1 = wRect.top + wRect.height / 2 - wrapRect.top;
    const x2 = bRect.left + bRect.width / 2 - wrapRect.left;
    const y2 = bRect.top + bRect.height / 2 - wrapRect.top;
    const lijn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lijn.setAttribute('x1', x1);
    lijn.setAttribute('y1', y1);
    lijn.setAttribute('x2', x2);
    lijn.setAttribute('y2', y2);
    lijn.setAttribute('class', 'verbinden-lijn');
    lijn.dataset.woordId = woordId;
    svg.appendChild(lijn);
  });
}

function _updateVerbindenKlaarKnop() {
  const knop = document.getElementById('verbinden-klaar-knop');
  if (!knop) return;
  const aantalPaar = Object.keys(_verbindenLijntjes).length;
  knop.disabled = aantalPaar < _verbindenItems.length;
}

async function taakVerbindenKlaar() {
  // Controleer alle paren: voor elk woord, koppelt het aan zichzelf?
  let aantalJuist = 0;
  let aantalFout = 0;
  // Markeer lijnen groen/rood
  const svg = document.getElementById('verbinden-lijnen');
  Object.keys(_verbindenLijntjes).forEach(woordId => {
    const beeldId = _verbindenLijntjes[woordId];
    const lijn = svg ? svg.querySelector(`line[data-woord-id="${woordId}"]`) : null;
    if (woordId === beeldId) {
      aantalJuist++;
      if (lijn) lijn.setAttribute('class', 'verbinden-lijn juist');
    } else {
      aantalFout++;
      if (lijn) lijn.setAttribute('class', 'verbinden-lijn fout');
    }
  });

  // Update tellers per woord — én markeer als behandeld in ronde
  for (const it of _verbindenItems) {
    const beeldId = _verbindenLijntjes[it.id];
    const isJuist = (beeldId === it.id);
    await _registreerAntwoord(it.id, 'luisteren', isJuist);
  }

  // Toon kort feedback en ga door na 1.8 sec naar volgend groepje (of einde ronde)
  setTimeout(() => {
    if (!taakModus) return;
    if (_verbindenGroepjesQueue && _verbindenGroepjesQueue.length > 0) {
      _toonVolgendVerbindenGroepje();
    } else {
      // Geen groepjes meer in deze ronde → terug naar router voor volgende oefenvorm/fase
      taakStartLuisterenOefenen();
    }
  }, 1800);
}

// Bij vensterresize moet de SVG opnieuw getekend worden zodat lijnen mee verschuiven.
window.addEventListener('resize', () => {
  if (taakHuidigeFase === 'luisteren-oef' &&
      document.getElementById('scherm-taak-verbinden') &&
      document.getElementById('scherm-taak-verbinden').classList.contains('actief')) {
    _renderVerbindenLijnen();
  }
});


// =================================================================
//  TAAK FASE — LUISTEREN-VERSLEPEN  (sleep woord naar leeg vak bij beeld)
// =================================================================
//
// Pedagogisch: kind ziet 1 beeld bovenaan met een leeg vak ernaast (=plaats
// voor het woord-label), en 4 woord-knoppen onderaan. Sleep de juiste woord-
// knop in het lege vak. Werkt met Pointer Events (muis + touch).

let _verslepenItem = null;
let _verslepenOpties = [];
let _verslepenDraggingEl = null;
let _verslepenStartX = 0;
let _verslepenStartY = 0;
let _verslepenOffsetX = 0;
let _verslepenOffsetY = 0;
let _verslepenAfHandeling = false;

function taakStartLuisterenVerslepen() {
  const item = _kiesVolgendOefenItem('luisteren');
  if (!item) {
    const taak = Voortgang.getTaak();
    taakStartFase(_volgendeFase('luisteren-oef', taak));
    return;
  }
  taakOefItem = item;
  _verslepenItem = item;

  // 3 afleiders + juist woord
  const verrijkt = verrijkThema(huidigThema);
  const beschikbAfl = verrijkt.items.filter(x => x.id !== item.id);
  const afl = [];
  while (afl.length < 3 && beschikbAfl.length > 0) {
    const idx = Math.floor(Math.random() * beschikbAfl.length);
    afl.push(beschikbAfl[idx]);
    beschikbAfl.splice(idx, 1);
  }
  _verslepenOpties = [item, ...afl].sort(() => Math.random() - 0.5);
  _verslepenAfHandeling = false;

  taakRendererVerslepen();
  toonScherm('scherm-taak-verslepen');
}

function taakRendererVerslepen() {
  const taak = Voortgang.getTaak();
  if (!taak || !_verslepenItem) return;

  // Voortgang — ronde-gebaseerd
  const v = _voortgangVoorVaardigheid('luisteren');
  document.getElementById('taak-verslepen-klaar').textContent = v.klaar;
  document.getElementById('taak-verslepen-totaal').textContent = v.totaal;
  const balk = document.getElementById('taak-verslepen-balk');
  if (balk) balk.style.width = (v.totaal > 0 ? (v.klaar / v.totaal) * 100 : 0) + '%';
  _updateRondeBadge('taak-verslepen-ronde', 'luisteren');

  // Beeld + leeg vak bovenaan
  const beeldEl = document.getElementById('verslepen-beeld');
  const dropVakEl = document.getElementById('verslepen-dropvak');
  if (beeldEl) beeldEl.innerHTML = Picto.html(_verslepenItem, { grootte: 90 });
  if (dropVakEl) {
    dropVakEl.classList.remove('juist', 'fout', 'gevuld', 'hover');
    dropVakEl.innerHTML = '<span class="verslepen-dropvak-placeholder">sleep het woord hier</span>';
  }

  // Woord-knoppen onderaan (sleepbaar)
  const optiesEl = document.getElementById('verslepen-woorden');
  optiesEl.innerHTML = '';
  _verslepenOpties.forEach(opt => {
    const w = document.createElement('div');
    w.className = 'verslepen-woord';
    w.dataset.woordId = opt.id;
    w.textContent = opt.tekst;
    w.onpointerdown = _verslepenStart;
    optiesEl.appendChild(w);
  });
}

function taakVerslepenHoor() {
  if (_verslepenItem) AudioEngine.spreek(_verslepenItem.tekst);
}

function _verslepenStart(e) {
  if (_verslepenAfHandeling) return;
  const woordEl = e.currentTarget;
  if (!woordEl) return;
  e.preventDefault();
  _verslepenDraggingEl = woordEl;
  const rect = woordEl.getBoundingClientRect();
  _verslepenStartX = rect.left;
  _verslepenStartY = rect.top;
  _verslepenOffsetX = e.clientX - rect.left;
  _verslepenOffsetY = e.clientY - rect.top;
  woordEl.classList.add('slepen');
  woordEl.setPointerCapture(e.pointerId);
  woordEl.style.transition = 'none';
  woordEl.onpointermove = _verslepenBeweeg;
  woordEl.onpointerup = _verslepenEinde;
  woordEl.onpointercancel = _verslepenEinde;
}

function _verslepenBeweeg(e) {
  if (!_verslepenDraggingEl) return;
  const verschilX = e.clientX - _verslepenOffsetX - _verslepenStartX;
  const verschilY = e.clientY - _verslepenOffsetY - _verslepenStartY;
  _verslepenDraggingEl.style.transform = `translate(${verschilX}px, ${verschilY}px)`;
  // Highlight het dropvak als we eroverheen zweven
  const dropVakEl = document.getElementById('verslepen-dropvak');
  if (dropVakEl) {
    const r = dropVakEl.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      dropVakEl.classList.add('hover');
    } else {
      dropVakEl.classList.remove('hover');
    }
  }
}

async function _verslepenEinde(e) {
  if (!_verslepenDraggingEl) return;
  const woordEl = _verslepenDraggingEl;
  _verslepenDraggingEl = null;
  woordEl.onpointermove = null;
  woordEl.onpointerup = null;
  woordEl.onpointercancel = null;
  if (e && e.pointerId !== undefined) {
    try { woordEl.releasePointerCapture(e.pointerId); } catch (er) {}
  }
  woordEl.classList.remove('slepen');

  const dropVakEl = document.getElementById('verslepen-dropvak');
  let geraakt = false;
  if (dropVakEl) {
    const r = dropVakEl.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      geraakt = true;
    }
    dropVakEl.classList.remove('hover');
  }

  if (!geraakt) {
    // Niet in vak gedropt: terug naar startpositie
    woordEl.style.transition = 'transform 0.25s ease';
    woordEl.style.transform = '';
    return;
  }

  _verslepenAfHandeling = true;
  const gekozenId = woordEl.dataset.woordId;
  const isJuist = (gekozenId === _verslepenItem.id);

  // Toon het woord in het dropvak
  if (dropVakEl) {
    dropVakEl.innerHTML = `<span class="verslepen-dropvak-tekst">${woordEl.textContent}</span>`;
    dropVakEl.classList.add('gevuld');
    dropVakEl.classList.add(isJuist ? 'juist' : 'fout');
  }
  // Verberg het gesleepte woord
  woordEl.style.opacity = '0';

  if (isJuist) {
    await _registreerAntwoord(_verslepenItem.id, 'luisteren', true);
    setTimeout(() => {
      if (taakModus) taakStartLuisterenOefenen();
    }, 900);
  } else {
    // Bij fout: register als fout (telt voor schrijven_fout, etc.) maar
    // markeer NIET als behandeld — kind probeert opnieuw met hetzelfde woord
    await Voortgang.registreerFoutInTaak(_verslepenItem.id, 'luisteren');
    // Reset zodat kind opnieuw kan proberen
    setTimeout(() => {
      if (!taakModus) return;
      if (dropVakEl) {
        dropVakEl.classList.remove('juist', 'fout', 'gevuld');
        dropVakEl.innerHTML = '<span class="verslepen-dropvak-placeholder">sleep het woord hier</span>';
      }
      woordEl.style.opacity = '';
      woordEl.style.transition = 'transform 0.3s ease';
      woordEl.style.transform = '';
      _verslepenAfHandeling = false;
    }, 1200);
  }
}



//
// Pedagogisch verschil met luisteren-oef: GEEN audio-knop. Kind moet het
// geschreven woord zelf decoderen. Het juiste beeld kiezen uit 4.

function taakStartLezenOefenen() {
  const taak = Voortgang.getTaak();
  // Eerst: zijn alle rondes voorbij? Dan door naar volgende fase.
  const ruwe = _ruweRonde('lezen');
  const max = _maxRondesVoor('lezen');
  if (ruwe > max) {
    taakStartFase(_volgendeFase('lezen-oef', taak));
    return;
  }
  const item = _kiesVolgendOefenItem('lezen');
  if (!item) {
    taakStartFase(_volgendeFase('lezen-oef', taak));
    return;
  }
  taakOefItem = item;
  taakRendererLezenOefenen();
  toonScherm('scherm-taak-lezen-oef');
}

function taakRendererLezenOefenen() {
  if (!taakOefItem) return;
  const taak = Voortgang.getTaak();

  // Toon het geschreven woord groot in beeld
  const woordEl = document.getElementById('taak-lezen-oef-woord');
  if (woordEl) woordEl.textContent = taakOefItem.tekst;

  // Voortgang — ronde-gebaseerd
  const v = _voortgangVoorVaardigheid('lezen');
  const klaarEl = document.getElementById('taak-lezen-oef-klaar');
  const totaalEl = document.getElementById('taak-lezen-oef-totaal');
  if (klaarEl) klaarEl.textContent = v.klaar;
  if (totaalEl) totaalEl.textContent = v.totaal;
  const balk = document.getElementById('taak-lezen-oef-balk');
  if (balk) balk.style.width = (v.totaal > 0 ? (v.klaar / v.totaal) * 100 : 0) + '%';
  // Ronde-badge
  _updateRondeBadge('taak-lezen-oef-ronde', 'lezen');

  // Bouw 4 BEELD-knoppen: het juiste + 3 afleiders
  const verrijkt = verrijkThema(huidigThema);
  const beschikbAfl = verrijkt.items.filter(x =>
    x.id !== taakOefItem.id && !_zijnVisueelVerwarrend(taakOefItem, x)
  );
  const afl = [];
  while (afl.length < 3 && beschikbAfl.length > 0) {
    const idx = Math.floor(Math.random() * beschikbAfl.length);
    afl.push(beschikbAfl[idx]);
    beschikbAfl.splice(idx, 1);
  }
  const opties = [taakOefItem, ...afl].sort(() => Math.random() - 0.5);

  const div = document.getElementById('taak-lezen-oef-opties');
  if (!div) return;
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'taak-toets-beeld-knop';
    k.innerHTML = Picto.html(opt, { grootte: 80 });
    k.dataset.id = opt.id;
    k.onclick = () => taakKiesLezenOefAntwoord(k, opt);
    div.appendChild(k);
  });
}

async function taakKiesLezenOefAntwoord(knop, gekozen) {
  document.querySelectorAll('#taak-lezen-oef-opties .taak-toets-beeld-knop').forEach(k => k.disabled = true);

  const isJuist = (gekozen.id === taakOefItem.id);
  if (isJuist) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('#taak-lezen-oef-opties .taak-toets-beeld-knop').forEach(k => {
      if (k.dataset.id === taakOefItem.id) k.classList.add('juist');
    });
    Voortgang.registreerFout(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  }
  await _registreerAntwoord(taakOefItem.id, 'lezen', isJuist);

  setTimeout(() => {
    if (!taakModus) return;
    taakStartLezenOefenen();
  }, 1400);
}

// =================================================================
//  TAAK FASE — LEZEN-TOETS  (kind ziet woord, kiest beeld, géén feedback)
// =================================================================
function taakStartLezenToets() {
  taakToetsLijst = [...taakItems].sort(() => Math.random() - 0.5);
  taakToetsIdx = 0;
  taakToetsJuist = 0;
  taakToetsFoutIds = [];
  const totaalEl = document.getElementById('taak-lezen-toets-totaal');
  if (totaalEl) totaalEl.textContent = taakToetsLijst.length;
  taakRendererLezenToets();
  toonScherm('scherm-taak-lezen-toets');
}

function taakRendererLezenToets() {
  const item = taakToetsLijst[taakToetsIdx];
  if (!item) return;
  const huidigEl = document.getElementById('taak-lezen-toets-huidig');
  if (huidigEl) huidigEl.textContent = taakToetsIdx + 1;
  const woordEl = document.getElementById('taak-lezen-toets-woord');
  if (woordEl) woordEl.textContent = item.tekst;

  const pct = (taakToetsIdx / taakToetsLijst.length) * 100;
  const balk = document.getElementById('taak-lezen-toets-balk');
  if (balk) balk.style.width = pct + '%';

  const opties = _taakToetsBeeldOpties(item);

  const div = document.getElementById('taak-lezen-toets-opties');
  if (!div) return;
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'taak-toets-beeld-knop';
    k.innerHTML = Picto.html(opt, { grootte: 80 });
    k.dataset.id = opt.id;
    k.onclick = () => taakKiesLezenToetsAntwoord(k, opt, item);
    div.appendChild(k);
  });
}

async function taakKiesLezenToetsAntwoord(knop, gekozen, juistItem) {
  document.querySelectorAll('#taak-lezen-toets-opties .taak-toets-beeld-knop').forEach(k => k.disabled = true);

  if (gekozen.id === juistItem.id) {
    taakToetsJuist++;
    Voortgang.registreerJuist(huidigThema.id, juistItem.id);
  } else {
    if (taakToetsFoutIds.indexOf(juistItem.id) === -1) taakToetsFoutIds.push(juistItem.id);
    Voortgang.registreerFout(huidigThema.id, juistItem.id);
  }
  knop.classList.add('gekozen');

  setTimeout(() => {
    if (!taakModus) return;
    taakToetsIdx++;
    if (taakToetsIdx >= taakToetsLijst.length) {
      taakEindigToets('lezen');
    } else {
      taakRendererLezenToets();
    }
  }, 650);
}

// =================================================================
//  TAAK FASE — SCHRIJVEN-OEFENEN  (overtypen: woord 3s zichtbaar, dan typen)
// =================================================================
//
// Pedagogisch: kind ziet beeld + woord 3 sec, dan verdwijnt het woord en
// moet het kind het overtypen in een typvak. Knop "👁️ Toon woord opnieuw"
// laat het woord opnieuw 3 sec zien zo vaak het kind wil. Bij fout: woord
// verschijnt in groen ter referentie en kind probeert opnieuw.

let taakSchrijvenWoordTimer = null;
let taakSchrijvenWoordZichtbaar = true;
// Hoe vaak het kind al heeft geklikt op "Toon opnieuw" voor het huidige woord.
// Max 2 keer herbekijken: 1× automatisch bij start + 2× via knop = 3× zien totaal.
let _taakSchrijvenHerbekijkAantal = 0;

function taakStartSchrijvenOefenen() {
  const taak = Voortgang.getTaak();
  // Eerst: zijn alle rondes voorbij? Dan door naar volgende fase.
  const ruwe = _ruweRonde('schrijven');
  const max = _maxRondesVoor('schrijven');
  if (ruwe > max) {
    taakStartFase(_volgendeFase('schrijven-oef', taak));
    return;
  }
  const item = _kiesVolgendOefenItem('schrijven');
  if (!item) {
    taakStartFase(_volgendeFase('schrijven-oef', taak));
    return;
  }
  taakOefItem = item;
  _taakSchrijvenHerbekijkAantal = 0;
  taakRendererSchrijvenOefenen();
  toonScherm('scherm-taak-schrijven-oef');
}

function taakRendererSchrijvenOefenen() {
  if (!taakOefItem) return;
  const taak = Voortgang.getTaak();

  // Beeld
  const beeldEl = document.getElementById('taak-schrijven-oef-beeld');
  if (beeldEl) beeldEl.innerHTML = Picto.html(taakOefItem);

  // Voortgang — ronde-gebaseerd
  const v = _voortgangVoorVaardigheid('schrijven');
  const klaarEl = document.getElementById('taak-schrijven-oef-klaar');
  const totaalEl = document.getElementById('taak-schrijven-oef-totaal');
  if (klaarEl) klaarEl.textContent = v.klaar;
  if (totaalEl) totaalEl.textContent = v.totaal;
  const balk = document.getElementById('taak-schrijven-oef-balk');
  if (balk) balk.style.width = (v.totaal > 0 ? (v.klaar / v.totaal) * 100 : 0) + '%';
  // Ronde-badge
  _updateRondeBadge('taak-schrijven-oef-ronde', 'schrijven');

  // Reset typvak en feedback (waarde leeg, knop opnieuw actief)
  const inputEl = document.getElementById('taak-schrijven-oef-input');
  const fbEl = document.getElementById('taak-schrijven-oef-feedback');
  if (inputEl) {
    inputEl.value = '';
    inputEl.disabled = false;
  inputEl.classList.remove('juist', 'fout', 'ingediend');
  }
  if (fbEl) fbEl.innerHTML = '';

  // Toon woord 3s, daarna typvak verschijnen
  _taakSchrijvenToonWoord();
}

// Helper: toon het woord 3 sec lang, verberg typvak gedurende die periode.
// Na 3s wordt het woord verborgen en het typvak verschijnt + krijgt focus.
function _taakSchrijvenToonWoord() {
  if (taakSchrijvenWoordTimer) {
    clearTimeout(taakSchrijvenWoordTimer);
    taakSchrijvenWoordTimer = null;
  }
  const woordEl = document.getElementById('taak-schrijven-oef-woord');
  const inputRijEl = document.getElementById('taak-schrijven-oef-input-rij');
  const knoppenEl  = document.getElementById('taak-schrijven-oef-knoppen');
  if (!woordEl || !taakOefItem) return;

  // FASE A: woord zichtbaar (3 sec) — typvak en knoppen verborgen
  woordEl.textContent = taakOefItem.tekst;
  woordEl.classList.add('zichtbaar');
  taakSchrijvenWoordZichtbaar = true;
  if (inputRijEl) inputRijEl.classList.add('verborgen');
  if (knoppenEl)  knoppenEl.classList.add('verborgen');

  taakSchrijvenWoordTimer = setTimeout(() => {
    // FASE B: woord weg, typvak en knoppen tonen
    woordEl.classList.remove('zichtbaar');
    woordEl.textContent = '••• typ het woord •••';
    taakSchrijvenWoordZichtbaar = false;
    if (inputRijEl) inputRijEl.classList.remove('verborgen');
    if (knoppenEl)  knoppenEl.classList.remove('verborgen');
    // Update herbekijk-knop afhankelijk van resterende beurten
    _taakSchrijvenUpdateHerbekijkKnop();
    // Focus op typvak
    const inputEl = document.getElementById('taak-schrijven-oef-input');
    if (inputEl && !inputEl.disabled) inputEl.focus();
  }, 3000);
}

// Update de "Toon opnieuw"-knop: gegrijsd of verborgen na 2 herbekijken
function _taakSchrijvenUpdateHerbekijkKnop() {
  const knopEl = document.getElementById('taak-schrijven-toon-opnieuw');
  if (!knopEl) return;
  const resterend = 2 - _taakSchrijvenHerbekijkAantal;
  if (resterend <= 0) {
    knopEl.disabled = true;
    knopEl.classList.add('uitgeschakeld');
    knopEl.querySelector('.audio-tekst').textContent = 'Geen herbekijken meer';
  } else {
    knopEl.disabled = false;
    knopEl.classList.remove('uitgeschakeld');
    knopEl.querySelector('.audio-tekst').textContent = `Toon opnieuw (${resterend}×)`;
  }
}

// Knop "Toon woord opnieuw" — max 2 keer
function taakSchrijvenToonOpnieuw() {
  if (_taakSchrijvenHerbekijkAantal >= 2) return;
  _taakSchrijvenHerbekijkAantal++;
  _taakSchrijvenToonWoord();
}

// Knop "Hoor het woord" (audio)
function taakSchrijvenHoor() {
  if (taakOefItem) AudioEngine.spreek(taakOefItem.tekst);
}

// Submit van het typvak (knop "✓ Klaar" of Enter)
async function taakSchrijvenSubmit() {
  const inputEl = document.getElementById('taak-schrijven-oef-input');
  const fbEl = document.getElementById('taak-schrijven-oef-feedback');
  if (!inputEl || !taakOefItem) return;

  const getypt = (inputEl.value || '').trim().toLowerCase();
  const juist = (taakOefItem.tekst || '').trim().toLowerCase();
  if (getypt.length === 0) return;

  inputEl.disabled = true;

  if (getypt === juist) {
    inputEl.classList.add('juist');
    if (fbEl) fbEl.innerHTML = '<span class="schrijven-fb-juist">🎉 Juist!</span>';
    Voortgang.registreerJuist(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
    await _registreerAntwoord(taakOefItem.id, 'schrijven', true);
    setTimeout(() => {
      if (!taakModus) return;
      taakStartSchrijvenOefenen();
    }, 1400);
  } else {
    inputEl.classList.add('fout');
    if (fbEl) {
      fbEl.innerHTML = `<span class="schrijven-fb-fout">Bijna! Het juiste woord is:</span>
                        <span class="schrijven-fb-juist-woord">${taakOefItem.tekst}</span>`;
    }
    // Bij fout: register als fout (verhoogt schrijven_fout) maar markeer
    // NIET als behandeld — kind probeert opnieuw met hetzelfde woord
    await Voortgang.registreerFoutInTaak(taakOefItem.id, 'schrijven');
    Voortgang.registreerFout(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
    setTimeout(() => {
      if (!taakModus) return;
      taakStartSchrijvenOefenen();
    }, 2200);
  }
}

// =================================================================
//  TAAK FASE — SCHRIJVEN-TOETS  (1 poging per woord, geen hint)
// =================================================================
function taakStartSchrijvenToets() {
  taakToetsLijst = [...taakItems].sort(() => Math.random() - 0.5);
  taakToetsIdx = 0;
  taakToetsJuist = 0;
  taakToetsFoutIds = [];
  const totaalEl = document.getElementById('taak-schrijven-toets-totaal');
  if (totaalEl) totaalEl.textContent = taakToetsLijst.length;
  taakRendererSchrijvenToets();
  toonScherm('scherm-taak-schrijven-toets');
}

function taakRendererSchrijvenToets() {
  const item = taakToetsLijst[taakToetsIdx];
  if (!item) return;
  const huidigEl = document.getElementById('taak-schrijven-toets-huidig');
  if (huidigEl) huidigEl.textContent = taakToetsIdx + 1;

  const beeldEl = document.getElementById('taak-schrijven-toets-beeld');
  if (beeldEl) beeldEl.innerHTML = Picto.html(item);

  const pct = (taakToetsIdx / taakToetsLijst.length) * 100;
  const balk = document.getElementById('taak-schrijven-toets-balk');
  if (balk) balk.style.width = pct + '%';

  const inputEl = document.getElementById('taak-schrijven-toets-input');
  const fbEl = document.getElementById('taak-schrijven-toets-feedback');
  if (inputEl) {
    inputEl.value = '';
    inputEl.disabled = false;
    inputEl.classList.remove('juist', 'fout', 'ingediend');
    setTimeout(() => inputEl.focus(), 50);
  }
  if (fbEl) fbEl.innerHTML = '';
}

function taakSchrijvenToetsHoor() {
  const item = taakToetsLijst[taakToetsIdx];
  if (item) AudioEngine.spreek(item.tekst);
}

async function taakSchrijvenToetsSubmit() {
  const inputEl = document.getElementById('taak-schrijven-toets-input');
  const fbEl = document.getElementById('taak-schrijven-toets-feedback');
  const item = taakToetsLijst[taakToetsIdx];
  if (!inputEl || !item) return;

  const getypt = (inputEl.value || '').trim().toLowerCase();
  if (getypt.length === 0) return;
  const juist = (item.tekst || '').trim().toLowerCase();

  inputEl.disabled = true;

  if (getypt === juist) {
    taakToetsJuist++;
    Voortgang.registreerJuist(huidigThema.id, item.id);
  } else {
    if (taakToetsFoutIds.indexOf(item.id) === -1) taakToetsFoutIds.push(item.id);
    Voortgang.registreerFout(huidigThema.id, item.id);
  }
  inputEl.classList.add('ingediend');
  if (fbEl) fbEl.textContent = 'Antwoord bewaard';

  setTimeout(() => {
    if (!taakModus) return;
    taakToetsIdx++;
    if (taakToetsIdx >= taakToetsLijst.length) {
      taakEindigToets('schrijven');
    } else {
      taakRendererSchrijvenToets();
    }
  }, 800);
}

async function taakEindigToets(vaardigheid) {
  // Als parameter ontbreekt, default naar luisteren (backwards compat)
  if (!vaardigheid) vaardigheid = 'luisteren';
  await Voortgang.bewaar(Auth.getCode());

  const aantal = taakToetsLijst.length;
  const juist = taakToetsJuist;
  const pct = aantal > 0 ? Math.round((juist / aantal) * 100) : 0;

  const taak = Voortgang.getTaak();
  if (!taak) { taakVerlaten(); return; }

  if (pct >= 80) {
    // GESLAAGD → ga naar volgende fase volgens lijst.
    // Pas status alleen op 'voltooid' als dit de allerlaatste toets-fase is.
    const huidigeFase = vaardigheid + '-toets';
    const volgende = _volgendeFase(huidigeFase, taak);
    const isLaatste = (volgende === 'klaar');
    // Update toetsResultaten: voeg deze poging toe aan pogingen-array
    const nieuweResultaten = Object.assign({}, taak.toetsResultaten || {});
    const huidig = nieuweResultaten[vaardigheid] || { afgenomen: false, pogingen: [], foutIds: [] };
    const pogingen = Array.isArray(huidig.pogingen) ? [...huidig.pogingen] : [];
    pogingen.push({ foutIds: [...taakToetsFoutIds], datum: Date.now(), pct });
    nieuweResultaten[vaardigheid] = {
      afgenomen: true,
      pogingen,
      foutIds: [...taakToetsFoutIds]  // backwards-compat: laatste poging
    };
    const update = {
      huidigeFase: volgende,
      foutWoordenLaatsteToets: taakToetsFoutIds,
      toetsResultaten: nieuweResultaten
    };
    if (isLaatste) update.status = 'voltooid';
    await Voortgang.updateTaak(update);
    taakStartFase(volgende);
  } else {
    // NIET GESLAAGD: tel poging voor déze vaardigheid
    const huidigPogingen = (taak.aantalPogingen && taak.aantalPogingen[vaardigheid]) || 0;
    const nieuwAantal = huidigPogingen + 1;
    const nieuw = Object.assign({}, taak.aantalPogingen || {}, { [vaardigheid]: nieuwAantal });
    // Voeg ook deze (mislukte) poging toe aan pogingen-array
    const nieuweResultaten = Object.assign({}, taak.toetsResultaten || {});
    const huidig = nieuweResultaten[vaardigheid] || { afgenomen: false, pogingen: [], foutIds: [] };
    const pogingen = Array.isArray(huidig.pogingen) ? [...huidig.pogingen] : [];
    pogingen.push({ foutIds: [...taakToetsFoutIds], datum: Date.now(), pct });
    nieuweResultaten[vaardigheid] = {
      afgenomen: true,
      pogingen,
      foutIds: [...taakToetsFoutIds]
    };
    if (nieuwAantal >= 2) {
      // Tweede mislukking → status moeilijk, taak stopt
      await Voortgang.updateTaak({
        status: 'moeilijk',
        aantalPogingen: nieuw,
        foutWoordenLaatsteToets: taakToetsFoutIds,
        toetsResultaten: nieuweResultaten
      });
      taakToonResultaatMoeilijk(juist, aantal);
    } else {
      // Eerste mislukking → herhalen (huidige toets-fase opnieuw)
      await Voortgang.updateTaak({
        aantalPogingen: nieuw,
        foutWoordenLaatsteToets: taakToetsFoutIds,
        toetsResultaten: nieuweResultaten
      });
      taakToonResultaatHerhaal(juist, aantal);
    }
  }
}

// =================================================================
//  TAAK — RESULTAAT-SCHERMEN
// =================================================================
function taakToonKlaar() {
  document.getElementById('taak-resultaat-emoji').textContent = '🏆';
  document.getElementById('taak-resultaat-titel').textContent = 'Klaar!';
  document.getElementById('taak-resultaat-tekst').textContent = 'Je taak is af. Vraag aan je juf voor een nieuwe!';
  // Beelden van de geleerde woorden
  const overzichtEl = document.getElementById('taak-resultaat-overzicht');
  if (overzichtEl) {
    overzichtEl.innerHTML = '';
    taakItems.forEach(item => {
      const d = document.createElement('div');
      d.className = 'taak-resultaat-woord';
      d.innerHTML = `${Picto.html(item, { grootte: 48 })}<span>${item.tekst}</span>`;
      overzichtEl.appendChild(d);
    });
  }
  // Knop = naar startscherm
  const knopEl = document.getElementById('taak-resultaat-knop');
  if (knopEl) {
    knopEl.textContent = '↩️ Naar het menu';
    knopEl.onclick = taakVerlaten;
  }
  AudioEngine.spreek('Heel goed! Je taak is helemaal klaar!');
  toonScherm('scherm-taak-resultaat');
}

function taakToonResultaatMoeilijk(juist, aantal) {
  document.getElementById('taak-resultaat-emoji').textContent = '💪';
  document.getElementById('taak-resultaat-titel').textContent = 'Goed geprobeerd!';
  document.getElementById('taak-resultaat-tekst').textContent = 'Vraag aan je juf om samen te oefenen.';
  const overzichtEl = document.getElementById('taak-resultaat-overzicht');
  if (overzichtEl) overzichtEl.innerHTML = '';
  const knopEl = document.getElementById('taak-resultaat-knop');
  if (knopEl) {
    knopEl.textContent = '↩️ Naar het menu';
    knopEl.onclick = taakVerlaten;
  }
  AudioEngine.spreek('Goed geprobeerd. We oefenen samen verder.');
  toonScherm('scherm-taak-resultaat');
}

function taakToonResultaatHerhaal(juist, aantal) {
  document.getElementById('taak-resultaat-emoji').textContent = '🌱';
  document.getElementById('taak-resultaat-titel').textContent = 'Probeer nog eens!';
  document.getElementById('taak-resultaat-tekst').textContent = 'Oefen nog wat. Je kan het!';
  const overzichtEl = document.getElementById('taak-resultaat-overzicht');
  if (overzichtEl) overzichtEl.innerHTML = '';
  const knopEl = document.getElementById('taak-resultaat-knop');
  if (knopEl) {
    knopEl.textContent = '🔁 Nog eens proberen';
    knopEl.onclick = () => {
      // Reset oefenfase (perWoord-tellers behouden) en ga terug naar de oef-fase
      // die bij de huidige toets-fase hoort. Bv. 'luisteren-toets' → 'luisteren-oef'.
      let oefFase = 'luisteren-oef';
      if (typeof taakHuidigeFase === 'string' && taakHuidigeFase.endsWith('-toets')) {
        oefFase = taakHuidigeFase.replace('-toets', '-oef');
      }
      taakStartFase(oefFase);
    };
  }
  AudioEngine.spreek('Niet erg, we oefenen nog even verder.');
  toonScherm('scherm-taak-resultaat');
}



// =================================================================
//  INIT
// =================================================================
async function init() {
  // Het laad-scherm is standaard zichtbaar (in HTML met class 'actief').
  // We tonen pas het login-scherm als we zeker weten dat auto-login mislukt is.

  // Firebase opzetten
  if (window.FIREBASE_INGESTELD && window.firebase) {
    try {
      window.firebase.initializeApp(window.FIREBASE_CONFIG);
    } catch (e) {
      // Al geïnitialiseerd
    }
    await Voortgang.init();
    if (window.Woordenbeheer) Woordenbeheer.init();
  }

  // Woordenbeheer laden — bevat overrides en eigen items van de leerkracht.
  // Mag falen, dan werkt het kind gewoon met basispakket.
  if (window.Woordenbeheer) {
    try { await Woordenbeheer.laad(); } catch (e) { console.warn('Woordenbeheer kon niet laden:', e); }
  }

  // Probeer auto-login. Eerst de bestaande Auth.probeerAutoLogin (die normaal
  // de URL-code en localStorage afhandelt). Als dat faalt maar er staat wél
  // een ?code= in de URL, doen we hier nog een handmatige login als vangnet —
  // zo komt de leerkracht zonder code typen direct in de kind-app.
  let ingelogd = false;
  // Preview-modus: leerkracht bekijkt de taak van een kind zonder voortgang aan te tasten.
  // Moet ALTIJD geactiveerd worden vóór login — ook als auto-login al lukt — anders
  // zouden voortgang-acties tijdens preview alsnog opgeslagen worden.
  const __urlParams = new URLSearchParams(window.location.search);
  const __isPreview = (__urlParams.get('preview') === '1');
  if (__isPreview && window.Voortgang && Voortgang.zetPreviewModus) {
    Voortgang.zetPreviewModus(true);
  }

  // Vrije leerkrachttest: een concepttaak kan zonder leerlingcode worden
  // doorlopen. Er wordt niets gelezen of geschreven bij een leerling.
  const __previewConceptSleutel = __urlParams.get('previewConcept');
  if (__isPreview && __previewConceptSleutel && !__urlParams.get('code')) {
    try {
      const conceptJson = sessionStorage.getItem(__previewConceptSleutel);
      if (!conceptJson) throw new Error('Testconcept niet gevonden');
      await Voortgang.zetTaak(JSON.parse(conceptJson));
      sessionStorage.removeItem(__previewConceptSleutel);
      const welk = document.getElementById('welkom-naam');
      if (welk) welk.textContent = 'leerkracht!';
      _toonPreviewBanner();
      rendererStart();
      toonScherm('scherm-start');
      setTimeout(() => startTaak(), 0);
      return;
    } catch (e) {
      console.warn('De vrije leerkrachttest kon niet starten:', e);
    }
  }

  // In preview-modus: skip auto-login zodat we gegarandeerd inloggen met de
  // code uit de URL (en dus de juiste leerling tonen aan de leerkracht).
  if (!__isPreview) {
    try {
      ingelogd = await Auth.probeerAutoLogin();
    } catch (e) {
      console.warn('Auth.probeerAutoLogin gaf een fout:', e);
    }
  }

  if (!ingelogd) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = (urlParams.get('code') || '').trim();
    if (urlCode) {
      try {
        await Auth.login(urlCode);
        ingelogd = true;
      } catch (e) {
        console.warn('Login met URL-code mislukt:', e);
      }
    }
  }

  if (ingelogd) {
    await naDuoLogin();
  } else {
    // Pas hier gaan we van laad-scherm naar login-scherm
    toonScherm('scherm-login');
    const inv = document.getElementById('login-code');
    if (inv) inv.focus();
  }

  // Enter in login-veld
  const loginInv = document.getElementById('login-code');
  if (loginInv) {
    loginInv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') probeerLogin();
    });
  }
}

async function probeerLogin() {
  const inv = document.getElementById('login-code');
  const fout = document.getElementById('login-fout');
  fout.textContent = '';
  const code = inv.value.trim();

  if (!code) {
    fout.textContent = 'Tik eerst je code in.';
    return;
  }

  try {
    await Auth.login(code);
    await naDuoLogin();
  } catch (e) {
    fout.textContent = e.message || 'Er ging iets fout.';
    inv.select();
  }
}

async function naDuoLogin() {
  // Voortgang laden uit Firestore
  await Voortgang.laad(Auth.getCode());

  // Een leerkracht kan een nog niet bewaarde taak rechtstreeks vanuit het
  // taakvenster testen. Het concept staat alleen in sessionStorage en wordt
  // door de reeds actieve preview-modus uitsluitend in het geheugen gezet.
  const previewParams = new URLSearchParams(window.location.search);
  const previewConceptSleutel = previewParams.get('previewConcept');
  if (previewConceptSleutel && Voortgang.isPreviewModus && Voortgang.isPreviewModus()) {
    try {
      const conceptJson = sessionStorage.getItem(previewConceptSleutel);
      if (conceptJson) {
        await Voortgang.zetTaak(JSON.parse(conceptJson));
        sessionStorage.removeItem(previewConceptSleutel);
      }
    } catch (e) {
      console.warn('Het taakconcept kon niet in de preview worden geladen:', e);
    }
  }

  // Welkomtekst
  const naam = Auth.getNaam();
  const welk = document.getElementById('welkom-naam');
  if (welk) welk.textContent = naam ? naam + '!' : '!';

  // Preview-modus: toon een banner bovenaan zodat de leerkracht ziet dat
  // niets bewaard wordt. Banner is non-intrusive maar duidelijk.
  if (window.Voortgang && Voortgang.isPreviewModus && Voortgang.isPreviewModus()) {
    _toonPreviewBanner();
  }

  rendererStart();
  toonScherm('scherm-start');
  if (Voortgang.isPreviewModus && Voortgang.isPreviewModus() && Voortgang.getTaak()) {
    setTimeout(() => startTaak(), 0);
  }
}

function _toonPreviewBanner() {
  if (document.getElementById('preview-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'preview-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #fef3c7; color: #78350f;
    padding: 6px 14px; font-size: 13px; font-weight: 600;
    text-align: center; border-bottom: 2px solid #f59e0b;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    font-family: system-ui, sans-serif;
  `;
  banner.textContent = '👁️ PREVIEW — niets wordt bewaard, leerlingvoortgang blijft intact';
  document.body.appendChild(banner);
  // Een beetje extra ruimte bovenaan zodat banner niet over content valt
  document.body.style.paddingTop = '34px';
}

function uitloggen() {
  if (confirm('Wil je echt uitloggen?')) {
    Auth.logout();
    location.reload();
  }
}

// =================================================================
//  SLIM LEREN — Autonome modus
//  Tool kiest zelf wat het kind moet leren, kind hoeft niets te beslissen
// =================================================================

let slimHuidig = null;       // { thema, item, prioriteit, reden }
let slimStreak = 0;          // hoeveel juiste antwoorden op rij in deze sessie
let slimFase = 'kennismaken';// 'kennismaken' (zien+horen) of 'oefenen' (kiezen)
const SLIM_THEMA_FILTERS = []; // optioneel filteren — voor later

// Welke thema's gebruikt slim leren in deze sessie? (default: alle woorden)
let slimThemas = null;

function startSlimLeren(themas) {
  slimThemas = themas || THEMAS_WOORDEN;
  slimStreak = 0;
  document.getElementById('slim-streak').textContent = '0';
  toonScherm('scherm-slim');
  volgendeSlimItem();
}

function stopSlimLeren() {
  if (Auth.ingelogd()) Voortgang.bewaar(Auth.getCode());
  AudioEngine.stop();
  // Terug naar thema-detail als slim leren vanuit thema gestart, anders naar start
  if (slimThemas && slimThemas.length === 1 && huidigThema) {
    naarThema();
  } else {
    naarStart();
  }
}

function volgendeSlimItem() {
  const themas = (slimThemas || THEMAS_WOORDEN).map(verrijkThema);
  const gekozen = Voortgang.kiesVolgendItem(themas);

  if (!gekozen) {
    toonSlimAlleskKlaar();
    return;
  }

  slimHuidig = gekozen;

  // Update status-balk bovenaan
  const statusEl = document.getElementById('slim-status');
  const emojiEl = document.getElementById('slim-status-emoji');
  const tekstEl = document.getElementById('slim-status-tekst');

  statusEl.className = 'slim-status'; // reset

  if (gekozen.reden === 'nieuw') {
    statusEl.classList.add('nieuw');
    emojiEl.textContent = '🌱';
    tekstEl.textContent = 'Nieuw woord';
    slimFase = 'kennismaken';
  } else if (gekozen.reden === 'herhaling') {
    statusEl.classList.add('herhaling');
    emojiEl.textContent = '🔁';
    tekstEl.textContent = 'Even herhalen';
    slimFase = 'oefenen';
  } else if (gekozen.reden === 'opfrissen') {
    statusEl.classList.add('opfrissen');
    emojiEl.textContent = '✨';
    tekstEl.textContent = 'Nog eens checken';
    slimFase = 'oefenen';
  } else if (gekozen.reden === 'verder') {
    emojiEl.textContent = '➡️';
    tekstEl.textContent = 'Verder oefenen';
    slimFase = 'oefenen';
  } else if (gekozen.reden === 'oefenen' || gekozen.reden === 'bijna') {
    emojiEl.textContent = '⭐';
    tekstEl.textContent = 'Oefenen';
    slimFase = 'oefenen';
  }

  // Toon kaart op basis van fase
  if (slimFase === 'kennismaken') toonSlimKennismaken();
  else toonSlimOefenen();
}

function toonSlimKennismaken() {
  // Eerst kennismaken: zie het beeld, hoor het woord, hoor de zin, dan "Ik snap het!"
  const { thema, item } = slimHuidig;
  const kaart = document.getElementById('slim-kaart');
  const acties = document.getElementById('slim-acties');

  kaart.innerHTML = `
    <div class="grote-beeld">${Picto.html(item)}</div>
    <div class="grote-tekst">${item.tekst}</div>
  `;

  acties.className = 'slim-acties';
  acties.innerHTML = `
    <button class="slim-knop-actie" onclick="slimNogEens()">🔁 Nog eens</button>
    <button class="slim-knop-actie primair" onclick="slimSnap()">✓ Ik snap het!</button>
  `;

  Voortgang.registreerGezien(thema.id, item.id);

  // Spreek automatisch uit
  spreekVeilig(item.tekst, 400);
}

function slimHoorWoord() {
  if (slimHuidig) AudioEngine.spreek(slimHuidig.item.tekst);
}

function slimNogEens() {
  if (slimHuidig) AudioEngine.spreek(slimHuidig.item.tekst);
}

async function slimSnap() {
  // Kind heeft kennisgemaakt — nu meteen oefenen
  slimFase = 'oefenen';
  toonSlimOefenen();
}

function toonSlimOefenen() {
  const { thema, item } = slimHuidig;
  const kaart = document.getElementById('slim-kaart');
  const acties = document.getElementById('slim-acties');

  // Kies 3 afleiders uit zelfde thema (of, als te weinig, uit andere thema's van zelfde type)
  let pool = thema.items.filter(x => x.id !== item.id);
  if (pool.length < 3) {
    // Vul aan met items uit andere thema's van zelfde type
    const zelfdeType = ALLE_THEMAS.filter(t => t.type === thema.type && t.id !== thema.id);
    zelfdeType.forEach(t => {
      pool = pool.concat(t.items.filter(x => x.id !== item.id));
    });
  }

  // Schud en pak 3
  const afl = [];
  const beschikb = [...pool];
  while (afl.length < 3 && beschikb.length > 0) {
    const idx = Math.floor(Math.random() * beschikb.length);
    afl.push(beschikb[idx]);
    beschikb.splice(idx, 1);
  }
  const opties = [item, ...afl].sort(() => Math.random() - 0.5);

  // Bovenkant: grote luister-knop (zonder beeld!)
  kaart.innerHTML = `
    <div class="vraag-tekst">Welk beeld hoor je?</div>
    <button class="slim-luister-grote-knop" onclick="slimHoorWoord()">
      <span class="slim-luister-icoon">🔊</span>
      <span class="slim-luister-tekst">Luister</span>
    </button>
    <button class="slim-hint-knop" onclick="slimToonHint(this)">💡 Hint (zien)</button>
    <span class="slim-hint-tekst" id="slim-hint-tekst"></span>
  `;

  // Onderkant: 4 beeld-knoppen (zonder tekst)
  acties.className = 'slim-acties slim-acties-beelden';
  acties.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'slim-beeld-knop';
    k.dataset.itemId = opt.id;
    k.innerHTML = Picto.html(opt, { klasse: 'slim-beeld-emoji' });
    k.onclick = () => slimKiesAntwoord(k, opt);
    acties.appendChild(k);
  });

  spreekVeilig(item.tekst, 400);
}

function slimToonHint(btn) {
  if (!slimHuidig) return;
  const tekstEl = document.getElementById('slim-hint-tekst');
  if (tekstEl) tekstEl.textContent = slimHuidig.item.tekst;
  if (btn) btn.disabled = true;
}

function slimKiesAntwoord(knop, gekozen) {
  // Schakel beide knop-types uit (oude en nieuwe modus)
  document.querySelectorAll('.slim-knop-actie, .slim-beeld-knop').forEach(k => k.disabled = true);
  const { thema, item } = slimHuidig;

  if (gekozen.id === item.id) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(thema.id, item.id);
    slimStreak++;
    document.getElementById('slim-streak').textContent = slimStreak;
    AudioEngine.spreek(item.tekst);

    // Bewaar elke 3 juiste antwoorden
    if (slimStreak % 3 === 0) Voortgang.bewaar(Auth.getCode());

    // Vier elke 5 op rij met een feestje (alleen als nog op slim-scherm)
    const versie = _schermVersie;
    if (slimStreak > 0 && slimStreak % 5 === 0) {
      setTimeout(() => { if (_schermVersie === versie) toonSlimVierMoment(); }, 1300);
    } else {
      setTimeout(() => { if (_schermVersie === versie) volgendeSlimItem(); }, 1500);
    }
  } else {
    knop.classList.add('fout');
    // Toon het juiste antwoord — werkt voor beide modussen via dataset-id of textContent
    document.querySelectorAll('.slim-beeld-knop').forEach(k => {
      if (k.dataset.itemId === item.id) k.classList.add('juist');
    });
    document.querySelectorAll('.slim-knop-actie').forEach(k => {
      if (k.textContent === item.tekst) k.classList.add('juist');
    });
    Voortgang.registreerFout(thema.id, item.id);
    slimStreak = 0;
    document.getElementById('slim-streak').textContent = '0';
    AudioEngine.spreek(item.tekst);
    const versie = _schermVersie;
    setTimeout(() => { if (_schermVersie === versie) volgendeSlimItem(); }, 2400);
  }
}

function toonSlimVierMoment() {
  const kaart = document.getElementById('slim-kaart');
  const acties = document.getElementById('slim-acties');
  const aantal = slimStreak;

  let emoji = '🎉', titel = 'Goed gedaan!';
  if (aantal >= 20) { emoji = '🏆'; titel = 'Geweldig!'; }
  else if (aantal >= 15) { emoji = '⭐'; titel = 'Top bezig!'; }
  else if (aantal >= 10) { emoji = '🌟'; titel = 'Super!'; }

  kaart.innerHTML = `
    <div class="grote-beeld">${emoji}</div>
    <div class="grote-tekst">${titel}</div>
    <div class="zin-tekst">${aantal} juiste antwoorden op rij!</div>
  `;

  acties.className = 'slim-acties een-knop';
  acties.innerHTML = `
    <button class="slim-knop-actie primair" onclick="volgendeSlimItem()">▶️ Verder leren</button>
  `;
}

function toonSlimAlleskKlaar() {
  const kaart = document.getElementById('slim-kaart');
  const acties = document.getElementById('slim-acties');
  kaart.innerHTML = `
    <div class="grote-beeld">🏆</div>
    <div class="grote-tekst">Knap gedaan!</div>
    <div class="zin-tekst">Je hebt alles geleerd. Kom morgen terug om te herhalen!</div>
  `;
  acties.className = 'slim-acties een-knop';
  acties.innerHTML = `
    <button class="slim-knop-actie primair" onclick="naarStart()">↩️ Naar het menu</button>
  `;
}

// =================================================================
//  STARTSCHERM (na login)
// =================================================================
function rendererStart() {
  rendererTaakZone();
  rendererThemaGrid('vrije-themas-grid', ALLE_THEMAS);
  rendererZinnenHerhalen();
  rendererVoortgang();
  kiesStartWeergave('themas');
}

function getGeoefendeZinnen() {
  const zinnen = [];
  ALLE_THEMAS.forEach(thema => {
    if (Voortgang.statsThema(verrijkThema(thema)).gezien === 0) return;
    getActieveItems(thema).forEach(item => {
      const zin = (item.zin || (item.type === 'zinnen' ? item.tekst : '') || '').trim();
      if (!zin) return;
      zinnen.push({
        ...item,
        id: `${thema.id}-${item.id}`,
        tekst: zin,
        zin: '',
        origineelThemaId: thema.id,
        origineelItemId: item.id
      });
    });
  });
  return zinnen;
}

function rendererZinnenHerhalen() {
  const grid = document.getElementById('vrije-themas-grid');
  if (!grid) return;
  const zinnen = getGeoefendeZinnen();
  if (zinnen.length < 2) return;
  const knop = document.createElement('button');
  knop.className = 'thema-kaart zinnen-herhaalkaart';
  knop.innerHTML = `<span class="thema-kaart-emoji">🔁</span><span class="thema-kaart-naam">Zinnen herhalen</span><div class="thema-kaart-stats"><span>Een mix uit mijn geoefende thema's</span></div>`;
  knop.onclick = startZinnenMix;
  grid.appendChild(knop);
}

function startZinnenMix() {
  const items = getGeoefendeZinnen().sort(() => Math.random() - 0.5).slice(0, 12);
  if (!items.length) return;
  huidigThema = { id:'zinnen-mix', type:'zinnen', naam:'Zinnen herhalen', emoji:'🔁', kleur:'#26856e', items };
  kijkenIndex = 0;
  rendererKijken();
  toonScherm('scherm-kijken');
}

function rendererSurvivalGrid() {
  const grid = document.getElementById('survival-grid');
  if (!grid) return;
  grid.innerHTML = '';
  // Was vroeger survival, nu startpakket — zelfde CSS-zone hergebruikt
  const actieveThemas = THEMAS_STARTPAKKET.filter(t => Voortgang.isThemaActiefVoorKind(t));
  // Toon de hele zone enkel als er minstens één startpakket-thema actief is
  const zone = grid.closest('.survival-zone');
  if (zone) zone.style.display = actieveThemas.length === 0 ? 'none' : '';
  actieveThemas.forEach(thema => {
    const stats = Voortgang.statsThema(verrijkThema(thema));
    const knop = document.createElement('button');
    knop.className = 'survival-kaart';
    knop.innerHTML = `
      <span class="survival-kaart-emoji">${thema.emoji}</span>
      <span class="survival-kaart-naam">${thema.naam}</span>
      <span class="survival-kaart-stats">${stats.gekend}/${stats.totaal} gekend</span>
      <div class="survival-kaart-balk">
        <div class="survival-kaart-balk-vul" style="width: ${stats.procent}%"></div>
      </div>
    `;
    knop.onclick = () => kiesThema(thema);
    grid.appendChild(knop);
  });
}

function rendererThemaGrid(gridId, themas) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  const actieveThemas = themas.filter(t => Voortgang.isThemaActiefVoorKind(t));
  actieveThemas.forEach(thema => {
    const stats = Voortgang.statsThema(verrijkThema(thema));
    const knop = document.createElement('button');
    knop.className = 'thema-kaart';
    knop.style.borderColor = thema.kleur + '40';
    knop.innerHTML = `
      <span class="thema-kaart-emoji">${thema.emoji}</span>
      <span class="thema-kaart-naam">${thema.naam}</span>
      <div class="thema-kaart-stats">
        <span>${stats.gekend}/${stats.totaal} gekend</span>
      </div>
      <div class="thema-kaart-balk">
        <div class="thema-kaart-balk-vul" style="width: ${stats.procent}%"></div>
      </div>
    `;
    knop.addEventListener('mouseenter', () => knop.style.borderColor = thema.kleur);
    knop.addEventListener('mouseleave', () => knop.style.borderColor = thema.kleur + '40');
    knop.onclick = () => kiesThema(thema);
    grid.appendChild(knop);
  });
}

function kiesTab(tab) {
  document.querySelectorAll('.tab-knop').forEach(k => k.classList.remove('actief'));
  document.querySelectorAll('.tab-inhoud').forEach(t => t.classList.remove('actief'));
  document.querySelector(`.tab-knop[data-tab="${tab}"]`).classList.add('actief');
  document.getElementById('tab-' + tab).classList.add('actief');
}

function kiesStartWeergave(weergave) {
  const themas = document.getElementById('tab-themas');
  const voortgang = document.getElementById('tab-voortgang');
  if (!themas || !voortgang) return;
  themas.classList.toggle('actief', weergave === 'themas');
  voortgang.classList.toggle('actief', weergave === 'voortgang');
}

function rendererVoortgang() {
  const div = document.getElementById('voortgang-overzicht');
  const totaalGekend = ALLE_THEMAS.reduce((s, t) => s + Voortgang.statsThema(verrijkThema(t)).gekend, 0);

  if (totaalGekend === 0) {
    div.innerHTML = `
      <div class="voortgang-leeg">
        <span class="grote-emoji">🌱</span>
        <p>Begin met oefenen!<br>Hier zie je later wat je geleerd hebt.</p>
      </div>`;
    return;
  }

  let html = '';
  ALLE_THEMAS.forEach(thema => {
    const s = Voortgang.statsThema(verrijkThema(thema));
    if (s.gezien === 0) return;
    html += `
      <div class="voortgang-vak">
        <div class="voortgang-vak-kop">
          <span class="emoji">${thema.emoji}</span>
          <strong>${thema.naam}</strong>
          <span class="pct">${s.procent}%</span>
        </div>
        <div class="voortgang-balk">
          <div class="voortgang-balk-vul" style="width: ${s.procent}%"></div>
        </div>
        <div class="voortgang-info">
          <span>👀 ${s.gezien} gezien</span>
          <span>⭐ ${s.geleerd} geleerd</span>
          <span>✅ ${s.gekend} gekend</span>
        </div>
      </div>`;
  });
  div.innerHTML = html;
}

// =================================================================
//  SCHERM SWITCHEN
// =================================================================
let _schermVersie = 0; // gaat omhoog bij elke schermwissel — gebruikt om verouderde timeouts te herkennen

function toonScherm(id) {
  _schermVersie++;
  document.querySelectorAll('.scherm').forEach(s => s.classList.remove('actief'));
  document.getElementById(id).classList.add('actief');
  window.scrollTo(0, 0);
  AudioEngine.stop();
}

// Spreek een tekst uit na een vertraging, maar alleen als we nog op hetzelfde scherm zitten.
// Voorkomt dat audio nog afspeelt nadat de gebruiker al weggeklikt heeft.
function spreekVeilig(tekst, vertraging) {
  const versieBijStart = _schermVersie;
  setTimeout(() => {
    if (_schermVersie === versieBijStart) {
      AudioEngine.spreek(tekst);
    }
  }, vertraging || 0);
}

function kiesThema(thema) {
  huidigThema = thema;
  document.getElementById('thema-emoji-groot').textContent = thema.emoji;
  document.getElementById('thema-naam').textContent = thema.naam;

  // Een vertelplaat of visuele praatkaart hoort bij het thema zelf.
  const visueleStap = document.getElementById('stap-vertelplaat');
  const heeftVertelplaat = !!thema.visueleOefening;
  visueleStap.style.display = heeftVertelplaat ? '' : 'none';
  document.getElementById('toets-stap-nummer').textContent = heeftVertelplaat ? '5' : '4';
  if (thema.visueleOefening === 'hulpzinnen') {
    document.getElementById('stap-vertelplaat-titel').textContent = 'Zinnen die mij helpen';
    document.getElementById('stap-vertelplaat-uitleg').textContent = 'Kies een plaatje, luister en zeg de zin na.';
  } else {
    document.getElementById('stap-vertelplaat-titel').textContent = 'Oefen met de vertelplaat';
    document.getElementById('stap-vertelplaat-uitleg').textContent = 'Kijk, luister, zoek en bouw een korte zin.';
  }

  // Stat-balk bovenaan thema
  const s = Voortgang.statsThema(verrijkThema(thema));
  document.getElementById('thema-statbalk').innerHTML = `
    <span class="statbalk-icoon">${thema.emoji}</span>
    <div class="statbalk-tekst">
      <strong>${s.gekend} van ${s.totaal} gekend</strong>
      <small>⭐ ${s.sterrenTotaal}/${s.sterrenMax} sterren</small>
    </div>
    <div class="statbalk-balk">
      <div class="statbalk-balk-vul" style="width: ${s.procent}%"></div>
    </div>
  `;

  // Bepaal welke stap visueel gemarkeerd wordt als suggestie
  ['stap-1','stap-2','stap-3','stap-vertelplaat','stap-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('begin-hier');
  });
  let aanwijzerStap = 'stap-1';
  if (s.gezien > 0 && s.gekend < s.totaal) aanwijzerStap = 'stap-3';
  if (s.gekend >= s.totaal && s.totaal > 0) aanwijzerStap = 'stap-4';
  const aanw = document.getElementById(aanwijzerStap);
  if (aanw && !aanw.disabled) aanw.classList.add('begin-hier');

  toonScherm('scherm-thema');
}

function naarStart() {
  rendererStart(); // herrender om verse stats te tonen
  toonScherm('scherm-start');
}

function naarThema() {
  if (huidigThema && huidigThema.id === 'zinnen-mix') naarStart();
  else if (huidigThema) kiesThema(huidigThema); // herrender met verse stats
  else toonScherm('scherm-start');
}

// =================================================================
//  MODUS-ROUTER
// =================================================================
function startModus(modus) {
  if (!huidigThema) return;

  // Beveiliging: als de leerkracht alle categorieën heeft uitgezet
  // voor dit kind, hebben we niets om te oefenen en moeten we niet crashen.
  const actief = getActieveItems(huidigThema);
  if (actief.length === 0) {
    alert('Er zijn voor jou nog geen woorden in dit thema. Vraag aan je juf of meester.');
    return;
  }

  if (modus === 'kijken') {
    kijkenIndex = 0;
    rendererKijken();
    toonScherm('scherm-kijken');
  } else if (modus === 'lezen') {
    rendererLezen();
    toonScherm('scherm-lezen');
  } else if (modus === 'oefenen') {
    score = 0;
    gebruikteOefenIndices = [];
    document.getElementById('score').textContent = '0';
    volgendeOefenVraag();
    toonScherm('scherm-oefenen');
  } else if (modus === 'slim') {
    // Slim leren — alleen woorden uit huidig thema
    startSlimLeren([huidigThema]);
  } else if (modus === 'spelen') {
    toonScherm('scherm-spelen');
  } else if (modus === 'toets') {
    startToets();
  }
}

// =================================================================
//  MODUS: KIJKEN & LUISTEREN
// =================================================================

// Helper: items voor de huidige weergave
function rendererKijken() {
  const _itemsKijken = getActieveItems(huidigThema);
  if (_itemsKijken.length === 0) return;
  const item = _itemsKijken[kijkenIndex];
  document.getElementById('kijken-beeld').innerHTML = Picto.html(item, { zin: huidigThema.type === 'zinnen' });
  document.getElementById('kijken-woord').textContent = item.tekst;

  // Toon zin als die er is
  const toonZin = !!(item.zin && item.zin.trim());
  const zinEl = document.getElementById('kijken-zin');
  const zinKnop = document.querySelector('.audio-knop.zin');
  if (zinEl) zinEl.style.display = toonZin ? '' : 'none';
  if (zinEl && toonZin) zinEl.textContent = item.zin || '';
  if (zinKnop) zinKnop.style.display = toonZin ? '' : 'none';

  document.getElementById('kijken-huidig').textContent = kijkenIndex + 1;
  document.getElementById('kijken-totaal').textContent = _itemsKijken.length;

  // Registreer gezien
  Voortgang.registreerGezien(item.origineelThemaId || huidigThema.id, item.origineelItemId || item.id);

  spreekVeilig(item.tekst, 300);
}

function hoorWoord() {
  const items = getActieveItems(huidigThema);
  if (items[kijkenIndex]) AudioEngine.spreek(items[kijkenIndex].tekst);
}

function hoorZin() {
  const items = getActieveItems(huidigThema);
  if (items[kijkenIndex] && items[kijkenIndex].zin) AudioEngine.spreek(items[kijkenIndex].zin);
}

function kijkenVolgende() {
  const totaal = getActieveItems(huidigThema).length;
  if (totaal === 0) return;
  kijkenIndex = (kijkenIndex + 1) % totaal;
  rendererKijken();
  // Bewaar elke 3 stappen
  if (kijkenIndex % 3 === 0) Voortgang.bewaar(Auth.getCode());
}

function kijkenVorige() {
  const _t = getActieveItems(huidigThema).length;
  if (_t === 0) return;
  kijkenIndex = (kijkenIndex - 1 + _t) % _t;
  rendererKijken();
}

// =================================================================
//  MODUS: LEZEN
// =================================================================
function rendererLezen() {
  const grid = document.getElementById('lezen-grid');
  grid.innerHTML = '';
  getActieveItems(huidigThema).forEach(item => {
    const stats = Voortgang.getCache()[huidigThema.id]?.[item.id];
    const sterren = stats?.sterren || 0;
    const sterrenStr = '⭐'.repeat(sterren);

    const kaart = document.createElement('button');
    kaart.className = 'lees-kaart';
    kaart.innerHTML = `
      ${sterren > 0 ? `<div class="lees-sterren">${sterrenStr}</div>` : ''}
      <div class="lees-beeld">${Picto.html(item)}</div>
      <div class="lees-woord">${item.tekst}</div>
    `;
    kaart.onclick = () => {
      document.querySelectorAll('.lees-kaart').forEach(k => k.classList.remove('spreekt'));
      kaart.classList.add('spreekt');
      Voortgang.registreerGezien(huidigThema.id, item.id);
      AudioEngine.spreek(item.tekst, {
        opEinde: () => kaart.classList.remove('spreekt')
      });
    };
    grid.appendChild(kaart);
  });
}

// =================================================================
//  MODUS: OEFENEN (zonder einde, vrije oefening)
// =================================================================
function volgendeOefenVraag() {
  const items = getActieveItems(huidigThema);
  if (gebruikteOefenIndices.length >= items.length) gebruikteOefenIndices = [];

  let kandidaten = [];
  for (let i = 0; i < items.length; i++) {
    if (!gebruikteOefenIndices.includes(i)) kandidaten.push(i);
  }
  const idx = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  gebruikteOefenIndices.push(idx);
  oefenItem = items[idx];

  // 3 afleiders
  const afl = [];
  const beschikb = items.filter((_, i) => i !== idx);
  while (afl.length < 3 && beschikb.length > afl.length) {
    const k = beschikb[Math.floor(Math.random() * beschikb.length)];
    if (!afl.includes(k)) afl.push(k);
  }
  const opties = [oefenItem, ...afl].sort(() => Math.random() - 0.5);

  document.getElementById('oefen-beeld').innerHTML = Picto.html(oefenItem);
  document.getElementById('oefen-feedback').textContent = '';
  document.getElementById('oefen-feedback').className = 'oefen-feedback';

  const div = document.getElementById('oefen-opties');
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'optie-knop';
    k.textContent = opt.tekst;
    k.onclick = () => kiesOefenAntwoord(k, opt);
    div.appendChild(k);
  });

  spreekVeilig(oefenItem.tekst, 400);
}

function herhaalOefen() {
  if (oefenItem) AudioEngine.spreek(oefenItem.tekst);
}

function kiesOefenAntwoord(knop, gekozen) {
  document.querySelectorAll('.optie-knop').forEach(k => k.disabled = true);
  const fb = document.getElementById('oefen-feedback');

  if (gekozen.id === oefenItem.id) {
    knop.classList.add('juist');
    fb.textContent = '✨ Goed zo!';
    fb.className = 'oefen-feedback juist';
    score++;
    document.getElementById('score').textContent = score;
    Voortgang.registreerJuist(huidigThema.id, oefenItem.id);
    AudioEngine.spreek(oefenItem.tekst);
    const v1 = _schermVersie;
    setTimeout(() => { if (_schermVersie === v1) { volgendeOefenVraag(); Voortgang.bewaar(Auth.getCode()); } }, 1400);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('.optie-knop').forEach(k => {
      if (k.textContent === oefenItem.tekst) k.classList.add('juist');
    });
    fb.textContent = `Het juiste antwoord is: ${oefenItem.tekst}`;
    fb.className = 'oefen-feedback fout';
    Voortgang.registreerFout(huidigThema.id, oefenItem.id);
    AudioEngine.spreek(oefenItem.tekst);
    const v2 = _schermVersie;
    setTimeout(() => { if (_schermVersie === v2) { volgendeOefenVraag(); Voortgang.bewaar(Auth.getCode()); } }, 2400);
  }
}

// =================================================================
//  MODUS: TOETS (vast aantal vragen, telt mee voor sterren)
// =================================================================
function startToets() {
  // Schud thema-items, neem eerste TOETS_AANTAL (of alles als minder)
  const items = [...getActieveItems(huidigThema)].sort(() => Math.random() - 0.5);
  toetsVragen = items.slice(0, Math.min(TOETS_AANTAL, items.length));

  if (toetsVragen.length === 0) {
    alert('Er zijn geen woorden om te toetsen. Vraag aan je juf of meester.');
    naarStart();
    return;
  }

  toetsHuidig = 0;
  toetsJuist = 0;
  toetsFoutIds = [];
  document.getElementById('toets-totaal').textContent = toetsVragen.length;
  toonToetsVraag();
  toonScherm('scherm-toets');
}

function toonToetsVraag() {
  toetsItem = toetsVragen[toetsHuidig];
  document.getElementById('toets-huidig').textContent = toetsHuidig + 1;
  document.getElementById('toets-beeld').innerHTML = Picto.html(toetsItem);

  // Voortgangsbalk
  const pct = (toetsHuidig / toetsVragen.length) * 100;
  document.getElementById('toets-balk-vulling').style.width = pct + '%';

  // 3 afleiders uit hetzelfde thema
  const beschikb = getActieveItems(huidigThema).filter(x => x.id !== toetsItem.id);
  const afl = [];
  while (afl.length < 3 && beschikb.length > afl.length) {
    const k = beschikb[Math.floor(Math.random() * beschikb.length)];
    if (!afl.includes(k)) afl.push(k);
  }
  const opties = [toetsItem, ...afl].sort(() => Math.random() - 0.5);

  const div = document.getElementById('toets-opties');
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'optie-knop';
    k.textContent = opt.tekst;
    k.onclick = () => kiesToetsAntwoord(k, opt);
    div.appendChild(k);
  });

  spreekVeilig(toetsItem.tekst, 400);
}

function herhaalToets() {
  if (toetsItem) AudioEngine.spreek(toetsItem.tekst);
}

function kiesToetsAntwoord(knop, gekozen) {
  document.querySelectorAll('.optie-knop').forEach(k => k.disabled = true);

  if (gekozen.id === toetsItem.id) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(huidigThema.id, toetsItem.id);
    toetsJuist++;
    AudioEngine.spreek(toetsItem.tekst);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('.optie-knop').forEach(k => {
      if (k.textContent === toetsItem.tekst) k.classList.add('juist');
    });
    Voortgang.registreerFout(huidigThema.id, toetsItem.id);
    if (toetsFoutIds.indexOf(toetsItem.id) === -1) toetsFoutIds.push(toetsItem.id);
    AudioEngine.spreek(toetsItem.tekst);
  }

  const vt = _schermVersie;
  setTimeout(() => {
    if (_schermVersie !== vt) return;
    toetsHuidig++;
    if (toetsHuidig >= toetsVragen.length) eindigToets();
    else toonToetsVraag();
  }, 1400);
}

function bevestigVerlatenToets() {
  if (confirm('Toets stoppen? Je voortgang gaat dan verloren.')) {
    naarThema();
  }
}

async function eindigToets() {
  await Voortgang.bewaar(Auth.getCode());

  const aantal = toetsVragen.length;
  const juist = toetsJuist;
  const pct = aantal > 0 ? Math.round((juist / aantal) * 100) : 0;

  document.getElementById('resultaat-juist').textContent = juist;
  document.getElementById('resultaat-totaal').textContent = aantal;

  let emoji, titel, tekst;
  if (pct === 100) {
    emoji = '🏆'; titel = 'Top!'; tekst = 'Alles juist! Super gedaan!';
  } else if (pct >= 80) {
    emoji = '🎉'; titel = 'Heel goed!'; tekst = 'Bijna alles juist!';
  } else if (pct >= 60) {
    emoji = '👍'; titel = 'Goed gedaan!'; tekst = 'Je bent goed bezig!';
  } else if (pct >= 40) {
    emoji = '🌱'; titel = 'Blijf oefenen!'; tekst = 'Oefen nog wat en probeer opnieuw.';
  } else {
    emoji = '💪'; titel = 'Niet opgeven!'; tekst = 'Bekijk eerst de woorden en kom terug.';
  }

  document.getElementById('resultaat-emoji').textContent = emoji;
  document.getElementById('resultaat-titel').textContent = titel;
  document.getElementById('resultaat-tekst').textContent = tekst;

  toonScherm('scherm-toets-eind');
}

// Hoofdknop op toets-eind-scherm: terug naar het thema-scherm.
function resultaatVerder() {
  naarThema();
}

// =================================================================
//  SPELEN — gemeenschappelijke functies
// =================================================================
function startSpel(spel) {
  if (!huidigThema) return;
  if (spel === 'klikspel') startKlikspel();
  else if (spel === 'memory') startMemory();
  else if (spel === 'verbinden') startVerbinden();
  else if (spel === 'snelheid') startSnelheid();
}

function stopSpel() {
  if (Auth.ingelogd()) Voortgang.bewaar(Auth.getCode());
  AudioEngine.stop();
  // Stop snelheidstimer als die loopt
  if (snelTimerInterval) {
    clearInterval(snelTimerInterval);
    snelTimerInterval = null;
  }
  toonScherm('scherm-spelen');
}

// Hulpfunctie: schud array (Fisher-Yates)
function schudArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// =================================================================
//  SPEL 1: KLIKSPEL — beeld zien, woord kiezen
// =================================================================
let klikItem = null;
let klikStreak = 0;
let klikGebruikt = []; // ids van items die deze sessie al voorgekomen zijn

function startKlikspel() {
  if (getActieveItems(huidigThema).length === 0) { alert("Er zijn nog geen woorden voor jou in dit thema."); return; }
  klikStreak = 0;
  klikGebruikt = [];
  document.getElementById('klik-streak').textContent = '0';
  toonScherm('scherm-klikspel');
  volgendeKlikVraag();
}

function volgendeKlikVraag() {
  const items = getActieveItems(huidigThema);
  // Reset als alle items getoond zijn
  if (klikGebruikt.length >= items.length) klikGebruikt = [];

  const beschikbaar = items.filter(it => !klikGebruikt.includes(it.id));
  klikItem = beschikbaar[Math.floor(Math.random() * beschikbaar.length)];
  klikGebruikt.push(klikItem.id);

  // 3 afleiders uit hetzelfde thema
  const afleiders = schudArray(items.filter(it => it.id !== klikItem.id)).slice(0, 3);
  const opties = schudArray([klikItem, ...afleiders]);

  document.getElementById('klik-beeld').innerHTML = Picto.html(klikItem);
  document.getElementById('klik-feedback').textContent = '';
  document.getElementById('klik-feedback').className = 'klikspel-feedback';

  const div = document.getElementById('klik-opties');
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'klik-optie-knop';
    k.textContent = opt.tekst;
    k.onclick = () => kiesKlikAntwoord(k, opt);
    div.appendChild(k);
  });

  spreekVeilig(klikItem.tekst, 400);
}

function klikHoorOpnieuw() {
  if (klikItem) AudioEngine.spreek(klikItem.tekst);
}

function kiesKlikAntwoord(knop, gekozen) {
  document.querySelectorAll('.klik-optie-knop').forEach(k => k.disabled = true);
  const fb = document.getElementById('klik-feedback');

  if (gekozen.id === klikItem.id) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(huidigThema.id, klikItem.id);
    klikStreak++;
    document.getElementById('klik-streak').textContent = klikStreak;
    fb.textContent = '✨ Goed zo!';
    fb.className = 'klikspel-feedback juist';
    AudioEngine.spreek(klikItem.tekst);
    if (klikStreak % 3 === 0) Voortgang.bewaar(Auth.getCode());
    const v = _schermVersie;
    setTimeout(() => { if (_schermVersie === v) volgendeKlikVraag(); }, 1400);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('.klik-optie-knop').forEach(k => {
      if (k.textContent === klikItem.tekst) k.classList.add('juist');
    });
    Voortgang.registreerFout(huidigThema.id, klikItem.id);
    klikStreak = 0;
    document.getElementById('klik-streak').textContent = '0';
    fb.textContent = `Het woord was: ${klikItem.tekst}`;
    fb.className = 'klikspel-feedback fout';
    AudioEngine.spreek(klikItem.tekst);
    const v = _schermVersie;
    setTimeout(() => { if (_schermVersie === v) volgendeKlikVraag(); }, 2400);
  }
}

// =================================================================
//  SPEL 2: MEMORY — paren zoeken (woord-kaart koppelt aan beeld-kaart)
// =================================================================
const MEMORY_PAREN_AANTAL = 6;
let memoryKaarten = [];
let memoryEersteKaart = null;
let memoryBezig = false; // tijdens animatie kan kind niet klikken
let memoryGevonden = 0;

function startMemory() {
  if (getActieveItems(huidigThema).length < 3) { alert("Te weinig woorden voor memory. Vraag aan je juf om meer categorieën aan te zetten."); return; }
  memoryEersteKaart = null;
  memoryBezig = false;
  memoryGevonden = 0;

  // Kies N items uit het thema
  const items = schudArray(getActieveItems(huidigThema)).slice(0, MEMORY_PAREN_AANTAL);

  // Voor elk item maken we 2 kaarten: een woord-kaart en een beeld-kaart
  memoryKaarten = [];
  items.forEach(item => {
    memoryKaarten.push({ id: 'b-' + item.id, itemId: item.id, type: 'beeld', inhoud: Picto.html(item), item });
    memoryKaarten.push({ id: 'w-' + item.id, itemId: item.id, type: 'woord', inhoud: item.tekst, item });
  });
  memoryKaarten = schudArray(memoryKaarten);

  document.getElementById('memory-paren').textContent = '0';
  document.getElementById('memory-totaal').textContent = items.length;
  document.getElementById('memory-feedback').textContent = '';

  rendererMemory();
  toonScherm('scherm-memory');
}

function rendererMemory() {
  const grid = document.getElementById('memory-grid');
  grid.innerHTML = '';
  memoryKaarten.forEach(kaart => {
    const k = document.createElement('button');
    k.className = 'memory-kaart';
    k.dataset.id = kaart.id;
    k.dataset.itemId = kaart.itemId;
    k.dataset.type = kaart.type;
    // Bij woord-kaarten: kleine luidspreker zodat kind opnieuw kan horen
    const luidspreker = kaart.type === 'woord'
      ? `<span class="memory-luidspreker" data-spreek="${kaart.item.tekst.replace(/"/g,'&quot;')}">🔊</span>`
      : '';
    k.innerHTML = `
      <span class="memory-kaart-achter">?</span>
      <span class="memory-kaart-voor">
        <span class="memory-kaart-inhoud">${kaart.inhoud}</span>
        ${luidspreker}
      </span>
    `;
    k.onclick = (e) => {
      // Klik op luidspreker = alleen uitspreken, kaart niet kiezen als hij al open is
      if (e.target.classList.contains('memory-luidspreker')) {
        e.stopPropagation();
        AudioEngine.spreek(kaart.item.tekst);
        return;
      }
      kiesMemoryKaart(k, kaart);
    };
    grid.appendChild(k);
  });
}

function kiesMemoryKaart(knop, kaart) {
  if (memoryBezig) return;
  if (knop.classList.contains('open') || knop.classList.contains('gevonden')) return;

  knop.classList.add('open');

  // Eerste kaart van een paar
  if (!memoryEersteKaart) {
    memoryEersteKaart = { knop, kaart };
    return;
  }

  // Tweede kaart — vergelijken
  memoryBezig = true;
  const eerste = memoryEersteKaart;
  memoryEersteKaart = null;

  const isPaar = (eerste.kaart.itemId === kaart.itemId) && (eerste.kaart.type !== kaart.type);

  if (isPaar) {
    // Markeer beide als gevonden (woord wordt al uitgesproken hierboven)
    Voortgang.registreerJuist(huidigThema.id, kaart.itemId);
    memoryGevonden++;
    document.getElementById('memory-paren').textContent = memoryGevonden;

    setTimeout(() => {
      eerste.knop.classList.add('gevonden');
      knop.classList.add('gevonden');
      memoryBezig = false;

      if (memoryGevonden >= MEMORY_PAREN_AANTAL) {
        // Alle paren gevonden!
        document.getElementById('memory-feedback').innerHTML = '🏆 Alle paren gevonden! <button class="grote-knop" onclick="startMemory()">Opnieuw</button>';
        Voortgang.bewaar(Auth.getCode());
      }
    }, 800);
  } else {
    // Geen paar — dicht na korte tijd
    Voortgang.registreerFout(huidigThema.id, kaart.itemId);
    setTimeout(() => {
      eerste.knop.classList.remove('open');
      knop.classList.remove('open');
      memoryBezig = false;
    }, 1100);
  }
}

// =================================================================
//  SPEL 3: VERBINDEN — drag-and-drop lijntjes trekken
// =================================================================
const VERBIND_AANTAL = 5;
let verbindItems = [];
let verbindGoed = 0;
let verbindActief = null; // huidig bezig met slepen vanaf
let verbindGekoppeld = []; // {linksId, rechtsId, juist}

function startVerbinden() {
  if (getActieveItems(huidigThema).length < 4) { alert("Te weinig woorden om te verbinden. Vraag aan je juf om meer categorieën aan te zetten."); return; }
  verbindGoed = 0;
  verbindGekoppeld = [];
  verbindActief = null;
  verbindNieuweRonde();
  toonScherm('scherm-verbinden');
}

function verbindNieuweRonde() {
  // Kies N items
  verbindItems = schudArray(getActieveItems(huidigThema)).slice(0, VERBIND_AANTAL);
  verbindGoed = 0;
  verbindGekoppeld = [];
  verbindActief = null;

  document.getElementById('verbind-goed').textContent = '0';
  document.getElementById('verbind-totaal').textContent = verbindItems.length;
  document.getElementById('verbind-volgende-knop').style.display = 'none';

  // Links: beelden in originele volgorde
  const links = document.getElementById('verbind-links');
  links.innerHTML = '';
  verbindItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'verbind-item verbind-item-beeld';
    el.dataset.itemId = item.id;
    el.dataset.zijde = 'links';
    el.innerHTML = `${Picto.html(item, { klasse: 'verbind-emoji' })}
      <button class="verbind-luisterhulp" type="button"
        aria-label="Hoor het woord als hulp" title="Hoor het woord als hulp"
        onpointerdown="event.stopPropagation()"
        onclick="verbindHoor(event, '${item.id}')">🔊</button>`;
    voegVerbindEventsToe(el);
    links.appendChild(el);
  });

  // Rechts: woorden in geschudde volgorde
  const rechts = document.getElementById('verbind-rechts');
  rechts.innerHTML = '';
  schudArray(verbindItems).forEach(item => {
    const el = document.createElement('div');
    el.className = 'verbind-item verbind-item-woord';
    el.dataset.itemId = item.id;
    el.dataset.zijde = 'rechts';
    el.textContent = item.tekst;
    voegVerbindEventsToe(el);
    rechts.appendChild(el);
  });

  // Maak de SVG schoon
  document.getElementById('verbind-svg').innerHTML = '';
}

// State voor slepen
let _verbindSleepBezig = false;
let _verbindSleepStart = null;
let _verbindSleepLijn = null;
let _verbindSleepStartPos = null;

function voegVerbindEventsToe(el) {
  // Pointer events werken voor zowel muis als touch
  el.addEventListener('pointerdown', verbindPointerDown);
  el.addEventListener('click', verbindKlik);
}

function verbindPointerDown(e) {
  const el = e.currentTarget;
  if (el.classList.contains('verbind-juist')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return; // alleen linker muisknop

  _verbindSleepStart = el;
  _verbindSleepBezig = false; // wordt true zodra gebruiker beweegt
  _verbindSleepStartPos = { x: e.clientX, y: e.clientY };

  // Luister verder op het hele document zodat sleep doorgaat ook buiten de element
  document.addEventListener('pointermove', verbindPointerMove);
  document.addEventListener('pointerup', verbindPointerUp);
  document.addEventListener('pointercancel', verbindPointerUp);

  // Voorkom standaard touch-scroll tijdens slepen
  e.preventDefault();
}

function verbindPointerMove(e) {
  if (!_verbindSleepStart) return;

  // Bepaal of we voldoende bewogen zijn om "slepen" te herkennen
  const dx = e.clientX - _verbindSleepStartPos.x;
  const dy = e.clientY - _verbindSleepStartPos.y;
  if (!_verbindSleepBezig && Math.abs(dx) + Math.abs(dy) < 8) return; // nog geen sleep

  _verbindSleepBezig = true;

  // Markeer startelement als actief
  _verbindSleepStart.classList.add('actief');

  // Teken/update lijn vanaf startelement naar cursor
  const veld = document.getElementById('verbind-veld');
  const svg = document.getElementById('verbind-svg');
  const veldRect = veld.getBoundingClientRect();
  const startRect = _verbindSleepStart.getBoundingClientRect();

  // Startpunt: midden van rechterkant (links) of linkerkant (rechts)
  const isLinks = _verbindSleepStart.dataset.zijde === 'links';
  const x1 = (isLinks ? startRect.right : startRect.left) - veldRect.left;
  const y1 = startRect.top + startRect.height / 2 - veldRect.top;
  const x2 = e.clientX - veldRect.left;
  const y2 = e.clientY - veldRect.top;

  if (!_verbindSleepLijn) {
    _verbindSleepLijn = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    _verbindSleepLijn.setAttribute('stroke-width', '4');
    _verbindSleepLijn.setAttribute('stroke-linecap', 'round');
    _verbindSleepLijn.setAttribute('stroke', '#3A86FF');
    _verbindSleepLijn.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(_verbindSleepLijn);
  }
  _verbindSleepLijn.setAttribute('x1', x1);
  _verbindSleepLijn.setAttribute('y1', y1);
  _verbindSleepLijn.setAttribute('x2', x2);
  _verbindSleepLijn.setAttribute('y2', y2);

  // Highlight het element waar de cursor over zit (als geldige drop-target)
  document.querySelectorAll('.verbind-item.over').forEach(x => x.classList.remove('over'));
  const onder = document.elementFromPoint(e.clientX, e.clientY);
  const dropTarget = onder ? onder.closest('.verbind-item') : null;
  if (dropTarget && dropTarget.dataset.zijde !== _verbindSleepStart.dataset.zijde
      && !dropTarget.classList.contains('verbind-juist')) {
    dropTarget.classList.add('over');
  }
}

function verbindPointerUp(e) {
  document.removeEventListener('pointermove', verbindPointerMove);
  document.removeEventListener('pointerup', verbindPointerUp);
  document.removeEventListener('pointercancel', verbindPointerUp);

  if (!_verbindSleepStart) return;
  const startEl = _verbindSleepStart;

  // Verwijder tijdelijke sleep-lijn
  if (_verbindSleepLijn) {
    _verbindSleepLijn.parentNode.removeChild(_verbindSleepLijn);
    _verbindSleepLijn = null;
  }
  document.querySelectorAll('.verbind-item.over').forEach(x => x.classList.remove('over'));

  if (!_verbindSleepBezig) {
    // Was geen sleep, maar een klik — laat klik-handler het overnemen
    _verbindSleepStart = null;
    return;
  }

  // Echte sleep: zoek waar pointer eindigde
  const eindEl = document.elementFromPoint(e.clientX, e.clientY);
  const doelItem = eindEl ? eindEl.closest('.verbind-item') : null;

  if (doelItem
      && doelItem !== startEl
      && doelItem.dataset.zijde !== startEl.dataset.zijde
      && !doelItem.classList.contains('verbind-juist')) {
    // Geldige drop — verbind ze
    verbindKoppel(startEl, doelItem);
  } else {
    // Ongeldige drop — reset actief
    startEl.classList.remove('actief');
  }

  _verbindSleepStart = null;
  _verbindSleepBezig = false;
}

function verbindKlik(e) {
  // Klikgedrag werkt ALLEEN als er net niet gesleept is
  if (_verbindSleepBezig) return;
  const el = e.currentTarget;
  if (el.classList.contains('verbind-juist')) return;

  if (!verbindActief) {
    verbindActief = el;
    document.querySelectorAll('.verbind-item.actief').forEach(x => x.classList.remove('actief'));
    el.classList.add('actief');
    return;
  }

  if (verbindActief.dataset.zijde === el.dataset.zijde) {
    verbindActief.classList.remove('actief');
    verbindActief = el;
    el.classList.add('actief');
    return;
  }

  verbindKoppel(verbindActief, el);
  verbindActief = null;
}

function verbindHoor(e, itemId) {
  e.preventDefault();
  e.stopPropagation();
  const item = huidigThema.items.find(it => it.id === itemId);
  if (item) AudioEngine.spreek(item.tekst);
}

function verbindKoppel(elA, elB) {
  // Bepaal welke links en welke rechts
  const linksEl = elA.dataset.zijde === 'links' ? elA : elB;
  const rechtsEl = elA.dataset.zijde === 'rechts' ? elA : elB;
  const juist = linksEl.dataset.itemId === rechtsEl.dataset.itemId;

  // Teken een definitieve lijn ertussen
  const veld = document.getElementById('verbind-veld');
  const svg = document.getElementById('verbind-svg');
  const veldRect = veld.getBoundingClientRect();
  const lEl = linksEl.getBoundingClientRect();
  const rEl = rechtsEl.getBoundingClientRect();

  const x1 = lEl.right - veldRect.left;
  const y1 = lEl.top + lEl.height / 2 - veldRect.top;
  const x2 = rEl.left - veldRect.left;
  const y2 = rEl.top + rEl.height / 2 - veldRect.top;

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke-width', '4');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke', juist ? '#06A77D' : '#E63946');
  svg.appendChild(line);

  if (juist) {
    linksEl.classList.add('verbind-juist');
    rechtsEl.classList.add('verbind-juist');
    linksEl.classList.remove('actief');
    rechtsEl.classList.remove('actief');
    Voortgang.registreerJuist(huidigThema.id, linksEl.dataset.itemId);
    verbindGoed++;
    document.getElementById('verbind-goed').textContent = verbindGoed;

    if (verbindGoed >= verbindItems.length) {
      document.getElementById('verbind-volgende-knop').style.display = 'block';
      Voortgang.bewaar(Auth.getCode());
    }
  } else {
    Voortgang.registreerFout(huidigThema.id, linksEl.dataset.itemId);
    linksEl.classList.add('verbind-fout');
    rechtsEl.classList.add('verbind-fout');
    setTimeout(() => {
      linksEl.classList.remove('verbind-fout', 'actief');
      rechtsEl.classList.remove('verbind-fout', 'actief');
      if (svg.contains(line)) svg.removeChild(line);
    }, 900);
  }
}

function verbindVolgendeRonde() {
  verbindNieuweRonde();
}

// =================================================================
//  SPEL 4: SNELHEID — klikspel met timer (30 sec)
// =================================================================
const SNELHEID_SECONDEN = 30;
let snelItem = null;
let snelScore = 0;
let snelTimerStart = 0;
let snelTimerInterval = null;
let snelGebruikt = [];
let snelModus = null; // 'beeld-woord' of 'luister-beeld'

function startSnelheid(modus) {
  if (getActieveItems(huidigThema).length < 4) { alert("Te weinig woorden voor het snelheidsspel."); return; }
  AudioEngine.stop();
  if (!modus) {
    snelModus = null;
    if (snelTimerInterval) clearInterval(snelTimerInterval);
    snelTimerInterval = null;
    toonScherm('scherm-snelheid');
    document.getElementById('snel-keuze').style.display = '';
    document.getElementById('snel-spel').style.display = 'none';
    document.getElementById('snel-eind').style.display = 'none';
    return;
  }
  snelModus = modus;
  snelScore = 0;
  snelGebruikt = [];
  document.getElementById('snel-score').textContent = '0';
  document.getElementById('snel-keuze').style.display = 'none';
  document.getElementById('snel-spel').style.display = '';
  document.getElementById('snel-eind').style.display = 'none';
  document.getElementById('snel-vraag-doos').style.display = '';
  document.getElementById('snel-opties').style.display = '';
  toonScherm('scherm-snelheid');

  // Start timer
  snelTimerStart = Date.now();
  updateSnelTimer();
  if (snelTimerInterval) clearInterval(snelTimerInterval);
  snelTimerInterval = setInterval(updateSnelTimer, 100);

  volgendeSnelVraag();
}

function updateSnelTimer() {
  const verstreken = (Date.now() - snelTimerStart) / 1000;
  const over = Math.max(0, SNELHEID_SECONDEN - verstreken);
  const procent = (over / SNELHEID_SECONDEN) * 100;

  document.getElementById('snel-timer-tekst').textContent = Math.ceil(over);
  document.getElementById('snel-timer-vul').style.width = procent + '%';

  // Kleur veranderen op het einde
  const balk = document.getElementById('snel-timer-vul');
  if (over < 5) balk.style.background = 'var(--kleur-fout)';
  else if (over < 10) balk.style.background = '#FFB627';
  else balk.style.background = 'var(--kleur-juist)';

  if (over <= 0) eindigSnelheid();
}

function volgendeSnelVraag() {
  const items = getActieveItems(huidigThema);
  if (snelGebruikt.length >= items.length) snelGebruikt = [];

  const beschikbaar = items.filter(it => !snelGebruikt.includes(it.id));
  snelItem = beschikbaar[Math.floor(Math.random() * beschikbaar.length)];
  snelGebruikt.push(snelItem.id);

  const afleiders = schudArray(items.filter(it => it.id !== snelItem.id)).slice(0, 3);
  const opties = schudArray([snelItem, ...afleiders]);

  const vraagTekst = document.getElementById('snel-vraag-tekst');
  const beeld = document.getElementById('snel-beeld');
  if (snelModus === 'luister-beeld') {
    vraagTekst.textContent = 'Luister en kies zo snel mogelijk het juiste beeld.';
    beeld.className = 'snel-luisterkaart';
    beeld.innerHTML = `<strong>${snelItem.tekst}</strong><button type="button" onclick="hoorSnelWoord(event)" aria-label="Hoor het woord opnieuw">🔊</button>`;
  } else {
    vraagTekst.textContent = 'Welk woord hoort bij dit beeld?';
    beeld.className = 'klikspel-beeld';
    beeld.innerHTML = Picto.html(snelItem);
  }

  const div = document.getElementById('snel-opties');
  div.innerHTML = '';
  opties.forEach((opt, index) => {
    const k = document.createElement('button');
    k.className = 'klik-optie-knop' + (snelModus === 'luister-beeld' ? ' snel-afbeelding-optie' : '');
    if (snelModus === 'luister-beeld') {
      k.setAttribute('aria-label', 'Kies afbeelding ' + (index + 1));
      k.innerHTML = Picto.html(opt, { grootte: 88 });
    } else {
      k.textContent = opt.tekst;
    }
    k.onclick = () => kiesSnelAntwoord(k, opt);
    div.appendChild(k);
  });
  if (snelModus === 'luister-beeld') AudioEngine.spreek(snelItem.tekst);
}

function hoorSnelWoord(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (snelItem) AudioEngine.spreek(snelItem.tekst);
}

function herstartSnelheid() {
  startSnelheid(snelModus || 'beeld-woord');
}

function kiesSnelAntwoord(knop, gekozen) {
  if (gekozen.id === snelItem.id) {
    knop.classList.add('juist');
    Voortgang.registreerJuist(huidigThema.id, snelItem.id);
    snelScore++;
    document.getElementById('snel-score').textContent = snelScore;
    // Direct door naar volgende, geen wachttijd — snelheid is van belang
    const v = _schermVersie;
    setTimeout(() => { if (_schermVersie === v) volgendeSnelVraag(); }, 250);
  } else {
    knop.classList.add('fout');
    Voortgang.registreerFout(huidigThema.id, snelItem.id);
    // Korte penalty van 600ms voor je verder mag
    document.querySelectorAll('#snel-opties .klik-optie-knop').forEach(k => k.disabled = true);
    const v = _schermVersie;
    setTimeout(() => { if (_schermVersie === v) volgendeSnelVraag(); }, 600);
  }
}

function eindigSnelheid() {
  if (snelTimerInterval) {
    clearInterval(snelTimerInterval);
    snelTimerInterval = null;
  }
  // Verberg vraag, toon eindscherm
  document.getElementById('snel-vraag-doos').style.display = 'none';
  document.getElementById('snel-opties').style.display = 'none';
  document.getElementById('snel-eind').style.display = 'block';
  document.getElementById('snel-eind-score').textContent = snelScore;

  // Aangepaste titel obv score
  const titelEl = document.getElementById('snel-eind-titel');
  if (snelScore >= 15) titelEl.textContent = '🏆 Geweldig!';
  else if (snelScore >= 10) titelEl.textContent = '⭐ Top!';
  else if (snelScore >= 5) titelEl.textContent = '✨ Goed bezig!';
  else titelEl.textContent = '⏰ Tijd om!';

  Voortgang.bewaar(Auth.getCode());
}

// =================================================================
//  Start
// =================================================================
document.addEventListener('DOMContentLoaded', init);

// Auto-bewaar bij verlaten pagina
window.addEventListener('beforeunload', () => {
  if (Auth.ingelogd()) Voortgang.bewaar(Auth.getCode());
});
