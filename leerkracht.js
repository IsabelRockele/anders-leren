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
//  TABS
// =================================================================
function lkKiesTab(tab) {
  document.querySelectorAll('.lk-tab').forEach(k => k.classList.remove('actief'));
  document.querySelectorAll('.lk-tab-inhoud').forEach(t => t.classList.remove('actief'));
  document.querySelector(`.lk-tab[data-tab="${tab}"]`).classList.add('actief');
  document.getElementById('lk-tab-' + tab).classList.add('actief');

  if (tab === 'overzicht') lkRendererOverzicht();
  if (tab === 'woorden') wbInitTab();
  if (tab === 'werkbladen') initWerkbladTab();
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
  html += '<th>Naam</th><th>Code</th><th>Voortgang</th><th>Acties</th>';
  html += '</tr></thead><tbody>';

  lkKinderen.forEach(kind => {
    const { gekend, totaal } = berekenVoortgangVoorKind(kind);
    html += `<tr>
      <td>${kind.naam || '<em style="opacity:0.5">geen naam</em>'}</td>
      <td><span class="lk-code">${kind.code}</span></td>
      <td>${gekend} / ${totaal}</td>
      <td>
        <button class="lk-knop-mini" onclick="lkToonQR('${kind.code}', '${(kind.naam || '').replace(/'/g, "\\'")}')" title="QR-code voor inloggen">📱 QR</button>
        <button class="lk-knop-mini" onclick="lkBekijkKind('${kind.code}')" title="Bekijk gedetailleerde voortgang">📊</button>
        <button class="lk-knop-mini" onclick="lkBekijkKindApp('${kind.code}')" title="Open de kind-app als deze leerling (in nieuw tabblad)">👁️</button>
        <button class="lk-knop-mini" onclick="lkBeheerCategorieen('${kind.code}', '${(kind.naam || '').replace(/'/g, "\\'")}')" title="Categorieën per thema">🏷️</button>
        <button class="lk-knop-mini gevaar" onclick="lkVerwijder('${kind.code}', '${(kind.naam || '').replace(/'/g, "\\'")}')" title="Leerling verwijderen">🗑️</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// Filter de items van een thema op de actieve categorieën voor dit kind.
// Past eerst Woordenbeheer toe (overrides + eigen items + verbergen),
// dan filtert op de categorieën van het kind.
function _filterItemsVoorKind(thema, kind) {
  const verrijkt = lkVerrijkThema(thema);
  const ingesteld = (kind.categorieen || {})[verrijkt.id];
  if (!verrijkt.categorieen || verrijkt.categorieen.length === 0) return verrijkt.items;
  if (!Array.isArray(ingesteld) || ingesteld.length === 0) {
    // null/undefined = default: alles aan. Lege lijst = letterlijk niets aan.
    if (ingesteld === undefined || ingesteld === null) return verrijkt.items;
    return [];
  }
  return verrijkt.items.filter(it => !it.categorie || ingesteld.includes(it.categorie));
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
//  CATEGORIEËN PER LEERLING — modal
// =================================================================

// State tijdens modal: { themaId: Set<categorie> }
let _catModalState = null;
let _catModalKindCode = null;

async function lkBeheerCategorieen(code, naam) {
  _catModalKindCode = code;

  // Eerst huidige instellingen ophalen
  let huidig = {};
  try {
    huidig = await Voortgang.haalCategorieenOpVoorKind(code);
  } catch (e) {
    console.warn('Kon categorieën niet ophalen, start vanaf default', e);
  }

  // Bouw state: per thema een Set met actieve categorieën.
  // Default (geen instelling) = ALLE categorieën van het thema aan.
  _catModalState = {};
  ALLE_THEMAS_LK.forEach(thema => {
    if (!thema.categorieen || thema.categorieen.length === 0) return;
    const ingesteld = huidig[thema.id];
    if (Array.isArray(ingesteld) && ingesteld.length > 0) {
      _catModalState[thema.id] = new Set(ingesteld.filter(c => thema.categorieen.includes(c)));
    } else {
      _catModalState[thema.id] = new Set(thema.categorieen);
    }
  });

  rendererCatModal(naam || code);
}

function rendererCatModal(naamOfCode) {
  // Verwijder eventueel bestaande modal eerst
  const oud = document.getElementById('lk-cat-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-cat-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) lkSluitCatModal(); };

  let html = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>🏷️ Categorieën voor ${naamOfCode}</h2>
      <p class="modal-uitleg">Vink aan welke categorieën deze leerling oefent. Niet aangevinkt = niet getoond in app of toetsen. Standaard staat alles aan.</p>
  `;

  ALLE_THEMAS_LK.forEach(thema => {
    if (!thema.categorieen || thema.categorieen.length === 0) return;
    const setActief = _catModalState[thema.id];
    html += `<div class="lk-cat-thema-blok">
      <div class="lk-cat-thema-naam">${thema.emoji} ${thema.naam}</div>
      <div class="categorie-chips">`;
    thema.categorieen.forEach(cat => {
      const aan = setActief.has(cat);
      const lab = CATEGORIE_LABELS[cat] || { label: cat, emoji: '•' };
      html += `
        <label class="categorie-chip ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="lkToggleCatModal('${thema.id}', '${cat}')">
          <span>${lab.emoji} ${lab.label}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  html += `
      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="lkAllesAanCatModal()">Alles aan</button>
        <button class="lk-knop-mini" onclick="lkSluitCatModal()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkBewaarCatModal()">💾 Bewaren</button>
      </div>
    </div>
  `;

  bg.innerHTML = html;
  document.body.appendChild(bg);
}

function lkToggleCatModal(themaId, cat) {
  if (!_catModalState || !_catModalState[themaId]) return;
  const s = _catModalState[themaId];
  if (s.has(cat)) s.delete(cat); else s.add(cat);
  // Update enkel de chip in plaats van alles te herrenderen
  const chips = document.querySelectorAll('.lk-cat-modal .categorie-chip');
  chips.forEach(chip => {
    const inp = chip.querySelector('input');
    if (inp && inp.getAttribute('onchange') && inp.getAttribute('onchange').includes(`'${themaId}', '${cat}'`)) {
      chip.classList.toggle('aan', s.has(cat));
      inp.checked = s.has(cat);
    }
  });
}

function lkAllesAanCatModal() {
  Object.keys(_catModalState).forEach(themaId => {
    const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
    if (thema) _catModalState[themaId] = new Set(thema.categorieen);
  });
  // Vind de naam terug uit de header
  const koppen = document.querySelectorAll('.lk-cat-modal h2');
  let naam = _catModalKindCode;
  if (koppen[0]) naam = koppen[0].textContent.replace(/^🏷️ Categorieën voor /, '');
  rendererCatModal(naam);
}

async function lkBewaarCatModal() {
  if (!_catModalKindCode || !_catModalState) return;

  const knop = document.querySelector('.lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    // Bewaar één thema tegelijk. Lege set = niets aan = blokkade voor het kind,
    // dus dat slaan we op als lege array (≠ 'verwijderen' wat → alles aan zou betekenen).
    // Volle set (alles aan) → expliciet verwijderen, zodat kind altijd alles ziet
    // ook als het thema later uitgebreid wordt met nieuwe categorieën.
    for (const themaId of Object.keys(_catModalState)) {
      const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
      if (!thema) continue;
      const setActief = _catModalState[themaId];
      const lijst = Array.from(setActief);
      const isAlles = lijst.length === thema.categorieen.length;
      // 'isAlles' → null doorgeven (= verwijderen, default = alles)
      // anders → de lijst doorgeven (ook als hij leeg is)
      await Voortgang.zetCategorieenVoorKind(_catModalKindCode, themaId, isAlles ? null : lijst);
    }
    lkSluitCatModal();
  } catch (e) {
    console.error('Bewaren mislukt:', e);
    alert('Kon de categorieën niet bewaren. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

function lkSluitCatModal() {
  const bg = document.getElementById('lk-cat-modal-bg');
  if (bg) bg.remove();
  _catModalState = null;
  _catModalKindCode = null;
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
