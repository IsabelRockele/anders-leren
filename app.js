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

// Toets-state
const TOETS_AANTAL = 10;
let toetsVragen = [];
let toetsHuidig = 0;
let toetsJuist = 0;
let toetsItem = null;

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
  const gekozen = Voortgang.kiesVolgendItem(slimThemas || THEMAS_WOORDEN);

  if (!gekozen) {
    // Alles klaar! Kind heeft alles geleerd
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
    <div class="grote-beeld">${item.beeld}</div>
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

  kaart.innerHTML = `
    <div class="vraag-tekst">Klik het juiste woord:</div>
    <div class="grote-beeld">${item.beeld}</div>
    <div class="slim-hoor-rij">
      <button class="slim-hoor-knop" onclick="slimHoorWoord()">🔊 Hoor opnieuw</button>
    </div>
  `;

  acties.className = 'slim-acties';
  acties.innerHTML = '';
  opties.forEach(opt => {
    const k = document.createElement('button');
    k.className = 'slim-knop-actie';
    k.textContent = opt.tekst;
    k.onclick = () => slimKiesAntwoord(k, opt);
    acties.appendChild(k);
  });

  spreekVeilig(item.tekst, 400);
}

function slimKiesAntwoord(knop, gekozen) {
  document.querySelectorAll('.slim-knop-actie').forEach(k => k.disabled = true);
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
  rendererSurvivalGrid();
  rendererThemaGrid('woorden-grid', THEMAS_WOORDEN);
  rendererThemaGrid('zinnen-grid', THEMAS_ZINNEN);
  rendererVoortgang();
}

function rendererSurvivalGrid() {
  const grid = document.getElementById('survival-grid');
  if (!grid) return;
  grid.innerHTML = '';
  THEMAS_SURVIVAL.forEach(thema => {
    const stats = Voortgang.statsThema(thema);
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
  themas.forEach(thema => {
    const stats = Voortgang.statsThema(thema);
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
  const totaalGekend = ALLE_THEMAS.reduce((s, t) => s + Voortgang.statsThema(t).gekend, 0);

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
    const s = Voortgang.statsThema(thema);
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
  const s = Voortgang.statsThema(thema);
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

  // Bepaal welke stap "Begin hier" krijgt
  // Reset alle stappen
  ['stap-1','stap-2','stap-3','stap-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('begin-hier');
  });
  // Stap 1 als nog niets is gezien; stap 3 als wel iets gezien maar nog niet stevig
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
  } else if (modus === 'toets') {
    startToets();
  } else if (modus === 'werkblad') {
    werkbladNiveau = 'basis';
    document.querySelectorAll('.niveau-knop').forEach(k => {
      k.classList.toggle('actief', k.dataset.niveau === 'basis');
    });
    toonScherm('scherm-werkblad');
  }
}

// =================================================================
//  MODUS: KIJKEN & LUISTEREN
// =================================================================
function rendererKijken() {
  const item = huidigThema.items[kijkenIndex];
  document.getElementById('kijken-beeld').textContent = item.beeld;
  document.getElementById('kijken-woord').textContent = item.tekst;
  document.getElementById('kijken-zin').textContent = item.zin;
  document.getElementById('kijken-huidig').textContent = kijkenIndex + 1;
  document.getElementById('kijken-totaal').textContent = huidigThema.items.length;

  // Registreer gezien
  Voortgang.registreerGezien(huidigThema.id, item.id);

  spreekVeilig(item.tekst, 300);
}

function hoorWoord() {
  AudioEngine.spreek(huidigThema.items[kijkenIndex].tekst);
}

function hoorZin() {
  AudioEngine.spreek(huidigThema.items[kijkenIndex].zin);
}

function kijkenVolgende() {
  kijkenIndex = (kijkenIndex + 1) % huidigThema.items.length;
  rendererKijken();
  // Bewaar elke 3 stappen
  if (kijkenIndex % 3 === 0) Voortgang.bewaar(Auth.getCode());
}

function kijkenVorige() {
  kijkenIndex = (kijkenIndex - 1 + huidigThema.items.length) % huidigThema.items.length;
  rendererKijken();
}

// =================================================================
//  MODUS: LEZEN
// =================================================================
function rendererLezen() {
  const grid = document.getElementById('lezen-grid');
  grid.innerHTML = '';
  huidigThema.items.forEach(item => {
    const stats = Voortgang.getCache()[huidigThema.id]?.[item.id];
    const sterren = stats?.sterren || 0;
    const sterrenStr = '⭐'.repeat(sterren);

    const kaart = document.createElement('button');
    kaart.className = 'lees-kaart';
    kaart.innerHTML = `
      ${sterren > 0 ? `<div class="lees-sterren">${sterrenStr}</div>` : ''}
      <div class="lees-beeld">${item.beeld}</div>
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
  const items = huidigThema.items;
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

  document.getElementById('oefen-beeld').textContent = oefenItem.beeld;
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
  const items = [...huidigThema.items].sort(() => Math.random() - 0.5);
  toetsVragen = items.slice(0, Math.min(TOETS_AANTAL, items.length));
  toetsHuidig = 0;
  toetsJuist = 0;
  document.getElementById('toets-totaal').textContent = toetsVragen.length;
  toonToetsVraag();
  toonScherm('scherm-toets');
}

function toonToetsVraag() {
  toetsItem = toetsVragen[toetsHuidig];
  document.getElementById('toets-huidig').textContent = toetsHuidig + 1;
  document.getElementById('toets-beeld').textContent = toetsItem.beeld;

  // Voortgangsbalk
  const pct = (toetsHuidig / toetsVragen.length) * 100;
  document.getElementById('toets-balk-vulling').style.width = pct + '%';

  // 3 afleiders
  const afl = [];
  const beschikb = huidigThema.items.filter(x => x.id !== toetsItem.id);
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

// =================================================================
//  MODUS: WERKBLAD
// =================================================================
let werkbladNiveau = 'basis'; // default

function kiesWerkbladNiveau(niveau) {
  werkbladNiveau = niveau;
  document.querySelectorAll('.niveau-knop').forEach(k => {
    k.classList.toggle('actief', k.dataset.niveau === niveau);
  });
}

function genereerWerkblad() {
  const opties = {
    koppel: document.getElementById('opt-koppel').checked,
    overschrijf: document.getElementById('opt-overschrijf').checked,
    letter: document.getElementById('opt-letter').checked,
    omcirkel: document.getElementById('opt-omcirkel').checked,
    zoek: document.getElementById('opt-zoek').checked,
    niveau: werkbladNiveau,
  };
  const minstens1 = ['koppel','overschrijf','letter','omcirkel','zoek'].some(k => opties[k]);
  if (!minstens1) {
    alert('Kies minstens één oefening.');
    return;
  }
  PDFEngine.maakWerkblad(huidigThema, opties);
}

// =================================================================
//  Start
// =================================================================
document.addEventListener('DOMContentLoaded', init);

// Auto-bewaar bij verlaten pagina
window.addEventListener('beforeunload', () => {
  if (Auth.ingelogd()) Voortgang.bewaar(Auth.getCode());
});