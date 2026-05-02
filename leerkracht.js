// =================================================================
//  leerkracht.js — Logica voor het leerkracht-paneel
// =================================================================

// Bouw de URL naar de kind-app, ongeacht hoe het leerkracht-paneel
// wordt geserveerd. We gaan uit van dezelfde folder + 'kind.html'.
function lkKindAppUrl(code) {
  // window.location.pathname bevat het pad zoals "/anders-leren/index.html"
  // We willen de map ervan en daar 'kind.html' aan plakken.
  const pad = window.location.pathname;
  const map = pad.replace(/[^/]*$/, '');  // alles tot en met laatste /
  const basis = window.location.origin + map + 'kind.html';
  return code ? `${basis}?code=${encodeURIComponent(code)}` : basis;
}

// Open de kind-app in een nieuw tabblad. Zonder code → kind ziet eerst het
// login-scherm. De leerkracht kan dan zelf een testcode invullen, of de
// functie krijgt een code mee om als specifieke leerling te 'spieken'.
function lkBekijkKindApp(code) {
  window.open(lkKindAppUrl(code), '_blank', 'noopener');
}

// Lijst van alle verwachte thema-globals
const VERWACHTE_THEMAS_LK = [
  ['THEMA_SURVIVAL_KLAS', 'survival-klas.js'],
  ['THEMA_SURVIVAL_SPEELPLAATS', 'survival-speelplaats.js'],
  ['THEMA_SURVIVAL_HEENTERUG', 'survival-heenterug.js'],
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
  ['THEMA_ZINNEN_SCHOOL', 'zinnen-school.js'],
  ['THEMA_ZINNEN_BELEEFD', 'zinnen-beleefd.js'],
  ['THEMA_ZINNEN_GEVOEL', 'zinnen-gevoel.js'],
  ['THEMA_ZINNEN_HULP', 'zinnen-hulp.js'],
  ['THEMA_ZINNEN_TIJD', 'zinnen-tijd.js'],
];

// Filter ontbrekende thema's eruit, log waarschuwing
const ALLE_THEMAS_LK = VERWACHTE_THEMAS_LK
  .map(([naam, bestand]) => {
    const t = window[naam];
    if (!t) console.warn(`[leerkracht] Thema niet geladen: ${naam} — bestand themas/${bestand} ontbreekt of heeft een fout.`);
    return t;
  })
  .filter(t => t && t.id); // alleen geldige thema's behouden

// Maak globaal beschikbaar voor andere modules (bv. rapport-engine.js)
window.ALLE_THEMAS_LK = ALLE_THEMAS_LK;

let lkKinderen = []; // cache van kinderen
let lkHuidigQRCode = null;

// =================================================================
//  INIT
// =================================================================
async function lkInit() {
  if (window.FIREBASE_INGESTELD && window.firebase) {
    try {
      window.firebase.initializeApp(window.FIREBASE_CONFIG);
    } catch (e) { /* al geinit */ }
    Voortgang.init();
    if (window.Woordenbeheer) {
      Woordenbeheer.init();
      try { await Woordenbeheer.laad(); } catch (e) { console.warn('Woordenbeheer kon niet laden:', e); }
    }
    await lkLaadKinderen();
    // Vul welkom-stats meteen na het laden van de leerlingen.
    lkVulWelkomStats();
    // Periodes laden + eventueel eerste-keer-modal tonen
    await lkPeriodesInit();
  } else {
    document.getElementById('lk-vak-firebase-niet-ingesteld').style.display = 'block';
    document.getElementById('lk-tabel-wrap').innerHTML = '<p style="opacity:0.6">Configureer eerst Firebase.</p>';
    document.getElementById('lk-overzicht').innerHTML = '<p style="opacity:0.6">Configureer eerst Firebase.</p>';
  }
}

// Helper: pas Woordenbeheer toe op een basispakket-thema (zelfde als verrijkThema in app.js)
function lkVerrijkThema(thema) {
  if (!thema) return thema;
  if (window.Woordenbeheer && Woordenbeheer.pasToeOpThema) {
    return Woordenbeheer.pasToeOpThema(thema);
  }
  return thema;
}

// =================================================================
//  TABS + ZIJBALK
// =================================================================
function lkKiesTab(tab) {
  document.querySelectorAll('.lk-tab').forEach(k => k.classList.remove('actief'));
  document.querySelectorAll('.lk-tab-inhoud').forEach(t => t.classList.remove('actief'));
  const navKnop = document.querySelector(`.lk-tab[data-tab="${tab}"]`);
  if (navKnop) navKnop.classList.add('actief');
  const inhoud = document.getElementById('lk-tab-' + tab);
  if (inhoud) inhoud.classList.add('actief');

  if (tab === 'welkom') lkVulWelkomStats();
  if (tab === 'overzicht') lkRendererOverzicht();
  if (tab === 'woorden') wbInitTab();
  if (tab === 'werkbladen') initWerkbladTab();
  if (tab === 'school') lkSchoolLaden();
  if (tab === 'taken') lkKindtabsRender('taken');
  if (tab === 'spreken') lkKindtabsRender('spreken');
  if (tab === 'rapporten') lkKindtabsRender('rapporten');

  // Sluit zijbalk op mobiel na keuze
  lkSluitMenu();

  // Scroll naar boven zodat nieuwe tab vanaf bovenaan zichtbaar is
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =================================================================
//  KINDERTABS — gedeeld systeem voor Taken / Spreken / Rapporten
// =================================================================
//
// Elke tab heeft kindertabs bovenaan + content gebied onder.
// State per tab: welk kind is geselecteerd.

const _lkKindtabsState = {
  taken: { gekozenCode: null },
  spreken: { gekozenCode: null },
  rapporten: { gekozenCode: null }
};

// Volledige naam: "Voornaam Achternaam", met fallback op het oude 'naam'-veld
function lkVolledigeNaam(kind) {
  if (!kind) return '';
  const voor = (kind.voornaam || '').trim();
  const achter = (kind.achternaam || '').trim();
  if (voor || achter) return [voor, achter].filter(Boolean).join(' ');
  return (kind.naam || '').trim() || kind.code || '';
}

// Sleutel voor sortering "klas → achternaam → voornaam"
// Achternaam ontbreekt? Gebruik dan oude 'naam' als fallback.
function _lkSortSleutel(kind) {
  const klas = (kind.klas || '~~').toLowerCase(); // ~~ zorgt dat lege klas achteraan komt
  const achter = (kind.achternaam || '').toLowerCase();
  const voor = (kind.voornaam || '').toLowerCase();
  // Als geen voornaam/achternaam: val terug op naam-veld
  const fallbackNaam = (achter || voor)
    ? ''
    : (kind.naam || kind.code || '').toLowerCase();
  return klas + '|' + (achter || fallbackNaam) + '|' + voor;
}

// Sorteer kinderen volgens "klas → achternaam → voornaam"
function _lkSorteerKinderenAlfabet() {
  return [...lkKinderen].sort((a, b) => {
    const sa = _lkSortSleutel(a);
    const sb = _lkSortSleutel(b);
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  });
}

// Render kindertabs + content voor een specifieke tab ('taken'|'spreken'|'rapporten')
function lkKindtabsRender(welkeTab) {
  // Als geen argument: render alle drie (gebruikt na laden van leerlingen)
  if (!welkeTab) {
    ['taken', 'spreken', 'rapporten'].forEach(t => lkKindtabsRender(t));
    return;
  }

  const state = _lkKindtabsState[welkeTab];
  if (!state) return;

  const tabsEl = document.getElementById('lk-kindtabs-' + welkeTab);
  const inhoudEl = document.getElementById('lk-kindinhoud-' + welkeTab);
  if (!tabsEl || !inhoudEl) return;

  const gesorteerd = _lkSorteerKinderenAlfabet();

  // Geen kinderen → leeg-bericht
  if (gesorteerd.length === 0) {
    tabsEl.innerHTML = '';
    inhoudEl.innerHTML = '<p class="lk-kind-leeg">Voeg eerst leerlingen toe in tabblad <strong>👥 Mijn klas</strong>.</p>';
    return;
  }

  // Eerste kind selecteren als nog geen of niet meer bestaat
  const codes = gesorteerd.map(k => k.code);
  if (!state.gekozenCode || codes.indexOf(state.gekozenCode) === -1) {
    state.gekozenCode = codes[0];
  }

  // Kindertabs renderen — gegroepeerd per klas
  // Bouw een lookup van klas → array van kinderen (in alfabetische volgorde door eerdere sortering)
  const klassen = []; // array van { klas: 'X', kinderen: [...] }, in volgorde
  const klasIdx = {}; // klas → index in 'klassen'
  gesorteerd.forEach(k => {
    const klasLabel = (k.klas && k.klas.trim()) ? k.klas.trim() : '';
    if (klasIdx[klasLabel] === undefined) {
      klasIdx[klasLabel] = klassen.length;
      klassen.push({ klas: klasLabel, kinderen: [] });
    }
    klassen[klasIdx[klasLabel]].kinderen.push(k);
  });

  let tabsHtml = '';
  const meerdereKlassen = klassen.length > 1;
  klassen.forEach((groep) => {
    if (meerdereKlassen) {
      const labelTekst = groep.klas || 'Geen klas';
      tabsHtml += `<span class="lk-kindtabs-klaslabel">${labelTekst}</span>`;
    }
    groep.kinderen.forEach(k => {
      const actief = (k.code === state.gekozenCode) ? 'actief' : '';
      const naam = lkVolledigeNaam(k);
      const codeSafe = k.code.replace(/'/g, "\\'");
      tabsHtml += `<button class="lk-kindtab ${actief}" onclick="lkKindtabKies('${welkeTab}', '${codeSafe}')">${naam}</button>`;
    });
  });
  tabsEl.innerHTML = tabsHtml;

  // Content renderen op basis van tab
  const kind = lkKinderen.find(k => k.code === state.gekozenCode);
  if (welkeTab === 'taken') {
    inhoudEl.innerHTML = _lkRendererTaken(kind);
  } else if (welkeTab === 'spreken') {
    inhoudEl.innerHTML = _lkRendererSpreektoetsen(kind);
  } else if (welkeTab === 'rapporten') {
    inhoudEl.innerHTML = _lkRendererRapporten(kind);
  }
}

function lkKindtabKies(welkeTab, code) {
  const state = _lkKindtabsState[welkeTab];
  if (!state) return;
  state.gekozenCode = code;
  lkKindtabsRender(welkeTab);
}

// === Renderer: TAKEN ===
function _lkRendererTaken(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  const naamSafe = (kind.naam || '').replace(/'/g, "\\'");

  // Bouw lijst: huidige taak (indien) bovenaan + geschiedenis
  let html = `
    <div class="lk-kind-acties">
      <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkBeheerTaak('${kind.code}', '${naamSafe}')">+ Nieuwe taak</button>
    </div>
  `;

  // Verzamel alle taken in chronologische volgorde (nieuwste eerst)
  const items = [];

  if (kind.taak && kind.taak.themaId && Array.isArray(kind.taak.woordIds)) {
    items.push({
      taak: kind.taak,
      isHuidig: true,
      tijd: kind.taak.gestart || Date.now()
    });
  }

  const gesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
  gesch.forEach((arch, idx) => {
    items.push({
      taak: arch,
      isHuidig: false,
      archiefIdx: idx,
      tijd: arch.voltooidOp || 0
    });
  });

  items.sort((a, b) => b.tijd - a.tijd);

  if (items.length === 0) {
    html += '<p class="lk-kind-leeg">Nog geen taken voor deze leerling. Klik <strong>+ Nieuwe taak</strong> om er een aan te maken.</p>';
    return html;
  }

  html += '<div class="lk-takenlijst">';
  items.forEach(entry => {
    const t = entry.taak;
    const thema = ALLE_THEMAS_LK.find(x => x.id === t.themaId);
    const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : t.themaId;
    const aantalW = (t.woordIds || []).length;

    // Datum
    const dt = new Date(entry.tijd);
    const dStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(2)}`;

    // Status
    let statusBadge = '';
    let scoreTekst = '';
    if (t.status === 'voltooid') {
      const fout = (t.foutWoordenLaatsteToets || []).length;
      const juist = aantalW - fout;
      statusBadge = '<span class="lk-status-badge voltooid">🏆 voltooid</span>';
      scoreTekst = `${juist}/${aantalW} juist`;
    } else if (t.status === 'moeilijk' || t.status === 'haperde') {
      const fout = (t.foutWoordenLaatsteToets || []).length;
      const juist = aantalW - fout;
      statusBadge = '<span class="lk-status-badge moeilijk">⚠️ moeilijk</span>';
      scoreTekst = `${juist}/${aantalW} juist`;
    } else {
      statusBadge = '<span class="lk-status-badge bezig">🔄 bezig</span>';
      scoreTekst = `${aantalW} woorden`;
    }

    const heeftToets = (Array.isArray(t.foutWoordenLaatsteToets) && t.foutWoordenLaatsteToets.length > 0)
                       || t.status === 'voltooid' || t.status === 'moeilijk' || t.status === 'haperde';

    // PDF-knop alleen als toets is afgenomen
    let pdfKnop = '';
    if (heeftToets) {
      if (entry.isHuidig) {
        pdfKnop = `<button class="lk-knop-mini" onclick="lkTaakPdfHuidig('${kind.code}')" title="PDF luistertoets voor toetsenmap">📄</button>`;
      } else {
        pdfKnop = `<button class="lk-knop-mini" onclick="lkTaakPdfVanGeschiedenis('${kind.code}', ${entry.archiefIdx})" title="PDF luistertoets voor toetsenmap">📄</button>`;
      }
    }

    // Werkblad-knop — altijd zichtbaar (huidig én archief)
    let wbKnop = '';
    if (entry.isHuidig) {
      wbKnop = `<button class="lk-knop-mini" onclick="lkTaakWerkbladen('${kind.code}', 'huidig')" title="Werkbladen maken met deze woorden">📝</button>`;
    } else {
      wbKnop = `<button class="lk-knop-mini" onclick="lkTaakWerkbladen('${kind.code}', ${entry.archiefIdx})" title="Werkbladen maken met deze woorden">📝</button>`;
    }

    const huidigBadge = entry.isHuidig ? '<span class="lk-huidig-badge">huidig</span>' : '';

    html += `
      <div class="lk-taakrij ${entry.isHuidig ? 'huidig' : ''}">
        <span class="lk-taakrij-datum">${dStr}</span>
        <span class="lk-taakrij-thema">${themaNaam} ${huidigBadge}</span>
        <span class="lk-taakrij-status">${statusBadge}</span>
        <span class="lk-taakrij-score">${scoreTekst}</span>
        <span class="lk-taakrij-acties">${wbKnop}${pdfKnop}</span>
      </div>
    `;
  });
  html += '</div>';

  return html;
}

// === Renderer: SPREEKTOETSEN ===
function _lkRendererSpreektoetsen(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  const naamSafe = (kind.naam || '').replace(/'/g, "\\'");

  let html = `
    <div class="lk-kind-acties">
      <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkOpenSpreektoets('${kind.code}', '${naamSafe}')">+ Nieuwe spreektoets</button>
    </div>
  `;

  const toetsen = Array.isArray(kind.spreektoetsen) ? kind.spreektoetsen : [];
  if (toetsen.length === 0) {
    html += '<p class="lk-kind-leeg">Nog geen spreektoetsen afgenomen. Klik <strong>+ Nieuwe spreektoets</strong> om te starten.</p>';
    return html;
  }

  const sorted = [...toetsen].sort((a, b) => (b.datum || 0) - (a.datum || 0));

  html += '<div class="lk-takenlijst">';
  sorted.forEach(st => {
    const thema = ALLE_THEMAS_LK.find(t => t.id === st.themaId);
    const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : (st.themaId || '');

    const dt = new Date(st.datum || 0);
    const dStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(2)}`;

    // Tellen met backward-compat helpers
    let v = 0, a = 0, n = 0;
    Object.values(st.perWoord || {}).forEach(r => {
      const o = sprWoordOordeel(r);
      if (o === 'vlot') v++;
      else if (o === 'aarzelt') a++;
      else if (o === 'niet') n++;
    });
    const totaal = v + a + n;

    const idSafe = st.id ? st.id.replace(/'/g, "\\'") : '';
    const pdfKnop = idSafe
      ? `<button class="lk-knop-mini" onclick="lkSprPdfVanGeschiedenis('${kind.code}', '${idSafe}')" title="PDF voor toetsenmap">📄</button>`
      : '';

    html += `
      <div class="lk-taakrij">
        <span class="lk-taakrij-datum">${dStr}</span>
        <span class="lk-taakrij-thema">${themaNaam}</span>
        <span class="lk-taakrij-status">
          <span class="lk-spr-cijfer vlot">✓ ${v}</span>
          <span class="lk-spr-cijfer aarzelt">🤔 ${a}</span>
          <span class="lk-spr-cijfer niet">✗ ${n}</span>
        </span>
        <span class="lk-taakrij-score">${totaal} w.</span>
        <span class="lk-taakrij-acties">${pdfKnop}</span>
      </div>
    `;
  });
  html += '</div>';

  return html;
}

// === Renderer: RAPPORTEN ===
function _lkRendererRapporten(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  const naamSafe = (kind.naam || '').replace(/'/g, "\\'");

  // Vooruitkijken naar Sessie C: een rapport-werkomgeving per leerling.
  // Voor nu: een eenvoudige knop die de bestaande rapport-modal opent.
  let html = `
    <div class="lk-kind-acties">
      <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkOpenRapport('${kind.code}', '${naamSafe}')">📄 Rapport maken</button>
    </div>
  `;

  // Toon een samenvatting van wat er bekend is over deze leerling
  const taakgesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
  const heeftHuidigeTaak = !!(kind.taak && kind.taak.themaId);
  const aantalTaken = taakgesch.length + (heeftHuidigeTaak ? 1 : 0);
  const aantalSpreek = (kind.spreektoetsen || []).length;

  html += `
    <div class="lk-rapport-samenvatting">
      <div class="lk-rapport-stat"><strong>${aantalTaken}</strong><br><small>taken</small></div>
      <div class="lk-rapport-stat"><strong>${aantalSpreek}</strong><br><small>spreektoetsen</small></div>
    </div>
  `;

  if (aantalTaken === 0 && aantalSpreek === 0) {
    html += '<p class="lk-kind-leeg">Nog geen toetsen voor deze leerling. Maak eerst een taak of spreektoets aan voor je een rapport genereert.</p>';
  } else {
    html += '<p style="margin-top:10px; opacity:0.75; font-size:13px">In de volgende update komt hier een rapport-werkomgeving met automatische voorinvulling per vaardigheid. Voor nu opent <strong>📄 Rapport maken</strong> de bestaande rapport-modal.</p>';
  }

  return html;
}


function lkToggleMenu() {
  const zijbalk = document.getElementById('lk-zijbalk');
  if (zijbalk) zijbalk.classList.toggle('open');
}

function lkSluitMenu() {
  const zijbalk = document.getElementById('lk-zijbalk');
  if (zijbalk) zijbalk.classList.remove('open');
}

// Vult de stats-tegels op de welkom-pagina
function lkVulWelkomStats() {
  const wrap = document.getElementById('welkom-stats');
  if (!wrap) return;

  const aantalKinderen = lkKinderen.length;

  // Tel hoeveel woorden er actief zijn over alle leerlingen heen
  let totaalActieveWoorden = 0;
  let kinderenMetThemas = 0;
  lkKinderen.forEach(kind => {
    let actiefDitKind = 0;
    ALLE_THEMAS_LK.forEach(thema => {
      const items = _filterItemsVoorKind(thema, kind);
      actiefDitKind += items.length;
    });
    totaalActieveWoorden += actiefDitKind;
    if (actiefDitKind > 0) kinderenMetThemas++;
  });

  // Totaal woorden in basispakket (over alle thema's)
  const totaalInPakket = ALLE_THEMAS_LK.reduce((s, t) => s + lkVerrijkThema(t).items.length, 0);

  wrap.innerHTML = `
    <div class="welkom-stat">
      <span class="welkom-stat-getal">${aantalKinderen}</span>
      <span class="welkom-stat-label">${aantalKinderen === 1 ? 'leerling' : 'leerlingen'}</span>
    </div>
    <div class="welkom-stat">
      <span class="welkom-stat-getal">${kinderenMetThemas}</span>
      <span class="welkom-stat-label">${kinderenMetThemas === 1 ? 'leerling oefent' : 'leerlingen oefenen'}</span>
    </div>
    <div class="welkom-stat">
      <span class="welkom-stat-getal">${totaalInPakket}</span>
      <span class="welkom-stat-label">woorden in pakket</span>
    </div>
  `;
}

// =================================================================
//  KINDEREN BEHEER
// =================================================================
// =================================================================
//  SCHOOL-INSTELLINGEN
// =================================================================
//
// Eenmalig in te stellen door de leerkracht. Wordt gebruikt in PDF-rapporten.
// Logo wordt opgeslagen als data-URL (base64) in Firestore. Maximum ~200KB om
// Firestore-limiet (1MB per document) niet te overschrijden.

let _schoolCache = null;

async function lkSchoolLaden() {
  try {
    const data = await Voortgang.haalSchoolinstellingenOp();
    _schoolCache = data || {};
    document.getElementById('school-naam').value = _schoolCache.schoolnaam || '';
    document.getElementById('school-klas').value = _schoolCache.klas || '';
    document.getElementById('school-leerkracht').value = _schoolCache.leerkrachtnaam || '';
    _lkSchoolLogoToon(_schoolCache.logoDataUrl || null);
  } catch (e) {
    console.warn('Schoolinstellingen laden mislukt:', e);
  }
}

function _lkSchoolLogoToon(dataUrl) {
  const preview = document.getElementById('school-logo-preview');
  const wisKnop = document.getElementById('school-logo-wis');
  if (!preview) return;
  if (dataUrl) {
    preview.innerHTML = `<img src="${dataUrl}" alt="Schoollogo">`;
    if (wisKnop) wisKnop.style.display = '';
  } else {
    preview.innerHTML = '<span class="lk-logo-placeholder">Geen logo opgeladen</span>';
    if (wisKnop) wisKnop.style.display = 'none';
  }
}

function lkSchoolLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  // Sanity check: 10MB hard plafond (anders mogelijk geheugenprobleem)
  if (file.size > 10 * 1024 * 1024) {
    alert('Het bestand is heel groot (>10 MB). Kies a.u.b. een kleinere foto.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    // Eerst inladen als Image, dan verkleinen via canvas
    const img = new Image();
    img.onload = () => {
      const MAX_W = 400; // ruim voldoende voor footer (35mm = ~140px op 100dpi)
      const MAX_H = 200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // Schalen met behoud van ratio
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // Witte achtergrond als JPG (vermijdt zwarte vlakken bij transparantie)
      // Voor PNG: behoud transparantie
      const isPng = (file.type === 'image/png');
      if (!isPng) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
      }
      // Hoge-kwaliteit smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Behoud PNG voor transparantie, anders JPEG met goede kwaliteit
      const dataUrl = isPng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.85);

      if (!_schoolCache) _schoolCache = {};
      _schoolCache.logoDataUrl = dataUrl;
      // Bewaar ook de eindafmetingen — nodig voor correcte aspect-ratio in PDF
      _schoolCache.logoBreedte = w;
      _schoolCache.logoHoogte = h;
      _lkSchoolLogoToon(dataUrl);
      // Reset het input-veld zodat dezelfde file opnieuw kan worden gekozen
      event.target.value = '';
    };
    img.onerror = () => {
      alert('Kon de afbeelding niet laden. Probeer een ander bestand (PNG of JPG).');
      event.target.value = '';
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    alert('Kon het bestand niet lezen.');
    event.target.value = '';
  };
  reader.readAsDataURL(file);
}

function lkSchoolLogoWissen() {
  if (!confirm('Logo verwijderen?')) return;
  if (!_schoolCache) _schoolCache = {};
  _schoolCache.logoDataUrl = null;
  _lkSchoolLogoToon(null);
}

async function lkSchoolBewaren() {
  const data = {
    schoolnaam: document.getElementById('school-naam').value.trim(),
    klas: document.getElementById('school-klas').value.trim(),
    leerkrachtnaam: document.getElementById('school-leerkracht').value.trim(),
    logoDataUrl: (_schoolCache && _schoolCache.logoDataUrl) || null,
    logoBreedte: (_schoolCache && _schoolCache.logoBreedte) || null,
    logoHoogte: (_schoolCache && _schoolCache.logoHoogte) || null
  };

  const statusEl = document.getElementById('school-status');
  if (statusEl) { statusEl.textContent = '⏳ Bezig met opslaan...'; statusEl.className = 'lk-school-status bezig'; }

  try {
    await Voortgang.bewaarSchoolinstellingen(data);
    _schoolCache = data;
    if (statusEl) {
      statusEl.textContent = '✓ Opgeslagen';
      statusEl.className = 'lk-school-status ok';
      setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'lk-school-status'; }, 3000);
    }
  } catch (e) {
    console.error('Schoolinstellingen opslaan mislukt:', e);
    if (statusEl) {
      statusEl.textContent = '✗ Opslaan mislukt: ' + (e.message || 'onbekend');
      statusEl.className = 'lk-school-status fout';
    }
  }
}

async function lkSchoolinstellingen() {
  // Voor andere modules: cache als nog niet geladen
  if (_schoolCache !== null) return _schoolCache;
  try {
    _schoolCache = await Voortgang.haalSchoolinstellingenOp() || {};
  } catch (e) {
    _schoolCache = {};
  }
  return _schoolCache;
}


// =================================================================
//  RAPPORTPERIODES — periode-balk + beheer
// =================================================================
//
// Eén actieve periode tegelijk. Nieuwe taken/toetsen krijgen automatisch
// die periode-ID mee. Afgesloten periodes blijven in archief.
//
// Datumformat in periode: ms timestamp (Date.now()-style)

let _periodes = [];          // alle periodes
let _actievePeriode = null;  // actieve periode object of null

// Init bij laden van leerkracht-pagina: zorg dat er minstens één periode is
async function lkPeriodesInit() {
  try {
    _periodes = await Voortgang.alleRapportperiodes();
    if (_periodes.length === 0) {
      // Geen periodes → toon "eerste keer"-modal
      _lkPeriodeEersteKeer();
      return;
    }
    _actievePeriode = _periodes.find(p => p.status === 'actief') || null;
    _lkPeriodeBalkRenderer();

    // Migratie van oude data (alleen één keer nodig)
    try {
      await Voortgang.migreerNaarRapportperiodes();
    } catch (e) { /* OK, al gemigreerd */ }
  } catch (e) {
    console.warn('Periodes laden mislukt:', e);
  }
}

function _lkPeriodeBalkRenderer() {
  const naamEl = document.getElementById('lk-periode-naam');
  if (!naamEl) return;
  if (!_actievePeriode) {
    naamEl.innerHTML = '<em style="opacity:0.6">geen actieve periode</em>';
    return;
  }
  // Toon naam + status-badge
  const datums = `${_lkPeriodeDatumKort(_actievePeriode.startDatum)} – ${_lkPeriodeDatumKort(_actievePeriode.eindDatum)}`;
  naamEl.innerHTML = `<strong>${_actievePeriode.naam}</strong> <span class="lk-periode-datums">${datums}</span>`;
}

function _lkPeriodeDatumKort(ts) {
  if (!ts) return '?';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}

function _lkPeriodeDatumLang(ts) {
  if (!ts) return '?';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function lkPeriodeMenuToggle() {
  const menu = document.getElementById('lk-periode-menu');
  if (!menu) return;
  const open = menu.classList.contains('open');
  if (open) {
    menu.classList.remove('open');
    return;
  }
  // Vul menu opnieuw bij elke open
  _lkPeriodeMenuRenderer();
  menu.classList.add('open');
  // Sluit op klik buiten het menu
  setTimeout(() => {
    document.addEventListener('click', _lkPeriodeMenuSluit, { once: true });
  }, 0);
}

function _lkPeriodeMenuSluit(ev) {
  const menu = document.getElementById('lk-periode-menu');
  const knop = document.getElementById('lk-periode-knop');
  if (!menu) return;
  if (knop && knop.contains(ev.target)) return; // klik op knop zelf — niet sluiten
  if (menu.contains(ev.target)) {
    // klik in menu — laat lkPeriodeKies zelf afhandelen
    return;
  }
  menu.classList.remove('open');
}

function _lkPeriodeMenuRenderer() {
  const menu = document.getElementById('lk-periode-menu');
  if (!menu) return;
  let html = '';
  if (_periodes.length === 0) {
    html = '<div class="lk-periode-menu-leeg">Geen periodes.</div>';
  } else {
    // Actieve eerst, dan afgesloten
    const actief = _periodes.filter(p => p.status === 'actief');
    const archief = _periodes.filter(p => p.status === 'afgesloten');
    if (actief.length > 0) {
      html += '<div class="lk-periode-menu-kop">Actief</div>';
      actief.forEach(p => {
        html += _lkPeriodeMenuItem(p, true);
      });
    }
    if (archief.length > 0) {
      html += '<div class="lk-periode-menu-kop">Archief</div>';
      archief.forEach(p => {
        html += _lkPeriodeMenuItem(p, false);
      });
    }
  }
  html += '<div class="lk-periode-menu-acties">';
  html += '<button class="lk-knop-mini" onclick="lkPeriodeNieuwModal()">➕ Nieuwe periode starten</button>';
  if (_actievePeriode) {
    html += `<button class="lk-knop-mini" onclick="lkPeriodeSluitenBevestig('${_actievePeriode.id}')">🔒 Huidige periode afsluiten</button>`;
  }
  html += '</div>';
  menu.innerHTML = html;
}

function _lkPeriodeMenuItem(p, isActief) {
  const datums = `${_lkPeriodeDatumKort(p.startDatum)} – ${_lkPeriodeDatumKort(p.eindDatum)}`;
  const badge = isActief ? '<span class="lk-periode-badge actief">actief</span>' : '<span class="lk-periode-badge archief">archief</span>';
  return `
    <div class="lk-periode-menu-item">
      <div class="lk-periode-menu-info">
        <strong>${p.naam}</strong> ${badge}
        <span class="lk-periode-datums">${datums}</span>
      </div>
    </div>
  `;
}

// === Modal voor nieuwe periode ===
function lkPeriodeNieuwModal() {
  // Sluit menu
  const menu = document.getElementById('lk-periode-menu');
  if (menu) menu.classList.remove('open');

  // Verwijder bestaande modal
  const oud = document.getElementById('lk-periode-modal-bg');
  if (oud) oud.remove();

  // Voorgestelde defaults: schooljaar of trimester
  const nu = new Date();
  let voorstel = '';
  let startVoor = '';
  let eindVoor = '';

  if (_actievePeriode) {
    // Suggestie: volgende trimester op basis van actieve einddatum
    const nieuweStart = new Date((_actievePeriode.eindDatum || nu.getTime()) + 86400000);
    const nieuweEind = new Date(nieuweStart);
    nieuweEind.setMonth(nieuweEind.getMonth() + 3);
    voorstel = 'Trimester ' + (1 + _periodes.filter(p => p.status === 'afgesloten').length + 1);
    startVoor = nieuweStart.toISOString().slice(0, 10);
    eindVoor = nieuweEind.toISOString().slice(0, 10);
  } else {
    // Geen actieve periode → start vandaag
    const eind = new Date(nu);
    eind.setMonth(eind.getMonth() + 3);
    voorstel = 'Trimester ' + (_periodes.length + 1);
    startVoor = nu.toISOString().slice(0, 10);
    eindVoor = eind.toISOString().slice(0, 10);
  }

  const heeftActieve = !!_actievePeriode;
  const waarschuwing = heeftActieve
    ? `<div class="lk-periode-waarschuwing">⚠️ De huidige periode "<strong>${_actievePeriode.naam}</strong>" wordt automatisch afgesloten als je een nieuwe start.</div>`
    : '';

  const bg = document.createElement('div');
  bg.id = 'lk-periode-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>📅 Nieuwe rapportperiode</h2>
      ${waarschuwing}
      <p class="modal-uitleg">
        Nieuwe taken en spreektoetsen vallen automatisch onder deze nieuwe periode.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Naam</label>
        <input type="text" class="lk-taak-select" id="periode-naam" value="${voorstel}" placeholder="Bv. Trimester 1, Schooljaar 2025-2026">
      </div>

      <div class="lk-taak-veld" style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Startdatum</label>
          <input type="date" class="lk-taak-select" id="periode-start" value="${startVoor}">
        </div>
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Einddatum</label>
          <input type="date" class="lk-taak-select" id="periode-eind" value="${eindVoor}">
        </div>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-periode-modal-bg').remove()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkPeriodeNieuwBewaren()">${heeftActieve ? '🔄 Vorige sluiten + nieuwe starten' : '✓ Periode aanmaken'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);

  // Focus op naam-veld voor snel typen
  setTimeout(() => {
    const naamEl = document.getElementById('periode-naam');
    if (naamEl) naamEl.focus();
  }, 50);
}

async function lkPeriodeNieuwBewaren() {
  const naam = document.getElementById('periode-naam').value.trim();
  const startStr = document.getElementById('periode-start').value;
  const eindStr = document.getElementById('periode-eind').value;
  if (!naam) {
    alert('Geef de periode een naam.');
    return;
  }
  if (!startStr || !eindStr) {
    alert('Vul start- en einddatum in.');
    return;
  }
  const startDatum = new Date(startStr).getTime();
  const eindDatum = new Date(eindStr).getTime();
  if (eindDatum <= startDatum) {
    alert('Einddatum moet na startdatum liggen.');
    return;
  }

  const knop = document.querySelector('#lk-periode-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    // Eerst huidige actieve afsluiten (indien aanwezig)
    if (_actievePeriode) {
      await Voortgang.sluitRapportperiode(_actievePeriode.id);
    }
    // Nieuwe aanmaken
    const nieuw = await Voortgang.maakRapportperiode(naam, startDatum, eindDatum);
    // Lokale cache vernieuwen
    _periodes = await Voortgang.alleRapportperiodes();
    _actievePeriode = nieuw;
    _lkPeriodeBalkRenderer();
    // Sluit modal
    const bg = document.getElementById('lk-periode-modal-bg');
    if (bg) bg.remove();
  } catch (e) {
    console.error('Periode aanmaken mislukt:', e);
    alert('Periode aanmaken mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '✓ Periode aanmaken'; }
  }
}

// === Eerste-keer-flow: bij geen periodes ===
function _lkPeriodeEersteKeer() {
  // Verwijder bestaande modal
  const oud = document.getElementById('lk-periode-modal-bg');
  if (oud) oud.remove();

  // Voorstel: huidig schooljaar
  const nu = new Date();
  let startJaar = nu.getFullYear();
  let eindJaar = startJaar + 1;
  if (nu.getMonth() < 8) { // jan-aug
    startJaar = nu.getFullYear() - 1;
    eindJaar = nu.getFullYear();
  }
  const startVoor = new Date(startJaar, 8, 1).toISOString().slice(0, 10);
  const eindVoor = new Date(eindJaar, 5, 30).toISOString().slice(0, 10);
  const voorstelNaam = `Schooljaar ${startJaar}-${eindJaar}`;

  const bg = document.createElement('div');
  bg.id = 'lk-periode-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  // Niet sluitbaar door op achtergrond te klikken — verplichte stap
  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>📅 Welkom! Maak je eerste rapportperiode</h2>
      <p class="modal-uitleg">
        Een rapportperiode is bijvoorbeeld een trimester of een heel schooljaar. Alle taken
        en spreektoetsen die je vanaf nu aanmaakt, vallen automatisch onder deze periode.
        Je kan later nieuwe periodes starten.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Naam</label>
        <input type="text" class="lk-taak-select" id="periode-naam" value="${voorstelNaam}" placeholder="Bv. Trimester 1, Schooljaar 2025-2026">
      </div>

      <div class="lk-taak-veld" style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Startdatum</label>
          <input type="date" class="lk-taak-select" id="periode-start" value="${startVoor}">
        </div>
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Einddatum</label>
          <input type="date" class="lk-taak-select" id="periode-eind" value="${eindVoor}">
        </div>
      </div>

      <div class="lk-cat-modal-knoppen" style="justify-content:center">
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166); padding:10px 24px; font-size:15px" onclick="lkPeriodeNieuwBewaren()">✓ Periode aanmaken</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);

  setTimeout(() => {
    const naamEl = document.getElementById('periode-naam');
    if (naamEl) { naamEl.focus(); naamEl.select(); }
  }, 50);
}

// === Periode afsluiten (zonder nieuwe te starten) ===
function lkPeriodeSluitenBevestig(periodeId) {
  // Sluit menu
  const menu = document.getElementById('lk-periode-menu');
  if (menu) menu.classList.remove('open');

  if (!confirm(
    'Wil je deze rapportperiode afsluiten? ' +
    'Daarna kunnen er geen nieuwe taken of toetsen meer in worden gemaakt. ' +
    'Je kan ze altijd nog raadplegen en afdrukken.\n\n' +
    'TIP: gebruik liever "Nieuwe periode starten" als je meteen een opvolger wil.'
  )) return;

  Voortgang.sluitRapportperiode(periodeId).then(async () => {
    _periodes = await Voortgang.alleRapportperiodes();
    _actievePeriode = _periodes.find(p => p.status === 'actief') || null;
    _lkPeriodeBalkRenderer();
    if (!_actievePeriode) {
      alert('De periode is afgesloten. Maak een nieuwe periode aan om verder te kunnen werken.');
    }
  }).catch(e => {
    console.error('Afsluiten mislukt:', e);
    alert('Afsluiten mislukt: ' + (e.message || 'onbekend'));
  });
}

// Helper voor andere modules: ID van actieve periode (of null)
function lkActievePeriodeId() {
  return _actievePeriode ? _actievePeriode.id : null;
}


async function lkLaadKinderen() {
  try {
    lkKinderen = await Voortgang.alleKinderen();
    lkRendererTabel();
    lkRendererAandachtsstrook();
    // Kindertabs in de andere tabbladen meteen herrenderen
    if (typeof lkKindtabsRender === 'function') {
      lkKindtabsRender();
    }
  } catch (e) {
    document.getElementById('lk-tabel-wrap').innerHTML =
      '<p style="color:var(--kleur-fout)">Kon de leerlingen niet laden: ' + e.message + '</p>';
  }
}

// Manueel: knop bovenaan klikken
async function lkVerversen() {
  const knop = document.querySelector('button[onclick="lkVerversen()"]');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Laden...'; }
  try {
    await lkLaadKinderen();
  } finally {
    if (knop) { knop.disabled = false; knop.textContent = '🔄 Vernieuwen'; }
  }
}

// Auto: bij terugkeer naar dit tabblad → verversen
// (alleen wanneer document terug zichtbaar wordt)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Alleen verversen als we al een keer geladen hebben (anders dubbel werk bij eerste laad)
      if (lkKinderen && lkKinderen.length > 0 && typeof lkLaadKinderen === 'function') {
        lkLaadKinderen();
      }
    }
  });
}

