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

// Survival-thema's — altijd open, hoogste prioriteit voor nieuwkomers
const THEMAS_SURVIVAL = _veiligThemas([
  ['THEMA_SURVIVAL_KLAS', 'survival-klas.js'],
  ['THEMA_SURVIVAL_SPEELPLAATS', 'survival-speelplaats.js'],
  ['THEMA_SURVIVAL_HEENTERUG', 'survival-heenterug.js'],
]);

// Leerlijn-thema's — in volgorde van eenvoud
const THEMAS_WOORDEN = _veiligThemas([
  ['THEMA_WOORDEN_KLAS', 'woorden-klas.js'],
  ['THEMA_WOORDEN_LICHAAM', 'woorden-lichaam.js'],
  ['THEMA_WOORDEN_ETEN', 'woorden-eten.js'],
  ['THEMA_WOORDEN_FAMILIE', 'woorden-familie.js'],
  ['THEMA_WOORDEN_DIEREN', 'woorden-dieren.js'],
  ['THEMA_WOORDEN_CIJFERS', 'woorden-cijfers.js'],
  ['THEMA_WOORDEN_KLEUREN', 'woorden-kleuren.js'],
  ['THEMA_WOORDEN_VORMEN', 'woorden-vormen.js'],
  ['THEMA_WOORDEN_DOEN', 'woorden-doen.js'],
  ['THEMA_WOORDEN_THUIS', 'woorden-thuis.js'],
]);

const THEMAS_ZINNEN = _veiligThemas([
  ['THEMA_ZINNEN_SCHOOL', 'zinnen-school.js'],
  ['THEMA_ZINNEN_BELEEFD', 'zinnen-beleefd.js'],
  ['THEMA_ZINNEN_GEVOEL', 'zinnen-gevoel.js'],
  ['THEMA_ZINNEN_HULP', 'zinnen-hulp.js'],
  ['THEMA_ZINNEN_TIJD', 'zinnen-tijd.js'],
]);

const ALLE_THEMAS = [...THEMAS_SURVIVAL, ...THEMAS_WOORDEN, ...THEMAS_ZINNEN];

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
// → mini-toets-luisteren → (klaar of moeilijk).
//
// State:
//   - taakModus = true zodra het kind in een taak zit
//   - taakHuidigeFase = 'leren' | 'luisteren-oef' | 'luisteren-toets' | 'klaar'
//   - taakItems = items van de taak (uit het thema gefilterd op woordIds)
//   - taakLeerIndex = welk item is zichtbaar in leren-fase
//   - taakOefItem = huidig item in oefen-fase
//   - taakToetsFoutCount = aantal foutieve toetsen voor deze taak
//
// Belangrijk: in oefen- en toets-fases speelt audio NIET automatisch.
// Het kind moet zelf op de hoorknop klikken om het woord te horen.

let taakModus = false;
let taakHuidigeFase = null;
let taakItems = [];
let taakLeerIndex = 0;
let taakOefItem = null;

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
  const knop = zone.querySelector('.taak-knop-groot');

  if (themaNaamEl) themaNaamEl.textContent = `${thema.emoji} ${thema.naam}`;
  if (aantalEl) {
    const n = taak.woordIds.length;
    aantalEl.textContent = n === 1 ? '1 woord' : `${n} woorden`;
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

  // Als taak al voltooid of moeilijk was: kind start hem opnieuw → reset
  if (taak.status === 'voltooid' || taak.status === 'moeilijk' || taak.status === 'haperde') {
    Voortgang.updateTaak({
      status: 'bezig',
      huidigeFase: 'leren',
      foutWoordenLaatsteToets: [],
      aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 }
    });
  }

  huidigThema = thema;
  taakModus = true;
  taakItems = _taakItems(Voortgang.getTaak(), thema);

  if (taakItems.length === 0) {
    alert('Er zijn geen woorden in je taak. Vraag aan je juf.');
    taakModus = false;
    return;
  }

  // Start altijd bij leren-fase wanneer kind op taak-knop klikt
  taakStartFase('leren');
}

// Centrale fase-router
function taakStartFase(fase) {
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
  } else if (fase === 'klaar') {
    taakToonKlaar();
  }
}

