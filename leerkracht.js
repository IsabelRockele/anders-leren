// =================================================================
//  leerkracht.js — Logica voor het leerkracht-paneel
// =================================================================

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
    await lkLaadKinderen();
  } else {
    document.getElementById('lk-vak-firebase-niet-ingesteld').style.display = 'block';
    document.getElementById('lk-tabel-wrap').innerHTML = '<p style="opacity:0.6">Configureer eerst Firebase.</p>';
    document.getElementById('lk-overzicht').innerHTML = '<p style="opacity:0.6">Configureer eerst Firebase.</p>';
  }
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
    const totaalGekend = berekenTotaalGekend(kind);
    const totaalItems = ALLE_THEMAS_LK.reduce((s, t) => s + t.items.length, 0);
    html += `<tr>
      <td>${kind.naam || '<em style="opacity:0.5">geen naam</em>'}</td>
      <td><span class="lk-code">${kind.code}</span></td>
      <td>${totaalGekend} / ${totaalItems}</td>
      <td>
        <button class="lk-knop-mini" onclick="lkToonQR('${kind.code}', '${(kind.naam || '').replace(/'/g, "\\'")}')">📱 QR</button>
        <button class="lk-knop-mini" onclick="lkBekijkKind('${kind.code}')">👁️</button>
        <button class="lk-knop-mini gevaar" onclick="lkVerwijder('${kind.code}', '${(kind.naam || '').replace(/'/g, "\\'")}')">🗑️</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function berekenTotaalGekend(kind) {
  const v = kind.voortgang || {};
  let totaal = 0;
  ALLE_THEMAS_LK.forEach(thema => {
    const themaData = v[thema.id] || {};
    Object.values(themaData).forEach(item => {
      if ((item.sterren || 0) >= 3) totaal++;
    });
  });
  return totaal;
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
  const baseUrl = window.location.href.replace(/leerkracht\.html.*/, 'index.html');
  const qrUrl = `${baseUrl}?code=${code}`;

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
      let gekend = 0;
      thema.items.forEach(it => {
        const x = themaData[it.id];
        if (x && (x.sterren || 0) >= 3) gekend++;
      });
      totGekend += gekend;
      totItems += thema.items.length;
      const pct = thema.items.length > 0 ? Math.round((gekend / thema.items.length) * 100) : 0;
      const kleur = pct >= 80 ? '#06A77D' : pct >= 40 ? '#FFB627' : pct > 0 ? '#FF8C42' : '#DDD';
      cellen += `<td style="text-align:center; background: ${kleur}22; color: ${kleur}; font-weight: 700">${gekend}/${thema.items.length}</td>`;
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
    let gekend = 0;
    thema.items.forEach(it => {
      const x = themaData[it.id];
      if (x && (x.sterren || 0) >= 3) gekend++;
    });

    html += `<h3 style="margin: 20px 0 10px; font-size:18px">${thema.emoji} ${thema.naam} (${gekend}/${thema.items.length})</h3>`;

    thema.items.forEach(it => {
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

  // Bouw URL-basis
  const baseUrl = window.location.href.replace(/leerkracht\.html.*/, 'index.html');

  // Genereer QR per kind in een tijdelijke verborgen div, en lees als data-URL
  const tijdelijk = document.createElement('div');
  tijdelijk.style.cssText = 'position:absolute; left:-9999px; top:-9999px;';
  document.body.appendChild(tijdelijk);

  const qrData = gesorteerd.map(kind => {
    const sub = document.createElement('div');
    tijdelijk.appendChild(sub);
    new QRCode(sub, {
      text: `${baseUrl}?code=${kind.code}`,
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
//  Init
// =================================================================
document.addEventListener('DOMContentLoaded', lkInit);