// Aandachtsstrook bovenaan tabel: leerlingen met taak-status die actie vraagt.
// Toont voltooide én moeilijke taken.
function lkRendererAandachtsstrook() {
  const wrap = document.getElementById('lk-aandacht-strook');
  if (!wrap) return;

  const voltooid = [];
  const moeilijk = [];
  lkKinderen.forEach(kind => {
    if (!kind.taak || !kind.taak.themaId) return;
    const status = kind.taak.status;
    if (status === 'voltooid') voltooid.push(kind);
    else if (status === 'moeilijk' || status === 'haperde') moeilijk.push(kind);
  });

  if (voltooid.length === 0 && moeilijk.length === 0) {
    wrap.innerHTML = '';
    return;
  }

  let html = '<div class="lk-aandacht-blok">';
  if (voltooid.length > 0) {
    const namen = voltooid.map(k => `<a class="lk-aandacht-naam" onclick="lkScrollNaarKind('${k.code}')">${k.naam || k.code}</a>`).join(', ');
    html += `<div class="lk-aandacht-rij voltooid">
      <span class="lk-aandacht-emoji">🏆</span>
      <span class="lk-aandacht-tekst"><strong>${voltooid.length === 1 ? '1 leerling heeft' : voltooid.length + ' leerlingen hebben'} de taak voltooid:</strong> ${namen}</span>
    </div>`;
  }
  if (moeilijk.length > 0) {
    const namen = moeilijk.map(k => `<a class="lk-aandacht-naam" onclick="lkScrollNaarKind('${k.code}')">${k.naam || k.code}</a>`).join(', ');
    html += `<div class="lk-aandacht-rij moeilijk">
      <span class="lk-aandacht-emoji">⚠️</span>
      <span class="lk-aandacht-tekst"><strong>${moeilijk.length === 1 ? '1 leerling vond' : moeilijk.length + ' leerlingen vonden'} de taak moeilijk:</strong> ${namen}</span>
    </div>`;
  }
  html += '</div>';
  wrap.innerHTML = html;
}