// Bij klik op een fase-terug-knop: ga één fase terug.
function taakFaseTerug() {
  if (taakHuidigeFase === 'luisteren-oef') {
    taakStartFase('leren');
  } else if (taakHuidigeFase === 'luisteren-toets') {
    taakStartFase('luisteren-oef');
  }
  // Vanuit 'leren' geen terug; vanuit 'klaar' ook niet
}

// Verlaat de taak en ga terug naar startscherm.
function taakVerlaten() {
  taakModus = false;
  taakHuidigeFase = null;
  taakItems = [];
  taakLeerIndex = 0;
  taakOefItem = null;
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

  document.getElementById('taak-leer-beeld').innerHTML = Picto.html(item);
  document.getElementById('taak-leer-woord').textContent = item.tekst;

  // Zin tonen indien zinscontext aan en zin bestaat
  const zinEl = document.getElementById('taak-leer-zin');
  const zinKnop = document.getElementById('taak-leer-zin-knop');
  const toonZin = !!(taak && taak.zinscontext && item.zin && item.zin.trim());
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
    // Einde leren → volgende fase
    taakStartFase('luisteren-oef');
    return;
  }
  taakLeerIndex++;
  taakRendererLeren();
}

// =================================================================
//  TAAK FASE 2 — LUISTEREN-OEFENEN  (klikspel, stilte, audio op vraag)
// =================================================================
function taakStartLuisterenOefenen() {
  // Pak een woord dat nog geen 3× juist heeft
  const item = _kiesVolgendOefenItem('luisteren');
  if (!item) {
    // Alle woorden 3× juist → naar toets
    taakStartFase('luisteren-toets');
    return;
  }
  taakOefItem = item;
  taakRendererLuisterenOefenen();
  toonScherm('scherm-taak-oefenen');
}

// Kies item dat nog niet "zit" op een vaardigheid. Geeft null als alles zit.
function _kiesVolgendOefenItem(vaardigheid) {
  const taak = Voortgang.getTaak();
  if (!taak) return null;
  const sleutel = vaardigheid + '_juist';
  const kandidaten = taakItems.filter(it => {
    const data = taak.perWoord && taak.perWoord[it.id] ? taak.perWoord[it.id] : null;
    const teller = data ? (data[sleutel] || 0) : 0;
    return teller < 3;
  });
  if (kandidaten.length === 0) return null;

  // Vorige item uitsluiten als er meer dan 1 kandidaat is — voorkomt dat
  // hetzelfde woord 2x na elkaar komt.
  const vorigeId = taakOefItem ? taakOefItem.id : null;
  let pool = kandidaten;
  if (vorigeId && kandidaten.length > 1) {
    const zonderVorige = kandidaten.filter(it => it.id !== vorigeId);
    if (zonderVorige.length > 0) pool = zonderVorige;
  }

  // Geef voorkeur aan items die net fout waren (teller 0) binnen de pool
  const nul = pool.filter(it => {
    const data = taak.perWoord[it.id];
    return !data || (data[sleutel] || 0) === 0;
  });
  const finalePool = nul.length > 0 ? nul : pool;
  return finalePool[Math.floor(Math.random() * finalePool.length)];
}

