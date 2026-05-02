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

  // Sluit zijbalk op mobiel na keuze
  lkSluitMenu();

  // Scroll naar boven zodat nieuwe tab vanaf bovenaan zichtbaar is
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
async function lkLaadKinderen() {
  try {
    lkKinderen = await Voortgang.alleKinderen();
    lkRendererTabel();
  } catch (e) {
    document.getElementById('lk-tabel-wrap').innerHTML =
      '<p style="color:var(--kleur-fout)">Kon de leerlingen niet laden: ' + e.message + '</p>';
  }
}

function lkRendererTabel() {
  const wrap = document.getElementById('lk-tabel-wrap');
  if (lkKinderen.length === 0) {
    wrap.innerHTML = '<p style="opacity:0.6; padding:20px; text-align:center">Nog geen leerlingen. Voeg er eentje toe hierboven.</p>';
    return;
  }

  let html = '<table class="lk-tabel"><thead><tr>';
  html += '<th></th><th>Naam</th><th>📋 Taak</th><th>🏷️ Vrij oefenen</th><th>Acties</th>';
  html += '</tr></thead><tbody>';

  lkKinderen.forEach(kind => {
    const naamSafe = (kind.naam || '').replace(/'/g, "\\'");
    const code = kind.code;
    const isOpen = lkUitgeklapt.has(code);

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
    html += `<tr class="lk-tabel-rij ${isOpen ? 'open' : ''}" data-code="${code}">
      <td class="lk-rij-pijl-cel" onclick="lkRijToggle('${code}')"><span class="lk-rij-pijl">${isOpen ? '▼' : '▶'}</span></td>
      <td onclick="lkRijToggle('${code}')">${kind.naam || '<em style="opacity:0.5">geen naam</em>'}<br><small class="lk-code-mini">${code}</small></td>
      <td onclick="lkRijToggle('${code}')">${taakCel}</td>
      <td onclick="lkRijToggle('${code}')"><span class="lk-vrij-tekst">${vrijTekst}</span></td>
      <td class="lk-acties-cel">
        <button class="lk-knop-mini lk-taak-knop" onclick="lkBeheerTaak('${code}', '${naamSafe}')" title="Taak voor deze leerling">📋</button>
        <button class="lk-knop-mini" onclick="lkBeheerCategorieen('${code}', '${naamSafe}')" title="Welke thema's mag de leerling vrij oefenen?">🏷️</button>
        <button class="lk-knop-mini" onclick="lkToonQR('${code}', '${naamSafe}')" title="QR-code voor inloggen">📱</button>
        <button class="lk-knop-mini" onclick="lkBekijkKindApp('${code}')" title="Open de kind-app als deze leerling">👁️</button>
        <button class="lk-knop-mini gevaar" onclick="lkVerwijder('${code}', '${naamSafe}')" title="Leerling verwijderen">🗑️</button>
      </td>
    </tr>`;

    // Uitklapbare detailrij
    if (isOpen) {
      html += `<tr class="lk-tabel-detailrij"><td colspan="5">${_lkRendererDetail(kind)}</td></tr>`;
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
  const naam = document.getElementById('nieuw-naam').value.trim();
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
    await Voortgang.maakKind(codeNorm, naam);
    document.getElementById('nieuw-naam').value = '';
    document.getElementById('nieuw-code').value = '';
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

async function lkBeheerTaak(code, naam) {
  _taakModalKindCode = code;
  _taakModalNaam = naam || code;

  // Huidige taak ophalen (kan null zijn)
  let huidigeTaak = null;
  try {
    huidigeTaak = await Voortgang.haalTaakOpVoorKind(code);
  } catch (e) {
    console.warn('Taak ophalen mislukt:', e);
  }

  // Voorinstelling: als er een taak is, hetzelfde thema/woorden/instellingen,
  // anders defaults
  if (huidigeTaak && huidigeTaak.themaId) {
    _taakModalThemaId = huidigeTaak.themaId;
    _taakModalWoordIds = new Set(huidigeTaak.woordIds || []);
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

      html += `
        <div class="lk-taak-veld">
          <label class="lk-taak-label">Welke woorden in de taak? <span class="lk-taak-teller">(${aantalAangevinkt} gekozen)</span></label>
          <div class="lk-taak-snelacties">
            <button class="lk-knop-mini" onclick="lkTaakAllesAan()">Alle aanvinken</button>
            <button class="lk-knop-mini" onclick="lkTaakNietsAan()">Alles uit</button>
          </div>
          <div class="lk-taak-woorden">
      `;
      items.forEach(item => {
        const aan = _taakModalWoordIds.has(item.id);
        html += `
          <label class="cat-item-rij ${aan ? 'aan' : ''}">
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
      gestart: Date.now()
    };
    await Voortgang.zetTaakVoorKind(_taakModalKindCode, taak);
    // Lokale lijst bijwerken
    const kind = lkKinderen.find(k => k.code === _taakModalKindCode);
    if (kind) kind.taak = taak;
    lkSluitTaakModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
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
//  Init
// =================================================================
document.addEventListener('DOMContentLoaded', lkInit);