// Scroll naar de leerling-rij + klap hem open zodat detail zichtbaar is
function lkScrollNaarKind(code) {
  if (!lkUitgeklapt.has(code)) {
    lkUitgeklapt.add(code);
    lkRendererTabel();
  }
  setTimeout(() => {
    const rij = document.querySelector(`tr[data-code="${code}"]`);
    if (rij) rij.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function lkRendererTabel() {
  const wrap = document.getElementById('lk-tabel-wrap');
  if (lkKinderen.length === 0) {
    wrap.innerHTML = '<p style="opacity:0.6; padding:20px; text-align:center">Nog geen leerlingen. Voeg er eentje toe hierboven.</p>';
    return;
  }

  let html = '<table class="lk-tabel"><thead><tr>';
  html += '<th></th><th>Klas</th><th>Naam</th><th>📋 Taak</th><th>🏷️ Vrij oefenen</th><th>Acties</th>';
  html += '</tr></thead><tbody>';

  // Gesorteerde lijst (klas → achternaam → voornaam)
  const gesorteerd = _lkSorteerKinderenAlfabet();

  gesorteerd.forEach(kind => {
    const naamVolledig = lkVolledigeNaam(kind);
    const naamSafe = naamVolledig.replace(/'/g, "\\'");
    const code = kind.code;
    const isOpen = lkUitgeklapt.has(code);
    const klasTekst = (kind.klas && kind.klas.trim()) ? kind.klas.trim() : '<span style="opacity:0.4">—</span>';

    // === Taak-status compact ===
    let taakCel = '<span class="lk-taak-leeg">— Geen taak —</span>';
    if (kind.taak && kind.taak.themaId && Array.isArray(kind.taak.woordIds) && kind.taak.woordIds.length > 0) {
      const t = kind.taak;
      const thema = ALLE_THEMAS_LK.find(x => x.id === t.themaId);
      const themaTekst = thema ? `${thema.emoji} ${thema.naam}` : t.themaId;
      const aantalW = t.woordIds.length;
      let statusBadge = '';
      if (t.status === 'voltooid') {
        statusBadge = '<span class="lk-status-badge voltooid">🏆 voltooid</span>';
      } else if (t.status === 'moeilijk' || t.status === 'haperde') {
        statusBadge = '<span class="lk-status-badge moeilijk">⚠️ moeilijk</span>';
      } else {
        const fase = t.huidigeFase || 'leren';
        const faseTekst = (fase === 'leren') ? 'leren' :
                          (fase === 'luisteren-oef') ? 'oefenen' :
                          (fase === 'luisteren-toets') ? 'toets' :
                          (fase === 'klaar') ? 'klaar' : fase;
        statusBadge = `<span class="lk-status-badge bezig">🔄 ${faseTekst}</span>`;
      }
      taakCel = `
        <div class="lk-taak-cel">
          <div class="lk-taak-cel-thema">${themaTekst} <small>(${aantalW} w.)</small></div>
          ${statusBadge}
        </div>
      `;
    }

    // === Vrij oefenen compact ===
    let vrijTekst = '— niets —';
    if (kind.thema_actief === undefined) {
      vrijTekst = 'alle thema\'s';
    } else if (Array.isArray(kind.thema_actief)) {
      const n = kind.thema_actief.length;
      vrijTekst = (n === 0) ? '— niets —' :
                  (n === 1) ? '1 thema' :
                  `${n} thema's`;
    }

    // Hoofdrij
    const naamCel = naamVolledig
      ? naamVolledig
      : '<em style="opacity:0.5">geen naam</em>';
    html += `<tr class="lk-tabel-rij ${isOpen ? 'open' : ''}" data-code="${code}">
      <td class="lk-rij-pijl-cel" onclick="lkRijToggle('${code}')"><span class="lk-rij-pijl">${isOpen ? '▼' : '▶'}</span></td>
      <td onclick="lkRijToggle('${code}')" class="lk-klas-cel">${klasTekst}</td>
      <td onclick="lkRijToggle('${code}')">${naamCel}<br><small class="lk-code-mini">${code}</small></td>
      <td onclick="lkRijToggle('${code}')">${taakCel}</td>
      <td onclick="lkRijToggle('${code}')"><span class="lk-vrij-tekst">${vrijTekst}</span></td>
      <td class="lk-acties-cel">
        <button class="lk-knop-mini" onclick="lkWijzigNaam('${code}', '${naamSafe}')" title="Naam van deze leerling wijzigen">⌨️</button>
        <button class="lk-knop-mini" onclick="lkBeheerCategorieen('${code}', '${naamSafe}')" title="Welke thema's mag de leerling vrij oefenen?">🏷️</button>
        <button class="lk-knop-mini" onclick="lkToonQR('${code}', '${naamSafe}')" title="QR-code voor inloggen">📱</button>
        <button class="lk-knop-mini" onclick="lkBekijkKindApp('${code}')" title="Open de kind-app als deze leerling">👁️</button>
        <button class="lk-knop-mini gevaar" onclick="lkVerwijder('${code}', '${naamSafe}')" title="Leerling verwijderen">🗑️</button>
      </td>
    </tr>`;

    // Uitklapbare detailrij
    if (isOpen) {
      html += `<tr class="lk-tabel-detailrij"><td colspan="6">${_lkRendererDetail(kind)}</td></tr>`;
    }
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// Set met codes van uitgeklapte rijen — globale state
let lkUitgeklapt = new Set();

function lkRijToggle(code) {
  if (lkUitgeklapt.has(code)) lkUitgeklapt.delete(code);
  else lkUitgeklapt.add(code);
  lkRendererTabel();
}

// Detail-render voor uitgeklapte rij
function _lkRendererDetail(kind) {
  let html = '<div class="lk-detail">';

  // === Taak-detail ===
  if (kind.taak && kind.taak.themaId && Array.isArray(kind.taak.woordIds)) {
    const t = kind.taak;
    const thema = ALLE_THEMAS_LK.find(x => x.id === t.themaId);
    const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : t.themaId;

    html += '<div class="lk-detail-blok">';
    html += `<h4>📋 Taak — ${themaNaam}</h4>`;

    // PDF-knop voor huidige taak — alleen tonen als er een toets is afgelegd
    const heeftToets = (Array.isArray(t.foutWoordenLaatsteToets) && t.foutWoordenLaatsteToets.length > 0)
                       || t.status === 'voltooid'
                       || t.status === 'moeilijk' || t.status === 'haperde';
    if (heeftToets) {
      html += `<p class="lk-detail-rij" style="margin-bottom:6px"><button class="lk-knop-mini" onclick="lkTaakPdfHuidig('${kind.code}')" title="PDF van deze toets voor toetsenmap">📄 PDF van deze toets</button></p>`;
    }

    // Vaardigheden + oefenvormen
    if (Array.isArray(t.vaardigheden) && t.vaardigheden.length > 0) {
      const vaardigIcoon = { 'luisteren': '👂', 'lezen': '👁️', 'schrijven': '✍️' };
      const vlist = t.vaardigheden.map(v => `${vaardigIcoon[v] || ''} ${v}`).join(' · ');
      html += `<p class="lk-detail-rij"><strong>Vaardigheden:</strong> ${vlist}</p>`;
    }

    // Toets-resultaat samengevat (op basis van foutWoorden + aantal woorden)
    const aantalW = t.woordIds.length;
    if (t.foutWoordenLaatsteToets && t.foutWoordenLaatsteToets.length > 0) {
      const juistAantal = aantalW - t.foutWoordenLaatsteToets.length;
      // Vind de tekst-namen op
      const foutNamen = [];
      if (thema) {
        const verrijkt = lkVerrijkThema(thema);
        verrijkt.items.forEach(it => {
          if (t.foutWoordenLaatsteToets.includes(it.id)) foutNamen.push(it.tekst);
        });
      }
      html += `<p class="lk-detail-rij"><strong>Laatste toets:</strong> ${juistAantal}/${aantalW} juist</p>`;
      if (foutNamen.length > 0) {
        html += `<p class="lk-detail-rij"><strong>Foute woorden:</strong> ${foutNamen.join(', ')}</p>`;
      }
    } else if (t.status === 'voltooid') {
      html += `<p class="lk-detail-rij"><strong>Laatste toets:</strong> ${aantalW}/${aantalW} juist 🏆</p>`;
    }

    // Geoefende woorden + status per woord
    if (t.perWoord && Object.keys(t.perWoord).length > 0) {
      html += '<p class="lk-detail-rij"><strong>Voortgang per woord:</strong></p>';
      html += '<div class="lk-detail-woorden">';
      const verrijkt = thema ? lkVerrijkThema(thema) : null;
      t.woordIds.forEach(id => {
        const data = t.perWoord[id] || {};
        const luist = data.luisteren_juist || 0;
        let woordTekst = id;
        if (verrijkt) {
          const item = verrijkt.items.find(x => x.id === id);
          if (item) woordTekst = item.tekst;
        }
        const bolletjes = '●'.repeat(luist) + '○'.repeat(3 - luist);
        const klaarKlas = (luist >= 3) ? 'klaar' : '';
        html += `<span class="lk-detail-woord ${klaarKlas}">${woordTekst} <span class="lk-bolletjes">${bolletjes}</span></span>`;
      });
      html += '</div>';
    }

    html += '</div>';
  } else {
    html += '<div class="lk-detail-blok"><h4>📋 Taak</h4><p class="lk-detail-leeg">Nog geen taak ingesteld voor deze leerling.</p></div>';
  }

  // === Vrij oefenen detail ===
  html += '<div class="lk-detail-blok">';
  html += '<h4>🏷️ Vrij oefenen</h4>';
  if (kind.thema_actief === undefined) {
    html += '<p class="lk-detail-leeg">Alle thema\'s staan open (standaard).</p>';
  } else if (!Array.isArray(kind.thema_actief) || kind.thema_actief.length === 0) {
    html += '<p class="lk-detail-leeg">Geen thema\'s aangevinkt.</p>';
  } else {
    html += '<p class="lk-detail-rij">';
    kind.thema_actief.forEach(themaId => {
      const thema = ALLE_THEMAS_LK.find(x => x.id === themaId);
      if (thema) {
        html += `<span class="lk-detail-tag">${thema.emoji} ${thema.naam}</span>`;
      }
    });
    html += '</p>';
  }
  html += '</div>';

  // === Algemene voortgang (sterren) ===
  const { gekend, totaal } = berekenVoortgangVoorKind(kind);
  html += `<div class="lk-detail-blok"><h4>⭐ Algemene voortgang</h4><p class="lk-detail-rij">${gekend} van ${totaal} woorden gekend (in vrij oefenen)</p></div>`;

  // === Eerdere taken (uit geschiedenis) ===
  const taakgesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
  if (taakgesch.length > 0) {
    const sortedT = [...taakgesch].sort((a, b) => (b.voltooidOp || 0) - (a.voltooidOp || 0));
    const tonen = sortedT.slice(0, 5);
    html += '<div class="lk-detail-blok"><h4>📋 Eerdere taken</h4>';
    tonen.forEach((arch, idx) => {
      const thema = ALLE_THEMAS_LK.find(t => t.id === arch.themaId);
      const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : (arch.themaId || '');
      const datum = new Date(arch.voltooidOp || 0);
      const dStr = `${String(datum.getDate()).padStart(2, '0')}/${String(datum.getMonth() + 1).padStart(2, '0')}/${String(datum.getFullYear()).slice(2)}`;
      // Score
      const aantalW = (arch.woordIds || []).length;
      const fout = Array.isArray(arch.foutWoordenLaatsteToets) ? arch.foutWoordenLaatsteToets.length : 0;
      const juist = aantalW - fout;
      // Status-badge
      const statusKlasse = arch.status === 'voltooid' ? 'voltooid' : (arch.status === 'moeilijk' || arch.status === 'haperde' ? 'moeilijk' : 'bezig');
      const statusEmoji = arch.status === 'voltooid' ? '✓' : (arch.status === 'moeilijk' || arch.status === 'haperde' ? '!' : '~');
      // Index in originele array (voor PDF-aanroep)
      const archiefIdx = taakgesch.indexOf(arch);
      html += `
        <div class="lk-taakgesch-rij">
          <span class="lk-taakgesch-datum">${dStr}</span>
          <span class="lk-taakgesch-thema">${themaNaam}</span>
          <span class="lk-taakgesch-status ${statusKlasse}">${statusEmoji} ${aantalW > 0 ? juist + '/' + aantalW : '—'}</span>
          <button class="lk-knop-mini lk-taakgesch-knop" onclick="lkTaakPdfVanGeschiedenis('${kind.code}', ${archiefIdx})" title="PDF van deze taak voor toetsenmap">📄</button>
        </div>
      `;
    });
    if (sortedT.length > 5) {
      html += `<p class="lk-detail-leeg" style="margin-top:6px">+ ${sortedT.length - 5} oudere taken</p>`;
    }
    html += '</div>';
  }

  // === Spreektoetsen (laatste 3) ===
  const spreektoetsen = Array.isArray(kind.spreektoetsen) ? kind.spreektoetsen : [];
  if (spreektoetsen.length > 0) {
    const sorted = [...spreektoetsen].sort((a, b) => (b.datum || 0) - (a.datum || 0));
    const tonen = sorted.slice(0, 3);
    html += '<div class="lk-detail-blok"><h4>🗣️ Spreektoetsen</h4>';
    tonen.forEach(st => {
      let v = 0, a = 0, n = 0;
      Object.values(st.perWoord || {}).forEach(r => {
        const o = sprWoordOordeel(r);
        if (o === 'vlot') v++;
        else if (o === 'aarzelt') a++;
        else if (o === 'niet') n++;
      });
      const thema = ALLE_THEMAS_LK.find(t => t.id === st.themaId);
      const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : (st.themaId || '');
      const datum = new Date(st.datum || 0);
      const dStr = `${String(datum.getDate()).padStart(2, '0')}/${String(datum.getMonth() + 1).padStart(2, '0')}`;
      const id = st.id ? st.id.replace(/'/g, "\\'") : '';
      html += `
        <div class="lk-spr-detail-rij">
          <span class="lk-spr-detail-datum">${dStr}</span>
          <span class="lk-spr-detail-thema">${themaNaam}</span>
          <span class="lk-spr-detail-cijfers">${v} ✓ · ${a} 🤔 · ${n} ✗</span>
          ${id ? `<button class="lk-knop-mini lk-spr-detail-knop" onclick="lkSprPdfVanGeschiedenis('${kind.code}', '${id}')" title="PDF van deze toets">📄</button>` : ''}
        </div>
      `;
    });
    if (sorted.length > 3) {
      html += `<p class="lk-detail-leeg" style="margin-top:6px">+ ${sorted.length - 3} oudere toetsen</p>`;
    }
    html += '</div>';
  }

  html += '</div>';
  return html;
}


// Filter de items van een thema voor dit kind. Volgorde:
//   1. Thema actief? Zo niet → leeg.
//   2. Woordenbeheer toepassen (overrides + eigen items + verbergen)
//   3. Categorieën-filter
//   4. Uitsluitingsfilter (specifieke woorden uitgezet voor dit kind)
function _filterItemsVoorKind(thema, kind) {
  // Thema-niveau: thema_actief afwezig = backward compat (alles aan).
  // Aanwezig = enkel als thema-id in de array zit.
  if (Array.isArray(kind.thema_actief)) {
    if (kind.thema_actief.indexOf(thema.id) === -1) return [];
  }

  const verrijkt = lkVerrijkThema(thema);
  const ingesteld = (kind.categorieen || {})[verrijkt.id];
  const uitgesloten = (kind.uitgesloten || {})[verrijkt.id] || [];

  // Geen categorieën in dit thema? Alleen uitsluiting toepassen.
  if (!verrijkt.categorieen || verrijkt.categorieen.length === 0) {
    if (uitgesloten.length === 0) return verrijkt.items;
    return verrijkt.items.filter(it => !uitgesloten.includes(it.id));
  }

  // Categorieën-bepaling
  let actieveCats;
  if (!Array.isArray(ingesteld) || ingesteld.length === 0) {
    if (ingesteld === undefined || ingesteld === null) {
      actieveCats = verrijkt.categorieen;  // default = alles
    } else {
      actieveCats = [];  // expliciet leeg
    }
  } else {
    actieveCats = ingesteld;
  }

  return verrijkt.items.filter(it => {
    if (it.categorie && !actieveCats.includes(it.categorie)) return false;
    if (uitgesloten.includes(it.id)) return false;
    return true;
  });
}

function berekenVoortgangVoorKind(kind) {
  const v = kind.voortgang || {};
  let gekend = 0, totaal = 0;
  ALLE_THEMAS_LK.forEach(thema => {
    const actieveItems = _filterItemsVoorKind(thema, kind);
    totaal += actieveItems.length;
    const themaData = v[thema.id] || {};
    actieveItems.forEach(item => {
      const it = themaData[item.id];
      if (it && (it.sterren || 0) >= 3) gekend++;
    });
  });
  return { gekend, totaal };
}

// =================================================================
//  CODE GENEREREN & TOEVOEGEN
// =================================================================
function lkGenereerCode() {
  // Format: ZEBRA-XXXX (4 cijfers)
  const cijfers = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('nieuw-code').value = `ZEBRA-${cijfers}`;
}

async function lkVoegToe() {
  const voornaam = (document.getElementById('nieuw-voornaam') || {}).value || '';
  const achternaam = (document.getElementById('nieuw-achternaam') || {}).value || '';
  const klas = (document.getElementById('nieuw-klas') || {}).value || '';
  const code = document.getElementById('nieuw-code').value.trim();
  const fout = document.getElementById('lk-fout');
  fout.textContent = '';

  if (!code) {
    fout.textContent = 'Tik eerst een code in (of klik "Code genereren").';
    return;
  }

  // Check of code geldig is
  if (!/^[A-Z0-9]{2,8}-?[A-Z0-9]{2,8}$/i.test(code) && !/^[A-Z0-9]{4,12}$/i.test(code)) {
    fout.textContent = 'De code moet 4-12 letters/cijfers zijn (bv. ZEBRA-1234).';
    return;
  }

  const codeNorm = code.toUpperCase();

  // Check of code al bestaat
  if (lkKinderen.find(k => k.code === codeNorm)) {
    fout.textContent = 'Deze code bestaat al. Kies een andere.';
    return;
  }

  try {
    await Voortgang.maakKind(codeNorm, {
      voornaam: voornaam.trim(),
      achternaam: achternaam.trim(),
      klas: klas.trim()
    });
    // Velden leegmaken
    ['nieuw-voornaam', 'nieuw-achternaam', 'nieuw-klas', 'nieuw-code'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    await lkLaadKinderen();
  } catch (e) {
    fout.textContent = 'Kon niet toevoegen: ' + e.message;
  }
}

async function lkVerwijder(code, naam) {
  if (!confirm(`Wil je ${naam || code} echt verwijderen?\nAlle voortgang gaat verloren.`)) return;
  try {
    await Voortgang.verwijderKind(code);
    await lkLaadKinderen();
  } catch (e) {
    alert('Kon niet verwijderen: ' + e.message);
  }
}

async function lkWijzigNaam(code, huidigeNaam) {
  // Open modal voor het wijzigen van voornaam, achternaam, klas
  const kind = lkKinderen.find(k => k.code === code);
  if (!kind) return;

  // Verwijder eventuele oude modal
  const oud = document.getElementById('lk-wijzig-modal-bg');
  if (oud) oud.remove();

  // Bouw modal
  const bg = document.createElement('div');
  bg.id = 'lk-wijzig-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  // Initiële waarden: nieuwe velden, fallback op naam-veld bij eerste migratie
  let initVoor = (kind.voornaam || '').trim();
  let initAchter = (kind.achternaam || '').trim();
  if (!initVoor && !initAchter && kind.naam) {
    // Suggestie: splits oude naam op eerste spatie
    const stukken = kind.naam.trim().split(/\s+/);
    if (stukken.length === 1) {
      initVoor = stukken[0];
    } else {
      initVoor = stukken[0];
      initAchter = stukken.slice(1).join(' ');
    }
  }
  const initKlas = (kind.klas || '').trim();

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()" style="max-width:500px">
      <h2>⌨️ Leerling wijzigen</h2>
      <p class="modal-uitleg" style="margin-bottom:16px">
        Code: <strong>${code}</strong>
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label" for="wijzig-voornaam">Voornaam</label>
        <input type="text" id="wijzig-voornaam" class="lk-taak-select" value="${initVoor.replace(/"/g, '&quot;')}" placeholder="bv. Mohammed">
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label" for="wijzig-achternaam">Achternaam</label>
        <input type="text" id="wijzig-achternaam" class="lk-taak-select" value="${initAchter.replace(/"/g, '&quot;')}" placeholder="bv. Yilmaz">
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label" for="wijzig-klas">Klas</label>
        <input type="text" id="wijzig-klas" class="lk-taak-select" value="${initKlas.replace(/"/g, '&quot;')}" placeholder="bv. 2A (laat leeg als niet bekend)">
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-wijzig-modal-bg').remove()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkWijzigBewaar('${code}')">Bewaren</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
  // Focus op voornaam
  setTimeout(() => {
    const el = document.getElementById('wijzig-voornaam');
    if (el) el.focus();
  }, 30);
}

async function lkWijzigBewaar(code) {
  const voor = (document.getElementById('wijzig-voornaam') || {}).value || '';
  const achter = (document.getElementById('wijzig-achternaam') || {}).value || '';
  const klas = (document.getElementById('wijzig-klas') || {}).value || '';

  try {
    await Voortgang.wijzigKindGegevens(code, voor, achter, klas);
    // Lokale lijst bijwerken
    const kind = lkKinderen.find(k => k.code === code);
    if (kind) {
      kind.voornaam = voor.trim();
      kind.achternaam = achter.trim();
      kind.klas = klas.trim();
      kind.naam = [voor.trim(), achter.trim()].filter(Boolean).join(' ');
    }
    const bg = document.getElementById('lk-wijzig-modal-bg');
    if (bg) bg.remove();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    alert('Kon niet bewaren: ' + e.message);
  }
}

// =================================================================
//  QR-CODE GENEREREN
// =================================================================
function lkToonQR(code, naam) {
  lkHuidigQRCode = code;
  // Bouw URL naar de kind-app met code in query string
  const qrUrl = lkKindAppUrl(code);

  document.getElementById('qr-naam').textContent = naam ? `${naam} · ${code}` : code;
  const qrDiv = document.getElementById('qr-canvas');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: qrUrl,
    width: 240,
    height: 240,
    colorDark: '#2D2A32',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qr-modal').classList.add('actief');
}

function lkPrintQR() {
  // Open een print-vriendelijk venster met de QR
  const naam = document.getElementById('qr-naam').textContent;
  const qrImg = document.querySelector('#qr-canvas img') || document.querySelector('#qr-canvas canvas');
  let qrSrc = '';
  if (qrImg && qrImg.tagName === 'IMG') qrSrc = qrImg.src;
  else if (qrImg && qrImg.tagName === 'CANVAS') qrSrc = qrImg.toDataURL();

  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html><html><head><title>QR-code ${naam}</title>
    <style>
      body { font-family: 'Quicksand', sans-serif; text-align: center; padding: 40px; }
      .doos { border: 3px dashed #FFB627; border-radius: 24px; padding: 40px; max-width: 500px; margin: 0 auto; }
      h1 { color: #E89F0F; margin-bottom: 20px; }
      h2 { font-size: 28px; margin: 16px 0; letter-spacing: 0.08em; color: #2D2A32; }
      img { max-width: 280px; margin: 20px 0; }
      p { color: #666; font-size: 14px; }
      .voet { margin-top: 20px; font-size: 12px; color: #999; }
      .zebra { font-size: 48px; margin-bottom: 10px; }
    </style></head><body>
    <div class="doos">
      <div class="zebra">🦓</div>
      <h1>Anders Leren</h1>
      <p style="font-size:16px">Hallo! Scan deze code om thuis te oefenen.</p>
      <h2>${naam}</h2>
      <img src="${qrSrc}" alt="QR-code">
      <p>Bewaar dit blaadje. Tot de volgende keer!</p>
      <div class="voet">Juf Zisa · jufzisa.be</div>
    </div>
    <script>setTimeout(() => window.print(), 300);<\/script>
    </body></html>
  `);
  w.document.close();
}

// =================================================================
//  OVERZICHT "WIE KAN WAT?"
// =================================================================
function lkRendererOverzicht() {
  const div = document.getElementById('lk-overzicht');

  if (lkKinderen.length === 0) {
    div.innerHTML = '<p style="opacity:0.6">Geen leerlingen toegevoegd.</p>';
    return;
  }

  let html = '<table class="lk-tabel"><thead><tr><th>Leerling</th>';
  ALLE_THEMAS_LK.forEach(t => {
    html += `<th title="${t.naam}">${t.emoji}</th>`;
  });
  html += '<th>Totaal</th></tr></thead><tbody>';

  lkKinderen.forEach(kind => {
    const v = kind.voortgang || {};
    let totGekend = 0, totItems = 0;
    let cellen = '';
    ALLE_THEMAS_LK.forEach(thema => {
      const themaData = v[thema.id] || {};
      const actieveItems = _filterItemsVoorKind(thema, kind);
      let gekend = 0;
      actieveItems.forEach(it => {
        const x = themaData[it.id];
        if (x && (x.sterren || 0) >= 3) gekend++;
      });
      totGekend += gekend;
      totItems += actieveItems.length;
      const totaalThema = actieveItems.length;
      const pct = totaalThema > 0 ? Math.round((gekend / totaalThema) * 100) : 0;
      const kleur = pct >= 80 ? '#06A77D' : pct >= 40 ? '#FFB627' : pct > 0 ? '#FF8C42' : '#DDD';
      // Toon "—" als geen items in dit thema voor dit kind (alle categorieën uit)
      const cellInhoud = totaalThema === 0 ? '—' : `${gekend}/${totaalThema}`;
      cellen += `<td style="text-align:center; background: ${kleur}22; color: ${kleur}; font-weight: 700">${cellInhoud}</td>`;
    });
    html += `<tr>
      <td><a href="javascript:lkBekijkKind('${kind.code}')" style="color:var(--kleur-zwart); font-weight:600">${kind.naam || kind.code}</a></td>
      ${cellen}
      <td style="text-align:center; font-weight:700">${totGekend}/${totItems}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  html += '<p style="margin-top:14px; opacity:0.6; font-size:13px">💡 Klik op een naam voor details per leerling.</p>';
  div.innerHTML = html;
}

function lkBekijkKind(code) {
  const kind = lkKinderen.find(k => k.code === code);
  if (!kind) return;

  // Switch naar overzicht-tab als we ergens anders zitten
  if (!document.querySelector('.lk-tab[data-tab="overzicht"]').classList.contains('actief')) {
    lkKiesTab('overzicht');
  }

  document.getElementById('lk-detail-naam').textContent = kind.naam || 'Leerling';
  document.getElementById('lk-detail-code').textContent = kind.code;

  const v = kind.voortgang || {};
  let html = '';

  ALLE_THEMAS_LK.forEach(thema => {
    const themaData = v[thema.id] || {};
    const actieveItems = _filterItemsVoorKind(thema, kind);
    if (actieveItems.length === 0 && thema.categorieen && thema.categorieen.length > 0) {
      // Volledig uit voor dit kind → niet tonen in detail
      return;
    }
    let gekend = 0;
    actieveItems.forEach(it => {
      const x = themaData[it.id];
      if (x && (x.sterren || 0) >= 3) gekend++;
    });

    html += `<h3 style="margin: 20px 0 10px; font-size:18px">${thema.emoji} ${thema.naam} (${gekend}/${actieveItems.length})</h3>`;

    actieveItems.forEach(it => {
      const data = themaData[it.id];
      const sterren = data?.sterren || 0;
      const sterStr = '⭐'.repeat(sterren) + '☆'.repeat(3 - sterren);
      const pct = sterren / 3 * 100;

      html += `<div class="kind-detail-rij">
        <span>${it.beeld} ${it.tekst}</span>
        <div class="balkje"><div class="balkje-vul" style="width:${pct}%; background:${pct === 100 ? '#06A77D' : pct > 0 ? '#FFB627' : '#DDD'}"></div></div>
        <span style="text-align:right; color:${sterren === 3 ? '#06A77D' : '#999'}; font-size:13px">${sterStr}</span>
      </div>`;
    });
  });

  document.getElementById('lk-detail-inhoud').innerHTML = html;
  document.getElementById('lk-kind-detail').classList.add('actief');
  document.getElementById('lk-kind-detail').scrollIntoView({ behavior: 'smooth' });
}

// =================================================================
//  PRINTBARE OVERZICHTEN
// =================================================================

function lkPrintLijst() {
  if (lkKinderen.length === 0) {
    alert('Voeg eerst leerlingen toe.');
    return;
  }

  // Sorteer op naam (kinderen zonder naam onderaan)
  const gesorteerd = [...lkKinderen].sort((a, b) => {
    if (!a.naam && !b.naam) return 0;
    if (!a.naam) return 1;
    if (!b.naam) return -1;
    return a.naam.localeCompare(b.naam, 'nl');
  });

  const datum = new Date().toLocaleDateString('nl-BE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  let rijen = '';
  gesorteerd.forEach((k, i) => {
    rijen += `<tr>
      <td class="nr">${i + 1}</td>
      <td class="naam">${k.naam || '<em style="color:#999">geen naam</em>'}</td>
      <td class="code">${k.code}</td>
      <td class="hand"></td>
    </tr>`;
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Klaslijst Anders Leren</title>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: 'Quicksand', 'Helvetica', sans-serif; color: #2D2A32; }
      .kop { display: flex; justify-content: space-between; align-items: flex-end;
             border-bottom: 3px solid #FFB627; padding-bottom: 10px; margin-bottom: 18px; }
      .kop-links h1 { font-size: 26px; margin: 0 0 4px 0; }
      .kop-links p { margin: 0; color: #666; font-size: 13px; }
      .kop-rechts { text-align: right; font-size: 12px; color: #888; }
      .kop-rechts .zebra { font-size: 28px; }
      .kop-rechts strong { color: #E89F0F; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #FFF4E0; text-align: left; padding: 10px 12px;
           font-size: 13px; color: #E89F0F; border-bottom: 2px solid #FFB627; }
      td { padding: 12px; border-bottom: 1px solid #E8DFD0; font-size: 14px; }
      td.nr { width: 30px; color: #999; font-size: 13px; }
      td.naam { font-weight: 600; }
      td.code { font-family: 'Courier New', monospace; font-weight: 700;
                letter-spacing: 0.05em; color: #2D2A32; }
      td.hand { width: 100px; border-bottom: 1px solid #999; }
      .voet { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; }
      .uitleg { margin-bottom: 14px; padding: 10px 14px; background: #FFF8EE;
                border-left: 3px solid #FFB627; font-size: 12px; color: #555; border-radius: 4px; }
      @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style></head><body>
    <div class="kop">
      <div class="kop-links">
        <h1>Klaslijst — Anders Leren</h1>
        <p>Codes voor inloggen op jufzisa.be/anders-leren</p>
      </div>
      <div class="kop-rechts">
        <div class="zebra">🦓</div>
        <div><strong>Juf Zisa</strong></div>
        <div>${datum}</div>
      </div>
    </div>
    <div class="uitleg">
      💡 Bewaar deze lijst goed — ouders en kinderen hebben de code nodig om in te loggen. De laatste kolom kan je gebruiken voor een handtekening of opmerking.
    </div>
    <table>
      <thead><tr><th></th><th>Naam</th><th>Code</th><th>Opmerking / handtekening</th></tr></thead>
      <tbody>${rijen}</tbody>
    </table>
    <div class="voet">${gesorteerd.length} leerling${gesorteerd.length === 1 ? '' : 'en'} · jufzisa.be · Anders Leren</div>
    <script>setTimeout(() => window.print(), 400);<\/script>
    </body></html>`);
  w.document.close();
}

function lkPrintAlleQR() {
  if (lkKinderen.length === 0) {
    alert('Voeg eerst leerlingen toe.');
    return;
  }

  // Sorteer op naam
  const gesorteerd = [...lkKinderen].sort((a, b) => {
    if (!a.naam && !b.naam) return 0;
    if (!a.naam) return 1;
    if (!b.naam) return -1;
    return a.naam.localeCompare(b.naam, 'nl');
  });

  // Genereer QR per kind in een tijdelijke verborgen div, en lees als data-URL
  const tijdelijk = document.createElement('div');
  tijdelijk.style.cssText = 'position:absolute; left:-9999px; top:-9999px;';
  document.body.appendChild(tijdelijk);

  const qrData = gesorteerd.map(kind => {
    const sub = document.createElement('div');
    tijdelijk.appendChild(sub);
    new QRCode(sub, {
      text: lkKindAppUrl(kind.code),
      width: 200,
      height: 200,
      colorDark: '#2D2A32',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
    const img = sub.querySelector('img') || sub.querySelector('canvas');
    let src = '';
    if (img && img.tagName === 'IMG') src = img.src;
    else if (img && img.tagName === 'CANVAS') src = img.toDataURL();
    return { naam: kind.naam || '', code: kind.code, qrSrc: src };
  });

  document.body.removeChild(tijdelijk);

  // Bouw blaadjes — 4 per A4-pagina (2x2 raster)
  let kaartjes = '';
  qrData.forEach(({ naam, code, qrSrc }) => {
    kaartjes += `
      <div class="kaartje">
        <div class="zebra">🦓</div>
        <div class="titel">Anders Leren</div>
        <div class="naam">${naam || '&nbsp;'}</div>
        <img src="${qrSrc}" alt="QR">
        <div class="code">${code}</div>
        <div class="onder">Scan thuis om te oefenen!</div>
        <div class="merk">jufzisa.be</div>
      </div>`;
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>QR-blaadjes Anders Leren</title>
    <style>
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Quicksand', 'Helvetica', sans-serif; color: #2D2A32; margin: 0; }
      .raster { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
      .kaartje {
        border: 2px dashed #FFB627;
        border-radius: 16px;
        padding: 14mm 6mm;
        text-align: center;
        background: #FFFDF8;
        page-break-inside: avoid;
        height: 130mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .zebra { font-size: 36px; line-height: 1; margin-bottom: 4px; }
      .titel { font-size: 14px; color: #E89F0F; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 6px; }
      .naam { font-size: 22px; font-weight: 700; margin-bottom: 8px; min-height: 28px; }
      .kaartje img { width: 50mm; height: 50mm; margin: 4px 0; }
      .code { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700;
              letter-spacing: 0.08em; margin-top: 6px; color: #2D2A32; }
      .onder { font-size: 11px; color: #888; margin-top: 8px; }
      .merk { font-size: 10px; color: #bbb; margin-top: 4px; }
      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .kaartje { break-inside: avoid; }
      }
    </style></head><body>
    <div class="raster">${kaartjes}</div>
    <script>setTimeout(() => window.print(), 600);<\/script>
    </body></html>`);
  w.document.close();
}



// =================================================================
//  VRIJ OEFENEN — welke thema's zijn open voor dit kind?
// =================================================================
//
// Heel eenvoudig: vink aan welke thema's het kind vrij mag oefenen.
// Voor de gerichte oefening van specifieke woorden: gebruik de Taak-modal.

let _vrijModalKindCode = null;
let _vrijModalNaam = '';
let _vrijModalThemaActief = null; // Set<themaId>

async function lkBeheerCategorieen(code, naam) {
  _vrijModalKindCode = code;
  _vrijModalNaam = naam || code;

  let huidigeActief = null;
  try {
    huidigeActief = await Voortgang.haalThemaActiefOpVoorKind(code);
  } catch (e) { console.warn('Thema-actief ophalen mislukt:', e); }

  // null vanuit Firestore = backward-compat: alles aan.
  // [] = expliciet niets aan.
  if (huidigeActief === null) {
    _vrijModalThemaActief = new Set(ALLE_THEMAS_LK.map(t => t.id));
  } else {
    _vrijModalThemaActief = new Set(huidigeActief);
  }

  rendererVrijModal();
}

function rendererVrijModal() {
  const oud = document.getElementById('lk-vrij-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-vrij-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) lkSluitVrijModal(); };

  const groepen = [
    { titel: 'Survival-thema\u2019s — eerste week', emoji: '🚨', themas: ALLE_THEMAS_LK.filter(t => t.categorie === 'survival') },
    { titel: 'Woorden-thema\u2019s', emoji: '📚', themas: ALLE_THEMAS_LK.filter(t => t.type === 'woorden') },
    { titel: 'Zinnen-thema\u2019s', emoji: '💬', themas: ALLE_THEMAS_LK.filter(t => t.type === 'zinnen') }
  ];

  let html = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>🏷️ Vrij oefenen voor ${_vrijModalNaam}</h2>
      <p class="modal-uitleg">
        Vink hieronder de thema\u2019s aan die deze leerling vrij mag oefenen.
        Voor een gerichte oefenopdracht met specifieke woorden: gebruik het 📋-knopje.
      </p>

      <div class="lk-cat-snelacties">
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('alles')">✓ Alles aan</button>
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('niets')">✗ Alles uit</button>
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('survival')" title="Alleen de drie survival-thema's aanzetten">🏫 Enkel survival</button>
      </div>
  `;

  groepen.forEach(groep => {
    if (groep.themas.length === 0) return;
    html += `<h3 class="lk-cat-groep-titel">${groep.emoji} ${groep.titel}</h3>`;
    html += `<div class="lk-vrij-themalijst">`;
    groep.themas.forEach(thema => {
      const aan = _vrijModalThemaActief.has(thema.id);
      const verrijkt = lkVerrijkThema(thema);
      const aantal = verrijkt.items.length;
      html += `
        <label class="lk-vrij-themarij ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="lkVrijToggleThema('${thema.id}')">
          <span class="lk-vrij-thema-emoji">${thema.emoji}</span>
          <span class="lk-vrij-thema-naam">${thema.naam}</span>
          <span class="lk-vrij-thema-teller">${aantal} woorden</span>
        </label>
      `;
    });
    html += `</div>`;
  });

  html += `
      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkSluitVrijModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkBewaarVrijModal()">💾 Bewaren</button>
      </div>
    </div>
  `;

  bg.innerHTML = html;
  document.body.appendChild(bg);
}

function lkVrijToggleThema(themaId) {
  if (!_vrijModalThemaActief) return;
  if (_vrijModalThemaActief.has(themaId)) _vrijModalThemaActief.delete(themaId);
  else _vrijModalThemaActief.add(themaId);
  rendererVrijModal();
}

function lkVrijSnelactie(soort) {
  if (soort === 'alles') {
    _vrijModalThemaActief = new Set(ALLE_THEMAS_LK.map(t => t.id));
  } else if (soort === 'niets') {
    _vrijModalThemaActief = new Set();
  } else if (soort === 'survival') {
    _vrijModalThemaActief = new Set(ALLE_THEMAS_LK.filter(t => t.categorie === 'survival').map(t => t.id));
  }
  rendererVrijModal();
}

async function lkBewaarVrijModal() {
  if (!_vrijModalKindCode) return;
  const knop = document.querySelector('#lk-vrij-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  try {
    const lijst = Array.from(_vrijModalThemaActief);
    await Voortgang.zetThemaActiefVoorKind(_vrijModalKindCode, lijst);
    const kind = lkKinderen.find(k => k.code === _vrijModalKindCode);
    if (kind) kind.thema_actief = lijst;
    lkSluitVrijModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Bewaren mislukt:', e);
    alert('Kon de instellingen niet bewaren. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

function lkSluitVrijModal() {
  const bg = document.getElementById('lk-vrij-modal-bg');
  if (bg) bg.remove();
  _vrijModalKindCode = null;
  _vrijModalThemaActief = null;
}

// Backward-compat: oudere code roept misschien lkSluitCatModal
function lkSluitCatModal() {
  lkSluitVrijModal();
}

// =================================================================
//  TAAK PER LEERLING — modal
// =================================================================
//
// Schema:
//   - Bovenaan: status van huidige taak (als er een is): voltooid / haperde / bezig
//   - Thema-dropdown: kies welke thema voor de taak
//   - Woord-checkboxes: kies welke woorden in de taak komen
//   - Bewaren = nieuwe taak (overschrijft eventuele oude)

let _taakModalKindCode = null;
let _taakModalNaam = '';
let _taakModalThemaId = null;
let _taakModalWoordIds = new Set();
// Nieuwe state voor v1:
let _taakModalVaardigheden = new Set(['luisteren']); // 'luisteren', 'lezen', 'schrijven'
let _taakModalOefenvormenLuisteren = new Set(['klikspel']); // 'klikspel', 'verbinden', 'verslepen'
let _taakModalOefenvormenSchrijven = new Set(['slepen']); // 'slepen', 'typen'
let _taakModalZinscontext = false;
// Geschiedenis voor kleur-codering van woorden: array van vorige taken voor dit kind
let _taakModalGeschiedenis = [];
// Huidige (nog niet gearchiveerde) taak — telt ook mee voor de kleur-codering
let _taakModalHuidigeTaak = null;

// Helper: bepaal kleur voor een woord-id binnen het huidig gekozen thema
//   'geel'  = woord was ooit fout in een toets (huidig of vorige taak)
//   'groen' = woord stond ooit in een taak (huidig of vorige) en was niet fout
//   ''      = nog nooit geoefend in een taak (wit/standaard)
function _taakModalWoordKleur(woordId) {
  if (!_taakModalThemaId) return '';
  let ooitGeoefend = false;
  let ooitFout = false;

  // Check 1: huidige nog-niet-gearchiveerde taak
  if (_taakModalHuidigeTaak &&
      _taakModalHuidigeTaak.themaId === _taakModalThemaId &&
      Array.isArray(_taakModalHuidigeTaak.woordIds) &&
      _taakModalHuidigeTaak.woordIds.indexOf(woordId) !== -1) {
    ooitGeoefend = true;
    if (Array.isArray(_taakModalHuidigeTaak.foutWoordenLaatsteToets) &&
        _taakModalHuidigeTaak.foutWoordenLaatsteToets.indexOf(woordId) !== -1) {
      ooitFout = true;
    }
  }

  // Check 2: gearchiveerde geschiedenis
  for (const archief of _taakModalGeschiedenis) {
    if (archief.themaId !== _taakModalThemaId) continue;
    if (!Array.isArray(archief.woordIds) || archief.woordIds.indexOf(woordId) === -1) continue;
    ooitGeoefend = true;
    if (Array.isArray(archief.foutWoordenLaatsteToets) &&
        archief.foutWoordenLaatsteToets.indexOf(woordId) !== -1) {
      ooitFout = true;
    }
  }

  if (ooitFout) return 'geel';
  if (ooitGeoefend) return 'groen';
  return '';
}

async function lkBeheerTaak(code, naam) {
  _taakModalKindCode = code;
  _taakModalNaam = naam || code;

  // Huidige taak + geschiedenis ophalen
  let huidigeTaak = null;
  try {
    huidigeTaak = await Voortgang.haalTaakOpVoorKind(code);
  } catch (e) {
    console.warn('Taak ophalen mislukt:', e);
  }
  _taakModalHuidigeTaak = huidigeTaak;
  try {
    _taakModalGeschiedenis = await Voortgang.haalTaakgeschiedenisOpVoorKind(code);
  } catch (e) {
    console.warn('Geschiedenis ophalen mislukt:', e);
    _taakModalGeschiedenis = [];
  }

  // Voorinstelling: als er een taak is, hetzelfde thema/instellingen overnemen.
  // Bij voltooid of moeilijk: woorden NIET vooraf aanvinken — leerkracht kiest opnieuw
  // (wel met groen/geel-codering zichtbaar zodat ze weet wat al kende of fout was).
  if (huidigeTaak && huidigeTaak.themaId) {
    _taakModalThemaId = huidigeTaak.themaId;
    const taakAfgewerkt = (huidigeTaak.status === 'voltooid' ||
                           huidigeTaak.status === 'moeilijk' ||
                           huidigeTaak.status === 'haperde');
    _taakModalWoordIds = taakAfgewerkt ? new Set() : new Set(huidigeTaak.woordIds || []);
    _taakModalVaardigheden = new Set(huidigeTaak.vaardigheden || ['luisteren']);
    _taakModalOefenvormenLuisteren = new Set(huidigeTaak.oefenvormen_luisteren || ['klikspel']);
    _taakModalOefenvormenSchrijven = new Set(huidigeTaak.oefenvormen_schrijven || ['slepen']);
    _taakModalZinscontext = huidigeTaak.zinscontext === true;
  } else {
    // Pak eerste thema dat actief is voor dit kind, anders eerste van de lijst
    const kind = lkKinderen.find(k => k.code === code);
    let themaIds = [];
    if (kind && Array.isArray(kind.thema_actief) && kind.thema_actief.length > 0) {
      themaIds = kind.thema_actief;
    } else {
      themaIds = ALLE_THEMAS_LK.map(t => t.id);
    }
    _taakModalThemaId = themaIds[0] || (ALLE_THEMAS_LK[0] && ALLE_THEMAS_LK[0].id);
    _taakModalWoordIds = new Set();
    _taakModalVaardigheden = new Set(['luisteren']);
    _taakModalOefenvormenLuisteren = new Set(['klikspel']);
    _taakModalOefenvormenSchrijven = new Set(['slepen']);
    _taakModalZinscontext = false;
  }

  rendererTaakModal(huidigeTaak);
}

function rendererTaakModal(huidigeTaak) {
  // Verwijder evt bestaande modal
  const oud = document.getElementById('lk-taak-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-taak-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) lkSluitTaakModal(); };

  // Bepaal beschikbare thema's voor dit kind
  const kind = lkKinderen.find(k => k.code === _taakModalKindCode);
  let beschikbareThemaIds;
  if (kind && Array.isArray(kind.thema_actief) && kind.thema_actief.length > 0) {
    beschikbareThemaIds = kind.thema_actief;
  } else {
    beschikbareThemaIds = ALLE_THEMAS_LK.map(t => t.id);
  }
  const beschikbareThemas = ALLE_THEMAS_LK.filter(t => beschikbareThemaIds.indexOf(t.id) !== -1);

  // Status-strook van vorige taak (als er een is)
  let statusBlok = '';
  if (huidigeTaak) {
    const thema = ALLE_THEMAS_LK.find(t => t.id === huidigeTaak.themaId);
    const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : huidigeTaak.themaId;
    let statusEmoji, statusTekst, statusKleur;
    if (huidigeTaak.status === 'voltooid') {
      statusEmoji = '🏆'; statusTekst = 'Vorige taak: voltooid'; statusKleur = '#d4edda';
    } else if (huidigeTaak.status === 'moeilijk' || huidigeTaak.status === 'haperde') {
      statusEmoji = '⚠️';
      statusTekst = 'Was moeilijk' + (huidigeTaak.huidigeFase ? ` (fase ${huidigeTaak.huidigeFase})` : '');
      statusKleur = '#fff3cd';
    } else {
      statusEmoji = '🔄';
      statusTekst = 'Bezig' + (huidigeTaak.huidigeFase ? ` (fase ${huidigeTaak.huidigeFase})` : '');
      statusKleur = '#e3f2fd';
    }
    let foutLijst = '';
    if (huidigeTaak.foutWoordenLaatsteToets && huidigeTaak.foutWoordenLaatsteToets.length > 0) {
      const naamLijst = [];
      ALLE_THEMAS_LK.forEach(t => {
        if (t.id !== huidigeTaak.themaId) return;
        const verrijkt = lkVerrijkThema(t);
        verrijkt.items.forEach(it => {
          if (huidigeTaak.foutWoordenLaatsteToets.indexOf(it.id) !== -1) naamLijst.push(it.tekst);
        });
      });
      if (naamLijst.length > 0) {
        foutLijst = `<div class="lk-taak-fouten">Foute woorden: <strong>${naamLijst.join(', ')}</strong></div>`;
      }
    }
    statusBlok = `
      <div class="lk-taak-status" style="background:${statusKleur}">
        <div class="lk-taak-status-kop">${statusEmoji} ${statusTekst} <small>(${themaNaam})</small></div>
        ${foutLijst}
      </div>
    `;
  }

  let html = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>📋 Taak voor ${_taakModalNaam}</h2>
      <p class="modal-uitleg">
        Stel een taak samen: kies thema, woorden, en welke vaardigheden de leerling moet oefenen.
      </p>

      ${statusBlok}

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Thema</label>
        <select class="lk-taak-select" onchange="lkTaakKiesThema(this.value)">
  `;

  if (beschikbareThemas.length === 0) {
    html += `<option value="">⚠️ Geen actieve thema's</option>`;
  } else {
    beschikbareThemas.forEach(t => {
      const sel = (t.id === _taakModalThemaId) ? 'selected' : '';
      html += `<option value="${t.id}" ${sel}>${t.emoji} ${t.naam}</option>`;
    });
  }

  html += `
        </select>
        <p class="lk-taak-tip">💡 Enkel thema's die jij hebt aangevinkt voor "vrij oefenen" verschijnen hier.</p>
      </div>
  `;

  // Woordlijst van het gekozen thema (zonder niveau-groepering)
  if (_taakModalThemaId) {
    const thema = ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId);
    if (thema) {
      const verrijkt = lkVerrijkThema(thema);
      const items = verrijkt.items;
      const aantalAangevinkt = _taakModalWoordIds.size;

      // Tellen voor legende: hebben we überhaupt geschiedenis voor dit thema?
      let heeftGroen = false, heeftGeel = false;
      items.forEach(it => {
        const k = _taakModalWoordKleur(it.id);
        if (k === 'groen') heeftGroen = true;
        if (k === 'geel') heeftGeel = true;
      });
      const legende = (heeftGroen || heeftGeel)
        ? `<div class="lk-taak-legende">
             <span class="lk-legende-item"><span class="lk-legende-bol groen"></span> al gekend</span>
             <span class="lk-legende-item"><span class="lk-legende-bol geel"></span> nog moeilijk</span>
             <span class="lk-legende-item"><span class="lk-legende-bol wit"></span> nog niet geoefend</span>
           </div>`
        : '';

      html += `
        <div class="lk-taak-veld">
          <label class="lk-taak-label">Welke woorden in de taak? <span class="lk-taak-teller">(${aantalAangevinkt} gekozen)</span></label>
          <div class="lk-taak-snelacties">
            <button class="lk-knop-mini" onclick="lkTaakAllesAan()">Alle aanvinken</button>
            <button class="lk-knop-mini" onclick="lkTaakNietsAan()">Alles uit</button>
          </div>
          ${legende}
          <div class="lk-taak-woorden">
      `;
      items.forEach(item => {
        const aan = _taakModalWoordIds.has(item.id);
        const kleur = _taakModalWoordKleur(item.id);
        const kleurKlas = kleur ? `geschiedenis-${kleur}` : '';
        html += `
          <label class="cat-item-rij ${aan ? 'aan' : ''} ${kleurKlas}">
            <input type="checkbox" ${aan ? 'checked' : ''} onchange="lkTaakToggleWoord('${item.id}')">
            <span class="cat-item-beeld">${Picto.html(item, { grootte: 28 })}</span>
            <span class="cat-item-tekst">${item.tekst}</span>
          </label>
        `;
      });
      html += `</div></div>`;
    }
  }

  // Vaardigheden + oefenvormen + zinscontext
  const luisterenAan = _taakModalVaardigheden.has('luisteren');
  const lezenAan = _taakModalVaardigheden.has('lezen');
  const schrijvenAan = _taakModalVaardigheden.has('schrijven');

  html += `
    <div class="lk-taak-veld">
      <label class="lk-taak-label">Welke vaardigheden moet de leerling oefenen?</label>
      <div class="lk-taak-vaardigheden">
        <label class="lk-taak-vaardigheid ${luisterenAan ? 'aan' : ''}">
          <input type="checkbox" ${luisterenAan ? 'checked' : ''} onchange="lkTaakToggleVaardigheid('luisteren')">
          <span class="lk-vaardigheid-icoon">👂</span>
          <span class="lk-vaardigheid-naam">Luisteren</span>
        </label>
        <label class="lk-taak-vaardigheid uitgeschakeld" title="Komt in volgende update">
          <input type="checkbox" disabled>
          <span class="lk-vaardigheid-icoon">👁️</span>
          <span class="lk-vaardigheid-naam">Lezen <small>(binnenkort)</small></span>
        </label>
        <label class="lk-taak-vaardigheid uitgeschakeld" title="Komt in volgende update">
          <input type="checkbox" disabled>
          <span class="lk-vaardigheid-icoon">✍️</span>
          <span class="lk-vaardigheid-naam">Schrijven <small>(binnenkort)</small></span>
        </label>
      </div>
    </div>
  `;

  // Oefenvormen — alleen tonen als luisteren aan staat
  if (luisterenAan) {
    const klikspelAan = _taakModalOefenvormenLuisteren.has('klikspel');
    const verbindenAan = _taakModalOefenvormenLuisteren.has('verbinden');
    const verslepenAan = _taakModalOefenvormenLuisteren.has('verslepen');
    html += `
      <div class="lk-taak-veld">
        <label class="lk-taak-label">Oefenvormen voor luisteren</label>
        <div class="lk-taak-vaardigheden">
          <label class="lk-taak-vaardigheid ${klikspelAan ? 'aan' : ''}">
            <input type="checkbox" ${klikspelAan ? 'checked' : ''} onchange="lkTaakToggleOefenvorm('luisteren', 'klikspel')">
            <span class="lk-vaardigheid-icoon">🎯</span>
            <span class="lk-vaardigheid-naam">Klikspel</span>
          </label>
          <label class="lk-taak-vaardigheid uitgeschakeld" title="Komt in volgende update">
            <input type="checkbox" disabled>
            <span class="lk-vaardigheid-icoon">🔗</span>
            <span class="lk-vaardigheid-naam">Verbinden <small>(binnenkort)</small></span>
          </label>
          <label class="lk-taak-vaardigheid uitgeschakeld" title="Komt in volgende update">
            <input type="checkbox" disabled>
            <span class="lk-vaardigheid-icoon">🤚</span>
            <span class="lk-vaardigheid-naam">Verslepen <small>(binnenkort)</small></span>
          </label>
        </div>
      </div>
    `;
  }

  // Zinscontext
  html += `
    <div class="lk-taak-veld">
      <label class="lk-taak-zinscontext ${_taakModalZinscontext ? 'aan' : ''}">
        <input type="checkbox" ${_taakModalZinscontext ? 'checked' : ''} onchange="lkTaakToggleZinscontext()">
        <span class="lk-vaardigheid-icoon">💬</span>
        <span class="lk-vaardigheid-naam">Zin laten zien bij elk woord (in leren-fase)</span>
      </label>
      <p class="lk-taak-tip">Aanvinken als je wil dat het kind ook de zin bij elk woord ziet en hoort tijdens de leren-fase.</p>
    </div>
  `;

  html += `
      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini gevaar" onclick="lkTaakWissen()">🗑️ Taak wissen</button>
        <button class="lk-knop-mini" onclick="lkSluitTaakModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkBewaarTaak()">💾 Bewaren</button>
      </div>
    </div>
  `;

  bg.innerHTML = html;
  document.body.appendChild(bg);
}

function lkTaakKiesThema(themaId) {
  _taakModalThemaId = themaId;
  // Bij thema-wissel: huidige selectie behouden NIET, want IDs verschillen per thema
  _taakModalWoordIds = new Set();
  // We hebben de huidige taak niet nodig om opnieuw te tekenen; tweede arg null
  rendererTaakModal(null);
}

function lkTaakToggleWoord(itemId) {
  if (_taakModalWoordIds.has(itemId)) _taakModalWoordIds.delete(itemId);
  else _taakModalWoordIds.add(itemId);
  rendererTaakModal(null);
}

function lkTaakAllesAan() {
  if (!_taakModalThemaId) return;
  const thema = ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId);
  if (!thema) return;
  const verrijkt = lkVerrijkThema(thema);
  _taakModalWoordIds = new Set(verrijkt.items.map(it => it.id));
  rendererTaakModal(null);
}

function lkTaakNietsAan() {
  _taakModalWoordIds = new Set();
  rendererTaakModal(null);
}

function lkTaakToggleVaardigheid(vaardigheid) {
  if (_taakModalVaardigheden.has(vaardigheid)) {
    // Niet de laatste vaardigheid uitzetten — er moet er minstens één zijn
    if (_taakModalVaardigheden.size > 1) {
      _taakModalVaardigheden.delete(vaardigheid);
    }
  } else {
    _taakModalVaardigheden.add(vaardigheid);
  }
  rendererTaakModal(null);
}

function lkTaakToggleOefenvorm(vaardigheid, vorm) {
  let set;
  if (vaardigheid === 'luisteren') set = _taakModalOefenvormenLuisteren;
  else if (vaardigheid === 'schrijven') set = _taakModalOefenvormenSchrijven;
  else return;

  if (set.has(vorm)) {
    // Niet de laatste oefenvorm uitzetten
    if (set.size > 1) set.delete(vorm);
  } else {
    set.add(vorm);
  }
  rendererTaakModal(null);
}

function lkTaakToggleZinscontext() {
  _taakModalZinscontext = !_taakModalZinscontext;
  rendererTaakModal(null);
}

async function lkBewaarTaak() {
  if (!_taakModalKindCode) return;
  if (!_taakModalThemaId || _taakModalWoordIds.size === 0) {
    alert('Kies eerst een thema en minstens één woord voor de taak.');
    return;
  }
  if (_taakModalVaardigheden.size === 0) {
    alert('Vink minstens één vaardigheid aan.');
    return;
  }
  // Check: als luisteren aan staat, moet er minstens één oefenvorm zijn
  if (_taakModalVaardigheden.has('luisteren') && _taakModalOefenvormenLuisteren.size === 0) {
    alert('Kies minstens één oefenvorm voor luisteren.');
    return;
  }
  const knop = document.querySelector('#lk-taak-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  try {
    const taak = {
      themaId: _taakModalThemaId,
      woordIds: [..._taakModalWoordIds],
      vaardigheden: [..._taakModalVaardigheden],
      oefenvormen_luisteren: [..._taakModalOefenvormenLuisteren],
      oefenvormen_schrijven: [..._taakModalOefenvormenSchrijven],
      zinscontext: _taakModalZinscontext,
      huidigeFase: 'leren',
      status: 'bezig',
      foutWoordenLaatsteToets: [],
      aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 },
      gestart: Date.now(),
      rapportperiodeId: lkActievePeriodeId()
    };
    await Voortgang.zetTaakVoorKind(_taakModalKindCode, taak);
    // Lokale lijst bijwerken
    const kind = lkKinderen.find(k => k.code === _taakModalKindCode);
    if (kind) {
      // Als er een vorige taak was, archiveer die in de lokale geschiedenis-cache
      if (kind.taak && kind.taak.themaId && Array.isArray(kind.taak.woordIds) && kind.taak.woordIds.length > 0) {
        const oudArch = {
          themaId: kind.taak.themaId,
          woordIds: [...kind.taak.woordIds],
          vaardigheden: Array.isArray(kind.taak.vaardigheden) ? [...kind.taak.vaardigheden] : ['luisteren'],
          voltooidOp: Date.now(),
          gestart: kind.taak.gestart || null,
          status: kind.taak.status || 'bezig',
          perWoord: JSON.parse(JSON.stringify(kind.taak.perWoord || {})),
          foutWoordenLaatsteToets: Array.isArray(kind.taak.foutWoordenLaatsteToets)
                                       ? [...kind.taak.foutWoordenLaatsteToets] : [],
          rapportperiodeId: kind.taak.rapportperiodeId || null
        };
        if (!Array.isArray(kind.taakgeschiedenis)) kind.taakgeschiedenis = [];
        kind.taakgeschiedenis.push(oudArch);
        if (kind.taakgeschiedenis.length > 50) {
          kind.taakgeschiedenis = kind.taakgeschiedenis.slice(-50);
        }
      }
      kind.taak = taak;
    }
    lkSluitTaakModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Bewaren taak mislukt:', e);
    alert('Kon de taak niet bewaren. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

async function lkTaakWissen() {
  if (!_taakModalKindCode) return;
  if (!confirm('Taak wissen? Het kind ziet dan geen taak meer op zijn startpagina.')) return;
  try {
    await Voortgang.zetTaakVoorKind(_taakModalKindCode, null);
    const kind = lkKinderen.find(k => k.code === _taakModalKindCode);
    if (kind) kind.taak = null;
    lkSluitTaakModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Wissen taak mislukt:', e);
    alert('Kon de taak niet wissen. Probeer opnieuw.');
  }
}

function lkSluitTaakModal() {
  const bg = document.getElementById('lk-taak-modal-bg');
  if (bg) bg.remove();
  _taakModalKindCode = null;
  _taakModalThemaId = null;
  _taakModalWoordIds = new Set();
}

// =================================================================
//  WOORDENBEHEER-TAB — overzicht, bewerken, foto's
// =================================================================

let wbHuidigThemaId = null;

function wbInitTab() {
  // Vul de thema-keuzelijst (eenmalig)
  const sel = document.getElementById('wb-thema-select');
  if (sel.children.length === 0) {
    let opties = '<option value="">-- Kies een thema --</option>';
    ALLE_THEMAS_LK.forEach(t => {
      opties += `<option value="${t.id}">${t.emoji}  ${t.naam}</option>`;
    });
    sel.innerHTML = opties;
  }
  // Als er al een thema gekozen was, herrender
  if (wbHuidigThemaId) {
    sel.value = wbHuidigThemaId;
    wbKiesThema(wbHuidigThemaId);
  }
}

function wbKiesThema(themaId) {
  wbHuidigThemaId = themaId || null;
  const inhoud = document.getElementById('wb-inhoud');
  if (!themaId) {
    inhoud.innerHTML = '<p style="opacity:0.6">Kies een thema om de woordenlijst te bekijken.</p>';
    return;
  }
  wbRender();
}

function wbRender() {
  const inhoud = document.getElementById('wb-inhoud');
  const basis = ALLE_THEMAS_LK.find(t => t.id === wbHuidigThemaId);
  if (!basis) return;

  const lijst = Woordenbeheer.geefVolledigOverzicht(basis);

  // Groeperen per categorie. Items zonder categorie krijgen een eigen "groep".
  const groepen = new Map();
  const cats = basis.categorieen && basis.categorieen.length > 0
    ? [...basis.categorieen, 'overig']
    : ['alle'];
  cats.forEach(c => groepen.set(c, []));

  lijst.forEach(item => {
    const c = item.categorie || (basis.categorieen ? 'overig' : 'alle');
    if (!groepen.has(c)) groepen.set(c, []);
    groepen.get(c).push(item);
  });

  // HTML
  let html = `
    <div class="wb-thema-kop">
      <div class="wb-thema-titel">
        <span style="font-size:32px">${basis.emoji}</span>
        <h3 style="margin:0">${basis.naam}</h3>
        <span class="wb-thema-aantal">${lijst.filter(i => i._bron !== 'verborgen').length} woorden</span>
      </div>
      <p class="wb-thema-uitleg">
        🟢 basis · 🟠 aangepast · 🔵 eigen woord · ⚪ verborgen
      </p>
    </div>
  `;

  groepen.forEach((items, cat) => {
    if (items.length === 0 && cat !== 'overig' && cat !== 'alle') {
      // Lege standaardcategorie — toon toch met "eigen toevoegen"-knop
    }
    const catLabel = (CATEGORIE_LABELS[cat] || { label: cat, emoji: '•' });
    html += `
      <div class="wb-categorie-blok">
        <div class="wb-categorie-kop">
          <span class="wb-categorie-naam">${catLabel.emoji} ${catLabel.label}</span>
          <span class="wb-categorie-aantal">${items.filter(i => i._bron !== 'verborgen').length}</span>
          <button class="lk-knop-mini" style="margin-left:auto" onclick="wbNieuwItem('${cat}')">➕ Nieuw woord</button>
        </div>
        <div class="wb-grid">
    `;
    if (items.length === 0) {
      html += '<p class="wb-leeg">Geen woorden in deze categorie.</p>';
    }
    items.forEach(item => {
      html += wbRenderKaart(item);
    });
    html += `</div></div>`;
  });

  inhoud.innerHTML = html;
}

function wbRenderKaart(item) {
  const bron = item._bron || 'basis';
  const bronKleur = {
    basis:     'wb-bron-basis',
    override:  'wb-bron-override',
    eigen:     'wb-bron-eigen',
    verborgen: 'wb-bron-verborgen'
  }[bron];

  // Voor verborgen items tonen we het origineel doorstreept met een "terug zichtbaar"-knop
  if (bron === 'verborgen') {
    const orig = item._origineel || item;
    return `
      <div class="wb-kaart ${bronKleur}">
        <div class="wb-kaart-beeld">${Picto.html(orig, { grootte: 64 })}</div>
        <div class="wb-kaart-tekst" style="text-decoration: line-through; opacity: 0.5">${orig.tekst}</div>
        <div class="wb-kaart-acties">
          <button class="lk-knop-mini" onclick="wbToonItem('${item.id}')" title="Terug zichtbaar maken">👁️ Tonen</button>
        </div>
      </div>
    `;
  }

  const kanVerwijderen = (bron === 'eigen');
  const kanVerbergen = (bron === 'basis' || bron === 'override');

  return `
    <div class="wb-kaart ${bronKleur}">
      <div class="wb-kaart-beeld">${Picto.html(item, { grootte: 64 })}</div>
      <div class="wb-kaart-tekst">${item.tekst || '<em>(zonder tekst)</em>'}</div>
      ${item.zin ? `<div class="wb-kaart-zin">${item.zin}</div>` : ''}
      <div class="wb-kaart-bron">${({basis:'basis',override:'aangepast',eigen:'eigen woord'})[bron]}</div>
      <div class="wb-kaart-acties">
        <button class="lk-knop-mini" onclick="wbBewerk('${item.id}')" title="Bewerken">✏️</button>
        ${kanVerbergen ? `<button class="lk-knop-mini" onclick="wbVerberg('${item.id}')" title="Verbergen voor de klas">🙈</button>` : ''}
        ${kanVerwijderen ? `<button class="lk-knop-mini gevaar" onclick="wbVerwijderEigen('${item.id}')" title="Echt verwijderen">🗑️</button>` : ''}
        ${bron === 'override' ? `<button class="lk-knop-mini" onclick="wbHerstel('${item.id}')" title="Terug naar basisversie">↺</button>` : ''}
      </div>
    </div>
  `;
}

async function wbVerberg(itemId) {
  if (!confirm('Dit woord wordt verborgen voor je leerlingen. Voortgang blijft bewaard. Doorgaan?')) return;
  try {
    await Woordenbeheer.verbergItem(wbHuidigThemaId, itemId);
    wbRender();
  } catch (e) { alert('Verbergen mislukt: ' + e.message); }
}

async function wbToonItem(itemId) {
  try {
    await Woordenbeheer.toonItem(wbHuidigThemaId, itemId);
    wbRender();
  } catch (e) { alert('Tonen mislukt: ' + e.message); }
}

async function wbHerstel(itemId) {
  if (!confirm('Alle aanpassingen aan dit woord wissen en terug naar de basisversie?')) return;
  try {
    await Woordenbeheer.verwijderOverride(wbHuidigThemaId, itemId);
    wbRender();
  } catch (e) { alert('Herstellen mislukt: ' + e.message); }
}

async function wbVerwijderEigen(itemId) {
  if (!confirm('Dit eigen woord echt verwijderen? Voortgang van leerlingen op dit woord gaat verloren.')) return;
  try {
    await Woordenbeheer.verwijderEigenItem(wbHuidigThemaId, itemId);
    wbRender();
  } catch (e) { alert('Verwijderen mislukt: ' + e.message); }
}

// ----------------- BEWERKEN / TOEVOEGEN — modal -----------------

let _wbModalState = null; // { themaId, item, bron, isNieuw, nieuweFotoBlob? }

function wbBewerk(itemId) {
  const basis = ALLE_THEMAS_LK.find(t => t.id === wbHuidigThemaId);
  const lijst = Woordenbeheer.geefVolledigOverzicht(basis);
  const item = lijst.find(i => i.id === itemId);
  if (!item) return;
  _wbModalState = {
    themaId: wbHuidigThemaId,
    item: { ...item },
    bron: item._bron,
    isNieuw: false
  };
  wbRenderModal();
}

function wbNieuwItem(categorieDefault) {
  const basis = ALLE_THEMAS_LK.find(t => t.id === wbHuidigThemaId);
  _wbModalState = {
    themaId: wbHuidigThemaId,
    item: {
      tekst: '',
      kort: '',
      zin: '',
      categorie: (categorieDefault && categorieDefault !== 'overig' && categorieDefault !== 'alle') ? categorieDefault : (basis.categorieen ? basis.categorieen[0] : ''),
      niveau: (basis.niveaus && basis.niveaus[0]) || 'basis',
      beeld: '🆕'
    },
    bron: 'eigen',
    isNieuw: true
  };
  wbRenderModal();
}

function wbRenderModal() {
  const oud = document.getElementById('wb-modal-bg');
  if (oud) oud.remove();

  const basis = ALLE_THEMAS_LK.find(t => t.id === _wbModalState.themaId);
  const it = _wbModalState.item;
  const bron = _wbModalState.bron;

  const bg = document.createElement('div');
  bg.id = 'wb-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) wbSluitModal(); };

  // Categorie-opties
  let catOpties = '';
  if (basis.categorieen && basis.categorieen.length > 0) {
    basis.categorieen.forEach(c => {
      const lab = CATEGORIE_LABELS[c] || { emoji: '•', label: c };
      catOpties += `<option value="${c}" ${it.categorie === c ? 'selected' : ''}>${lab.emoji} ${lab.label}</option>`;
    });
  } else {
    catOpties = `<option value="">(geen categorieën)</option>`;
  }

  // Niveau-opties
  let nivOpties = '';
  const niveaus = basis.niveaus || ['basis', 'uitbreiding', 'verdieping'];
  niveaus.forEach(n => {
    nivOpties += `<option value="${n}" ${it.niveau === n ? 'selected' : ''}>${n}</option>`;
  });

  // Huidige afbeelding
  const huidigBeeldHtml = Picto.html(it, { grootte: 100 });

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()" style="max-width:560px">
      <h2>${_wbModalState.isNieuw ? '➕ Nieuw woord toevoegen' : '✏️ Woord bewerken'}</h2>
      <p class="modal-uitleg">${basis.emoji} ${basis.naam} ${bron !== 'eigen' && !_wbModalState.isNieuw ? '· bewerken zet een aanpassing op het basiswoord (kan altijd hersteld worden)' : ''}</p>

      <div class="wb-modal-row">
        <div class="wb-modal-foto-wrap">
          <div id="wb-modal-foto-preview" class="wb-modal-foto-preview">${huidigBeeldHtml}</div>
          <input type="file" id="wb-foto-input" accept="image/*" capture="environment" style="display:none" onchange="wbFotoGekozen(this.files[0])">
          <button class="lk-knop-mini" onclick="document.getElementById('wb-foto-input').click()">📷 Foto kiezen</button>
          ${it.foto ? '<button class="lk-knop-mini gevaar" onclick="wbFotoWissen()">✗ Foto wissen</button>' : ''}
          <p class="wb-modal-foto-hint">Of laat leeg en de emoji wordt getoond.</p>
        </div>
        <div class="wb-modal-velden">
          <label class="wb-veld">
            <span>Woord (zoals het kind het ziet)</span>
            <input type="text" id="wb-tekst" value="${(it.tekst || '').replace(/"/g,'&quot;')}" placeholder="bv. de juf">
          </label>
          <label class="wb-veld">
            <span>Kort (zonder lidwoord)</span>
            <input type="text" id="wb-kort" value="${(it.kort || '').replace(/"/g,'&quot;')}" placeholder="bv. juf">
          </label>
          <label class="wb-veld">
            <span>Voorbeeldzin</span>
            <input type="text" id="wb-zin" value="${(it.zin || '').replace(/"/g,'&quot;')}" placeholder="bv. De juf helpt mij.">
          </label>
          <label class="wb-veld">
            <span>Emoji (fallback als foto ontbreekt)</span>
            <input type="text" id="wb-beeld" value="${(it.beeld || '').replace(/"/g,'&quot;')}" placeholder="bv. 👩‍🏫" maxlength="4">
          </label>
          <div class="wb-veld-rij">
            <label class="wb-veld">
              <span>Categorie</span>
              <select id="wb-cat">${catOpties}</select>
            </label>
            <label class="wb-veld">
              <span>Niveau</span>
              <select id="wb-niveau">${nivOpties}</select>
            </label>
          </div>
        </div>
      </div>

      <div id="wb-modal-status" class="wb-modal-status"></div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="wbSluitModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="wbBewaarModal()">💾 Bewaren</button>
      </div>
    </div>
  `;

  document.body.appendChild(bg);
  // Foto-input ook reageren op keuze (capture/galerij keuze toont in mobile)
  document.getElementById('wb-tekst').focus();
}

function wbFotoGekozen(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Dit is geen afbeelding. Kies een foto (jpg, png, ...).');
    return;
  }
  // Toon directe preview (van de orig-file, niet gecomprimeerd — alleen voorvertoning)
  _wbModalState.nieuweFoto = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('wb-modal-foto-preview').innerHTML =
      `<img src="${e.target.result}" class="picto-img" style="height:100px;width:auto">`;
  };
  reader.readAsDataURL(file);
  setStatus('Nieuwe foto klaar voor upload bij bewaren.', 'info');
}

function wbFotoWissen() {
  _wbModalState.item.foto = null;
  _wbModalState.fotoVerwijderen = true;
  _wbModalState.nieuweFoto = null;
  document.getElementById('wb-modal-foto-preview').innerHTML =
    Picto.html({ ..._wbModalState.item, foto: null }, { grootte: 100 });
  setStatus('Foto wordt verwijderd bij bewaren.', 'info');
}

function setStatus(tekst, type) {
  const el = document.getElementById('wb-modal-status');
  if (!el) return;
  el.textContent = tekst || '';
  el.className = 'wb-modal-status ' + (type || '');
}

async function wbBewaarModal() {
  if (!_wbModalState) return;
  const it = _wbModalState.item;

  // Velden uitlezen
  const tekst = document.getElementById('wb-tekst').value.trim();
  const kort = document.getElementById('wb-kort').value.trim();
  const zin = document.getElementById('wb-zin').value.trim();
  const beeld = document.getElementById('wb-beeld').value.trim();
  const cat = document.getElementById('wb-cat').value;
  const niveau = document.getElementById('wb-niveau').value;

  if (!tekst) {
    setStatus('Vul minstens een woord in.', 'fout');
    return;
  }

  const knop = document.querySelector('#wb-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    // Stap 1: foto uploaden indien er een nieuwe is
    let nieuweFotoUrl = null;
    if (_wbModalState.nieuweFoto) {
      setStatus('Foto wordt geupload...', 'info');
      // Voor eigen items: gebruik bestaand id of genereer er één
      const itemIdVoorPad = it.id || 'tijdelijk-' + Date.now();
      const upload = await AfbeeldingUpload.uploadFoto(_wbModalState.nieuweFoto, _wbModalState.themaId, itemIdVoorPad);
      nieuweFotoUrl = upload.url;
    }

    // Stap 2: oude foto verwijderen indien aangevraagd OF vervangen
    const oudeFotoUrl = it.foto;
    if ((nieuweFotoUrl || _wbModalState.fotoVerwijderen) && oudeFotoUrl && oudeFotoUrl.startsWith('http')) {
      // Niet awaiten — zelfs bij faal mag bewaring doorgaan
      AfbeeldingUpload.verwijderFoto(oudeFotoUrl).catch(() => {});
    }

    // Stap 3: nieuwe data samenstellen
    const nieuweVelden = {
      tekst, kort, zin, beeld, categorie: cat, niveau
    };
    if (nieuweFotoUrl) {
      nieuweVelden.foto = nieuweFotoUrl;
    } else if (_wbModalState.fotoVerwijderen) {
      nieuweVelden.foto = null;
    } else if (it.foto) {
      // Foto blijft zoals ze was
      nieuweVelden.foto = it.foto;
    }

    // Stap 4: bewaren — afhankelijk van bron
    if (_wbModalState.isNieuw) {
      await Woordenbeheer.voegEigenItemToe(_wbModalState.themaId, nieuweVelden);
    } else if (_wbModalState.bron === 'eigen') {
      await Woordenbeheer.wijzigEigenItem(_wbModalState.themaId, it.id, nieuweVelden);
    } else {
      // basis of override → schrijf override (alleen velden die afwijken van basis bewaren)
      // Voor de eenvoud: bewaar alle velden die ingevuld zijn (override leest gewoon over basis heen)
      await Woordenbeheer.zetOverride(_wbModalState.themaId, it.id, nieuweVelden);
    }

    wbSluitModal();
    wbRender();
  } catch (e) {
    console.error('Bewaren mislukt:', e);
    setStatus('❌ ' + (e.message || 'Bewaren mislukt'), 'fout');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

function wbSluitModal() {
  const bg = document.getElementById('wb-modal-bg');
  if (bg) bg.remove();
  _wbModalState = null;
}

// =================================================================
//  WERKBLADEN
// =================================================================

// Niveau bepaalt welke OEFENVORMEN aan staan, niet welke woorden
const WB_NIVEAU_BUNDELS = {
  basis: {
    naam: 'Basis',
    hint: 'Eenvoudige oefeningen om woorden te herkennen.',
    oefeningen: ['koppel', 'omcirkel', 'kleurkoppel', 'knip', 'kaartjes']
  },
  uitbreiding: {
    naam: 'Uitbreiding',
    hint: 'Schrijven met hulp: voorbeeld of woordkeuze.',
    oefeningen: ['overschrijf', 'kiesschrijf', 'letter']
  },
  verdieping: {
    naam: 'Verdieping',
    hint: 'Zelfstandig produceren zonder steun.',
    oefeningen: ['zelfschrijven', 'woordzoeker']
  },
  vrij: {
    naam: 'Zelf kiezen',
    hint: 'Kies hieronder zelf de gewenste oefeningen.',
    oefeningen: []
  }
};

const WB_OEFENING_KEYS = ['koppel','overschrijf','letter','omcirkel','zelfschrijven','kiesschrijf','knip','kleurkoppel','woordzoeker','kaartjes'];

const WB_OEFENING_LABELS = {
  koppel: '👁️ → 🔗 Koppel beeld en woord',
  overschrijf: '👁️ → ✏️ Schrijf na',
  letter: '👁️ → 🔤 → ✏️ Maak het woord',
  omcirkel: '👁️ → ✗ Kruis het juiste woord aan',
  zelfschrijven: '👁️ → ✏️ Schrijf zelf het woord',
  kiesschrijf: '👁️ → ✗ → ✏️ Kies en schrijf',
  knip: '✂️ → 📋 Knip en plak',
  kleurkoppel: '👁️ → 🎨 Kleur dezelfde paren',
  woordzoeker: '👁️ → 🔍 Woordzoeker',
  kaartjes: '🃏 Woordkaartjes'
};

// Labels voor categorieën — gebruikt in chips
const CATEGORIE_LABELS = {
  voorwerpen:  { label: 'voorwerpen',  emoji: '📦' },
  werkwoorden: { label: 'werkwoorden', emoji: '🏃' },
  personen:    { label: 'personen',    emoji: '👤' },
  plaatsen:    { label: 'plaatsen',    emoji: '📍' },
  situaties:   { label: 'situaties',   emoji: '🕒' }
};

let werkbladPerThema = new Map();
let werkbladThemaIds = [];
let werkbladTabAlGetoond = false;

function nieuwThemaConfig(thema) {
  // Default: alle categorieën die in dit thema bestaan zijn aan
  const cats = (thema && thema.categorieen) ? new Set(thema.categorieen) : new Set();
  return {
    niveau: 'basis',
    oefeningen: new Set(WB_NIVEAU_BUNDELS.basis.oefeningen),
    categorieen: cats
  };
}

function initWerkbladTab() {
  if (werkbladTabAlGetoond) return; // niet opnieuw renderen als gebruiker terugkomt
  werkbladTabAlGetoond = true;
  rendererWerkbladThemas();
}

function kiesThemaNiveau(themaId, niveau) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  cfg.niveau = niveau;
  if (niveau !== 'vrij') {
    cfg.oefeningen = new Set(WB_NIVEAU_BUNDELS[niveau].oefeningen);
  }
  rendererThemaPaneel(themaId);
}

function toggleThemaOefening(themaId, oefKey) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  if (cfg.oefeningen.has(oefKey)) cfg.oefeningen.delete(oefKey);
  else cfg.oefeningen.add(oefKey);
  cfg.niveau = 'vrij';
  rendererThemaPaneel(themaId);
}

function toggleThemaCategorie(themaId, cat) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  if (cfg.categorieen.has(cat)) cfg.categorieen.delete(cat);
  else cfg.categorieen.add(cat);
  rendererThemaPaneel(themaId);
}

function rendererWerkbladThemas() {
  const lijst = document.getElementById('werkblad-themas-lijst');
  if (!lijst) return;
  lijst.innerHTML = '';

  ALLE_THEMAS_LK.forEach(thema => {
    const id = 'wt-' + thema.id;
    const aan = werkbladThemaIds.includes(thema.id);
    const chip = document.createElement('label');
    chip.className = 'thema-chip' + (aan ? ' aan' : '');
    chip.innerHTML = `
      <input type="checkbox" id="${id}" ${aan ? 'checked' : ''}>
      <span class="chip-emoji">${thema.emoji}</span>
      <span class="chip-naam">${thema.naam}</span>
    `;
    chip.querySelector('input').onchange = (e) => {
      if (e.target.checked) {
        if (!werkbladThemaIds.includes(thema.id)) {
          werkbladThemaIds.push(thema.id);
          werkbladPerThema.set(thema.id, nieuwThemaConfig(thema));
        }
        chip.classList.add('aan');
      } else {
        werkbladThemaIds = werkbladThemaIds.filter(x => x !== thema.id);
        werkbladPerThema.delete(thema.id);
        chip.classList.remove('aan');
      }
      rendererThemaPanelen();
    };
    lijst.appendChild(chip);
  });

  rendererThemaPanelen();
}

function rendererThemaPanelen() {
  const container = document.getElementById('werkblad-thema-panelen');
  if (!container) return;
  container.innerHTML = '';

  if (werkbladThemaIds.length === 0) {
    container.innerHTML = '<p class="sectie-hint">Kies eerst minstens één thema hierboven.</p>';
    return;
  }

  werkbladThemaIds.forEach(themaId => {
    const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
    if (!thema) return;
    const paneel = document.createElement('div');
    paneel.className = 'thema-paneel';
    paneel.id = 'paneel-' + themaId;
    container.appendChild(paneel);
    rendererThemaPaneel(themaId);
  });
}

function rendererThemaPaneel(themaId) {
  const paneel = document.getElementById('paneel-' + themaId);
  if (!paneel) return;
  const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
  const cfg = werkbladPerThema.get(themaId);
  if (!thema || !cfg) return;

  // Bepaal of dit thema "alleen zinnen" bevat — dan zijn letter-puzzel en woordzoeker uitgeschakeld
  const isZinnenThema = thema.type === 'zinnen';

  // Oefeningen die niet werken voor zinnen-thema's
  const nietVoorZinnen = ['letter', 'woordzoeker'];

  let html = `
    <div class="thema-paneel-kop">
      <span class="paneel-emoji">${thema.emoji}</span>
      <span class="paneel-naam">${thema.naam}</span>
      ${isZinnenThema ? '<span class="paneel-badge">zinnen-thema</span>' : ''}
    </div>
    <div class="paneel-niveau-rij">
  `;
  ['basis', 'uitbreiding', 'verdieping', 'vrij'].forEach(niveau => {
    const isActief = cfg.niveau === niveau;
    const labels = { basis: '🌱 Basis', uitbreiding: '🌿 Uitbreiding', verdieping: '🌳 Verdieping', vrij: '⚙️ Zelf' };
    html += `<button class="mini-niveau-knop ${isActief ? 'actief' : ''}" onclick="kiesThemaNiveau('${themaId}', '${niveau}')">${labels[niveau]}</button>`;
  });
  html += `</div>`;

  // ===== Categorieën-chips (alleen tonen als thema categorieën heeft) =====
  if (thema.categorieen && thema.categorieen.length > 0) {
    html += `
      <div class="categorieen-paneel">
        <div class="categorieen-paneel-kop">🏷️ Categorieën in dit werkblad</div>
        <div class="categorie-chips">
    `;
    thema.categorieen.forEach(cat => {
      const aan = cfg.categorieen.has(cat);
      const lab = CATEGORIE_LABELS[cat] || { label: cat, emoji: '•' };
      html += `
        <label class="categorie-chip ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="toggleThemaCategorie('${themaId}', '${cat}')">
          <span>${lab.emoji} ${lab.label}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  }

  let tonen = cfg.niveau === 'vrij' ? WB_OEFENING_KEYS : WB_NIVEAU_BUNDELS[cfg.niveau].oefeningen;
  // Filter ongeschikte oefeningen voor zinnen-thema's
  if (isZinnenThema) {
    tonen = tonen.filter(k => !nietVoorZinnen.includes(k));
    // Zorg ook dat ze niet in de actieve set zitten (anders crashen ze in de PDF)
    nietVoorZinnen.forEach(k => cfg.oefeningen.delete(k));
  }

  html += `<div class="paneel-oefeningen">`;
  if (tonen.length === 0) {
    html += '<p class="sectie-hint">Geen oefeningen op dit niveau die werken voor een zinnen-thema. Kies een ander niveau.</p>';
  } else {
    tonen.forEach(oefKey => {
      const aan = cfg.oefeningen.has(oefKey);
      html += `
        <label class="mini-check ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="toggleThemaOefening('${themaId}', '${oefKey}')">
          <span>${WB_OEFENING_LABELS[oefKey]}</span>
        </label>
      `;
    });
  }
  html += `</div>`;

  paneel.innerHTML = html;
}

async function genereerWerkblad() {
  if (werkbladThemaIds.length === 0) {
    alert('Kies minstens één thema.');
    return;
  }

  // Belangrijk: pas Woordenbeheer toe vóór we naar de PDF-engine gaan,
  // anders zou het werkblad alleen het basispakket gebruiken zonder
  // overrides of eigen woorden.
  const themaConfigs = werkbladThemaIds.map(id => {
    const basis = ALLE_THEMAS_LK.find(t => t.id === id);
    const verrijkt = lkVerrijkThema(basis);
    const cfg = werkbladPerThema.get(id);
    return {
      thema: verrijkt,
      oefeningen: Array.from(cfg.oefeningen),
      niveau: cfg.niveau,
      categorieen: Array.from(cfg.categorieen)
    };
  });

  const totaalOef = themaConfigs.reduce((acc, tc) => acc + tc.oefeningen.length, 0);
  if (totaalOef === 0) {
    alert('Vink minstens één oefening aan in een van de thema-panelen.');
    return;
  }

  // Controleer per thema dat er nog items overblijven na categorie-filter
  const leegThema = themaConfigs.find(tc => {
    if (!tc.thema.categorieen || tc.thema.categorieen.length === 0) return false;
    if (tc.categorieen.length === 0) return true;
    const overig = tc.thema.items.filter(it => !it.categorie || tc.categorieen.includes(it.categorie));
    return overig.length === 0;
  });
  if (leegThema) {
    alert(`In "${leegThema.thema.naam}" zijn er geen woorden geselecteerd. Vink minstens één categorie aan.`);
    return;
  }

  try {
    await PDFEngine.maakWerkblad(themaConfigs, { verdeling: 'per-thema' });
  } catch (e) {
    console.error('Werkblad genereren mislukt:', e);
    alert('Het werkblad kon niet gemaakt worden. Probeer opnieuw.');
  }
}

async function genereerOplossingssleutel() {
  if (werkbladThemaIds.length === 0) {
    alert('Kies minstens één thema voor de oplossingssleutel.');
    return;
  }
  const themaConfigs = werkbladThemaIds.map(id => {
    const basis = ALLE_THEMAS_LK.find(t => t.id === id);
    const verrijkt = lkVerrijkThema(basis);
    const cfg = werkbladPerThema.get(id);
    return {
      thema: verrijkt,
      oefeningen: Array.from(cfg.oefeningen),
      niveau: cfg.niveau,
      categorieen: Array.from(cfg.categorieen)
    };
  });
  const totaalOef = themaConfigs.reduce((acc, tc) => acc + tc.oefeningen.length, 0);
  if (totaalOef === 0) {
    alert('Vink minstens één oefening aan in een van de thema-panelen.');
    return;
  }
  try {
    await PDFEngine.maakOplossingssleutel(themaConfigs, { verdeling: 'per-thema' });
  } catch (e) {
    console.error('Oplossingssleutel mislukt:', e);
    alert('De oplossingssleutel kon niet gemaakt worden. Probeer opnieuw.');
  }
}

// =================================================================
//  RAPPORT-MODAL — kies type, notitie, genereer PDF
// =================================================================

let _rapModalCode = null;
let _rapModalNaam = '';
let _rapModalType = 'kort'; // 'kort' | 'uitgebreid'
let _rapModalNotitie = '';
let _rapModalGoed = '';      // Wat ging goed
let _rapModalGroei = '';     // Groeikansen
let _rapModalTips = '';      // Tips voor thuis

// Vaste oefen-tips per vaardigheid — bouwstenen voor "Tips voor thuis"
const _RAP_TIPS = {
  luisteren: [
    'Speel "Toon mij..." samen: u zegt een woord, het kind wijst aan op de prent of in huis.',
    'Lees voor uit eenvoudige prentenboeken — laat het kind herhalen wat het hoort.',
    'Speel een memorie- of luisterspel met de woorden van het thema.',
    'Zet Nederlandstalige liedjes op (bv. K3, Bumba) en herhaal samen wat u hoort.'
  ],
  lezen: [
    'Hang briefjes met woorden bij voorwerpen in huis (deur, raam, stoel...).',
    'Lees samen pictogrammen en korte zinnen — wijs aan en zeg het samen.',
    'Lees korte teksten samen in tweetalige boekjes als die er zijn.'
  ],
  schrijven: [
    'Laat het kind zijn naam en korte woorden overschrijven met dikke stift of krijt.',
    'Schrijf samen woordlijstjes — laat het kind elke letter zelf vormen.',
    'Plak letters of woorden uit een tijdschrift en laat het kind ze hardop benoemen.'
  ],
  spreken: [
    'Stel u-vragen: "Wat is dit?" "Wie is dat?" — laat het kind antwoorden in volledige zin.',
    'Speel rollenspel: in de winkel, dokter, klas — kind oefent zinnetjes in context.',
    'Beschrijf samen foto\'s uit een fotoboek of tijdschrift.',
    'Laat het kind iets vertellen over zijn dag in eenvoudige zinnen.'
  ]
};

async function lkOpenRapport(code, naam) {
  _rapModalCode = code;
  _rapModalNaam = naam || code;
  _rapModalType = 'kort';
  // Voorinvullen met opgeslagen rapport-notitie van het kind (= hoofdcommentaar)
  try {
    const kind = lkKinderen.find(k => k.code === code);
    _rapModalNotitie = (kind && kind.rapportNotities) || '';
    // Drie feedback-velden starten leeg (worden niet bewaard tussen rapporten)
    _rapModalGoed = '';
    _rapModalGroei = '';
    _rapModalTips = '';
  } catch (e) {
    _rapModalNotitie = '';
    _rapModalGoed = '';
    _rapModalGroei = '';
    _rapModalTips = '';
  }

  _rendererRapportModal();
}

// Genereer slimme suggestie voor "Wat ging goed" op basis van data
function _rapSuggestieGoed() {
  const kind = lkKinderen.find(k => k.code === _rapModalCode);
  if (!kind) return '';
  const stukken = [];

  // Voltooide taak?
  if (kind.taak && kind.taak.status === 'voltooid') {
    const thema = ALLE_THEMAS_LK.find(t => t.id === kind.taak.themaId);
    const themaNaam = thema ? thema.naam.toLowerCase() : 'het thema';
    stukken.push(`${_rapModalNaam} heeft de taak rond ${themaNaam} succesvol afgerond.`);
  }

  // Spreektoetsen — algemene indruk
  const sprT = Array.isArray(kind.spreektoetsen) ? kind.spreektoetsen : [];
  if (sprT.length > 0) {
    let v = 0, t = 0;
    sprT.forEach(st => {
      Object.values(st.perWoord || {}).forEach(r => {
        t++;
        if (r === 'vlot') v++;
      });
    });
    if (t > 0) {
      const pct = Math.round(v / t * 100);
      if (pct >= 70) {
        stukken.push(`Bij het mondeling spreken benoemt het kind woorden vlot (${pct}% van de getoetste woorden zonder aarzeling).`);
      } else if (pct >= 40) {
        stukken.push(`${_rapModalNaam} durft te spreken en doet vooruitgang in het mondeling benoemen van woorden.`);
      }
    }
  }

  // Eerdere taken
  const gesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
  const voltooid = gesch.filter(t => t.status === 'voltooid').length;
  if (voltooid > 0) {
    stukken.push(voltooid === 1
      ? `Het kind voltooide al een eerdere taak.`
      : `Het kind voltooide al ${voltooid} eerdere taken.`);
  }

  if (stukken.length === 0) {
    stukken.push(`${_rapModalNaam} doet zijn/haar best en oefent regelmatig.`);
  }

  return stukken.join(' ');
}

function _rapSuggestieGroei() {
  const kind = lkKinderen.find(k => k.code === _rapModalCode);
  if (!kind) return '';
  const stukken = [];

  // Foute woorden in laatste toets
  if (kind.taak && kind.taak.foutWoordenLaatsteToets && kind.taak.foutWoordenLaatsteToets.length > 0) {
    const thema = ALLE_THEMAS_LK.find(t => t.id === kind.taak.themaId);
    if (thema) {
      const verrijkt = lkVerrijkThema(thema);
      const namen = kind.taak.foutWoordenLaatsteToets.map(id => {
        const it = (verrijkt.items || []).find(x => x.id === id);
        return it ? it.tekst : id;
      });
      stukken.push(`We blijven oefenen op de woorden waar het nog moeilijk gaat: ${namen.join(', ')}.`);
    }
  }

  // Spreektoetsen — woorden die "niet" of "aarzelt" waren
  const sprT = Array.isArray(kind.spreektoetsen) ? kind.spreektoetsen : [];
  if (sprT.length > 0) {
    const laatste = [...sprT].sort((a, b) => (b.datum || 0) - (a.datum || 0))[0];
    if (laatste && laatste.themaId) {
      const moeilijk = Object.keys(laatste.perWoord || {}).filter(id => laatste.perWoord[id] === 'niet');
      if (moeilijk.length > 0) {
        const thema = ALLE_THEMAS_LK.find(t => t.id === laatste.themaId);
        if (thema) {
          const verrijkt = lkVerrijkThema(thema);
          const namen = moeilijk.slice(0, 4).map(id => {
            const it = (verrijkt.items || []).find(x => x.id === id);
            return it ? it.tekst : id;
          });
          stukken.push(`Bij het spreken zijn deze woorden nog onbekend: ${namen.join(', ')}.`);
        }
      }
    }
  }

  if (stukken.length === 0) {
    stukken.push(`We blijven werken aan woordenschat en luistervaardigheid.`);
  }

  return stukken.join(' ');
}

function _rapSuggestieTips() {
  // Twee tips uit luisteren + één uit spreken
  const tips = [];
  const luist = _RAP_TIPS.luisteren;
  const spreek = _RAP_TIPS.spreken;
  // Pseudo-random op basis van kindcode (zelfde tip elke keer voor dezelfde kind)
  const seed = (_rapModalCode || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  tips.push(luist[seed % luist.length]);
  tips.push(luist[(seed + 1) % luist.length]);
  tips.push(spreek[seed % spreek.length]);
  return tips.map(t => '• ' + t).join('\n');
}

function _rendererRapportModal() {
  const oud = document.getElementById('lk-rap-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-rap-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) lkSluitRapportModal(); };

  const html = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>📄 Rapport voor ${_rapModalNaam}</h2>
      <p class="modal-uitleg">
        Genereer een PDF-rapport. Schoolinfo en logo komen uit tabblad <strong>Mijn school</strong>.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Type rapport</label>
        <div class="lk-taak-vaardigheden">
          <label class="lk-taak-vaardigheid ${_rapModalType === 'kort' ? 'aan' : ''}">
            <input type="radio" name="rap-type" ${_rapModalType === 'kort' ? 'checked' : ''} onclick="lkRapKiesType('kort')">
            <span class="lk-vaardigheid-icoon">📄</span>
            <span class="lk-vaardigheid-naam">Kort <small>(1 p.)</small></span>
          </label>
          <label class="lk-taak-vaardigheid ${_rapModalType === 'uitgebreid' ? 'aan' : ''}">
            <input type="radio" name="rap-type" ${_rapModalType === 'uitgebreid' ? 'checked' : ''} onclick="lkRapKiesType('uitgebreid')">
            <span class="lk-vaardigheid-icoon">📚</span>
            <span class="lk-vaardigheid-naam">Uitgebreid <small>(2-3 p.)</small></span>
          </label>
        </div>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">
          ✓ Wat ging goed
          <button class="lk-rap-suggestie-knop" onclick="lkRapVulSuggestie('goed')" title="Vul automatisch een suggestie in op basis van de data">💡 Suggestie</button>
        </label>
        <textarea class="lk-spr-notitie" rows="3" placeholder="Bv. ${_rapModalNaam} kent zijn klasspullen al goed en durft te spreken." oninput="lkRapVeld('goed', this.value)">${(_rapModalGoed || '').replace(/</g, '&lt;')}</textarea>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">
          ↗ Groeikansen
          <button class="lk-rap-suggestie-knop" onclick="lkRapVulSuggestie('groei')" title="Vul automatisch een suggestie in op basis van de data">💡 Suggestie</button>
        </label>
        <textarea class="lk-spr-notitie" rows="3" placeholder="Bv. We oefenen nog op de woorden waar het moeilijker ging." oninput="lkRapVeld('groei', this.value)">${(_rapModalGroei || '').replace(/</g, '&lt;')}</textarea>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">
          🏠 Tips voor thuis
          <button class="lk-rap-suggestie-knop" onclick="lkRapVulSuggestie('tips')" title="Vul automatisch een paar oefen-tips in">💡 Suggestie</button>
        </label>
        <textarea class="lk-spr-notitie" rows="4" placeholder="Bv. • Speel samen 'Toon mij...' met voorwerpen in huis. • Lees voor uit een eenvoudig prentenboek." oninput="lkRapVeld('tips', this.value)">${(_rapModalTips || '').replace(/</g, '&lt;')}</textarea>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Bericht voor de ouders (optioneel)</label>
        <textarea class="lk-spr-notitie" rows="3" placeholder="Bv. Mohammed werkt hard. Goed zo!" oninput="lkRapVeld('notitie', this.value)">${(_rapModalNotitie || '').replace(/</g, '&lt;')}</textarea>
        <p class="lk-school-tip">Wordt automatisch bewaard zodat je het later kan hergebruiken.</p>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkSluitRapportModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkRapGenereer()">📄 PDF genereren</button>
      </div>
    </div>
  `;

  bg.innerHTML = html;
  document.body.appendChild(bg);
}

function lkRapKiesType(type) {
  _rapModalType = type;
  _rendererRapportModal();
}

// Eén handler voor alle textarea-velden (oninput, niet onchange — bewaar bij elke toets)
function lkRapVeld(naam, tekst) {
  if (naam === 'goed') _rapModalGoed = tekst;
  else if (naam === 'groei') _rapModalGroei = tekst;
  else if (naam === 'tips') _rapModalTips = tekst;
  else if (naam === 'notitie') _rapModalNotitie = tekst;
}

// Vul een veld met een automatisch gegenereerde suggestie (overschrijft bestaande tekst)
function lkRapVulSuggestie(welk) {
  if (welk === 'goed') {
    _rapModalGoed = _rapSuggestieGoed();
  } else if (welk === 'groei') {
    _rapModalGroei = _rapSuggestieGroei();
  } else if (welk === 'tips') {
    _rapModalTips = _rapSuggestieTips();
  }
  _rendererRapportModal();
}

// Achterwaartse compat — oude functienaam
function lkRapNotitie(tekst) {
  _rapModalNotitie = tekst;
}

function lkSluitRapportModal() {
  const bg = document.getElementById('lk-rap-modal-bg');
  if (bg) bg.remove();
  _rapModalCode = null;
}

async function lkRapGenereer() {
  if (!_rapModalCode) return;
  const kind = lkKinderen.find(k => k.code === _rapModalCode);
  if (!kind) return;

  const knop = document.querySelector('#lk-rap-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    // Notitie bewaren voor later hergebruik
    if (_rapModalNotitie && _rapModalNotitie.trim()) {
      try {
        await Voortgang.zetRapportNotitiesVoorKind(_rapModalCode, _rapModalNotitie.trim());
        kind.rapportNotities = _rapModalNotitie.trim();
      } catch (e) {
        console.warn('Notitie bewaren mislukt (rapport gaat toch door):', e);
      }
    }

    await RapportEngine.genereer(kind, {
      type: _rapModalType,
      notitie: _rapModalNotitie,
      watGingGoed: _rapModalGoed,
      groeikansen: _rapModalGroei,
      tipsThuis: _rapModalTips
    });
    lkSluitRapportModal();
  } catch (e) {
    console.error('Rapport genereren mislukt:', e);
    alert('Rapport genereren mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '📄 PDF genereren'; }
  }
}


// =================================================================
//  SPREEKTOETS — afnametool met directe beoordeling
// =================================================================
//
// Workflow:
//   - Leerkracht klikt 🗣️ bij leerling
//   - Fase "kiezen": thema-keuze + start-knop + afnameblad printen
//   - Fase "afnemen": één beeld per scherm, juf duidt aan vlot/aarzelt/niet
//     → automatisch volgende beeld; vorige/over te slaan-knoppen mogelijk
//   - Fase "klaar": samenvatting + notitie + bewaren
//     Voor 'aarzelt'/'niet': tekstveld 'wat zei het kind'
//   - Na bewaren: knop "📄 PDF van deze toets" voor in toetsenmap
//
// Datamodel:
//   toets.perWoord[woordId] = ofwel een string (oud format: 'vlot'|'aarzelt'|'niet'),
//   ofwel een object (nieuw format: { oordeel, notitie }).
//   De helper sprWoordOordeel/sprWoordNotitie maakt het verschil.

// Helper: haal het oordeel uit een perWoord-waarde (oud of nieuw format)
function sprWoordOordeel(waarde) {
  if (!waarde) return null;
  if (typeof waarde === 'string') return waarde;
  if (typeof waarde === 'object' && waarde.oordeel) return waarde.oordeel;
  return null;
}

// Helper: haal de notitie uit een perWoord-waarde (alleen nieuw format)
function sprWoordNotitie(waarde) {
  if (!waarde) return '';
  if (typeof waarde === 'object' && waarde.notitie) return waarde.notitie;
  return '';
}

let _sprModalCode = null;
let _sprModalNaam = '';
let _sprModalThemaId = null;
let _sprModalItems = [];           // verrijkte items van het gekozen thema (gefilterd op selectie)
let _sprModalIdx = 0;              // huidige positie in afnemen
let _sprModalResultaten = {};      // { woordId: 'vlot'|'aarzelt'|'niet' }
let _sprModalNotitiesPerWoord = {}; // { woordId: 'wat het kind zei' }
let _sprModalNotitie = '';
let _sprModalFase = 'kiezen';      // 'kiezen' | 'afnemen' | 'klaar'
let _sprModalLaatstBewaardId = null; // voor PDF-knop na bewaren
let _sprModalGeselecteerd = new Set(); // woordIds die in de toets opgenomen worden

async function lkOpenSpreektoets(code, naam) {
  _sprModalCode = code;
  _sprModalNaam = naam || code;
  _sprModalResultaten = {};
  _sprModalNotitiesPerWoord = {};
  _sprModalNotitie = '';
  _sprModalIdx = 0;
  _sprModalFase = 'kiezen';
  _sprModalLaatstBewaardId = null;
  _sprModalGeselecteerd = new Set();

  // Standaard-thema = thema van huidige taak, anders eerste actief thema
  const kind = lkKinderen.find(k => k.code === code);
  if (kind && kind.taak && kind.taak.themaId) {
    _sprModalThemaId = kind.taak.themaId;
  } else {
    let themaIds = [];
    if (kind && Array.isArray(kind.thema_actief) && kind.thema_actief.length > 0) {
      themaIds = kind.thema_actief;
    } else {
      themaIds = ALLE_THEMAS_LK.map(t => t.id);
    }
    _sprModalThemaId = themaIds[0] || (ALLE_THEMAS_LK[0] && ALLE_THEMAS_LK[0].id);
  }

  // Vul selectie automatisch met alle woorden van het gekozen thema
  _sprVulSelectieAuto();

  _rendererSpreektoetsModal();
}

// Vul _sprModalGeselecteerd met alle woorden van het huidige thema
function _sprVulSelectieAuto() {
  _sprModalGeselecteerd = new Set();
  if (!_sprModalThemaId) return;
  const thema = ALLE_THEMAS_LK.find(t => t.id === _sprModalThemaId);
  if (!thema) return;
  const verrijkt = lkVerrijkThema(thema);
  (verrijkt.items || []).forEach(it => _sprModalGeselecteerd.add(it.id));
}

function _rendererSpreektoetsModal() {
  const oud = document.getElementById('lk-spr-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-spr-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => {
    if (e.target === bg) {
      // Tijdens afname: vraag bevestiging als er beoordelingen zijn
      if (_sprModalFase === 'afnemen' && Object.keys(_sprModalResultaten).length > 0) {
        if (!confirm('Spreektoets stoppen? De beoordelingen worden niet bewaard.')) return;
      }
      lkSluitSpreektoetsModal();
    }
  };

  let html = '';
  if (_sprModalFase === 'kiezen') html = _sprHtmlKiezen();
  else if (_sprModalFase === 'afnemen') html = _sprHtmlAfnemen();
  else if (_sprModalFase === 'klaar') html = _sprHtmlKlaar();

  bg.innerHTML = html;
  document.body.appendChild(bg);
}

// ----- FASE 1: thema kiezen -----
function _sprHtmlKiezen() {
  const kind = lkKinderen.find(k => k.code === _sprModalCode);
  let themaIds = [];
  if (kind && Array.isArray(kind.thema_actief) && kind.thema_actief.length > 0) {
    themaIds = kind.thema_actief;
  } else {
    themaIds = ALLE_THEMAS_LK.map(t => t.id);
  }
  const beschikbare = ALLE_THEMAS_LK.filter(t => themaIds.indexOf(t.id) !== -1);

  let opties = '';
  if (beschikbare.length === 0) {
    opties = '<option value="">⚠️ Geen actieve thema\'s</option>';
  } else {
    beschikbare.forEach(t => {
      const sel = (t.id === _sprModalThemaId) ? 'selected' : '';
      opties += `<option value="${t.id}" ${sel}>${t.emoji} ${t.naam}</option>`;
    });
  }

  // Bouw woordkeuze-lijst
  let woordenHtml = '';
  let totaalW = 0;
  let geselW = 0;
  const thema = ALLE_THEMAS_LK.find(t => t.id === _sprModalThemaId);
  if (thema) {
    const verrijkt = lkVerrijkThema(thema);
    const items = verrijkt.items || [];
    totaalW = items.length;
    geselW = items.filter(it => _sprModalGeselecteerd.has(it.id)).length;
    items.forEach(it => {
      const aan = _sprModalGeselecteerd.has(it.id);
      woordenHtml += `
        <label class="lk-spr-keuze-rij ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="lkSprToggleWoord('${it.id}')">
          <span class="lk-spr-keuze-tekst">${it.tekst}</span>
        </label>
      `;
    });
  }

  return `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>🗣️ Spreektoets — ${_sprModalNaam}</h2>
      <p class="modal-uitleg">
        Kies een thema en de woorden die je wil afnemen. Daarna doorloop je ze één voor één.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Thema</label>
        <select class="lk-taak-select" onchange="lkSprKiesThema(this.value)">
          ${opties}
        </select>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">
          Woorden in deze toets <span class="lk-taak-teller">(${geselW} van ${totaalW})</span>
          <span style="margin-left:auto; display:flex; gap:4px">
            <button class="lk-knop-mini" type="button" onclick="lkSprAllesAan()" title="Alle woorden selecteren">✓ alles</button>
            <button class="lk-knop-mini" type="button" onclick="lkSprAllesUit()" title="Niets geselecteerd">☐ niets</button>
          </span>
        </label>
        <div class="lk-spr-keuze-lijst">
          ${woordenHtml || '<p class="lk-detail-leeg">Geen woorden in dit thema.</p>'}
        </div>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkSluitSpreektoetsModal()">Annuleren</button>
        <button class="lk-knop-mini" onclick="lkSprAfnamebladPrint()" ${geselW === 0 ? 'disabled' : ''} title="Print een blanco afnameblad om met pen in te vullen">🖨️ Afnameblad</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkSprStartAfname()" ${geselW === 0 ? 'disabled' : ''}>▶ Start digitaal</button>
      </div>
    </div>
  `;
}

function lkSprToggleWoord(woordId) {
  if (_sprModalGeselecteerd.has(woordId)) {
    _sprModalGeselecteerd.delete(woordId);
  } else {
    _sprModalGeselecteerd.add(woordId);
  }
  _rendererSpreektoetsModal();
}

function lkSprAllesAan() {
  _sprVulSelectieAuto();
  _rendererSpreektoetsModal();
}

function lkSprAllesUit() {
  _sprModalGeselecteerd = new Set();
  _rendererSpreektoetsModal();
}

// PDF afnameblad genereren — voor pen-en-papier-werkwijze
async function lkSprAfnamebladPrint() {
  if (!_sprModalThemaId) return;
  if (!window.RapportEngine || !RapportEngine.spreektoetsAfnameblad) {
    alert('PDF-functie nog niet beschikbaar.');
    return;
  }
  const thema = ALLE_THEMAS_LK.find(t => t.id === _sprModalThemaId);
  if (!thema) return;
  const verrijkt = lkVerrijkThema(thema);
  // Filter op de geselecteerde woorden
  const items = (verrijkt.items || []).filter(it => _sprModalGeselecteerd.has(it.id));
  if (items.length === 0) {
    alert('Selecteer eerst minstens één woord.');
    return;
  }
  const kind = lkKinderen.find(k => k.code === _sprModalCode) || { code: _sprModalCode, naam: _sprModalNaam };
  try {
    await RapportEngine.spreektoetsAfnameblad(kind, thema, items);
  } catch (e) {
    console.error('Afnameblad PDF mislukt:', e);
    alert('PDF maken mislukt: ' + (e.message || 'onbekend'));
  }
}

function lkSprKiesThema(themaId) {
  _sprModalThemaId = themaId;
  // Bij thema-wissel: selectie auto vernieuwen voor het nieuwe thema
  _sprVulSelectieAuto();
  _rendererSpreektoetsModal();
}

function lkSprStartAfname() {
  const thema = ALLE_THEMAS_LK.find(t => t.id === _sprModalThemaId);
  if (!thema) return;
  const verrijkt = lkVerrijkThema(thema);
  // Alleen geselecteerde woorden in de afname
  _sprModalItems = (verrijkt.items || []).filter(it => _sprModalGeselecteerd.has(it.id));
  if (_sprModalItems.length === 0) {
    alert('Selecteer eerst minstens één woord.');
    return;
  }
  _sprModalIdx = 0;
  _sprModalFase = 'afnemen';
  _rendererSpreektoetsModal();
}

// ----- FASE 2: afnemen -----
function _sprHtmlAfnemen() {
  const item = _sprModalItems[_sprModalIdx];
  if (!item) {
    // Veiligheid: ga naar klaar-fase als index buiten bereik
    _sprModalFase = 'klaar';
    return _sprHtmlKlaar();
  }
  const totaal = _sprModalItems.length;
  const huidig = _sprModalResultaten[item.id] || null;
  const aantalBeoord = Object.keys(_sprModalResultaten).filter(id => _sprModalResultaten[id]).length;
  const pct = Math.round((aantalBeoord / totaal) * 100);
  const isLaatste = (_sprModalIdx === totaal - 1);

  return `
    <div class="lk-cat-modal lk-spr-afname" onclick="event.stopPropagation()">
      <div class="lk-spr-kop">
        <div class="lk-spr-kop-naam">🗣️ ${_sprModalNaam}</div>
        <div class="lk-spr-kop-teller">${_sprModalIdx + 1} / ${totaal}</div>
      </div>
      <div class="lk-spr-balk-wrap">
        <div class="lk-spr-balk-vul" style="width:${pct}%"></div>
      </div>

      <div class="lk-spr-afname-paneel">
        <div class="lk-spr-beeld-groot">
          ${Picto.html(item, { grootte: 240 })}
        </div>
        <div class="lk-spr-juf-info">
          <span class="lk-spr-juf-label">Juf ziet:</span>
          <span class="lk-spr-juf-woord">${item.tekst}</span>
          <button class="lk-knop-mini lk-spr-hoor" onclick="lkSprHoorWoord('${item.id}')" title="Het woord laten horen">🔊 Hoor</button>
        </div>
      </div>

      <div class="lk-spr-beoordeel">
        <button class="lk-spr-bk vlot ${huidig === 'vlot' ? 'aan' : ''}" onclick="lkSprBeoordeel('vlot')">
          <span class="lk-spr-bk-emoji">✓</span>
          <span class="lk-spr-bk-tekst">Vlot</span>
        </button>
        <button class="lk-spr-bk aarzelt ${huidig === 'aarzelt' ? 'aan' : ''}" onclick="lkSprBeoordeel('aarzelt')">
          <span class="lk-spr-bk-emoji">🤔</span>
          <span class="lk-spr-bk-tekst">Aarzelt</span>
        </button>
        <button class="lk-spr-bk niet ${huidig === 'niet' ? 'aan' : ''}" onclick="lkSprBeoordeel('niet')">
          <span class="lk-spr-bk-emoji">✗</span>
          <span class="lk-spr-bk-tekst">Niet</span>
        </button>
      </div>

      <div class="lk-spr-nav">
        <button class="lk-knop-mini" onclick="lkSprVorige()" ${_sprModalIdx === 0 ? 'disabled' : ''}>← Vorige</button>
        <button class="lk-knop-mini" onclick="lkSprOverslaan()">Overslaan →</button>
        ${isLaatste
          ? `<button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkSprNaarKlaar()">Afronden ✓</button>`
          : `<button class="lk-knop-mini" onclick="lkSprVolgende()">Volgende →</button>`
        }
      </div>

      <div class="lk-spr-stop">
        <a onclick="lkSprStopBevestig()">Stoppen zonder bewaren</a>
      </div>
    </div>
  `;
}

function lkSprHoorWoord(woordId) {
  const item = _sprModalItems.find(it => it.id === woordId);
  if (!item || !window.AudioEngine) return;
  AudioEngine.spreek(item.tekst);
}

function lkSprBeoordeel(oordeel) {
  const item = _sprModalItems[_sprModalIdx];
  if (!item) return;
  // Toggle: dezelfde knop opnieuw → leeg
  if (_sprModalResultaten[item.id] === oordeel) {
    delete _sprModalResultaten[item.id];
    _rendererSpreektoetsModal();
    return;
  }
  _sprModalResultaten[item.id] = oordeel;

  // Automatisch volgende (na korte pauze voor visuele feedback)
  if (_sprModalIdx < _sprModalItems.length - 1) {
    setTimeout(() => {
      _sprModalIdx++;
      _rendererSpreektoetsModal();
    }, 350);
  } else {
    // Laatste woord: niet automatisch naar klaar — leerkracht klikt zelf "Afronden"
    _rendererSpreektoetsModal();
  }
}

function lkSprVolgende() {
  if (_sprModalIdx < _sprModalItems.length - 1) {
    _sprModalIdx++;
    _rendererSpreektoetsModal();
  }
}

function lkSprVorige() {
  if (_sprModalIdx > 0) {
    _sprModalIdx--;
    _rendererSpreektoetsModal();
  }
}

function lkSprOverslaan() {
  // Markeert niet, gewoon doorgaan
  if (_sprModalIdx < _sprModalItems.length - 1) {
    _sprModalIdx++;
    _rendererSpreektoetsModal();
  } else {
    _sprModalFase = 'klaar';
    _rendererSpreektoetsModal();
  }
}

function lkSprNaarKlaar() {
  _sprModalFase = 'klaar';
  _rendererSpreektoetsModal();
}

function lkSprStopBevestig() {
  if (Object.keys(_sprModalResultaten).length > 0) {
    if (!confirm('Spreektoets stoppen? De beoordelingen worden niet bewaard.')) return;
  }
  lkSluitSpreektoetsModal();
}

// ----- FASE 3: samenvatting + bewaren -----
function _sprHtmlKlaar() {
  // Tellen
  let aV = 0, aA = 0, aN = 0, aLeeg = 0;
  _sprModalItems.forEach(it => {
    const r = _sprModalResultaten[it.id];
    if (r === 'vlot') aV++;
    else if (r === 'aarzelt') aA++;
    else if (r === 'niet') aN++;
    else aLeeg++;
  });
  const totaal = _sprModalItems.length;
  const beoordeeld = aV + aA + aN;

  // Items per categorie (object met item + tekst, niet alleen tekst)
  function itemsAls(cat) {
    return _sprModalItems.filter(it => _sprModalResultaten[it.id] === cat);
  }
  const vlotItems = itemsAls('vlot');
  const aarzItems = itemsAls('aarzelt');
  const nietItems = itemsAls('niet');

  // Vlot: compacte inline-lijst
  function inlineNamen(items) {
    if (items.length === 0) return '<em style="opacity:0.5">geen</em>';
    return items.map(it => it.tekst).join(', ');
  }

  // Aarzelt + niet samen: woorden waarvoor een notitie kan
  const notitieItems = [...aarzItems, ...nietItems];

  // "Vergeet niet over te typen" — alleen tonen als er aarzelt/niet is
  let overtypenBlok = '';
  if (notitieItems.length > 0) {
    const namen = notitieItems.map(it => it.tekst).join(' · ');
    overtypenBlok = `
      <div class="lk-spr-overtypen">
        <strong>📝 Vergeet niet over te typen wat het kind zei:</strong>
        <span class="lk-spr-overtypen-namen">${namen}</span>
      </div>
    `;
  }

  // Notitievelden per aarzelt/niet-woord
  let notitieVelden = '';
  if (notitieItems.length > 0) {
    notitieVelden = '<div class="lk-spr-notities-blok">';
    notitieItems.forEach(it => {
      const huidig = (_sprModalNotitiesPerWoord[it.id] || '').replace(/</g, '&lt;');
      const oordeel = _sprModalResultaten[it.id];
      const cls = oordeel === 'aarzelt' ? 'aarzelt' : 'niet';
      const emoji = oordeel === 'aarzelt' ? '🤔' : '✗';
      notitieVelden += `
        <div class="lk-spr-notitie-rij ${cls}">
          <span class="lk-spr-notitie-emoji">${emoji}</span>
          <span class="lk-spr-notitie-woord">${it.tekst}</span>
          <input type="text" class="lk-spr-notitie-input"
            placeholder="wat zei het kind?"
            value="${huidig}"
            oninput="lkSprNotitiePerWoord('${it.id}', this.value)">
        </div>
      `;
    });
    notitieVelden += '</div>';
  }

  return `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>✓ Toets afgenomen — ${_sprModalNaam}</h2>

      ${overtypenBlok}

      <div class="lk-spr-samenvatting">
        <div class="lk-spr-samen-rij vlot">
          <span class="lk-spr-samen-emoji">✓</span>
          <span class="lk-spr-samen-tekst"><strong>Vlot (${aV}):</strong> ${inlineNamen(vlotItems)}</span>
        </div>
        ${aLeeg > 0 ? `<div class="lk-spr-samen-rij leeg">
          <span class="lk-spr-samen-emoji">—</span>
          <span class="lk-spr-samen-tekst"><em>${aLeeg} woord${aLeeg === 1 ? '' : 'en'} niet beoordeeld (overgeslagen)</em></span>
        </div>` : ''}
      </div>

      ${notitieVelden}

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Algemene notitie (optioneel)</label>
        <textarea class="lk-spr-notitie" rows="2" placeholder="Bv. spreekt duidelijk maar twijfelt soms over uitspraak van -ng" oninput="lkSprNotitie(this.value)">${(_sprModalNotitie || '').replace(/</g, '&lt;')}</textarea>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkSprNaarAfname()">← Terug naar afname</button>
        <button class="lk-knop-mini" onclick="lkSluitSpreektoetsModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkSprBewaren()" ${beoordeeld === 0 ? 'disabled' : ''}>💾 Bewaren</button>
      </div>
    </div>
  `;
}

function lkSprNotitiePerWoord(woordId, tekst) {
  if (!tekst || !tekst.trim()) {
    delete _sprModalNotitiesPerWoord[woordId];
  } else {
    _sprModalNotitiesPerWoord[woordId] = tekst;
  }
}

function lkSprNotitie(tekst) {
  _sprModalNotitie = tekst;
}

function lkSprNaarAfname() {
  _sprModalFase = 'afnemen';
  _rendererSpreektoetsModal();
}

function lkSluitSpreektoetsModal() {
  const bg = document.getElementById('lk-spr-modal-bg');
  if (bg) bg.remove();
  _sprModalCode = null;
  _sprModalFase = 'kiezen';
}

async function lkSprBewaren() {
  if (!_sprModalCode || !_sprModalThemaId) return;

  // Bouw perWoord op als object: { oordeel, notitie }
  // Voor 'vlot' zonder notitie blijft het een string (kleinere opslag, backward compat)
  const perWoord = {};
  Object.keys(_sprModalResultaten).forEach(id => {
    const oordeel = _sprModalResultaten[id];
    if (!oordeel) return;
    const notitie = _sprModalNotitiesPerWoord[id];
    if (notitie && notitie.trim()) {
      perWoord[id] = { oordeel: oordeel, notitie: notitie.trim() };
    } else {
      // Geen notitie → bewaar gewoon string (achterwaarts compatibel)
      perWoord[id] = oordeel;
    }
  });

  if (Object.keys(perWoord).length === 0) {
    alert('Geen beoordelingen om te bewaren.');
    return;
  }

  // Genereer een unieke ID voor deze toets — voor PDF-export en latere referentie
  const toetsId = 'spr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

  const toets = {
    id: toetsId,
    themaId: _sprModalThemaId,
    datum: Date.now(),
    perWoord: perWoord,
    notitie: _sprModalNotitie || '',
    rapportperiodeId: lkActievePeriodeId()
  };

  const knop = document.querySelector('#lk-spr-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    await Voortgang.bewaarSpreektoetsVoorKind(_sprModalCode, toets);
    _sprModalLaatstBewaardId = toetsId;
    // Toon bevestigings-scherm met PDF-knop
    _sprToonBewaardScherm(toets);
    // Lijst herladen op de achtergrond
    lkLaadKinderen();
  } catch (e) {
    console.error('Bewaren spreektoets mislukt:', e);
    alert('Bewaren mislukt. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

function _sprToonBewaardScherm(toets) {
  const bg = document.getElementById('lk-spr-modal-bg');
  if (!bg) return;
  const code = _sprModalCode;
  const naam = _sprModalNaam;

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>✓ Spreektoets bewaard</h2>
      <p class="modal-uitleg">
        De resultaten zijn opgeslagen voor ${naam}. Wil je een PDF maken voor in de toetsenmap?
      </p>
      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkSluitSpreektoetsModal()">Sluiten</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkSprPdfDownload('${code}', '${(naam || '').replace(/'/g, "\\'")}', '${toets.id}')">📄 PDF van deze toets</button>
      </div>
    </div>
  `;
}

// PDF van een specifieke spreektoets — voor in toetsenmap
async function lkSprPdfDownload(code, naam, toetsId) {
  if (!window.RapportEngine || !RapportEngine.spreektoetsPdf) {
    alert('PDF-functie nog niet beschikbaar. Update de pagina.');
    return;
  }
  const knop = document.querySelector('#lk-spr-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  try {
    // Kind opnieuw ophalen voor verse data
    const toetsen = await Voortgang.haalSpreektoetsenOpVoorKind(code);
    const toets = toetsen.find(t => t.id === toetsId) || toetsen[toetsen.length - 1];
    if (!toets) {
      alert('Toets niet gevonden.');
      return;
    }
    const kind = lkKinderen.find(k => k.code === code) || { code, naam };
    await RapportEngine.spreektoetsPdf(kind, toets);
    lkSluitSpreektoetsModal();
  } catch (e) {
    console.error('PDF mislukt:', e);
    alert('PDF maken mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '📄 PDF van deze toets'; }
  }
}

// Voor knop in detail-uitklap van leerkracht-tabel: download PDF van een
// eerder opgeslagen spreektoets (toetsId staat in detail-rendering).
async function lkSprPdfVanGeschiedenis(code, toetsId) {
  if (!window.RapportEngine || !RapportEngine.spreektoetsPdf) {
    alert('PDF-functie nog niet beschikbaar.');
    return;
  }
  try {
    const toetsen = await Voortgang.haalSpreektoetsenOpVoorKind(code);
    const toets = toetsen.find(t => t.id === toetsId);
    if (!toets) {
      alert('Toets niet gevonden.');
      return;
    }
    const kind = lkKinderen.find(k => k.code === code);
    if (!kind) return;
    await RapportEngine.spreektoetsPdf(kind, toets);
  } catch (e) {
    console.error('PDF mislukt:', e);
    alert('PDF maken mislukt.');
  }
}

// =================================================================
//  WERKBLADEN VOOR EEN TAAK — mini-modal met oefenvorm-keuze
// =================================================================
//
// Vanuit de Taken-tab: klik op 📝-knop → open modal met de woorden van die
// taak (alleen-lezen) en checkboxes voor oefenvormen. Bij genereren wordt
// een kunstmatig "thema" gemaakt waarvan de items enkel de gekozen woorden
// zijn, zodat de bestaande PDFEngine.maakWerkblad zonder wijziging werkt.

let _twbModalState = {
  code: null,           // leerling-code
  taakBron: null,       // 'huidig' of archiefIdx
  woordIds: [],
  themaId: null,
  oefeningen: new Set(['koppel'])  // standaard: koppel aan
};

function lkTaakWerkbladen(code, taakBron) {
  const kind = lkKinderen.find(k => k.code === code);
  if (!kind) return;

  // Vind de juiste taak
  let taak;
  if (taakBron === 'huidig') {
    taak = kind.taak;
  } else {
    const gesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
    taak = gesch[taakBron];
  }
  if (!taak || !taak.themaId || !Array.isArray(taak.woordIds) || taak.woordIds.length === 0) {
    alert('Geen woorden gevonden in deze taak.');
    return;
  }

  _twbModalState.code = code;
  _twbModalState.taakBron = taakBron;
  _twbModalState.themaId = taak.themaId;
  _twbModalState.woordIds = [...taak.woordIds];
  // Onthoud niet over taken heen — start altijd met enkel 'koppel' aan
  _twbModalState.oefeningen = new Set(['koppel']);

  _twbRender();
}

function _twbRender() {
  // Verwijder oude modal
  const oud = document.getElementById('lk-twb-modal-bg');
  if (oud) oud.remove();

  const kind = lkKinderen.find(k => k.code === _twbModalState.code);
  const thema = ALLE_THEMAS_LK.find(t => t.id === _twbModalState.themaId);
  if (!kind || !thema) return;
  const verrijkt = lkVerrijkThema(thema);

  // Bouw woordenlijst (compact, alleen-lezen)
  const woordItems = _twbModalState.woordIds
    .map(id => verrijkt.items.find(it => it.id === id))
    .filter(Boolean);
  const woordenTekst = woordItems.map(it => it.tekst).join(', ');

  // Bouw oefenvorm-checkboxes
  let oefHtml = '';
  Object.keys(WB_OEFENING_LABELS).forEach(oefKey => {
    const aan = _twbModalState.oefeningen.has(oefKey) ? 'checked' : '';
    const label = WB_OEFENING_LABELS[oefKey];
    oefHtml += `
      <label class="lk-twb-oef-rij ${aan ? 'aan' : ''}">
        <input type="checkbox" ${aan} onchange="lkTwbToggleOef('${oefKey}')">
        <span>${label}</span>
      </label>
    `;
  });

  const aantalOef = _twbModalState.oefeningen.size;

  const bg = document.createElement('div');
  bg.id = 'lk-twb-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()" style="max-width:600px">
      <h2>📝 Werkbladen voor ${lkVolledigeNaam(kind)}</h2>
      <p class="modal-uitleg">
        Maak werkbladen met de woorden uit deze taak. Kies hieronder welke oefenvormen je wilt.
      </p>

      <div class="lk-twb-woorden-strook">
        <strong>${thema.emoji} ${thema.naam}</strong> — ${woordItems.length} woord${woordItems.length === 1 ? '' : 'en'}<br>
        <span class="lk-twb-woordenlijst">${woordenTekst}</span>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">
          Oefenvormen <span class="lk-taak-teller">(${aantalOef} aangevinkt)</span>
        </label>
        <div class="lk-twb-oef-lijst">
          ${oefHtml}
        </div>
      </div>

      <div class="lk-cat-modal-knoppen" style="flex-wrap:wrap; gap:10px">
        <label class="lk-twb-oplossing-toggle">
          <input type="checkbox" id="lk-twb-oplossing" checked>
          <span>Ook oplossingssleutel meedownloaden</span>
        </label>
        <div style="display:flex; gap:6px; margin-left:auto">
          <button class="lk-knop-mini" onclick="document.getElementById('lk-twb-modal-bg').remove()">Annuleren</button>
          <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkTwbGenereer()" ${aantalOef === 0 ? 'disabled' : ''}>📝 Genereer</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
}

function lkTwbToggleOef(oefKey) {
  if (_twbModalState.oefeningen.has(oefKey)) {
    _twbModalState.oefeningen.delete(oefKey);
  } else {
    _twbModalState.oefeningen.add(oefKey);
  }
  _twbRender();
}

async function lkTwbGenereer() {
  if (_twbModalState.oefeningen.size === 0) {
    alert('Vink minstens één oefenvorm aan.');
    return;
  }

  const thema = ALLE_THEMAS_LK.find(t => t.id === _twbModalState.themaId);
  if (!thema) {
    alert('Thema niet gevonden.');
    return;
  }
  const verrijkt = lkVerrijkThema(thema);

  // Filter items op de woordIds van de taak
  const gefilterdeItems = verrijkt.items.filter(it => _twbModalState.woordIds.indexOf(it.id) !== -1);
  if (gefilterdeItems.length === 0) {
    alert('Geen woorden gevonden voor deze taak.');
    return;
  }

  // Bouw kunstmatig thema-object met enkel de gekozen woorden.
  const themaConfigs = [{
    thema: { ...verrijkt, items: gefilterdeItems },
    oefeningen: Array.from(_twbModalState.oefeningen),
    niveau: 'vrij',
    categorieen: []
  }];

  // Lees of de leerkracht oplossing wil
  const oplossingChk = document.getElementById('lk-twb-oplossing');
  const ookOplossing = !!(oplossingChk && oplossingChk.checked);

  try {
    // Eerst werkblad
    await PDFEngine.maakWerkblad(themaConfigs, { verdeling: 'per-thema' });
    // Daarna oplossingssleutel als aangevinkt — kleine pauze zodat de browser
    // de eerste download verwerkt voor de tweede start
    if (ookOplossing) {
      await new Promise(r => setTimeout(r, 400));
      await PDFEngine.maakOplossingssleutel(themaConfigs, { verdeling: 'per-thema' });
    }
    // Modal sluiten na succes
    const bg = document.getElementById('lk-twb-modal-bg');
    if (bg) bg.remove();
  } catch (e) {
    console.error('Werkblad genereren mislukt:', e);
    alert('Het werkblad kon niet gemaakt worden: ' + (e.message || 'onbekend'));
  }
}

// PDF-export van een gearchiveerde luistertoets — voor in toetsenmap
async function lkTaakPdfVanGeschiedenis(code, archiefIdx) {
  if (!window.RapportEngine || !RapportEngine.taakPdf) {
    alert('PDF-functie nog niet beschikbaar.');
    return;
  }
  try {
    const kind = lkKinderen.find(k => k.code === code);
    if (!kind) return;
    const gesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
    const arch = gesch[archiefIdx];
    if (!arch) {
      alert('Taak niet gevonden in geschiedenis.');
      return;
    }
    await RapportEngine.taakPdf(kind, arch);
  } catch (e) {
    console.error('Taak-PDF mislukt:', e);
    alert('PDF maken mislukt: ' + (e.message || 'onbekend'));
  }
}

// PDF-export van de huidige taak (zelfde formaat als geschiedenis-versie)
async function lkTaakPdfHuidig(code) {
  if (!window.RapportEngine || !RapportEngine.taakPdf) {
    alert('PDF-functie nog niet beschikbaar.');
    return;
  }
  try {
    const kind = lkKinderen.find(k => k.code === code);
    if (!kind || !kind.taak) {
      alert('Geen huidige taak om af te drukken.');
      return;
    }
    // Bouw "archief-style" object van huidige taak voor consistente PDF-functie
    const taakSnapshot = {
      themaId: kind.taak.themaId,
      woordIds: [...(kind.taak.woordIds || [])],
      vaardigheden: [...(kind.taak.vaardigheden || ['luisteren'])],
      voltooidOp: Date.now(),
      gestart: kind.taak.gestart || null,
      status: kind.taak.status || 'bezig',
      perWoord: JSON.parse(JSON.stringify(kind.taak.perWoord || {})),
      foutWoordenLaatsteToets: [...(kind.taak.foutWoordenLaatsteToets || [])],
      rapportperiodeId: kind.taak.rapportperiodeId || null
    };
    await RapportEngine.taakPdf(kind, taakSnapshot);
  } catch (e) {
    console.error('Taak-PDF mislukt:', e);
    alert('PDF maken mislukt: ' + (e.message || 'onbekend'));
  }
}


// =================================================================
//  Init
// =================================================================
document.addEventListener('DOMContentLoaded', lkInit);