function taakRendererLuisterenOefenen() {
  if (!taakOefItem) return;
  const taak = Voortgang.getTaak();

  // Beeld in het oefen-scherm
  document.getElementById('taak-oef-beeld').innerHTML = Picto.html(taakOefItem);

  // Voortgang: aantal woorden dat al 3× juist is
  let klaar = 0;
  taakItems.forEach(it => {
    const d = taak.perWoord && taak.perWoord[it.id];
    if (d && (d.luisteren_juist || 0) >= 3) klaar++;
  });
  document.getElementById('taak-oef-klaar').textContent = klaar;
  document.getElementById('taak-oef-totaal').textContent = taakItems.length;
  // Voortgangsbalk
  const pct = taakItems.length > 0 ? (klaar / taakItems.length) * 100 : 0;
  const balk = document.getElementById('taak-oef-balk');
  if (balk) balk.style.width = pct + '%';

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

  if (gekozen.id === taakOefItem.id) {
    knop.classList.add('juist');
    await Voortgang.registreerJuistInTaak(taakOefItem.id, 'luisteren');
    // Sterren-systeem voor vrij oefenen ook updaten
    Voortgang.registreerJuist(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  } else {
    knop.classList.add('fout');
    document.querySelectorAll('#taak-oef-opties .optie-knop').forEach(k => {
      if (k.textContent === taakOefItem.tekst) k.classList.add('juist');
    });
    await Voortgang.registreerFoutInTaak(taakOefItem.id, 'luisteren');
    Voortgang.registreerFout(huidigThema.id, taakOefItem.id);
    AudioEngine.spreek(taakOefItem.tekst);
  }

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

function taakRendererToets() {
  const item = taakToetsLijst[taakToetsIdx];
  if (!item) return;
  document.getElementById('taak-toets-huidig').textContent = taakToetsIdx + 1;

  // SPIEGEL versie: groot WOORD bovenaan in plaats van beeld
  const beeldEl = document.getElementById('taak-toets-beeld');
  if (beeldEl) {
    beeldEl.innerHTML = `<div class="taak-toets-woord-groot">${item.tekst}</div>`;
  }

  // Voortgangsbalk
  const pct = (taakToetsIdx / taakToetsLijst.length) * 100;
  const balk = document.getElementById('taak-toets-balk');
  if (balk) balk.style.width = pct + '%';

  // 4 opties als BEELDEN (niet als woordknoppen): het juiste + 3 afleiders
  const verrijkt = verrijkThema(huidigThema);
  const beschikbAfl = verrijkt.items.filter(x => x.id !== item.id);
  const afl = [];
  while (afl.length < 3 && beschikbAfl.length > 0) {
    const idx = Math.floor(Math.random() * beschikbAfl.length);
    afl.push(beschikbAfl[idx]);
    beschikbAfl.splice(idx, 1);
  }
  const opties = [item, ...afl].sort(() => Math.random() - 0.5);

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

  // Geen automatische audio. Kind klikt zelf op hoorknop om woord te horen.
}

function taakToetsHoor() {
  const item = taakToetsLijst[taakToetsIdx];
  if (item) AudioEngine.spreek(item.tekst);
}

async function taakKiesToetsAntwoord(knop, gekozen, juistItem) {
  document.querySelectorAll('#taak-toets-opties .taak-toets-beeld-knop').forEach(k => k.disabled = true);

  if (gekozen.id === juistItem.id) {
    knop.classList.add('juist');
    taakToetsJuist++;
    Voortgang.registreerJuist(huidigThema.id, juistItem.id);
  } else {
    knop.classList.add('fout');
    // Toon ook het juiste antwoord
    document.querySelectorAll('#taak-toets-opties .taak-toets-beeld-knop').forEach(k => {
      if (k.dataset.id === juistItem.id) k.classList.add('juist');
    });
    if (taakToetsFoutIds.indexOf(juistItem.id) === -1) taakToetsFoutIds.push(juistItem.id);
    Voortgang.registreerFout(huidigThema.id, juistItem.id);
  }

  setTimeout(() => {
    if (!taakModus) return;
    taakToetsIdx++;
    if (taakToetsIdx >= taakToetsLijst.length) {
      taakEindigToets();
    } else {
      taakRendererToets();
    }
  }, 1400);
}

async function taakEindigToets() {
  await Voortgang.bewaar(Auth.getCode());

  const aantal = taakToetsLijst.length;
  const juist = taakToetsJuist;
  const pct = aantal > 0 ? Math.round((juist / aantal) * 100) : 0;

  const taak = Voortgang.getTaak();
  if (!taak) { taakVerlaten(); return; }

  if (pct >= 80) {
    // GESLAAGD → status voltooid (voor luisteren-fase v1)
    await Voortgang.updateTaak({
      status: 'voltooid',
      huidigeFase: 'klaar',
      foutWoordenLaatsteToets: taakToetsFoutIds
    });
    taakStartFase('klaar');
  } else {
    // NIET GESLAAGD: tel poging
    const nieuwAantal = ((taak.aantalPogingen && taak.aantalPogingen.luisteren) || 0) + 1;
    const nieuw = Object.assign({}, taak.aantalPogingen || {}, { luisteren: nieuwAantal });
    if (nieuwAantal >= 2) {
      // Tweede mislukking → status moeilijk, taak stopt
      await Voortgang.updateTaak({
        status: 'moeilijk',
        aantalPogingen: nieuw,
        foutWoordenLaatsteToets: taakToetsFoutIds
      });
      taakToonResultaatMoeilijk(juist, aantal);
    } else {
      // Eerste mislukking → herhalen
      await Voortgang.updateTaak({
        aantalPogingen: nieuw,
        foutWoordenLaatsteToets: taakToetsFoutIds
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
      // Reset oefenfase (perWoord-tellers behouden) en ga terug naar oefenen
      taakStartFase('luisteren-oef');
    };
  }
  AudioEngine.spreek('Niet erg, we oefenen nog even verder.');
  toonScherm('scherm-taak-resultaat');
}



// =================================================================
//  INIT
// =================================================================
async function init() {
  // Firebase opzetten
  if (window.FIREBASE_INGESTELD && window.firebase) {
    try {
      window.firebase.initializeApp(window.FIREBASE_CONFIG);
    } catch (e) {
      // Al geïnitialiseerd
    }
    Voortgang.init();
    if (window.Woordenbeheer) Woordenbeheer.init();
  }

  // Woordenbeheer laden — bevat overrides en eigen items van de leerkracht.
  // Mag falen, dan werkt het kind gewoon met basispakket.
  if (window.Woordenbeheer) {
    try { await Woordenbeheer.laad(); } catch (e) { console.warn('Woordenbeheer kon niet laden:', e); }
  }

  // Probeer auto-login (URL-code, anders localStorage)
  const ingelogd = await Auth.probeerAutoLogin();
  if (ingelogd) {
    await naDuoLogin();
  } else {
    toonScherm('scherm-login');
    document.getElementById('login-code').focus();
  }

  // Enter in login-veld
  document.getElementById('login-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') probeerLogin();
  });
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

  // Welkomtekst
  const naam = Auth.getNaam();
  const welk = document.getElementById('welkom-naam');
  if (welk) welk.textContent = naam ? naam + '!' : '!';

  rendererStart();
  toonScherm('scherm-start');
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
  rendererSurvivalGrid();
  rendererThemaGrid('woorden-grid', THEMAS_WOORDEN);
  rendererThemaGrid('zinnen-grid', THEMAS_ZINNEN);
  rendererVoortgang();
}

function rendererSurvivalGrid() {
  const grid = document.getElementById('survival-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const actieveThemas = THEMAS_SURVIVAL.filter(t => Voortgang.isThemaActiefVoorKind(t));
  // Toon de hele zone enkel als er minstens één survival-thema actief is
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
  ['stap-1','stap-2','stap-3','stap-4'].forEach(id => {
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
  if (huidigThema) kiesThema(huidigThema); // herrender met verse stats
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
  document.getElementById('kijken-beeld').innerHTML = Picto.html(item);
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
  Voortgang.registreerGezien(huidigThema.id, item.id);

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
    el.innerHTML = Picto.html(item, { klasse: 'verbind-emoji' });
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

  // Spreek woord uit bij beeld
  if (el.dataset.zijde === 'links') {
    const item = huidigThema.items.find(it => it.id === el.dataset.itemId);
    if (item) AudioEngine.spreek(item.tekst);
  }

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
    if (el.dataset.zijde === 'links') {
      const item = huidigThema.items.find(it => it.id === el.dataset.itemId);
      if (item) AudioEngine.spreek(item.tekst);
    }
    return;
  }

  if (verbindActief.dataset.zijde === el.dataset.zijde) {
    verbindActief.classList.remove('actief');
    verbindActief = el;
    el.classList.add('actief');
    if (el.dataset.zijde === 'links') {
      const item = huidigThema.items.find(it => it.id === el.dataset.itemId);
      if (item) AudioEngine.spreek(item.tekst);
    }
    return;
  }

  verbindKoppel(verbindActief, el);
  verbindActief = null;
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

function startSnelheid() {
  if (getActieveItems(huidigThema).length < 4) { alert("Te weinig woorden voor het snelheidsspel."); return; }
  snelScore = 0;
  snelGebruikt = [];
  document.getElementById('snel-score').textContent = '0';
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

  document.getElementById('snel-beeld').innerHTML = Picto.html(snelItem);

  const div = document.getElementById('snel-opties');
  div.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'klik-optie-knop';
    k.textContent = opt.tekst;
    k.onclick = () => kiesSnelAntwoord(k, opt);
    div.appendChild(k);
  });
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
