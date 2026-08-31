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

// Preview-modus: open de kind-app in een grote popup binnen het leerkracht-scherm.
// Voortgang wordt NIET aangetast (preview=1 schakelt schrijfacties uit).
function lkPreviewTaak(code, naam, conceptSleutel) {
  // CSS voor preview-popup eenmalig injecteren
  if (!document.getElementById('lk-preview-style')) {
    const style = document.createElement('style');
    style.id = 'lk-preview-style';
    style.textContent = `
      .lk-preview-bg {
        position: fixed; inset: 0; background: rgba(0,0,0,0.7);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .lk-preview-doos {
        background: #fff; border-radius: 12px;
        width: 100%; max-width: 1000px; height: 90vh; max-height: 800px;
        display: flex; flex-direction: column; overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      }
      .lk-preview-kop {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 18px; border-bottom: 1px solid #e5e7eb;
        background: #fef3c7;
      }
      .lk-preview-titel {
        font-weight: 600; color: #78350f; font-size: 15px;
        display: flex; align-items: center; gap: 8px;
      }
      .lk-preview-uitleg {
        font-size: 12px; color: #92400e; font-weight: 400;
      }
      .lk-preview-sluit {
        background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
        padding: 6px 14px; font-size: 14px; cursor: pointer; color: #1f2937;
      }
      .lk-preview-sluit:hover { background: #f3f4f6; }
      .lk-preview-skipbalk {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 18px; background: #fffbea;
        border-bottom: 1px solid #fde68a;
        font-size: 13px;
      }
      .lk-preview-skipbalk-uitleg {
        color: #78350f; font-style: italic;
      }
      .lk-preview-skipknop {
        background: var(--kleur-zisa, #ffd166); color: #1f2937;
        border: 1px solid #f59e0b; border-radius: 6px;
        padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
      }
      .lk-preview-skipknop:hover { filter: brightness(0.95); }
      .lk-preview-iframe {
        flex: 1; width: 100%; border: 0; background: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  // Bouw URL met code + preview-flag
  const conceptDeel = conceptSleutel ? `&previewConcept=${encodeURIComponent(conceptSleutel)}` : '';
  const url = lkKindAppUrl(code) + '&preview=1' + conceptDeel;
  const naamWeergave = naam || code;

  // Verwijder bestaande popup als die er nog is
  const oud = document.getElementById('lk-preview-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-preview-bg';
  bg.className = 'lk-preview-bg';
  bg.onclick = (e) => { if (e.target === bg) lkSluitPreview(); };

  bg.innerHTML = `
    <div class="lk-preview-doos">
      <div class="lk-preview-kop">
        <div class="lk-preview-titel">
          👁️ Preview taak van ${naamWeergave}
          <span class="lk-preview-uitleg">— niets wordt bewaard</span>
        </div>
        <button class="lk-preview-sluit" onclick="lkSluitPreview()">✕ Sluiten</button>
      </div>
      <div class="lk-preview-skipbalk">
        <span class="lk-preview-skipbalk-uitleg">Snel doorbladeren?</span>
        <button class="lk-preview-skipknop" onclick="lkPreviewSkip()">⏭️ Volgende oefenvorm</button>
      </div>
      <iframe class="lk-preview-iframe" id="lk-preview-iframe" src="${url}" title="Preview voor leerkracht"></iframe>
    </div>
  `;
  document.body.appendChild(bg);
}

// Test de keuzes die nu in het taakvenster staan, zonder de taak te bewaren.
// Het concept blijft uitsluitend in dit browsertabblad en wordt in preview-modus
// in het kindscherm geladen. Firebase en de echte leerlingtaak wijzigen niet.
function lkTestHuidigeTaakkeuzes() {
  if (!_taakModalThemaId || _taakModalWoordIds.size === 0) {
    alert('Kies eerst een thema en minstens één woord.');
    return;
  }
  if (_taakModalVaardigheden.size === 0) {
    alert('Vink eerst minstens één vaardigheid aan.');
    return;
  }

  const code = _taakModalKindCode || _taakModalDoelCodes[0];
  if (!code) {
    alert('Kies eerst een leerling om de testweergave te openen.');
    return;
  }

  const concept = {
    themaId: _taakModalThemaId,
    woordIds: [..._taakModalWoordIds],
    vaardigheden: [..._taakModalVaardigheden],
    oefenvormen_luisteren: [..._taakModalOefenvormenLuisteren],
    oefenvormen_lezen: [..._taakModalOefenvormenLezen],
    oefenvormen_schrijven: [..._taakModalOefenvormenSchrijven],
    toetsen: [..._taakModalToetsen],
    zinscontext: _taakModalZinscontext,
    huidigeFase: 'leren',
    status: 'bezig',
    foutWoordenLaatsteToets: [],
    aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 },
    gestart: Date.now(),
    toegewezenOp: Date.now(),
    toegewezenDoorRol: 'preview',
    doel: _taakModalDoel.trim(),
    bronGroepNaam: _taakModalGroepsnaam || '',
    vrijHerhalenNaAfronding: _taakModalVrijHerhalen
  };

  const sleutel = 'taalgroei-preview-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  sessionStorage.setItem(sleutel, JSON.stringify(concept));
  const kind = lkKinderen.find(k => k.code === code);
  const naam = kind ? lkVolledigeNaam(kind) : code;
  lkPreviewTaak(code, naam, sleutel);
}

// Roep de skip-functie aan in de iframe (kind-app).
function lkPreviewSkip() {
  const iframe = document.getElementById('lk-preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  try {
    if (typeof iframe.contentWindow.taakPreviewVolgendeOefenvorm === 'function') {
      iframe.contentWindow.taakPreviewVolgendeOefenvorm();
    } else {
      console.warn('Skip-functie niet gevonden in iframe');
    }
  } catch (e) {
    console.warn('Skip mislukt:', e);
  }
}

function lkSluitPreview() {
  const bg = document.getElementById('lk-preview-bg');
  if (bg) bg.remove();
}

// Lijst van alle verwachte thema-globals
const VERWACHTE_THEMAS_LK = [
  ['THEMA_STARTPAKKET', 'startpakket.js'],
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
    if (window.SchoolSessie && typeof window.SchoolSessie.wachtTotKlaar === 'function') {
      await window.SchoolSessie.wachtTotKlaar();
    }
    try {
      window.firebase.initializeApp(window.FIREBASE_CONFIG);
    } catch (e) { /* al geinit */ }
    await Voortgang.init();
    if (window.Woordenbeheer) {
      Woordenbeheer.init();
      try { await Woordenbeheer.laad(); } catch (e) { console.warn('Woordenbeheer kon niet laden:', e); }
    }
    // Schooljaren laden VOOR kinderen, zodat we kunnen filteren op actief schooljaar
    await lkSchooljarenInit();
    await lkLaadKinderen();
    // Vul welkom-stats meteen na het laden van de leerlingen.
    lkVulWelkomStats();
    // Periodes laden + eventueel eerste-keer-modal tonen
    await lkPeriodesInit();
    // Schooljaar-balk renderen (DOM moet al klaar zijn)
    if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
    // Check of migratie naar multi-schooljaar nodig is — eenmalig prompt
    try {
      const nodig = await Voortgang.migratieNodig();
      if (nodig && !sessionStorage.getItem('migratie-prompt-getoond')) {
        sessionStorage.setItem('migratie-prompt-getoond', '1');
        setTimeout(() => {
          const wil = confirm(
            '🔧 Update beschikbaar: multi-schooljaar systeem\n\n' +
            'Je data is nog op het oude formaat (zonder schooljaar-laag). ' +
            'We kunnen ze nu migreren — dit voegt een schooljaar-koppeling toe aan al je leerlingen, ' +
            'periodes en rapporten.\n\n' +
            'Wil je nu de migratie-modal openen? (Eerst dry-run, dan pas écht uitvoeren — geen risico.)'
          );
          if (wil) lkSchooljaarMigratieModal();
        }, 800);
      }
    } catch (e) { /* stil falen */ }
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
  if (tab === 'taalgroei' && window.Taalgroei) Taalgroei.open();
  if (tab === 'taken') lkKindtabsRender('taken');
  if (tab === 'spreken') lkKindtabsRender('spreken');
  if (tab === 'rapporten') lkKindtabsRender('rapporten');
  if (tab === 'puntenboek') lkKindtabsRender('puntenboek');

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
  // Rapporten en puntenboek: twee-laagse tabs (klas → namen)
  rapporten: { gekozenCode: null, gekozenKlas: null },
  puntenboek: { gekozenCode: null, gekozenKlas: null }
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

// Zelfde alfabetische regel voor lijsten die niet eerst per klas groeperen.
function _lkVergelijkOpAchternaam(a, b) {
  const achter = (a.achternaam || '').localeCompare(b.achternaam || '', 'nl-BE', { sensitivity: 'base' });
  if (achter) return achter;
  const voor = (a.voornaam || '').localeCompare(b.voornaam || '', 'nl-BE', { sensitivity: 'base' });
  if (voor) return voor;
  return lkVolledigeNaam(a).localeCompare(lkVolledigeNaam(b), 'nl-BE', { sensitivity: 'base' });
}

// Render kindertabs + content voor een specifieke tab ('taken'|'spreken'|'rapporten'|'puntenboek')
function lkKindtabsRender(welkeTab) {
  // Als geen argument: render alle (gebruikt na laden van leerlingen)
  if (!welkeTab) {
    ['taken', 'spreken', 'rapporten', 'puntenboek'].forEach(t => lkKindtabsRender(t));
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

  // Twee-laagse tabs alleen voor rapporten en puntenboek (compacte weergave bij vele klassen)
  const tweeLaags = (welkeTab === 'rapporten' || welkeTab === 'puntenboek');

  let tabsHtml = '';

  if (tweeLaags) {
    // CSS één keer injecteren voor de klas-tabs
    _lkInjecteerKlasTabsCSS();

    // Bepaal actieve klas: indien niet gezet of niet meer bestaand, neem klas van gekozen kind
    const huidigKind = gesorteerd.find(k => k.code === state.gekozenCode);
    const klasVanHuidig = huidigKind && huidigKind.klas ? huidigKind.klas.trim() : '';
    const klasLabels = klassen.map(g => g.klas);
    if (!state.gekozenKlas || klasLabels.indexOf(state.gekozenKlas) === -1) {
      state.gekozenKlas = klasLabels.indexOf(klasVanHuidig) !== -1 ? klasVanHuidig : klasLabels[0];
    }

    // Bouw klas-tabs (eerste rij) + namen-tabs (tweede rij, gefilterd op gekozen klas)
    tabsHtml += '<div class="lk-klastabs-rij">';
    klassen.forEach(groep => {
      const klasLabel = groep.klas || 'Geen klas';
      const actief = (groep.klas === state.gekozenKlas) ? 'actief' : '';
      const aantal = groep.kinderen.length;
      const klasSafe = (groep.klas || '').replace(/'/g, "\\'");
      tabsHtml += `<button class="lk-klastab ${actief}" onclick="lkKindtabKiesKlas('${welkeTab}', '${klasSafe}')">${klasLabel} <span class="lk-klastab-aantal">(${aantal})</span></button>`;
    });
    tabsHtml += '</div>';

    // Namenrij: alleen kinderen van de gekozen klas
    const huidigeGroep = klassen.find(g => g.klas === state.gekozenKlas);
    if (huidigeGroep) {
      // Als gekozenCode niet in deze klas zit, schuif door naar eerste van deze klas
      const codesInKlas = huidigeGroep.kinderen.map(k => k.code);
      if (codesInKlas.indexOf(state.gekozenCode) === -1) {
        state.gekozenCode = codesInKlas[0];
      }
      tabsHtml += '<div class="lk-namentabs-rij">';
      huidigeGroep.kinderen.forEach(k => {
        const actief = (k.code === state.gekozenCode) ? 'actief' : '';
        const naam = lkVolledigeNaam(k);
        const codeSafe = k.code.replace(/'/g, "\\'");
        tabsHtml += `<button class="lk-kindtab ${actief}" onclick="lkKindtabKies('${welkeTab}', '${codeSafe}')">${naam}</button>`;
      });
      tabsHtml += '</div>';
    }
  } else {
    // Bestaande oudere weergave: klaslabels tussen de namen door (taken + spreken)
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
  }

  tabsEl.innerHTML = tabsHtml;

  // Content renderen op basis van tab
  const kind = lkKinderen.find(k => k.code === state.gekozenCode);
  if (welkeTab === 'taken') {
    inhoudEl.innerHTML = _lkRendererTaken(kind);
  } else if (welkeTab === 'spreken') {
    inhoudEl.innerHTML = _lkRendererSpreektoetsen(kind);
  } else if (welkeTab === 'rapporten') {
    inhoudEl.innerHTML = _lkRendererRapporten(kind);
  } else if (welkeTab === 'puntenboek') {
    inhoudEl.innerHTML = _lkRendererPuntenboek(kind);
  }
}

function lkKindtabKies(welkeTab, code) {
  const state = _lkKindtabsState[welkeTab];
  if (!state) return;
  state.gekozenCode = code;
  lkKindtabsRender(welkeTab);
}

// Voor twee-laagse tabs (rapporten, puntenboek): klas kiezen.
// Schuift gekozenCode automatisch door naar eerste kind van die klas.
function lkKindtabKiesKlas(welkeTab, klas) {
  const state = _lkKindtabsState[welkeTab];
  if (!state) return;
  state.gekozenKlas = klas;
  // Schuif gekozenCode naar eerste kind van deze klas (als huidige niet in deze klas zit)
  const kinderenInKlas = lkKinderen.filter(k => {
    const kKlas = (k.klas || '').trim();
    return kKlas === klas;
  });
  if (kinderenInKlas.length > 0) {
    const huidigInKlas = kinderenInKlas.some(k => k.code === state.gekozenCode);
    if (!huidigInKlas) {
      // Sorteren binnen de klas op achternaam → voornaam
      kinderenInKlas.sort((a, b) => _lkSortSleutel(a).localeCompare(_lkSortSleutel(b)));
      state.gekozenCode = kinderenInKlas[0].code;
    }
  }
  lkKindtabsRender(welkeTab);
}

// CSS voor klas-tabs en namen-tabs in rapporten/puntenboek.
// Eenmalig injecteren — geen styling-bestand om te wijzigen.
function _lkInjecteerKlasTabsCSS() {
  if (document.getElementById('lk-klastabs-style')) return;
  const style = document.createElement('style');
  style.id = 'lk-klastabs-style';
  style.textContent = `
    .lk-klastabs-rij {
      display: flex; gap: 8px; flex-wrap: wrap;
      margin-bottom: 10px; padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .lk-klastab {
      background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 8px 16px; font-size: 14px; font-weight: 600;
      color: #374151; cursor: pointer;
      transition: all 0.15s;
    }
    .lk-klastab:hover {
      background: #fefce8; border-color: #fbbf24;
    }
    .lk-klastab.actief {
      background: var(--kleur-zisa, #ffd166); border-color: #f59e0b;
      color: #1f2937;
    }
    .lk-klastab-aantal {
      font-size: 12px; font-weight: 400; opacity: 0.7;
      margin-left: 2px;
    }
    .lk-namentabs-rij {
      display: flex; gap: 6px; flex-wrap: wrap;
      margin-bottom: 12px;
    }
  `;
  document.head.appendChild(style);
}

// === Renderer: TAKEN ===
function _lkRendererTaken(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  const naamSafe = (kind.naam || '').replace(/'/g, "\\'");

  // Bouw lijst: huidige taak (indien) bovenaan + geschiedenis
  let html = `
    <div class="lk-kind-acties">
      <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkOpenKindBeheer('${kind.code}', '${naamSafe}')">📋 Taken &amp; vrije thema\u2019s</button>
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

  const gepland = Array.isArray(kind.taakwachtrij) ? kind.taakwachtrij : [];
  gepland.forEach((taak, idx) => {
    items.push({
      taak,
      isHuidig: false,
      isGepland: true,
      geplandIdx: idx,
      tijd: taak.toegewezenOp || taak.gestart || 0,
      sorteerTijd: taak.toegewezenOp || taak.gestart || 0
    });
  });

  const gesch = Array.isArray(kind.taakgeschiedenis) ? kind.taakgeschiedenis : [];
  gesch.forEach((arch, idx) => {
    // Voor de zichtbare datum gebruiken we 'gestart' als primair (= wanneer
    // de leerkracht de taak aanmaakte), en voltooidOp alleen als fallback.
    // Sorteren gebeurt op voltooidOp (= wanneer gearchiveerd) zodat recente
    // archiveringen bovenaan staan, maar de getoonde datum is wel de start-datum.
    items.push({
      taak: arch,
      isHuidig: false,
      archiefIdx: idx,
      tijd: arch.gestart || arch.voltooidOp || 0,
      sorteerTijd: arch.voltooidOp || arch.gestart || 0
    });
  });

  // Sorteer op archief-tijd (voltooidOp), zodat recent gearchiveerde taken bovenaan
  items.sort((a, b) => (b.sorteerTijd || b.tijd) - (a.sorteerTijd || a.tijd));

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
    if (entry.isGepland) {
      statusBadge = '<span class="lk-status-badge bezig">🗓️ gepland</span>';
      scoreTekst = `${aantalW} woorden`;
    } else if (t.status === 'voltooid') {
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

    // Heeft deze taak een afgenomen toets?
    //   - Nieuwe taken: kijk naar toetsResultaten (per vaardigheid)
    //   - Oude taken: val terug op foutWoordenLaatsteToets + status
    let heeftToets = false;
    if (t.toetsResultaten) {
      heeftToets = ['luisteren', 'lezen', 'schrijven'].some(v =>
        t.toetsResultaten[v] && t.toetsResultaten[v].afgenomen
      );
    }
    if (!heeftToets) {
      heeftToets = (Array.isArray(t.foutWoordenLaatsteToets) && t.foutWoordenLaatsteToets.length > 0)
                   || t.status === 'voltooid' || t.status === 'moeilijk' || t.status === 'haperde';
    }

    // PDF-knop alleen als toets is afgenomen
    let pdfKnop = '';
    if (heeftToets) {
      if (entry.isHuidig) {
        pdfKnop = `<button class="lk-knop-mini" onclick="lkTaakPdfHuidig('${kind.code}')" title="PDF van de afgenomen toetsen">📄</button>`;
      } else {
        pdfKnop = `<button class="lk-knop-mini" onclick="lkTaakPdfVanGeschiedenis('${kind.code}', ${entry.archiefIdx})" title="PDF van de afgenomen toetsen">📄</button>`;
      }
    }

    // Werkblad-knop — altijd zichtbaar (huidig én archief)
    let wbKnop = '';
    if (entry.isHuidig) {
      wbKnop = `<button class="lk-knop-mini" onclick="lkTaakWerkbladen('${kind.code}', 'huidig')" title="Werkbladen maken met deze woorden">📝</button>`;
    } else if (!entry.isGepland) {
      wbKnop = `<button class="lk-knop-mini" onclick="lkTaakWerkbladen('${kind.code}', ${entry.archiefIdx})" title="Werkbladen maken met deze woorden">📝</button>`;
    }

    // Bewerken + wissen + preview logica:
    //   - Huidige taak  → 👁️ bekijken + ✏️ bewerken + 🗑️ wissen
    //   - Archief-taak  → 🗑️ wissen (verwijdert uit geschiedenis)
    let bewerkKnop = '';
    let wisKnop = '';
    let previewKnop = '';
    if (entry.isHuidig) {
      const naamSafe2 = (kind.naam || '').replace(/'/g, "\\'");
      previewKnop = `<button class="lk-knop-mini" onclick="lkPreviewTaak('${kind.code}', '${naamSafe2}')" title="Bekijk de taak zoals het kind hem ziet (zonder voortgang aan te tasten)">👁️</button>`;
      bewerkKnop = `<button class="lk-knop-mini" onclick="lkBeheerTaak('${kind.code}', '${naamSafe2}')" title="Extra taak plannen">➕</button>`;
      wisKnop = `<button class="lk-knop-mini gevaar" onclick="lkTaakWissenDirect('${kind.code}')" title="Huidige taak wissen">🗑️</button>`;
    } else if (entry.isGepland) {
      wisKnop = `<button class="lk-knop-mini gevaar" onclick="lkGeplandeTaakWissen('${kind.code}', '${t.taakId || ''}', ${entry.geplandIdx})" title="Geplande taak verwijderen">🗑️</button>`;
    } else {
      wisKnop = `<button class="lk-knop-mini gevaar" onclick="lkTaakArchiefWissen('${kind.code}', ${entry.archiefIdx})" title="Uit geschiedenis verwijderen">🗑️</button>`;
    }

    const huidigBadge = entry.isHuidig ? '<span class="lk-huidig-badge">huidig</span>'
      : (entry.isGepland ? '<span class="lk-huidig-badge">volgende</span>' : '');
    const meta = `${_taakVeiligeTekst(t.toegewezenDoorRol || 'leerkracht')}${t.doel ? ' · ' + _taakVeiligeTekst(t.doel) : ''}`;

    html += `
      <div class="lk-taakrij ${entry.isHuidig ? 'huidig' : ''}">
        <span class="lk-taakrij-datum">${dStr}</span>
        <span class="lk-taakrij-thema">${themaNaam} ${huidigBadge}<small>${meta}</small></span>
        <span class="lk-taakrij-status">${statusBadge}</span>
        <span class="lk-taakrij-score">${scoreTekst}</span>
        <span class="lk-taakrij-acties">${previewKnop}${bewerkKnop}${wbKnop}${pdfKnop}${wisKnop}</span>
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

    // Bepaal status: 'klaargezet' of 'afgenomen'
    const isKlaargezet = (st.status === 'klaargezet');

    // Tellen met backward-compat helpers
    let v = 0, a = 0, n = 0;
    Object.values(st.perWoord || {}).forEach(r => {
      const o = sprWoordOordeel(r);
      if (o === 'vlot') v++;
      else if (o === 'aarzelt') a++;
      else if (o === 'niet') n++;
    });
    const totaal = v + a + n;
    const aantalWoorden = Array.isArray(st.woordIds) ? st.woordIds.length : totaal;

    const idSafe = st.id ? st.id.replace(/'/g, "\\'") : '';

    // Acties verschillen per status
    let acties = '';
    if (isKlaargezet && idSafe) {
      // Klaargezet: play-knop om afname te starten + vuilbakje
      acties = `
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkSprStartKlaargezetteAfname('${kind.code}', '${idSafe}')" title="Start de afname met het kind">▶ Afnemen</button>
        <button class="lk-knop-mini gevaar" onclick="lkSprVerwijder('${kind.code}', '${idSafe}')" title="Verwijderen">🗑️</button>
      `;
    } else if (idSafe) {
      // Afgenomen: PDF-knop + vuilbakje
      acties = `
        <button class="lk-knop-mini" onclick="lkSprPdfVanGeschiedenis('${kind.code}', '${idSafe}')" title="PDF voor toetsenmap">📄</button>
        <button class="lk-knop-mini gevaar" onclick="lkSprVerwijder('${kind.code}', '${idSafe}')" title="Verwijderen">🗑️</button>
      `;
    }

    // Status-weergave
    let statusHtml = '';
    if (isKlaargezet) {
      statusHtml = `<span class="lk-spr-status-klaargezet">📅 klaargezet · ${aantalWoorden} woord${aantalWoorden === 1 ? '' : 'en'}</span>`;
    } else {
      statusHtml = `
        <span class="lk-spr-cijfer vlot">✓ ${v}</span>
        <span class="lk-spr-cijfer aarzelt">🤔 ${a}</span>
        <span class="lk-spr-cijfer niet">✗ ${n}</span>
      `;
    }

    html += `
      <div class="lk-taakrij ${isKlaargezet ? 'klaargezet' : ''}">
        <span class="lk-taakrij-datum">${dStr}</span>
        <span class="lk-taakrij-thema">${themaNaam}</span>
        <span class="lk-taakrij-status">
          ${statusHtml}
        </span>
        <span class="lk-taakrij-score">${isKlaargezet ? '' : totaal + ' w.'}</span>
        <span class="lk-taakrij-acties">${acties}</span>
      </div>
    `;
  });
  html += '</div>';

  return html;
}

// === Renderer: RAPPORTEN ===
function _lkRendererRapporten(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  // Toon meteen de placeholder; data wordt asynchroon geladen
  const html = _lkRapInlinePlaceholder(kind);

  // Trigger de async data-load + render direct na deze sync return
  setTimeout(() => {
    if (typeof _lkRapInlineLaden === 'function') {
      _lkRapInlineLaden(kind);
    }
  }, 0);

  return html;
}

// === Renderer: PUNTENBOEK ===
function _lkRendererPuntenboek(kind) {
  if (!kind) return '<p class="lk-kind-leeg">Geen leerling geselecteerd.</p>';

  // Sync placeholder + async laden
  const html = `
    <div id="lk-pb-inline" class="lk-pb-inline" data-code="${kind.code}">
      <div class="lk-rap-inline-laden"><p>⏳ Bezig met laden…</p></div>
    </div>
  `;
  setTimeout(() => {
    if (typeof _lkPuntenboekLaden === 'function') {
      _lkPuntenboekLaden(kind);
    }
  }, 0);
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

// =================================================================
//  SCHOOLJAREN — context-laag bovenop rapportperiodes
// =================================================================

let _schooljaren = [];        // alle schooljaren
let _actiefSchooljaar = null; // huidig geselecteerd schooljaar-object

// Init schooljaren-laag. Idempotent: ook veilig om opnieuw aan te roepen.
async function lkSchooljarenInit() {
  try {
    _schooljaren = await Voortgang.alleSchooljaren();
    // Default: meest recente actieve, anders meest recente, anders null
    _actiefSchooljaar = _schooljaren.find(s => s.status === 'actief')
      || _schooljaren[0]
      || null;
  } catch (e) {
    console.warn('Schooljaren laden mislukt:', e);
    _schooljaren = [];
    _actiefSchooljaar = null;
  }
}

// Wissel naar een ander schooljaar (bv. archief bekijken)
async function lkWisselSchooljaar(schooljaarId) {
  if (!schooljaarId) return;
  const sj = (_schooljaren || []).find(s => s.id === schooljaarId);
  if (!sj) return;
  _actiefSchooljaar = sj;
  // UI bijwerken: kinder-lijst, periode-lijst etc.
  await lkLaadKinderen();
  // Re-render alle relevante onderdelen
  if (typeof _lkPeriodeBalkRenderer === 'function') _lkPeriodeBalkRenderer();
  if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
}

// Renderer voor schooljaar-balk (parallel aan periode-balk)
function _lkSchooljaarBalkRenderer() {
  const el = document.getElementById('lk-schooljaar-naam');
  if (!el) return;
  if (!_actiefSchooljaar) {
    el.innerHTML = '<em style="opacity:0.6">geen schooljaar</em>';
    return;
  }
  const status = _actiefSchooljaar.status === 'archief' ? ' <span class="lk-sj-badge archief">archief</span>' : '';
  el.innerHTML = `<strong>${_actiefSchooljaar.id}</strong>${status}`;
}

// Schooljaar-menu open/dicht
function lkSchooljaarMenuToggle() {
  const menu = document.getElementById('lk-schooljaar-menu');
  if (!menu) return;
  const open = menu.classList.contains('open');
  if (open) {
    menu.classList.remove('open');
    return;
  }
  _lkSchooljaarMenuRenderer();
  menu.classList.add('open');
  setTimeout(() => {
    document.addEventListener('click', _lkSchooljaarMenuSluit, { once: true });
  }, 0);
}

function _lkSchooljaarMenuSluit(ev) {
  const menu = document.getElementById('lk-schooljaar-menu');
  const knop = document.getElementById('lk-schooljaar-knop');
  if (!menu) return;
  if (knop && knop.contains(ev.target)) return;
  if (menu.contains(ev.target)) {
    setTimeout(() => {
      document.addEventListener('click', _lkSchooljaarMenuSluit, { once: true });
    }, 0);
    return;
  }
  menu.classList.remove('open');
}

function _lkSchooljaarMenuRenderer() {
  const menu = document.getElementById('lk-schooljaar-menu');
  if (!menu) return;
  let html = '';

  if (_schooljaren.length === 0) {
    html += '<div class="lk-sj-menu-leeg">Nog geen schooljaren ingesteld.</div>';
  } else {
    const actieve = _schooljaren.filter(s => s.status === 'actief');
    const archief = _schooljaren.filter(s => s.status === 'archief');

    if (actieve.length > 0) {
      html += '<div class="lk-sj-menu-kop">Actief schooljaar</div>';
      actieve.forEach(s => { html += _lkSchooljaarMenuItem(s); });
    }
    if (archief.length > 0) {
      html += '<div class="lk-sj-menu-kop">Archief</div>';
      archief.forEach(s => { html += _lkSchooljaarMenuItem(s); });
    }
  }

  // Acties
  html += '<div class="lk-sj-menu-acties">';
  html += '<button class="lk-knop-mini" onclick="lkSchooljaarNieuwModal()">➕ Nieuw schooljaar starten</button>';
  // Migratie-knop alleen tonen als nog nodig
  html += '<button class="lk-knop-mini" id="lk-sj-migratie-knop" onclick="lkSchooljaarMigratieModal()" style="display:none">🔧 Data migreren naar multi-schooljaar</button>';
  html += '</div>';

  menu.innerHTML = html;

  // Check of migratie nodig is, toon knop indien zo
  if (typeof Voortgang !== 'undefined' && Voortgang.migratieNodig) {
    Voortgang.migratieNodig().then(nodig => {
      const knop = document.getElementById('lk-sj-migratie-knop');
      if (knop && nodig) knop.style.display = '';
    }).catch(() => { /* stil falen */ });
  }
}

function _lkSchooljaarMenuItem(sj) {
  const isActief = (_actiefSchooljaar && _actiefSchooljaar.id === sj.id);
  const badge = sj.status === 'actief'
    ? '<span class="lk-sj-badge actief">actief</span>'
    : '<span class="lk-sj-badge archief">archief</span>';
  const aantal = Array.isArray(sj.kinderen) ? sj.kinderen.length : 0;
  const periodes = Array.isArray(sj.rapportperiodes) ? sj.rapportperiodes.length : 0;
  const huidigKlasse = isActief ? ' lk-sj-menu-item-huidig' : '';
  return `
    <div class="lk-sj-menu-item${huidigKlasse}" onclick="lkWisselSchooljaar('${sj.id}')">
      <div class="lk-sj-menu-info">
        <strong>${sj.id}</strong> ${badge}
        <span class="lk-sj-kleine">${aantal} leerling${aantal === 1 ? '' : 'en'} · ${periodes} periode${periodes === 1 ? '' : 's'}</span>
      </div>
      ${isActief ? '<span class="lk-sj-checkmark">✓</span>' : ''}
    </div>
  `;
}

// =================================================================
//  Schooljaar aanmaken — eenvoudige modal of doorstroom-wizard
// =================================================================

// Open eerste-stap modal: kies actie (nieuw + leeg, of doorstroom-wizard)
function lkSchooljaarNieuwModal() {
  // Sluit menu
  const menu = document.getElementById('lk-schooljaar-menu');
  if (menu) menu.classList.remove('open');

  const oud = document.getElementById('lk-sj-modal-bg');
  if (oud) oud.remove();

  // Bepaal voorstel-schooljaar (volgende t.o.v. huidig)
  let voorstelId = '';
  if (_actiefSchooljaar && _actiefSchooljaar.id) {
    const m = _actiefSchooljaar.id.match(/^(\d{4})-(\d{4})$/);
    if (m) {
      const start = parseInt(m[1]) + 1;
      voorstelId = `${start}-${start + 1}`;
    }
  }
  if (!voorstelId) {
    voorstelId = Voortgang.bepaalSchooljaarUitDatum(Date.now());
  }

  const heeftHuidig = !!_actiefSchooljaar;
  const heeftKinderen = Array.isArray(lkKinderen) && lkKinderen.length > 0;

  const bg = document.createElement('div');
  bg.id = 'lk-sj-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>🎒 Nieuw schooljaar starten</h2>
      <p class="modal-uitleg">
        Je opent hier het nieuwe werkjaar voor Taalgroei en kiest alleen met welke leerlingen je <strong>voorlopig</strong> start.
        Tijdens het hele schooljaar kan je nog kinderen toevoegen, uit een taalgroep halen of naar een andere taalgroep verplaatsen. Hun eerdere resultaten blijven bewaard.
        Alleen het vorige schooljaar verhuist naar het archief.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Schooljaar</label>
        <input type="text" class="lk-taak-select" id="sj-id" value="${voorstelId}" placeholder="2026-2027">
        <p class="lk-school-tip">Format: YYYY-YYYY (loopt van 1 september tot 31 augustus)</p>
      </div>

      <div class="lk-cat-modal-knoppen" style="flex-direction:column;gap:8px">
        ${heeftHuidig && heeftKinderen ? `
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166);width:100%;padding:11px" onclick="lkSchooljaarStartDoorstroom()">
          🎓 Startselectie maken uit bestaande leerlingen
        </button>` : ''}
        <button class="lk-knop-mini" style="width:100%;padding:11px" onclick="lkSchooljaarStartLeeg()">
          ✨ Leeg starten en leerlingen later kiezen
        </button>
        <button class="lk-knop-mini" style="width:100%" onclick="document.getElementById('lk-sj-modal-bg').remove()">
          Annuleren
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
  setTimeout(() => {
    const idEl = document.getElementById('sj-id');
    if (idEl) idEl.focus();
  }, 50);
}

// Optie 1: leeg schooljaar (geen kinderen overnemen)
async function lkSchooljaarStartLeeg() {
  const sjId = (document.getElementById('sj-id') || {}).value || '';
  if (!sjId.match(/^\d{4}-\d{4}$/)) {
    alert('Schooljaar moet de vorm YYYY-YYYY hebben (bv. 2026-2027).');
    return;
  }

  const bevestiging = confirm(
    `Wil je een nieuw schooljaar "${sjId}" aanmaken zonder leerlingen?\n\n` +
    `Het huidige schooljaar "${(_actiefSchooljaar && _actiefSchooljaar.id) || '—'}" wordt gearchiveerd. ` +
    `Je kan later leerlingen toevoegen via de "+ Nieuwe leerling" knop.`
  );
  if (!bevestiging) return;

  try {
    // Archiveer huidig schooljaar
    if (_actiefSchooljaar) {
      await Voortgang.archiveerSchooljaar(_actiefSchooljaar.id);
    }
    // Maak nieuw aan
    await Voortgang.maakSchooljaar(sjId, { kinderen: [], klasPerKind: {} });
    // Cleanup oude schooljaren (max 3)
    await Voortgang.ruimOudeSchooljarenOp(3);
    // Refresh
    await lkSchooljarenInit();
    if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
    await lkLaadKinderen();
    document.getElementById('lk-sj-modal-bg').remove();
  } catch (e) {
    console.error('Schooljaar aanmaken faalde:', e);
    alert('Schooljaar aanmaken faalde: ' + (e.message || 'onbekend'));
  }
}

// Optie 2: doorstroom-wizard
function lkSchooljaarStartDoorstroom() {
  const sjId = (document.getElementById('sj-id') || {}).value || '';
  if (!sjId.match(/^\d{4}-\d{4}$/)) {
    alert('Schooljaar moet de vorm YYYY-YYYY hebben (bv. 2026-2027).');
    return;
  }

  // Sluit huidige modal
  const oud = document.getElementById('lk-sj-modal-bg');
  if (oud) oud.remove();

  // Open doorstroom-wizard
  _lkSchooljaarDoorstroomModal(sjId);
}

// =================================================================
//  Doorstroom-wizard — selectie kinderen + nieuwe klas
// =================================================================

let _lkDoorstroomState = {
  schooljaarId: null,
  geselecteerd: {},  // { kindCode: true/false }
  klasPerKind: {}    // { kindCode: nieuweKlas }
};

function _lkSchooljaarDoorstroomModal(schooljaarId) {
  const oud = document.getElementById('lk-sj-modal-bg');
  if (oud) oud.remove();

  // Init state: alle huidige kinderen geselecteerd, klas blijft hetzelfde
  _lkDoorstroomState = {
    schooljaarId: schooljaarId,
    geselecteerd: {},
    klasPerKind: {}
  };
  (lkKinderen || []).forEach(k => {
    _lkDoorstroomState.geselecteerd[k.code] = true;
    _lkDoorstroomState.klasPerKind[k.code] = k.klas || '';
  });

  const bg = document.createElement('div');
  bg.id = 'lk-sj-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) {
    if (confirm('De doorstroom-wizard sluiten? Niet-bewaarde wijzigingen gaan verloren.')) bg.remove();
  } };

  bg.innerHTML = `
    <div class="lk-cat-modal lk-doorstroom-modal" onclick="event.stopPropagation()">
      <h2>🎓 Doorstroom naar ${schooljaarId}</h2>
      <p class="modal-uitleg">
        Kies met welke leerlingen je bij de start begint en pas hun klas aan indien nodig.
        Deze keuze staat niet vast: je kan tijdens ${schooljaarId} nog leerlingen toevoegen of verwijderen uit Taalgroei en je taalgroepen blijven aanpassen.
        Niet-aangevinkte leerlingen behouden hun eerdere gegevens.
      </p>

      <div class="lk-doorstroom-acties">
        <button class="lk-knop-mini" onclick="lkDoorstroomKiesAlle(true)">✓ Alle aanvinken</button>
        <button class="lk-knop-mini" onclick="lkDoorstroomKiesAlle(false)">✗ Alle uitvinken</button>
      </div>

      <div class="lk-doorstroom-lijst" id="lk-doorstroom-lijst">
        ${_lkDoorstroomLijstHtml()}
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-sj-modal-bg').remove()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkDoorstroomBevestigen()">✓ Schooljaar starten</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
}

function _lkDoorstroomLijstHtml() {
  if (!lkKinderen || lkKinderen.length === 0) {
    return '<p class="lk-kind-leeg">Geen leerlingen om mee te nemen.</p>';
  }
  // Sorteer op klas, dan op naam
  const gesorteerd = lkKinderen.slice().sort((a, b) => {
    const klasA = (a.klas || '').toLowerCase();
    const klasB = (b.klas || '').toLowerCase();
    if (klasA !== klasB) return klasA.localeCompare(klasB);
    return _lkVergelijkOpAchternaam(a, b);
  });

  return gesorteerd.map(k => {
    const aan = !!_lkDoorstroomState.geselecteerd[k.code];
    const nieuweKlas = _lkDoorstroomState.klasPerKind[k.code] || '';
    const naam = lkVolledigeNaam ? lkVolledigeNaam(k) : (k.naam || k.code);
    return `
      <div class="lk-doorstroom-rij ${aan ? 'aan' : ''}" data-code="${k.code}">
        <input type="checkbox" ${aan ? 'checked' : ''} onclick="lkDoorstroomToggle('${k.code}')">
        <span class="lk-doorstroom-naam">${naam}</span>
        <span class="lk-doorstroom-pijl">${k.klas || '—'} →</span>
        <input type="text" class="lk-doorstroom-klas" placeholder="nieuwe klas" value="${nieuweKlas}" oninput="lkDoorstroomZetKlas('${k.code}', this.value)" ${aan ? '' : 'disabled'}>
      </div>
    `;
  }).join('');
}

function lkDoorstroomToggle(kindCode) {
  _lkDoorstroomState.geselecteerd[kindCode] = !_lkDoorstroomState.geselecteerd[kindCode];
  const lijst = document.getElementById('lk-doorstroom-lijst');
  if (lijst) lijst.innerHTML = _lkDoorstroomLijstHtml();
}

function lkDoorstroomKiesAlle(aan) {
  Object.keys(_lkDoorstroomState.geselecteerd).forEach(k => {
    _lkDoorstroomState.geselecteerd[k] = aan;
  });
  const lijst = document.getElementById('lk-doorstroom-lijst');
  if (lijst) lijst.innerHTML = _lkDoorstroomLijstHtml();
}

function lkDoorstroomZetKlas(kindCode, klas) {
  _lkDoorstroomState.klasPerKind[kindCode] = klas;
}

async function lkDoorstroomBevestigen() {
  const sjId = _lkDoorstroomState.schooljaarId;
  if (!sjId) return;

  // Verzamel geselecteerde kinderen + hun nieuwe klas
  const kinderenCodes = [];
  const klasPerKind = {};
  Object.keys(_lkDoorstroomState.geselecteerd).forEach(code => {
    if (_lkDoorstroomState.geselecteerd[code]) {
      kinderenCodes.push(code);
      klasPerKind[code] = (_lkDoorstroomState.klasPerKind[code] || '').trim();
    }
  });

  const bevestiging = confirm(
    `Klaar om schooljaar "${sjId}" te starten met ${kinderenCodes.length} leerling${kinderenCodes.length === 1 ? '' : 'en'}?\n\n` +
    `Het vorige schooljaar wordt gearchiveerd. Deze startselectie kan je tijdens het nieuwe schooljaar nog aanpassen.`
  );
  if (!bevestiging) return;

  const knop = document.querySelector('#lk-sj-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    // 1) Archiveer huidig schooljaar
    if (_actiefSchooljaar) {
      await Voortgang.archiveerSchooljaar(_actiefSchooljaar.id);
    }
    // 2) Maak nieuw schooljaar aan met geselecteerde kinderen
    await Voortgang.maakSchooljaar(sjId, { kinderen: kinderenCodes, klasPerKind: klasPerKind });
    // 3) Update kinderen: nieuwe actiefInSchooljaar + nieuwe klas
    for (const code of kinderenCodes) {
      const k = lkKinderen.find(x => x.code === code);
      const nieuweKlas = klasPerKind[code] || '';
      try {
        await Voortgang.wijzigKindGegevens(
          code,
          k ? (k.voornaam || '') : '',
          k ? (k.achternaam || '') : '',
          nieuweKlas
        );
      } catch (e) {
        console.warn(`Klas updaten faalde voor ${code}:`, e);
      }
    }
    // 4) Cleanup oude schooljaren
    await Voortgang.ruimOudeSchooljarenOp(3);
    // 5) Refresh UI
    await lkSchooljarenInit();
    if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
    await lkLaadKinderen();
    document.getElementById('lk-sj-modal-bg').remove();
    // Bevestiging
    setTimeout(() => alert(`Schooljaar ${sjId} is succesvol gestart!`), 100);
  } catch (e) {
    console.error('Doorstroom faalde:', e);
    alert('Doorstroom faalde: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '✓ Schooljaar starten'; }
  }
}

// =================================================================
//  Migratie-modal
// =================================================================

function lkSchooljaarMigratieModal() {
  // Sluit menu
  const menu = document.getElementById('lk-schooljaar-menu');
  if (menu) menu.classList.remove('open');

  const oud = document.getElementById('lk-sj-modal-bg');
  if (oud) oud.remove();

  const bg = document.createElement('div');
  bg.id = 'lk-sj-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>🔧 Data migreren naar multi-schooljaar</h2>
      <p class="modal-uitleg">
        We voegen een schooljaar-laag toe aan je bestaande data: leerlingen, rapportperiodes en rapporten worden gekoppeld aan het juiste schooljaar.
        Eerst doen we een <strong>dry-run</strong> (geen wijzigingen) zodat we kunnen zien wat er gaat gebeuren.
      </p>

      <div id="lk-migratie-resultaat" style="margin-top:14px"></div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-sj-modal-bg').remove()">Sluiten</button>
        <button class="lk-knop-mini" id="lk-migratie-dry-knop" onclick="lkMigratieDryRun()">🔍 Dry-run</button>
        <button class="lk-knop-mini" id="lk-migratie-echt-knop" style="background:var(--kleur-zisa,#ffd166);display:none" onclick="lkMigratieEcht()">✓ Migratie nu echt uitvoeren</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
}

async function lkMigratieDryRun() {
  const knop = document.getElementById('lk-migratie-dry-knop');
  const resEl = document.getElementById('lk-migratie-resultaat');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  if (resEl) resEl.innerHTML = '<p>⏳ Bezig met dry-run...</p>';

  try {
    const rapport = await Voortgang.migreerNaarMultiSchooljaar(true);
    if (resEl) resEl.innerHTML = _formatMigratieRapport(rapport, true);
    // Toon de "echt uitvoeren"-knop
    const echtKnop = document.getElementById('lk-migratie-echt-knop');
    if (echtKnop) echtKnop.style.display = '';
    if (knop) { knop.textContent = '🔍 Dry-run opnieuw'; knop.disabled = false; }
  } catch (e) {
    console.error('Dry-run faalde:', e);
    if (resEl) resEl.innerHTML = `<p style="color:#c62828">⚠️ Dry-run faalde: ${e.message}</p>`;
    if (knop) { knop.textContent = '🔍 Dry-run'; knop.disabled = false; }
  }
}

async function lkMigratieEcht() {
  const bevestiging = confirm(
    'Migratie nu écht uitvoeren?\n\n' +
    'Dit schrijft naar Firestore. Zorg dat je een backup hebt gemaakt.\n\n' +
    'Doorgaan?'
  );
  if (!bevestiging) return;

  const knop = document.getElementById('lk-migratie-echt-knop');
  const resEl = document.getElementById('lk-migratie-resultaat');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    const rapport = await Voortgang.migreerNaarMultiSchooljaar(false);
    if (resEl) resEl.innerHTML = _formatMigratieRapport(rapport, false);
    // Refresh schooljaren
    await lkSchooljarenInit();
    if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
    await lkLaadKinderen();
    if (knop) { knop.textContent = '✓ Migratie voltooid'; }
  } catch (e) {
    console.error('Migratie faalde:', e);
    if (resEl) resEl.innerHTML += `<p style="color:#c62828">⚠️ Migratie faalde: ${e.message}</p>`;
    if (knop) { knop.textContent = '✓ Migratie nu echt uitvoeren'; knop.disabled = false; }
  }
}

function _formatMigratieRapport(rapport, isDryRun) {
  const titel = isDryRun ? '🔍 Dry-run resultaat' : '✓ Migratie uitgevoerd';
  let html = `<div class="lk-migratie-rapport">
    <h3>${titel}</h3>`;

  if (rapport.schooljarenAangemaakt.length > 0) {
    html += '<p><strong>Schooljaren aangemaakt:</strong></p><ul>';
    rapport.schooljarenAangemaakt.forEach(sj => {
      html += `<li>${sj.id} (${sj.periodes} periodes, status: ${sj.status})</li>`;
    });
    html += '</ul>';
  }
  html += `<p>📋 ${rapport.periodesGemigreerd} rapportperiodes ${isDryRun ? 'zouden gemigreerd worden' : 'gemigreerd'}</p>`;
  html += `<p>📄 ${rapport.rapportenGemigreerd} rapporten ${isDryRun ? 'zouden gemigreerd worden' : 'gemigreerd'}</p>`;
  html += `<p>👥 ${rapport.kinderenGemigreerd} leerlingen ${isDryRun ? 'zouden bijgewerkt worden' : 'bijgewerkt'}</p>`;

  if (rapport.waarschuwingen.length > 0) {
    html += '<p><strong style="color:#f57c00">⚠️ Waarschuwingen:</strong></p><ul>';
    rapport.waarschuwingen.forEach(w => { html += `<li>${w}</li>`; });
    html += '</ul>';
  }
  if (rapport.fouten.length > 0) {
    html += '<p><strong style="color:#c62828">❌ Fouten:</strong></p><ul>';
    rapport.fouten.forEach(f => { html += `<li>${f}</li>`; });
    html += '</ul>';
  }
  if (rapport.fouten.length === 0 && rapport.waarschuwingen.length === 0) {
    html += '<p style="color:#2e7d32">✓ Geen problemen gedetecteerd.</p>';
  }
  html += '</div>';
  return html;
}

// Helper: filter een lijst kinderen op het actieve schooljaar
function lkFilterKinderenOpActiefSchooljaar(kinderen) {
  if (!_actiefSchooljaar) return kinderen;
  return Voortgang.filterKinderenOpSchooljaar(kinderen, _actiefSchooljaar);
}

// Helper: ID van actief schooljaar (of null)
function lkActiefSchooljaarId() {
  return _actiefSchooljaar ? _actiefSchooljaar.id : null;
}

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
  const label = p.nummer ? `Rapportperiode ${p.nummer}` : p.naam;
  const sjLabel = p.schooljaar ? ` <small class="lk-periode-sj">· ${p.schooljaar}</small>` : '';
  return `
    <div class="lk-periode-menu-item">
      <div class="lk-periode-menu-info">
        <strong>${label}</strong> ${badge}${sjLabel}
        <span class="lk-periode-datums">${datums}</span>
        ${p.naam && p.naam !== label ? `<small class="lk-periode-bijnaam">"${p.naam}"</small>` : ''}
      </div>
      <div class="lk-periode-menu-acties-rij">
        <button class="lk-knop-mini" title="Bewerken" onclick="lkPeriodeBewerkenModal('${p.id}')">✏️</button>
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

  // Bevestigings-popup als er een actieve periode is die wordt afgesloten
  if (_actievePeriode) {
    const oudeNaam = _actievePeriode.nummer
      ? `Rapportperiode ${_actievePeriode.nummer}`
      : _actievePeriode.naam;
    const bevestiging = confirm(
      `Hierdoor wordt "${oudeNaam}" afgesloten.\n\n` +
      `Rapporten in die periode worden alleen-lezen — je kan ze nog bekijken en de PDF's downloaden, ` +
      `maar niet meer wijzigen (tenzij je de periode later weer heropent).\n\n` +
      `Doorgaan met het aanmaken van de nieuwe periode?`
    );
    if (!bevestiging) return;
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
    if (typeof _lkPeriodeMenuRenderer === 'function') _lkPeriodeMenuRenderer();
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

// === Modal: bestaande periode bewerken (naam + datums) ===
function lkPeriodeBewerkenModal(periodeId) {
  const periode = (_periodes || []).find(p => p.id === periodeId);
  if (!periode) return;

  // Sluit menu
  const menu = document.getElementById('lk-periode-menu');
  if (menu) menu.classList.remove('open');

  const oud = document.getElementById('lk-periode-modal-bg');
  if (oud) oud.remove();

  const startVoor = new Date(periode.startDatum).toISOString().slice(0, 10);
  const eindVoor = new Date(periode.eindDatum).toISOString().slice(0, 10);
  const naamSafe = (periode.naam || '').replace(/"/g, '&quot;');

  const bg = document.createElement('div');
  bg.id = 'lk-periode-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>✏️ Periode bewerken</h2>
      <p class="modal-uitleg">
        Pas naam of datums aan. Het schooljaar wordt automatisch bepaald uit de startdatum.
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Naam</label>
        <input type="text" class="lk-taak-select" id="periode-bewerk-naam" value="${naamSafe}">
      </div>

      <div class="lk-taak-veld" style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Startdatum</label>
          <input type="date" class="lk-taak-select" id="periode-bewerk-start" value="${startVoor}">
        </div>
        <div style="flex:1;min-width:140px">
          <label class="lk-taak-label">Einddatum</label>
          <input type="date" class="lk-taak-select" id="periode-bewerk-eind" value="${eindVoor}">
        </div>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-periode-modal-bg').remove()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkPeriodeBewerkenBewaren('${periode.id}')">💾 Opslaan</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
  setTimeout(() => {
    const naamEl = document.getElementById('periode-bewerk-naam');
    if (naamEl) naamEl.focus();
  }, 50);
}

async function lkPeriodeBewerkenBewaren(periodeId) {
  const naam = (document.getElementById('periode-bewerk-naam') || {}).value || '';
  const startStr = (document.getElementById('periode-bewerk-start') || {}).value;
  const eindStr = (document.getElementById('periode-bewerk-eind') || {}).value;
  if (!naam.trim()) { alert('Naam is verplicht.'); return; }
  if (!startStr || !eindStr) { alert('Start- en einddatum zijn verplicht.'); return; }
  const startDatum = new Date(startStr).getTime();
  const eindDatum = new Date(eindStr).getTime();
  if (eindDatum <= startDatum) { alert('Einddatum moet na de startdatum liggen.'); return; }

  try {
    await Voortgang.wijzigRapportperiode(periodeId, naam.trim(), startDatum, eindDatum);
    // Periodes herladen
    _periodes = await Voortgang.alleRapportperiodes();
    _actievePeriode = _periodes.find(p => p.status === 'actief') || null;
    if (typeof _lkPeriodeBalkRenderer === 'function') _lkPeriodeBalkRenderer();
    if (typeof _lkPeriodeMenuRenderer === 'function') _lkPeriodeMenuRenderer();
    document.getElementById('lk-periode-modal-bg').remove();
  } catch (e) {
    alert('Bewerken mislukt: ' + (e.message || 'onbekend'));
  }
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
    const alleKinderen = await Voortgang.alleKinderen();
    // Filter op actief schooljaar als gezet (anders backwards-compat: alle kinderen)
    if (_actiefSchooljaar && Array.isArray(_actiefSchooljaar.kinderen)) {
      lkKinderen = lkFilterKinderenOpActiefSchooljaar(alleKinderen);
    } else {
      lkKinderen = alleKinderen;
    }
    if (window.CentraleKlaslijsten && typeof CentraleKlaslijsten.verrijkTaalgroeiKinderen === 'function') {
      CentraleKlaslijsten.verrijkTaalgroeiKinderen(lkKinderen);
    }
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

  // CSS voor klikbare gecombineerde cel één keer injecteren
  if (!document.getElementById('lk-taakvrij-cel-style')) {
    const style = document.createElement('style');
    style.id = 'lk-taakvrij-cel-style';
    style.textContent = `
      .lk-taakvrij-cel {
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        transition: background 0.12s;
      }
      .lk-taakvrij-cel:hover {
        background: #fefce8;
      }
      .lk-vrij-onderkant {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px dashed #e5e7eb;
        font-size: 12px;
        color: #6b7280;
      }
    `;
    document.head.appendChild(style);
  }

  let html = '<table class="lk-tabel"><thead><tr>';
  html += '<th></th><th>Klas</th><th>Naam</th><th>📋 Taken &amp; thema\u2019s</th><th>Acties</th>';
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
    // Gecombineerde cel: taakstatus boven, vrij-tekst onder
    const gecombineerdeCel = `
      <div class="lk-taakvrij-cel" onclick="event.stopPropagation(); lkOpenKindBeheer('${code}', '${naamSafe}')" title="Klik om taken en vrije thema's te beheren">
        ${taakCel}
        <div class="lk-vrij-onderkant">🏷️ Vrij: <span class="lk-vrij-tekst">${vrijTekst}</span></div>
      </div>
    `;
    html += `<tr class="lk-tabel-rij ${isOpen ? 'open' : ''}" data-code="${code}">
      <td class="lk-rij-pijl-cel" onclick="lkRijToggle('${code}')"><span class="lk-rij-pijl">${isOpen ? '▼' : '▶'}</span></td>
      <td onclick="lkRijToggle('${code}')" class="lk-klas-cel">${klasTekst}</td>
      <td onclick="lkRijToggle('${code}')">${naamCel}<br><small class="lk-code-mini">${code}</small></td>
      <td>${gecombineerdeCel}</td>
      <td class="lk-acties-cel">
        <button class="lk-knop-mini" onclick="lkWijzigNaam('${code}', '${naamSafe}')" title="Naam van deze leerling wijzigen">⌨️</button>
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

    const toegewezenDatum = t.toegewezenOp || t.gestart || 0;
    const toegewezenStr = toegewezenDatum
      ? new Date(toegewezenDatum).toLocaleDateString('nl-BE')
      : 'datum onbekend';
    html += `<p class="lk-detail-rij"><strong>Toegewezen door:</strong> ${_taakVeiligeTekst(t.toegewezenDoorRol || 'leerkracht')} · ${toegewezenStr}</p>`;
    if (t.doel) html += `<p class="lk-detail-rij"><strong>Doel:</strong> ${_taakVeiligeTekst(t.doel)}</p>`;
    if (t.bronGroepNaam) html += `<p class="lk-detail-rij"><strong>Taalgroep:</strong> ${_taakVeiligeTekst(t.bronGroepNaam)}</p>`;
    if (t.vrijHerhalenNaAfronding) html += '<p class="lk-detail-rij">🔁 Daarna vrij blijven herhalen</p>';

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

  // === Geplande taken die na de actieve taak volgen ===
  const geplandeTaken = Array.isArray(kind.taakwachtrij) ? kind.taakwachtrij : [];
  if (geplandeTaken.length > 0) {
    html += `<div class="lk-detail-blok"><h4>🗓️ Gepland (${geplandeTaken.length})</h4>`;
    geplandeTaken.forEach((taak, index) => {
      const thema = ALLE_THEMAS_LK.find(x => x.id === taak.themaId);
      const themaNaam = thema ? `${thema.emoji} ${thema.naam}` : (taak.themaId || 'Thema');
      const datum = taak.toegewezenOp || taak.gestart || 0;
      const datumStr = datum ? new Date(datum).toLocaleDateString('nl-BE') : 'datum onbekend';
      const doel = taak.doel ? `<small><strong>Doel:</strong> ${_taakVeiligeTekst(taak.doel)}</small>` : '';
      html += `<div class="lk-taakgesch-rij">
        <span class="lk-taakgesch-datum">${index + 1}</span>
        <span class="lk-taakgesch-thema"><strong>${themaNaam}</strong>${doel}</span>
        <span class="lk-taakgesch-status bezig">${_taakVeiligeTekst(taak.toegewezenDoorRol || 'leerkracht')} · ${datumStr}</span>
        <button class="lk-knop-mini gevaar" onclick="lkGeplandeTaakWissen('${kind.code}', '${_taakVeiligeTekst(taak.taakId || '')}', ${index})" title="Geplande taak verwijderen">🗑️</button>
      </div>`;
    });
    html += '</div>';
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

    // Koppel nieuw kind automatisch aan actief schooljaar — anders wordt het
    // gefilterd weggehouden uit de tabel (filterKinderenOpSchooljaar).
    if (_actiefSchooljaar && _actiefSchooljaar.id) {
      try {
        const huidigeCodes = Array.isArray(_actiefSchooljaar.kinderen) ? _actiefSchooljaar.kinderen : [];
        const huidigeKlasMap = (_actiefSchooljaar.klasPerKind && typeof _actiefSchooljaar.klasPerKind === 'object')
          ? { ..._actiefSchooljaar.klasPerKind }
          : {};
        if (!huidigeCodes.includes(codeNorm)) huidigeCodes.push(codeNorm);
        if (klas.trim()) huidigeKlasMap[codeNorm] = klas.trim();
        await Voortgang.updateSchooljaarKinderen(_actiefSchooljaar.id, huidigeCodes, huidigeKlasMap);
        // Lokaal cachebeeld bijwerken zodat lkLaadKinderen meteen het juiste filter gebruikt
        _actiefSchooljaar.kinderen = huidigeCodes;
        _actiefSchooljaar.klasPerKind = huidigeKlasMap;
      } catch (e) {
        console.warn('Kind toevoegen aan actief schooljaar mislukt:', e);
        // Niet blokkerend — kind bestaat in Firestore, alleen niet zichtbaar in deze view
      }
    }

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
      <h1>Taalgroei</h1>
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
  const gesorteerd = [...lkKinderen].sort(_lkVergelijkOpAchternaam);

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
  w.document.write(`<!DOCTYPE html><html><head><title>Klaslijst Taalgroei</title>
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
        <h1>Klaslijst — Taalgroei</h1>
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
    <div class="voet">${gesorteerd.length} leerling${gesorteerd.length === 1 ? '' : 'en'} · jufzisa.be · Taalgroei</div>
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
  const gesorteerd = [...lkKinderen].sort(_lkVergelijkOpAchternaam);

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
        <div class="titel">Taalgroei</div>
        <div class="naam">${naam || '&nbsp;'}</div>
        <img src="${qrSrc}" alt="QR">
        <div class="code">${code}</div>
        <div class="onder">Scan thuis om te oefenen!</div>
        <div class="merk">jufzisa.be</div>
      </div>`;
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>QR-blaadjes Taalgroei</title>
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
//  KIND-BEHEER — keuzemodal met 2 knoppen
//  Toegangspoort tot zowel "vrij oefenen" als "taak maken" voor één kind.
//  Vervangt de oude verspreide knopjes in de tabel.
// =================================================================
function lkOpenKindBeheer(code, naam) {
  // Verwijder evt bestaande modal
  const oud = document.getElementById('lk-kindbeheer-modal-bg');
  if (oud) oud.remove();

  const naamSafe = (naam || code).replace(/'/g, "\\'");
  const naamWeergave = naam || code;

  // CSS één keer injecteren
  if (!document.getElementById('lk-kindbeheer-style')) {
    const style = document.createElement('style');
    style.id = 'lk-kindbeheer-style';
    style.textContent = `
      .lk-kindbeheer-modal {
        background: #fff; border-radius: 12px; padding: 24px;
        max-width: 480px; width: calc(100% - 40px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      }
      .lk-kindbeheer-modal h2 {
        margin: 0 0 6px 0; color: #1f2937; font-size: 20px;
      }
      .lk-kindbeheer-modal .modal-uitleg {
        margin: 0 0 18px 0; color: #6b7280; font-size: 14px;
      }
      .lk-kindbeheer-keuzeknop {
        display: block; width: 100%; text-align: left;
        background: #fff; border: 2px solid #e5e7eb; border-radius: 10px;
        padding: 14px 18px; margin-bottom: 12px; cursor: pointer;
        transition: all 0.15s; font-size: 15px;
      }
      .lk-kindbeheer-keuzeknop:hover {
        background: #fefce8; border-color: #fbbf24;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      }
      .lk-kindbeheer-titel {
        font-weight: 600; color: #1f2937; font-size: 16px;
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 4px;
      }
      .lk-kindbeheer-uitleg {
        color: #6b7280; font-size: 13px; line-height: 1.4;
      }
      .lk-kindbeheer-sluiten {
        margin-top: 8px; text-align: right;
      }
    `;
    document.head.appendChild(style);
  }

  const bg = document.createElement('div');
  bg.id = 'lk-kindbeheer-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  bg.innerHTML = `
    <div class="lk-kindbeheer-modal" onclick="event.stopPropagation()">
      <h2>Beheer voor ${naamWeergave}</h2>
      <p class="modal-uitleg">Wat wil je instellen voor deze leerling?</p>

      <button class="lk-kindbeheer-keuzeknop" onclick="lkSluitKindBeheer(); lkBeheerCategorieen('${code}', '${naamSafe}')">
        <div class="lk-kindbeheer-titel">🏷️ Kies vrije thema's</div>
        <div class="lk-kindbeheer-uitleg">
          Welke thema's mag deze leerling zelfstandig oefenen in haar/zijn eigen app?
          Bekijk hier ook de aanbevolen leerpad-volgorde voor anderstalige nieuwkomers.
        </div>
      </button>

      <button class="lk-kindbeheer-keuzeknop" onclick="lkSluitKindBeheer(); lkBeheerTaak('${code}', '${naamSafe}')">
        <div class="lk-kindbeheer-titel">📋 Nieuwe taak klaarzetten</div>
        <div class="lk-kindbeheer-uitleg">
          Zet een gerichte oefening klaar bij één thema: kies specifieke woorden,
          vaardigheden en oefenvormen. Een bestaande taak wordt niet overschreven.
        </div>
      </button>

      <div class="lk-kindbeheer-sluiten">
        <button class="lk-knop-mini" onclick="lkSluitKindBeheer()">Sluiten</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
}

function lkSluitKindBeheer() {
  const bg = document.getElementById('lk-kindbeheer-modal-bg');
  if (bg) bg.remove();
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
    { titel: 'Startpakket — voor wie net begint', emoji: '🌱', themas: ALLE_THEMAS_LK.filter(t => t.categorie === 'startpakket') },
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

      <div class="lk-leerpad-tip">
        <strong>💡 Aanbevolen volgorde voor anderstalige nieuwkomers:</strong>
        <ol class="lk-leerpad-lijst">
          <li><strong>Week 1–2:</strong> 🌱 Startpakket — overlevingswoorden voor in de klas</li>
          <li><strong>Week 3–4:</strong> 👨‍👩‍👧 Familie & gevoelens · 👕 Lichaam & kleding</li>
          <li><strong>Week 5–6:</strong> 🎒 Klas & schoolspullen · 🏫 Op school</li>
          <li><strong>Week 7–8:</strong> 🍎 Eten & drinken · 🎨 Kleuren · 🔢 Cijfers</li>
          <li><strong>Daarna:</strong> 🐶 Dieren · 🏠 Thuis · 🏃 Wat doe ik? · 🕐 Tijd · 🔷 Vormen</li>
        </ol>
        <p class="lk-leerpad-uitleg">Dit is een gids — pas aan aan het tempo van het kind.</p>
      </div>

      <div class="lk-cat-snelacties">
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('alles')">✓ Alles aan</button>
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('niets')">✗ Alles uit</button>
        <button class="lk-knop-mini" onclick="lkVrijSnelactie('startpakket')" title="Alleen het startpakket aanzetten">🌱 Enkel startpakket</button>
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

  // CSS voor leerpad-tip één keer injecteren
  if (!document.getElementById('lk-leerpad-style')) {
    const style = document.createElement('style');
    style.id = 'lk-leerpad-style';
    style.textContent = `
      .lk-leerpad-tip {
        margin: 14px 0; padding: 12px 16px;
        background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 6px;
      }
      .lk-leerpad-tip strong { color: #166534; }
      .lk-leerpad-lijst {
        margin: 8px 0 6px 0; padding-left: 20px; font-size: 13.5px;
        color: #15803d; line-height: 1.7;
      }
      .lk-leerpad-lijst li { margin-bottom: 2px; }
      .lk-leerpad-uitleg {
        margin: 6px 0 0 0; font-size: 12px; color: #16a34a;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }
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
  } else if (soort === 'startpakket') {
    _vrijModalThemaActief = new Set(ALLE_THEMAS_LK.filter(t => t.categorie === 'startpakket').map(t => t.id));
  }
  rendererVrijModal();
}

async function lkBewaarVrijModal() {
  if (!_vrijModalKindCode) return;
  const knop = document.querySelector('#lk-vrij-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  // Onthoud kind-info voor de eventuele vervolgvraag
  const codeBewaard = _vrijModalKindCode;
  const naamBewaard = _vrijModalNaam;
  try {
    const lijst = Array.from(_vrijModalThemaActief);
    await Voortgang.zetThemaActiefVoorKind(_vrijModalKindCode, lijst);
    const kind = lkKinderen.find(k => k.code === _vrijModalKindCode);
    if (kind) kind.thema_actief = lijst;
    lkSluitVrijModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();

    // Vraag of leerkracht ook een taak wil maken — bespaart een klik
    // Alleen als er minstens één thema vrij staat (anders heeft een taak geen zin)
    if (lijst.length > 0) {
      _toonVervolgvraagNaTaakofVrij(codeBewaard, naamBewaard);
    }
  } catch (e) {
    console.error('Bewaren mislukt:', e);
    alert('Kon de instellingen niet bewaren. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

// Kleine vervolgmodal: na het bewaren van vrije thema's vragen of de
// leerkracht ook een taak wil klaarzetten voor dezelfde leerling.
function _toonVervolgvraagNaTaakofVrij(code, naam) {
  // CSS één keer injecteren (hergebruikt voor nette popup)
  if (!document.getElementById('lk-vervolg-style')) {
    const style = document.createElement('style');
    style.id = 'lk-vervolg-style';
    style.textContent = `
      .lk-vervolg-modal {
        background: #fff; border-radius: 12px; padding: 22px 24px;
        max-width: 420px; width: calc(100% - 40px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      }
      .lk-vervolg-modal h3 { margin: 0 0 6px 0; color: #1f2937; font-size: 17px; }
      .lk-vervolg-modal p { margin: 0 0 18px 0; color: #4b5563; font-size: 14px; line-height: 1.5; }
      .lk-vervolg-knoppen { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
      .lk-vervolg-primair {
        background: var(--kleur-zisa, #ffd166); color: #1f2937;
        border: none; border-radius: 8px; padding: 10px 18px;
        font-size: 14px; font-weight: 500; cursor: pointer;
      }
      .lk-vervolg-primair:hover { filter: brightness(0.95); }
      .lk-vervolg-secundair {
        background: #fff; color: #4b5563; border: 1px solid #d1d5db;
        border-radius: 8px; padding: 10px 18px; font-size: 14px; cursor: pointer;
      }
      .lk-vervolg-secundair:hover { background: #f3f4f6; }
    `;
    document.head.appendChild(style);
  }

  const naamSafe = (naam || code).replace(/'/g, "\\'");
  const naamWeergave = naam || code;

  const bg = document.createElement('div');
  bg.id = 'lk-vervolg-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  bg.innerHTML = `
    <div class="lk-vervolg-modal" onclick="event.stopPropagation()">
      <h3>✓ Vrije thema's bewaard</h3>
      <p>Wil je nu ook een taak klaarzetten voor ${naamWeergave}?</p>
      <div class="lk-vervolg-knoppen">
        <button class="lk-vervolg-secundair" onclick="document.getElementById('lk-vervolg-modal-bg').remove()">Nee, klaar</button>
        <button class="lk-vervolg-primair" onclick="document.getElementById('lk-vervolg-modal-bg').remove(); lkBeheerTaak('${code}', '${naamSafe}')">📋 Ja, taak maken</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
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
// Welke sectie van de taak-modal is uitgeklapt — 'woorden', 'vaardigheden' of 'toetsen'.
// null = alles dicht. Bij open van modal start sectie 'woorden'.
let _taakModalOpenSectie = 'woorden';
let _taakModalNaam = '';
let _taakModalThemaId = null;
let _taakModalWoordIds = new Set();
// Vaardigheden in deze taak — mogelijk: 'luisteren', 'lezen', 'schrijven'
let _taakModalVaardigheden = new Set(['luisteren']);
// Per vaardigheid: welke oefenvorm(en) actief zijn.
// Voor v1 is er per vaardigheid 1 actieve oefenvorm; rest staat 'binnenkort'.
let _taakModalOefenvormenLuisteren = new Set(['klikspel']); // 'klikspel', 'verbinden', 'verslepen'
let _taakModalOefenvormenLezen     = new Set(['woord-beeld']); // 'woord-beeld'
let _taakModalOefenvormenSchrijven = new Set(['overtypen']);   // 'overtypen' (3s zichtbaar dan typen), 'slepen' (binnenkort)
// Toetsen per vaardigheid — leerkracht kiest per vaardigheid of er een mini-toets bij komt
let _taakModalToetsen = new Set(['luisteren']); // default luisteren-toets aan (zoals nu)
let _taakModalZinscontext = false;
// Geschiedenis voor kleur-codering van woorden: array van vorige taken voor dit kind
let _taakModalGeschiedenis = [];
// Huidige (nog niet gearchiveerde) taak — telt ook mee voor de kleur-codering
let _taakModalHuidigeTaak = null;
let _taakModalDoelCodes = [];
let _taakModalGroepsnaam = '';
let _taakModalDoel = '';
let _taakModalVrijHerhalen = false;

function _taakVeiligeTekst(waarde) {
  return String(waarde || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _taakToewijzerRol() {
  const sessie = window.SchoolSessie && typeof window.SchoolSessie.get === 'function'
    ? window.SchoolSessie.get() : null;
  const rol = String(sessie && sessie.rol || 'leerkracht').toLowerCase();
  const labels = {
    zorgleerkracht: 'zorgleerkracht', zorgcoordinator: 'zorgcoördinator',
    directie: 'directie', beheerder: 'beheerder', klasleerkracht: 'klasleerkracht',
    leerkracht: 'leerkracht'
  };
  return labels[rol] || 'leerkracht';
}

// Helper: bepaal kleur voor een woord-id binnen het huidig gekozen thema
//   'geel'  = woord was fout in de MEEST RECENTE toets waar het in zat
//   'groen' = woord stond in een taak en was in de meest recente toets niet fout
//   ''      = nog nooit geoefend in een taak (wit/standaard)
//
// Belangrijk: we kijken naar de MEEST RECENTE taak waarin het woord voorkwam,
// niet naar alle taken cumulatief. Anders blijft een woord eeuwig geel ook al
// heeft het kind het in een latere taak goed gedaan.
function _taakModalWoordKleur(woordId) {
  if (!_taakModalThemaId) return '';

  // Verzamel alle taken (huidig + archief) waarin het woord voorkwam, met tijdstempel
  const voorkomens = []; // { tijd, foutInToets }

  if (_taakModalHuidigeTaak &&
      _taakModalHuidigeTaak.themaId === _taakModalThemaId &&
      Array.isArray(_taakModalHuidigeTaak.woordIds) &&
      _taakModalHuidigeTaak.woordIds.indexOf(woordId) !== -1) {
    const foutInToets = Array.isArray(_taakModalHuidigeTaak.foutWoordenLaatsteToets) &&
                        _taakModalHuidigeTaak.foutWoordenLaatsteToets.indexOf(woordId) !== -1;
    // Huidige taak is altijd het meest recent — gebruik gestart of nu
    const tijd = _taakModalHuidigeTaak.gestart || Date.now();
    voorkomens.push({ tijd, foutInToets });
  }

  for (const archief of _taakModalGeschiedenis) {
    if (archief.themaId !== _taakModalThemaId) continue;
    if (!Array.isArray(archief.woordIds) || archief.woordIds.indexOf(woordId) === -1) continue;
    const foutInToets = Array.isArray(archief.foutWoordenLaatsteToets) &&
                        archief.foutWoordenLaatsteToets.indexOf(woordId) !== -1;
    // Sorteren op voltooidOp (of gestart als fallback)
    const tijd = archief.voltooidOp || archief.gestart || 0;
    voorkomens.push({ tijd, foutInToets });
  }

  if (voorkomens.length === 0) return '';

  // Sorteer op tijd, meest recente eerst
  voorkomens.sort((a, b) => b.tijd - a.tijd);
  const meestRecent = voorkomens[0];

  if (meestRecent.foutInToets) return 'geel';
  return 'groen';
}

async function lkBeheerTaak(code, naam, doelCodes, groepsnaam) {
  _taakModalKindCode = code;
  _taakModalNaam = naam || code;
  _taakModalDoelCodes = Array.isArray(doelCodes) && doelCodes.length ? [...new Set(doelCodes)] : [code];
  _taakModalGroepsnaam = groepsnaam || '';
  _taakModalDoel = '';
  _taakModalVrijHerhalen = false;
  // Standaard start de modal op de woorden-sectie open
  _taakModalOpenSectie = 'woorden';

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
    // We maken een nieuwe taak. Het bestaande pakket blijft actief of gepland.
    _taakModalWoordIds = new Set();
    _taakModalVaardigheden = new Set(huidigeTaak.vaardigheden || ['luisteren']);
    _taakModalOefenvormenLuisteren = new Set(huidigeTaak.oefenvormen_luisteren || ['klikspel']);
    _taakModalOefenvormenLezen     = new Set(huidigeTaak.oefenvormen_lezen     || ['woord-beeld']);
    _taakModalOefenvormenSchrijven = new Set(huidigeTaak.oefenvormen_schrijven || ['overtypen']);
    _taakModalToetsen              = new Set(huidigeTaak.toetsen              || ['luisteren']);
    _taakModalZinscontext = huidigeTaak.zinscontext === true;
    _taakModalDoel = '';
    _taakModalVrijHerhalen = false;
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
    _taakModalOefenvormenLezen     = new Set(['woord-beeld']);
    _taakModalOefenvormenSchrijven = new Set(['overtypen']);
    _taakModalToetsen              = new Set(['luisteren']);
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
  // Alle thema's zijn beschikbaar voor een taak — vrij oefenen is een aparte instelling.
  // Een leerkracht kan dus een gerichte taak geven in een thema dat (nog) niet vrij staat.
  const kind = lkKinderen.find(k => k.code === _taakModalKindCode);
  const beschikbareThemas = ALLE_THEMAS_LK.slice();

  // Status-strook van vorige taak (als er een is)
  let statusBlok = '';
  if (huidigeTaak && _taakModalDoelCodes.length === 1) {
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
    <div class="lk-cat-modal lk-taak-modal-doos" onclick="event.stopPropagation()">
      <h2>📋 ${_taakModalDoelCodes.length > 1 ? `Nieuwe taak voor groep ${_taakModalGroepsnaam || ''}` : `Nieuwe taak voor ${_taakModalNaam}`}</h2>
      <p class="modal-uitleg">
        ${_taakModalDoelCodes.length > 1 ? `<strong>${_taakModalDoelCodes.length} leerlingen krijgen dezelfde taak.</strong> Bestaande taken blijven behouden; deze taak wordt actief of sluit achteraan aan.` : 'Stel een taak samen in 3 stappen.'}
        Klik op een sectie om hem open of dicht te klappen.
        Open één sectie tegelijk om overzichtelijk te werken.
      </p>

      ${statusBlok}

      <div class="lk-taak-veld">
        <label class="lk-taak-label" for="lk-taak-doel">Doel van deze taak</label>
        <input id="lk-taak-doel" class="lk-taak-select" type="text"
          value="${_taakVeiligeTekst(_taakModalDoel)}"
          placeholder="bv. schoolwoorden begrijpen en zelfstandig gebruiken"
          oninput="_taakModalDoel=this.value">
        <p class="lk-taak-tip">Dit doel verschijnt in het gedeelde overzicht voor zorg- en klasleerkrachten.</p>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Thema</label>
        <select class="lk-taak-select" onchange="lkTaakKiesThema(this.value)">
  `;

  if (beschikbareThemas.length === 0) {
    html += `<option value="">⚠️ Geen thema's geladen</option>`;
  } else {
    beschikbareThemas.forEach(t => {
      const sel = (t.id === _taakModalThemaId) ? 'selected' : '';
      html += `<option value="${t.id}" ${sel}>${t.emoji} ${t.naam}</option>`;
    });
  }

  html += `
        </select>
        <p class="lk-taak-tip">💡 Je kan een taak maken uit elk thema, ook als het kind dat thema (nog) niet vrij mag oefenen.</p>
      </div>
  `;

  // Voorbereiding voor secties: bepaal wat zinnen-thema is, en welke vaardigheden aan staan
  const _modalThema = _taakModalThemaId ? ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId) : null;
  const _modalIsZinnen = _modalThema && _modalThema.type === 'zinnen';
  if (_modalIsZinnen && _taakModalVaardigheden.has('schrijven')) {
    _taakModalVaardigheden.delete('schrijven');
  }
  const luisterenAan = _taakModalVaardigheden.has('luisteren');
  const lezenAan = _taakModalVaardigheden.has('lezen');
  const schrijvenAan = _taakModalVaardigheden.has('schrijven');

  // Bouw samenvattingen voor in de gesloten sectie-koppen
  const sectieWoordenSamenvatting = `${_taakModalWoordIds.size} woord${_taakModalWoordIds.size === 1 ? '' : 'en'} gekozen`;
  const vaardigSamen = [];
  if (luisterenAan)  vaardigSamen.push('👂');
  if (lezenAan)      vaardigSamen.push('👁️');
  if (schrijvenAan)  vaardigSamen.push('✍️');
  const sectieVaardighedenSamenvatting = vaardigSamen.length > 0
    ? vaardigSamen.join(' ') + ` (${vaardigSamen.length} vaardighe${vaardigSamen.length === 1 ? 'id' : 'den'})`
    : 'geen vaardigheden gekozen';
  const toetsSamen = [];
  if (_taakModalToetsen.has('luisteren')) toetsSamen.push('luisteren');
  if (_taakModalToetsen.has('lezen'))     toetsSamen.push('lezen');
  if (_taakModalToetsen.has('schrijven')) toetsSamen.push('schrijven');
  const sectieToetsenSamenvatting = toetsSamen.length > 0
    ? `🎯 ${toetsSamen.join(' + ')}`
    : 'geen toetsen';

  // ====================================================
  // SECTIE 1: WOORDEN
  // ====================================================
  const sectie1Open = (_taakModalOpenSectie === 'woorden');
  html += `
    <div class="lk-sectie ${sectie1Open ? 'open' : ''}">
      <button type="button" class="lk-sectie-kop" onclick="lkTaakToggleSectie('woorden')">
        <span class="lk-sectie-nummer">1</span>
        <span class="lk-sectie-titel">Welke woorden?</span>
        <span class="lk-sectie-samenvatting">${sectieWoordenSamenvatting}</span>
        <span class="lk-sectie-pijl">${sectie1Open ? '▾' : '▸'}</span>
      </button>
      <div class="lk-sectie-inhoud" ${sectie1Open ? '' : 'hidden'}>
  `;
  if (_taakModalThemaId) {
    const thema = ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId);
    if (thema) {
      const verrijkt = lkVerrijkThema(thema);
      const items = verrijkt.items;

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
      html += `</div>`;
    }
  }
  html += `
      </div>
    </div>

    <div class="lk-taak-veld">
      <label class="lk-taak-zinscontext ${_taakModalVrijHerhalen ? 'aan' : ''}">
        <input type="checkbox" ${_taakModalVrijHerhalen ? 'checked' : ''} onchange="_taakModalVrijHerhalen=this.checked; rendererTaakModal(null)">
        <span class="lk-vaardigheid-icoon">🔁</span>
        <span class="lk-vaardigheid-naam">Dit thema na de taak vrij laten herhalen</span>
      </label>
      <p class="lk-taak-tip">Wanneer de taak is afgerond, komt dit thema automatisch bij de vrije herhaling van het kind.</p>
    </div>
  `;

  // ====================================================
  // SECTIE 2: VAARDIGHEDEN + OEFENVORMEN
  // ====================================================
  const sectie2Open = (_taakModalOpenSectie === 'vaardigheden');
  html += `
    <div class="lk-sectie ${sectie2Open ? 'open' : ''}">
      <button type="button" class="lk-sectie-kop" onclick="lkTaakToggleSectie('vaardigheden')">
        <span class="lk-sectie-nummer">2</span>
        <span class="lk-sectie-titel">Welke vaardigheden + oefenvormen?</span>
        <span class="lk-sectie-samenvatting">${sectieVaardighedenSamenvatting}</span>
        <span class="lk-sectie-pijl">${sectie2Open ? '▾' : '▸'}</span>
      </button>
      <div class="lk-sectie-inhoud" ${sectie2Open ? '' : 'hidden'}>
        <div class="lk-oefenroutes">
          <div class="lk-oefenroutes-kop">
            <strong>Kies eerst een passende oefenroute</strong>
            <span>Je kan de keuzes daarna nog handmatig aanpassen.</span>
          </div>
          <div class="lk-oefenroute-grid">
            <button type="button" class="lk-oefenroute" onclick="lkTaakKiesOefenroute('begrijpen')">
              <span class="lk-oefenroute-fase">START</span>
              <strong>👂 Eerst begrijpen</strong>
              <small>Voor een nieuw thema of een kind dat nog weinig Nederlands spreekt. Eerst luisteren en het juiste beeld zoeken.</small>
            </button>
            <button type="button" class="lk-oefenroute aanbevolen" onclick="lkTaakKiesOefenroute('lezen')">
              <span class="lk-oefenroute-fase">MEEST GEKOZEN</span>
              <strong>👂 + 👁️ Begrijpen en lezen</strong>
              <small>Voor woorden die al mondeling zijn aangeboden. Het kind koppelt klank, woord en beeld.</small>
            </button>
            <button type="button" class="lk-oefenroute" onclick="lkTaakKiesOefenroute('verankeren')">
              <span class="lk-oefenroute-fase">VERDER</span>
              <strong>${_modalIsZinnen ? '🔁 Herhalen en lezen' : '✍️ Herhalen en schrijven'}</strong>
              <small>Voor gekende leerstof die verder moet worden ingeoefend en onthouden.</small>
            </button>
          </div>
        </div>
        <div class="lk-handmatig-kop">Handmatig verfijnen</div>
        <div class="lk-taak-veld">
          <label class="lk-taak-label">Vaardigheden</label>
          <div class="lk-taak-vaardigheden">
            <label class="lk-taak-vaardigheid ${luisterenAan ? 'aan' : ''}">
              <input type="checkbox" ${luisterenAan ? 'checked' : ''} onchange="lkTaakToggleVaardigheid('luisteren')">
              <span class="lk-vaardigheid-icoon">👂</span>
              <span class="lk-vaardigheid-naam">Luisteren</span>
            </label>
            <label class="lk-taak-vaardigheid ${lezenAan ? 'aan' : ''}">
              <input type="checkbox" ${lezenAan ? 'checked' : ''} onchange="lkTaakToggleVaardigheid('lezen')">
              <span class="lk-vaardigheid-icoon">👁️</span>
              <span class="lk-vaardigheid-naam">Lezen</span>
            </label>
            ${_modalIsZinnen ? '' : `
            <label class="lk-taak-vaardigheid ${schrijvenAan ? 'aan' : ''}">
              <input type="checkbox" ${schrijvenAan ? 'checked' : ''} onchange="lkTaakToggleVaardigheid('schrijven')">
              <span class="lk-vaardigheid-icoon">✍️</span>
              <span class="lk-vaardigheid-naam">Schrijven</span>
            </label>
            `}
          </div>
          ${_modalIsZinnen ? '<p class="lk-taak-tip" style="margin-top:8px">✍️ Schrijven is niet beschikbaar voor zinnen-thema\'s.</p>' : ''}
        </div>
  `;

  // Helper voor sub-blok per vaardigheid (oefenvormen-rij — toets staat in sectie 3)
  function _oefenBlok(vaardigheid, kop, oefenvormen) {
    const set = vaardigheid === 'luisteren' ? _taakModalOefenvormenLuisteren
              : vaardigheid === 'lezen'     ? _taakModalOefenvormenLezen
              :                                _taakModalOefenvormenSchrijven;
    let blok = `
      <div class="lk-taak-veld lk-vaardigheid-blok">
        <label class="lk-taak-label">${kop}</label>
        <div class="lk-taak-vaardigheden">`;
    oefenvormen.forEach(ov => {
      const aan = set.has(ov.key);
      if (ov.beschikbaar) {
        blok += `
          <label class="lk-taak-vaardigheid ${aan ? 'aan' : ''}">
            <input type="checkbox" ${aan ? 'checked' : ''} onchange="lkTaakToggleOefenvorm('${vaardigheid}', '${ov.key}')">
            <span class="lk-vaardigheid-icoon">${ov.icoon}</span>
            <span class="lk-vaardigheid-naam">${ov.naam}</span>
          </label>`;
      } else {
        blok += `
          <label class="lk-taak-vaardigheid uitgeschakeld" title="Komt in volgende update">
            <input type="checkbox" disabled>
            <span class="lk-vaardigheid-icoon">${ov.icoon}</span>
            <span class="lk-vaardigheid-naam">${ov.naam} <small>(binnenkort)</small></span>
          </label>`;
      }
    });
    blok += `</div></div>`;
    return blok;
  }

  if (luisterenAan) {
    html += _oefenBlok('luisteren', '👂 Oefenvormen voor luisteren', [
      { key: 'klikspel',  icoon: '🎯', naam: 'Klikspel',  beschikbaar: true },
      { key: 'verbinden', icoon: '🔗', naam: 'Verbinden', beschikbaar: true },
      { key: 'verslepen', icoon: '🤚', naam: 'Verslepen', beschikbaar: true }
    ]);
  }
  if (lezenAan) {
    html += _oefenBlok('lezen', '👁️ Oefenvormen voor lezen', [
      { key: 'woord-beeld', icoon: '🖼️', naam: 'Woord → kies beeld', beschikbaar: true }
    ]);
  }
  if (schrijvenAan) {
    html += _oefenBlok('schrijven', '✍️ Oefenvormen voor schrijven', [
      { key: 'overtypen', icoon: '⌨️', naam: 'Overtypen (woord 3s zichtbaar)', beschikbaar: true },
      { key: 'slepen',    icoon: '🤚', naam: 'Letters slepen',                  beschikbaar: false }
    ]);
  }

  // Zinscontext (extra optie binnen sectie 2)
  html += `
        <div class="lk-taak-veld">
          <label class="lk-taak-zinscontext ${_taakModalZinscontext ? 'aan' : ''}">
            <input type="checkbox" ${_taakModalZinscontext ? 'checked' : ''} onchange="lkTaakToggleZinscontext()">
            <span class="lk-vaardigheid-icoon">💬</span>
            <span class="lk-vaardigheid-naam">Zin laten zien bij elk woord (in leren-fase)</span>
          </label>
          <p class="lk-taak-tip">Aanvinken als je wil dat het kind ook de zin bij elk woord ziet en hoort tijdens de leren-fase.</p>
        </div>
      </div>
    </div>
  `;

  // ====================================================
  // SECTIE 3: TOETSEN
  // ====================================================
  const sectie3Open = (_taakModalOpenSectie === 'toetsen');
  // Toets-checkbox helper
  function _toetsRij(vaardigheid, label, vaardigAan) {
    const toetsAan = _taakModalToetsen.has(vaardigheid);
    if (!vaardigAan) {
      return `
        <label class="lk-taak-toets-rij uitgeschakeld" title="Vaardigheid niet aangevinkt">
          <input type="checkbox" disabled>
          <span class="lk-vaardigheid-icoon">🎯</span>
          <span class="lk-vaardigheid-naam">${label} <small>(eerst vaardigheid aanvinken)</small></span>
        </label>`;
    }
    return `
      <label class="lk-taak-toets-rij ${toetsAan ? 'aan' : ''}">
        <input type="checkbox" ${toetsAan ? 'checked' : ''} onchange="lkTaakToggleToets('${vaardigheid}')">
        <span class="lk-vaardigheid-icoon">🎯</span>
        <span class="lk-vaardigheid-naam">${label}</span>
      </label>`;
  }

  html += `
    <div class="lk-sectie ${sectie3Open ? 'open' : ''}">
      <button type="button" class="lk-sectie-kop" onclick="lkTaakToggleSectie('toetsen')">
        <span class="lk-sectie-nummer">3</span>
        <span class="lk-sectie-titel">Welke mini-toetsen?</span>
        <span class="lk-sectie-samenvatting">${sectieToetsenSamenvatting}</span>
        <span class="lk-sectie-pijl">${sectie3Open ? '▾' : '▸'}</span>
      </button>
      <div class="lk-sectie-inhoud" ${sectie3Open ? '' : 'hidden'}>
        <p class="lk-taak-tip" style="margin-top:0">
          Een mini-toets test of het kind de woorden echt kent. Vink aan welke toetsen het kind moet maken na de oefenfases.
        </p>
        <div class="lk-taak-toetsen-lijst">
          ${_toetsRij('luisteren', 'Mini-toets luisteren', luisterenAan)}
          ${_toetsRij('lezen',     'Mini-toets lezen',     lezenAan)}
          ${_toetsRij('schrijven', 'Mini-toets schrijven', schrijvenAan)}
        </div>
      </div>
    </div>
  `;

  html += `
      <div class="lk-cat-modal-knoppen">
        <span></span>
        <button class="lk-knop-mini" onclick="lkSluitTaakModal()">Annuleren</button>
        <button class="lk-knop-mini" onclick="lkTestHuidigeTaakkeuzes()" title="Doorloop deze keuzes zonder ze te bewaren">👁️ Test deze fases</button>
          <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkBewaarTaak()">➕ Taak klaarzetten</button>
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

function lkTaakToggleSectie(naam) {
  // Klikken op huidige open sectie → sluit. Klikken op andere → open die.
  _taakModalOpenSectie = (_taakModalOpenSectie === naam) ? null : naam;
  rendererTaakModal(null);
}

function lkTaakToggleVaardigheid(vaardigheid) {
  // Bescherming: schrijven kan niet aan staan voor een zinnen-thema
  if (vaardigheid === 'schrijven' && _taakModalThemaId) {
    const thema = ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId);
    if (thema && thema.type === 'zinnen') return;
  }
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

function lkTaakKiesOefenroute(route) {
  const thema = _taakModalThemaId ? ALLE_THEMAS_LK.find(t => t.id === _taakModalThemaId) : null;
  const isZinnen = thema && thema.type === 'zinnen';
  if (route === 'begrijpen') {
    _taakModalVaardigheden = new Set(['luisteren']);
    _taakModalOefenvormenLuisteren = new Set(['klikspel']);
    _taakModalOefenvormenLezen = new Set();
    _taakModalOefenvormenSchrijven = new Set();
    _taakModalToetsen = new Set(['luisteren']);
    _taakModalZinscontext = true;
  } else if (route === 'lezen') {
    _taakModalVaardigheden = new Set(['luisteren', 'lezen']);
    _taakModalOefenvormenLuisteren = new Set(['klikspel', 'verbinden']);
    _taakModalOefenvormenLezen = new Set(['woord-beeld']);
    _taakModalOefenvormenSchrijven = new Set();
    _taakModalToetsen = new Set(['luisteren', 'lezen']);
    _taakModalZinscontext = true;
  } else {
    _taakModalVaardigheden = new Set(isZinnen ? ['luisteren', 'lezen'] : ['luisteren', 'lezen', 'schrijven']);
    _taakModalOefenvormenLuisteren = new Set(['klikspel', 'verbinden', 'verslepen']);
    _taakModalOefenvormenLezen = new Set(['woord-beeld']);
    _taakModalOefenvormenSchrijven = new Set(isZinnen ? [] : ['overtypen']);
    _taakModalToetsen = new Set(isZinnen ? ['luisteren', 'lezen'] : ['luisteren', 'lezen', 'schrijven']);
    _taakModalZinscontext = true;
  }
  rendererTaakModal(null);
}

function lkTaakToggleOefenvorm(vaardigheid, vorm) {
  let set;
  if (vaardigheid === 'luisteren')      set = _taakModalOefenvormenLuisteren;
  else if (vaardigheid === 'lezen')     set = _taakModalOefenvormenLezen;
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

function lkTaakToggleToets(vaardigheid) {
  if (_taakModalToetsen.has(vaardigheid)) {
    _taakModalToetsen.delete(vaardigheid);
  } else {
    _taakModalToetsen.add(vaardigheid);
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
  if (_taakModalVaardigheden.has('lezen') && _taakModalOefenvormenLezen.size === 0) {
    alert('Kies minstens één oefenvorm voor lezen.');
    return;
  }
  if (_taakModalVaardigheden.has('schrijven') && _taakModalOefenvormenSchrijven.size === 0) {
    alert('Kies minstens één oefenvorm voor schrijven.');
    return;
  }
  const knop = document.querySelector('#lk-taak-modal-bg .lk-cat-modal-knoppen button:last-child');
  const doelCodes = _taakModalDoelCodes.length ? _taakModalDoelCodes : [_taakModalKindCode];
  if (doelCodes.length > 1 && !confirm(`Deze taak klaarzetten voor ${doelCodes.length} leerlingen van ${_taakModalGroepsnaam || 'de groep'}?\n\nBestaande taken worden niet overschreven. Waar nodig sluit deze taak aan in de planning.`)) return;
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }
  try {
    const taak = {
      themaId: _taakModalThemaId,
      woordIds: [..._taakModalWoordIds],
      vaardigheden: [..._taakModalVaardigheden],
      oefenvormen_luisteren: [..._taakModalOefenvormenLuisteren],
      oefenvormen_lezen:     [..._taakModalOefenvormenLezen],
      oefenvormen_schrijven: [..._taakModalOefenvormenSchrijven],
      toetsen:               [..._taakModalToetsen],
      zinscontext: _taakModalZinscontext,
      huidigeFase: 'leren',
      status: 'bezig',
      foutWoordenLaatsteToets: [],
      aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 },
      gestart: Date.now(),
      toegewezenOp: Date.now(),
      toegewezenDoorRol: _taakToewijzerRol(),
      doel: _taakModalDoel.trim(),
      bronGroepNaam: _taakModalGroepsnaam || '',
      vrijHerhalenNaAfronding: _taakModalVrijHerhalen,
      rapportperiodeId: lkActievePeriodeId()
    };
    const resultaten = await Promise.all(doelCodes.map(code =>
      Voortgang.voegTaakToeVoorKind(code, { ...taak, gestart: Date.now(), toegewezenOp: Date.now() })
    ));
    // Lokale lijst bijwerken
    doelCodes.forEach(code => {
    const kind = lkKinderen.find(k => k.code === code);
    if (kind) {
      // Bewaar de oude taak alleen in de geschiedenis als die NIET meer bezig was
      // (dus voltooid/moeilijk/haperde). Een nog-bezige taak die wordt bewerkt
      // moeten we overschrijven, niet archiveren — anders verschijnt dezelfde
      // taak twee keer in de lijst.
      const oudeTaakAfgewerkt = kind.taak &&
                                (kind.taak.status === 'voltooid' ||
                                 kind.taak.status === 'moeilijk'  ||
                                 kind.taak.status === 'haperde');
      if (oudeTaakAfgewerkt && kind.taak.themaId && Array.isArray(kind.taak.woordIds) && kind.taak.woordIds.length > 0) {
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
          toetsResultaten: kind.taak.toetsResultaten ? JSON.parse(JSON.stringify(kind.taak.toetsResultaten)) : null,
          rapportperiodeId: kind.taak.rapportperiodeId || null
        };
        if (!Array.isArray(kind.taakgeschiedenis)) kind.taakgeschiedenis = [];
        kind.taakgeschiedenis.push(oudArch);
        if (kind.taakgeschiedenis.length > 50) {
          kind.taakgeschiedenis = kind.taakgeschiedenis.slice(-50);
        }
      }
      const resultaat = resultaten[doelCodes.indexOf(code)];
      if (resultaat && resultaat.positie === 'actief') {
        kind.taak = resultaat.taak;
      } else if (resultaat && resultaat.taak) {
        if (!Array.isArray(kind.taakwachtrij)) kind.taakwachtrij = [];
        kind.taakwachtrij.push(resultaat.taak);
      }
    }
    });
    lkSluitTaakModal();
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Bewaren taak mislukt:', e);
    alert('Kon de taak niet bewaren. Probeer opnieuw.');
    if (knop) { knop.disabled = false; knop.textContent = '💾 Bewaren'; }
  }
}

function lkBeheerTaakVoorGroep(codes, groepsnaam) {
  const geldig = [...new Set((codes || []).filter(code => lkKinderen.some(k => k.code === code)))];
  if (!geldig.length) {
    alert('Voeg eerst leerlingen toe aan deze groep.');
    return;
  }
  const eerste = lkKinderen.find(k => k.code === geldig[0]);
  lkBeheerTaak(geldig[0], eerste ? lkVolledigeNaam(eerste) : geldig[0], geldig, groepsnaam || 'taalgroep');
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

// Wis huidige taak direct vanuit de takenlijst, zonder de modal te openen.
// Wordt aangeroepen via de 🗑️-knop in de rij.
async function lkTaakWissenDirect(kindCode) {
  if (!kindCode) return;
  if (!confirm('Taak wissen? Het kind ziet dan geen taak meer op zijn startpagina.')) return;
  try {
    await Voortgang.zetTaakVoorKind(kindCode, null);
    const kind = lkKinderen.find(k => k.code === kindCode);
    if (kind) kind.taak = null;
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Wissen taak mislukt:', e);
    alert('Kon de taak niet wissen. Probeer opnieuw.');
  }
}

async function lkGeplandeTaakWissen(kindCode, taakId, index) {
  if (!kindCode || !confirm('Deze geplande taak verwijderen? De actieve taak blijft behouden.')) return;
  try {
    const wachtrij = await Voortgang.verwijderGeplandeTaakVoorKind(kindCode, taakId || null, index);
    const kind = lkKinderen.find(k => k.code === kindCode);
    if (kind) kind.taakwachtrij = wachtrij;
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Geplande taak wissen mislukt:', e);
    alert('Kon de geplande taak niet wissen. Probeer opnieuw.');
  }
}

// Wis een specifieke taak uit de geschiedenis (archief) van een kind.
// Wordt aangeroepen via de 🗑️-knop op een archief-rij.
async function lkTaakArchiefWissen(kindCode, archiefIdx) {
  if (!kindCode) return;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (!kind || !Array.isArray(kind.taakgeschiedenis)) return;
  if (archiefIdx < 0 || archiefIdx >= kind.taakgeschiedenis.length) return;
  if (!confirm('Deze taak uit de geschiedenis wissen? Dit kan niet ongedaan gemaakt worden.')) return;
  try {
    // Verwijder uit lokale kopie
    kind.taakgeschiedenis.splice(archiefIdx, 1);
    // Persisteer naar Voortgang/Firestore
    if (typeof Voortgang.zetTaakgeschiedenisVoorKind === 'function') {
      await Voortgang.zetTaakgeschiedenisVoorKind(kindCode, kind.taakgeschiedenis);
    } else {
      // Fallback: direct naar Firestore via Voortgang's interne db
      console.warn('zetTaakgeschiedenisVoorKind niet beschikbaar, lokale wijziging blijft enkel in memory');
    }
    if (typeof lkRendererTabel === 'function') lkRendererTabel();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
  } catch (e) {
    console.error('Wissen archief-taak mislukt:', e);
    alert('Kon de taak niet wissen. Probeer opnieuw.');
  }
}

function lkSluitTaakModal() {
  const bg = document.getElementById('lk-taak-modal-bg');
  if (bg) bg.remove();
  _taakModalKindCode = null;
  _taakModalThemaId = null;
  _taakModalWoordIds = new Set();
  _taakModalDoel = '';
  _taakModalVrijHerhalen = false;
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
            <!-- Niveau-veld verborgen — woorden hebben geen niveau, niveaus horen bij oefeningen -->
            <select id="wb-niveau" style="display:none">${nivOpties}</select>
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

// Niveaus dienen als groepering/label boven de oefeningen-lijst.
// Leerkracht vinkt zelf aan welke oefeningen ze wil — er is geen "niveau-modus"
// meer; ze kan vrij combineren over alle drie de niveaus heen.
const WB_NIVEAU_BUNDELS = {
  basis: {
    naam: '🌱 Basis',
    hint: 'Eenvoudige oefeningen om woorden te herkennen.',
    oefeningen: ['koppel', 'omcirkel', 'kleurkoppel', 'knip', 'vertelplaatNummers', 'zinnenKnippen', 'kaartjes', 'categoriseerBasis']
  },
  uitbreiding: {
    naam: '🌿 Uitbreiding',
    hint: 'Schrijven met hulp: voorbeeld of woordkeuze.',
    oefeningen: ['overschrijf', 'kiesschrijf', 'letter', 'categoriseerUitbreiding']
  },
  verdieping: {
    naam: '🌳 Verdieping',
    hint: 'Zelfstandig produceren zonder steun.',
    oefeningen: ['zelfschrijven', 'woordzoeker', 'categoriseerVerdieping']
  }
};

const WB_NIVEAU_VOLGORDE = ['basis', 'uitbreiding', 'verdieping'];

const WB_OEFENING_KEYS = ['koppel','overschrijf','letter','omcirkel','zelfschrijven','kiesschrijf','knip','vertelplaatNummers','zinnenKnippen','kleurkoppel','woordzoeker','kaartjes','categoriseerBasis','categoriseerUitbreiding','categoriseerVerdieping'];

const WB_OEFENING_LABELS = {
  koppel: '👁️ → 🔗 Koppel beeld en woord',
  overschrijf: '👁️ → ✏️ Schrijf na',
  letter: '👁️ → 🔤 → ✏️ Maak het woord',
  omcirkel: '👁️ → ✗ Kruis het juiste woord aan',
  zelfschrijven: '👁️ → ✏️ Schrijf zelf het woord',
  kiesschrijf: '👁️ → ✗ → ✏️ Kies en schrijf',
  knip: '✂️ → 📋 Knip en plak',
  vertelplaatNummers: '🔢 Vertelplaat: zet het nummer in het rondje',
  zinnenKnippen: '✂️ Knip woorden en bouw zinnen bij beelden',
  kleurkoppel: '👁️ → 🎨 Kleur dezelfde paren',
  woordzoeker: '👁️ → 🔍 Woordzoeker',
  kaartjes: '🃏 Woordkaartjes',
  categoriseerBasis: '🏷️ Welk hoort er niet bij?',
  categoriseerUitbreiding: '🏷️ Sorteer in 2 groepen (kleuren)',
  categoriseerVerdieping: '🏷️ Sorteer in 3+ groepen (schrijven)'
};

// Labels voor categorieën — gebruikt in chips
const CATEGORIE_LABELS = {
  // Startpakket — voor nieuwkomers
  'lichaam-behoeften': { label: 'lichaamsbehoeften', emoji: '🆘' },
  'hulp-vragen':       { label: 'hulp vragen',       emoji: '❓' },
  'beleefd':           { label: 'beleefd',           emoji: '👋' },
  'jezelf':            { label: 'jezelf',            emoji: '🙋' },
  'gevoel':            { label: 'gevoel',            emoji: '❤️' },
  // Klas (oud)
  voorwerpen:  { label: 'voorwerpen',  emoji: '📦' },
  werkwoorden: { label: 'werkwoorden', emoji: '🏃' },
  personen:    { label: 'personen',    emoji: '👤' },
  plaatsen:    { label: 'plaatsen',    emoji: '📍' },
  situaties:   { label: 'situaties',   emoji: '🤫' },
  // Lichaam & kleding
  lichaam:     { label: 'lichaam',     emoji: '👤' },
  kleren:      { label: 'kleren',      emoji: '👕' },
  // Eten & drinken (oud, blijven voor backward compat)
  eten:        { label: 'eten',        emoji: '🥪' },
  drinken:     { label: 'drinken',     emoji: '🥛' },
  bestek:      { label: 'bestek',      emoji: '🍽️' },
  // Eten & drinken (nieuwe categorieën)
  groenten:    { label: 'groenten',    emoji: '🥕' },
  fruit:       { label: 'fruit',       emoji: '🍎' },
  drank:       { label: 'drank',       emoji: '🥛' },
  snoepgoed:   { label: 'snoepgoed',   emoji: '🍬' },
  broodbeleg:  { label: 'broodbeleg',  emoji: '🧀' },
  andere:      { label: 'andere',      emoji: '🍲' },
  optafel:     { label: 'op tafel',    emoji: '🍽️' },
  // Familie & gevoelens
  familie:     { label: 'familie',     emoji: '👨‍👩‍👧' },
  gevoelens:   { label: 'gevoelens',   emoji: '😊' },
  // Dieren & natuur (oud, backward compat)
  dieren:      { label: 'dieren',      emoji: '🐶' },
  natuur:      { label: 'natuur',      emoji: '🌳' },
  weer:        { label: 'weer',        emoji: '☀️' },
  // Dieren & natuur (nieuwe categorieën)
  boerderijdieren:  { label: 'boerderijdieren',  emoji: '🐮' },
  huisdieren:       { label: 'huisdieren',       emoji: '🐱' },
  waterdieren:      { label: 'in het water',     emoji: '🐟' },
  dierentuindieren: { label: 'dierentuin',       emoji: '🦁' },
  planten:          { label: 'planten',          emoji: '🌿' },
  // Cijfers
  getallen:    { label: 'getallen',    emoji: '🔢' },
  hoeveelheid: { label: 'hoeveelheid', emoji: '➕' },
  // Thuis (oud, backward compat)
  kamers:      { label: 'kamers',      emoji: '🏠' },
  meubels:     { label: 'meubels',     emoji: '🛏️' },
  keukenspullen: { label: 'keukenspullen', emoji: '🍳' },
  // Thuis (nieuwe categorie)
  toestellen:  { label: 'toestellen',  emoji: '📺' },
  // Wat doe ik?
  'op-school':      { label: 'op school',     emoji: '📚' },
  thuis:            { label: 'thuis',         emoji: '🏠' },
  'sociale-acties': { label: 'samen',         emoji: '🤝' }
};

let werkbladPerThema = new Map();
let werkbladThemaIds = [];
let werkbladTabAlGetoond = false;

// Modus voor sectie 2: 'per-thema' (default) of 'mix'.
// Alleen relevant bij ≥2 thema's. Bij 1 thema is er geen keuze.
let werkbladModus = 'per-thema';

// === Mix-paneel state ===
// Wordt zichtbaar zodra ≥2 thema's aangevinkt zijn. Eén gemeenschappelijke
// oefeningen-set toegepast op een gemengde woordenpool uit alle thema's.
const WB_MIX_AANTAL_OPTIES = [8, 12, 16, 20];
const WB_MIX_NIVEAU_OPTIES = [
  { key: 'basis',                 label: '🌱 alleen basis' },
  { key: 'basis-uitbreiding',     label: '🌱 + 🌿 basis & uitbreiding' },
  { key: 'alle',                  label: '🌱 + 🌿 + 🌳 alle niveaus' }
];
let werkbladMix = {
  oefeningen: new Set(),
  aantalWoorden: 12,
  niveauFilter: 'basis-uitbreiding',
  // Hoe categoriseren werkt in mix: 'thema' (elk thema = eigen groep) of
  // 'woord-categorie' (gebruik gemeenschappelijke woord-cats; alleen mogelijk als
  // alle thema's minstens 1 cat delen)
  categorieMode: 'thema'
};

function nieuwThemaConfig(thema) {
  // Default: alle categorieën die in dit thema bestaan zijn aan
  const cats = (thema && thema.categorieen) ? new Set(thema.categorieen) : new Set();
  return {
    // niveau is legacy-veld — niet meer gebruikt voor filtering, alle oefeningen
    // zijn altijd zichtbaar en aanvinkbaar onder hun groepslabel
    niveau: 'basis',
    oefeningen: new Set(),  // niets default aangevinkt — leerkracht kiest zelf
    categorieen: cats,
    // Nieuw: per-item uitsluiting binnen een werkblad. Standaard leeg (alles aan).
    // Leerkracht opent "Kies woorden" en vinkt items uit die ze niet wil.
    // State per sessie — niet bewaard in storage.
    uitgeslotenItems: new Set()
  };
}

function initWerkbladTab() {
  if (werkbladTabAlGetoond) return; // niet opnieuw renderen als gebruiker terugkomt
  werkbladTabAlGetoond = true;
  rendererWerkbladThemas();
}

function toggleThemaOefening(themaId, oefKey) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  if (cfg.oefeningen.has(oefKey)) cfg.oefeningen.delete(oefKey);
  else cfg.oefeningen.add(oefKey);
  const scrollY = window.scrollY;
  rendererThemaPaneel(themaId);
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}

function toggleThemaCategorie(themaId, cat) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  if (cfg.categorieen.has(cat)) cfg.categorieen.delete(cat);
  else cfg.categorieen.add(cat);
  // Scrolpositie bewaren bij paneel-rerender
  const scrollY = window.scrollY;
  rendererThemaPaneel(themaId);
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}

// === Woorden kiezen — modal ===
// Opent een paneel waarin de leerkracht per categorie kan zien welke woorden
// in het werkblad komen, en losse woorden kan uitvinken.
// Standaard alles aan; uitgevinkte items komen in cfg.uitgeslotenItems.
function openWoordenKiezer(themaId) {
  const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
  const cfg = werkbladPerThema.get(themaId);
  if (!thema || !cfg) return;

  // Verrijkt thema gebruiken zodat ook eigen woorden + overrides meekomen
  const verrijkt = lkVerrijkThema(thema);
  const items = verrijkt.items || [];
  if (items.length === 0) {
    alert('Dit thema bevat nog geen woorden.');
    return;
  }

  // Groepeer items per categorie. Items zonder categorie komen onder 'overig'.
  const cats = (verrijkt.categorieen && verrijkt.categorieen.length > 0)
    ? [...verrijkt.categorieen]
    : [];
  const heeftOverig = items.some(it => !it.categorie || (cats.length && !cats.includes(it.categorie)));
  if (heeftOverig) cats.push('overig');

  const groepen = {};
  cats.forEach(c => { groepen[c] = []; });
  items.forEach(it => {
    const c = (it.categorie && cats.includes(it.categorie)) ? it.categorie : (cats.includes('overig') ? 'overig' : (cats[0] || 'overig'));
    if (!groepen[c]) groepen[c] = [];
    groepen[c].push(it);
  });

  // Bouw HTML voor de modal
  let html = `
    <div class="wk-modal-achtergrond" onclick="sluitWoordenKiezer(event)">
      <div class="wk-modal" onclick="event.stopPropagation()">
        <div class="wk-modal-kop">
          <div class="wk-modal-titel">
            <span style="font-size:24px">${verrijkt.emoji || '📚'}</span>
            <span>Kies woorden — ${verrijkt.naam}</span>
          </div>
          <button class="wk-modal-sluit" onclick="sluitWoordenKiezer()" aria-label="Sluiten">✕</button>
        </div>
        <div class="wk-modal-uitleg">
          Standaard staan alle woorden aan. Vink uit wat je niet in dit werkblad wil.
        </div>
        <div class="wk-modal-acties-boven">
          <button class="wk-mini-knop" onclick="wkAllesAan('${themaId}')">✓ Alles aanzetten</button>
        </div>
        <div class="wk-modal-body">
  `;

  cats.forEach(c => {
    const groepItems = groepen[c] || [];
    if (groepItems.length === 0) return;

    // Categorie alleen tonen als hij actief is in cfg.categorieen.
    // Niet-actieve categorieën grijs tonen met uitleg.
    const catActief = (c === 'overig')
      ? true
      : cfg.categorieen.has(c);

    const lab = (c === 'overig')
      ? { label: 'Andere woorden', emoji: '•' }
      : (CATEGORIE_LABELS[c] || { label: c, emoji: '•' });

    // Tel hoeveel items uitgesloten zijn in deze groep
    const aantalUit = groepItems.filter(it => cfg.uitgeslotenItems.has(it.id)).length;
    const aantalAan = groepItems.length - aantalUit;

    html += `
      <div class="wk-cat-blok ${catActief ? '' : 'inactief'}" data-wk-cat="${c}">
        <div class="wk-cat-kop">
          <span class="wk-cat-naam">${lab.emoji} ${lab.label}</span>
          <span class="wk-cat-teller">${aantalAan}/${groepItems.length}</span>
          ${catActief ? `
            <button class="wk-cat-toggle" onclick="wkCatAllemaal('${themaId}', '${c}', true)">alles aan</button>
            <button class="wk-cat-toggle" onclick="wkCatAllemaal('${themaId}', '${c}', false)">alles uit</button>
          ` : `<span class="wk-cat-uitleg">categorie staat uit — eerst aanvinken in het paneel</span>`}
        </div>
        ${catActief ? `
          <div class="wk-woorden-grid">
            ${groepItems.map(it => {
              const aan = !cfg.uitgeslotenItems.has(it.id);
              const tekst = it.tekst || it.kort || it.id;
              const beeld = it.beeld || '';
              return `
                <label class="wk-woord-chip ${aan ? 'aan' : 'uit'}" data-wk-item="${it.id}">
                  <input type="checkbox" ${aan ? 'checked' : ''} onchange="toggleWoordUitsluiting('${themaId}', '${it.id}')">
                  <span class="wk-woord-beeld">${beeld}</span>
                  <span class="wk-woord-tekst">${tekst}</span>
                </label>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += `
        </div>
        <div class="wk-modal-voet">
          <button class="wk-knop-klaar" onclick="sluitWoordenKiezer()">Klaar</button>
        </div>
      </div>
    </div>
  `;

  // CSS één keer injecteren
  _wkInjecteerCSS();

  // Modal toevoegen aan body
  const wrap = document.createElement('div');
  wrap.id = 'wk-modal-wrap';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
}

function sluitWoordenKiezer(ev) {
  // Bij click op achtergrond: alleen sluiten als de click NIET in de modal zelf was
  if (ev && ev.target && !ev.target.classList.contains('wk-modal-achtergrond')) return;
  const wrap = document.getElementById('wk-modal-wrap');
  if (wrap) wrap.remove();
  // Hoofdpaneel her-renderen zodat de teller op de knop geüpdatet wordt
  // We weten niet meer welk thema, dus alle panelen her-renderen
  const scrollY = window.scrollY;
  rendererThemaPanelen();
  window.scrollTo({ top: scrollY, behavior: 'instant' });
}

function toggleWoordUitsluiting(themaId, itemId) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  const wasUit = cfg.uitgeslotenItems.has(itemId);
  if (wasUit) cfg.uitgeslotenItems.delete(itemId);
  else cfg.uitgeslotenItems.add(itemId);

  // Synchronisatie: woord weer aangezet → categorie-chip ook weer aan.
  // (cat uit → woorden NIET automatisch uit, dat behoudt de leerkracht-keuze.)
  if (wasUit) {
    // Item wordt weer aangezet — vind de categorie van dit item
    const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
    if (thema) {
      const verrijkt = lkVerrijkThema(thema);
      const item = (verrijkt.items || []).find(it => it.id === itemId);
      if (item && item.categorie && !cfg.categorieen.has(item.categorie)) {
        cfg.categorieen.add(item.categorie);
      }
    }
  }

  // In-place updaten van DE EEN chip + de teller in zijn categorie-blok,
  // zonder de hele modal te herbouwen (anders springt scroll naar boven).
  _wkUpdateInPlace(themaId, itemId);
}

// Werk de visuele staat van één chip + teller bij na een toggle.
// Vermijdt volledige modal-rebuild zodat scrolpositie behouden blijft.
function _wkUpdateInPlace(themaId, itemId) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  const wrap = document.getElementById('wk-modal-wrap');
  if (!wrap) return;

  // Chip terugvinden via data-attribuut
  const chip = wrap.querySelector(`[data-wk-item="${itemId}"]`);
  if (chip) {
    const aan = !cfg.uitgeslotenItems.has(itemId);
    chip.classList.toggle('aan', aan);
    chip.classList.toggle('uit', !aan);
    const checkbox = chip.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = aan;
  }

  // Teller(s) van categorie-blokken bijwerken — eenvoudigste: alle tellers herrekenen
  _wkUpdateAlleTellers(themaId);
}

// Herbereken alle "X/Y"-tellers in de zichtbare modal.
function _wkUpdateAlleTellers(themaId) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  const wrap = document.getElementById('wk-modal-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('.wk-cat-blok').forEach(blok => {
    const cat = blok.getAttribute('data-wk-cat');
    if (!cat) return;
    const chips = blok.querySelectorAll('[data-wk-item]');
    let totaal = chips.length;
    let aan = 0;
    chips.forEach(c => {
      const id = c.getAttribute('data-wk-item');
      if (!cfg.uitgeslotenItems.has(id)) aan++;
    });
    const teller = blok.querySelector('.wk-cat-teller');
    if (teller) teller.textContent = `${aan}/${totaal}`;
  });
}

function wkCatAllemaal(themaId, cat, aanzetten) {
  const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
  const cfg = werkbladPerThema.get(themaId);
  if (!thema || !cfg) return;
  const verrijkt = lkVerrijkThema(thema);
  let isAlleenWeerAangezet = false;
  (verrijkt.items || []).forEach(it => {
    const itemCat = it.categorie || 'overig';
    const matchOverig = (cat === 'overig' && (!it.categorie || (verrijkt.categorieen && !verrijkt.categorieen.includes(it.categorie))));
    if (itemCat === cat || matchOverig) {
      if (aanzetten) {
        cfg.uitgeslotenItems.delete(it.id);
        isAlleenWeerAangezet = true;
      }
      else cfg.uitgeslotenItems.add(it.id);
    }
  });
  // Synchronisatie: alle woorden van een cat aangezet → categorie-chip ook aan
  if (aanzetten && isAlleenWeerAangezet && cat !== 'overig' && !cfg.categorieen.has(cat)) {
    cfg.categorieen.add(cat);
  }
  // In-place update: alle chips in de modal en tellers herzetten zonder herbouw
  _wkRefreshAllVisible(themaId);
}

function wkAllesAan(themaId) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  cfg.uitgeslotenItems.clear();
  // Synchronisatie: alle categorieën weer aanzetten
  const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
  if (thema && thema.categorieen) {
    thema.categorieen.forEach(c => cfg.categorieen.add(c));
  }
  _wkRefreshAllVisible(themaId);
}

// Update alle chips in de zichtbare modal volgens cfg.uitgeslotenItems,
// zonder te herbouwen — scrolpositie blijft behouden.
function _wkRefreshAllVisible(themaId) {
  const cfg = werkbladPerThema.get(themaId);
  if (!cfg) return;
  const wrap = document.getElementById('wk-modal-wrap');
  if (!wrap) return;
  wrap.querySelectorAll('[data-wk-item]').forEach(chip => {
    const id = chip.getAttribute('data-wk-item');
    const aan = !cfg.uitgeslotenItems.has(id);
    chip.classList.toggle('aan', aan);
    chip.classList.toggle('uit', !aan);
    const checkbox = chip.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = aan;
  });
  _wkUpdateAlleTellers(themaId);
}

// CSS voor de woordenkiezer-modal. Wordt eenmalig geïnjecteerd.
function _wkInjecteerCSS() {
  if (document.getElementById('wk-modal-style')) return;
  const style = document.createElement('style');
  style.id = 'wk-modal-style';
  style.textContent = `
    .wk-modal-achtergrond {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 20px;
    }
    .wk-modal {
      background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      width: 100%; max-width: 720px; max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .wk-modal-kop {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
    }
    .wk-modal-titel {
      display: flex; align-items: center; gap: 10px;
      font-size: 18px; font-weight: 600; color: #1f2937;
    }
    .wk-modal-sluit {
      background: none; border: none; font-size: 22px; cursor: pointer;
      color: #6b7280; padding: 4px 10px; border-radius: 6px;
    }
    .wk-modal-sluit:hover { background: #f3f4f6; color: #111827; }
    .wk-modal-uitleg {
      padding: 10px 20px; color: #6b7280; font-size: 14px;
      background: #f9fafb; border-bottom: 1px solid #e5e7eb;
    }
    .wk-modal-acties-boven {
      padding: 10px 20px; border-bottom: 1px solid #e5e7eb;
      display: flex; gap: 8px;
    }
    .wk-mini-knop {
      background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
      padding: 6px 12px; cursor: pointer; font-size: 13px; color: #374151;
    }
    .wk-mini-knop:hover { background: #f3f4f6; }
    .wk-modal-body {
      overflow-y: auto; padding: 16px 20px; flex: 1;
    }
    .wk-cat-blok {
      margin-bottom: 18px; border: 1px solid #e5e7eb; border-radius: 10px;
      padding: 12px; background: #fafbfc;
    }
    .wk-cat-blok.inactief { opacity: 0.55; background: #f3f4f6; }
    .wk-cat-kop {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .wk-cat-naam { font-weight: 600; color: #1f2937; font-size: 15px; }
    .wk-cat-teller {
      background: #fff; border: 1px solid #d1d5db; border-radius: 12px;
      padding: 2px 8px; font-size: 12px; color: #6b7280;
    }
    .wk-cat-toggle {
      background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
      padding: 3px 8px; font-size: 12px; cursor: pointer; color: #4b5563;
    }
    .wk-cat-toggle:hover { background: #eff6ff; border-color: #93c5fd; }
    .wk-cat-uitleg { font-size: 12px; color: #9ca3af; font-style: italic; }
    .wk-woorden-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 6px;
    }
    .wk-woord-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; border-radius: 8px;
      background: #fff; border: 1px solid #e5e7eb; cursor: pointer;
      font-size: 13px; transition: background 0.1s;
    }
    .wk-woord-chip:hover { background: #f9fafb; }
    .wk-woord-chip input { margin: 0; cursor: pointer; }
    .wk-woord-chip.aan { border-color: #86efac; background: #f0fdf4; }
    .wk-woord-chip.uit { opacity: 0.5; text-decoration: line-through; background: #fef2f2; border-color: #fecaca; }
    .wk-woord-beeld { font-size: 16px; line-height: 1; }
    .wk-woord-tekst { color: #1f2937; }
    .wk-modal-voet {
      padding: 12px 20px; border-top: 1px solid #e5e7eb;
      display: flex; justify-content: flex-end;
    }
    .wk-knop-klaar {
      background: #2563eb; color: #fff; border: none; border-radius: 8px;
      padding: 9px 22px; font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .wk-knop-klaar:hover { background: #1d4ed8; }
  `;
  document.head.appendChild(style);
}

// === Mix-paneel handlers ===
// Rerender via rendererThemaPanelen() zodat de container eerst leeggemaakt wordt
// (rendererMixPaneel is een appender en zou anders dubbel renderen).
function toggleMixOefening(oefKey) {
  if (werkbladMix.oefeningen.has(oefKey)) werkbladMix.oefeningen.delete(oefKey);
  else werkbladMix.oefeningen.add(oefKey);
  rendererThemaPanelen();
}

function kiesMixAantal(aantal) {
  werkbladMix.aantalWoorden = aantal;
  rendererThemaPanelen();
}

function kiesMixNiveauFilter(filter) {
  werkbladMix.niveauFilter = filter;
  rendererThemaPanelen();
}

function kiesMixCategorieMode(mode) {
  werkbladMix.categorieMode = mode;
  rendererThemaPanelen();
}

// Helper: vind categorieën die in alle gekozen woord-thema's voorkomen.
// Returns lijst van categorie-keys (kan leeg zijn als er geen overlap is).
// Zinnen-thema's tellen niet mee — die hebben geen categorieën.
function _mixGemeenschappelijkeCategorieen(themas) {
  const woordThemas = themas.filter(t => t.type !== 'zinnen' && Array.isArray(t.categorieen) && t.categorieen.length > 0);
  if (woordThemas.length < themas.length) return []; // niet álle thema's hebben cats
  if (woordThemas.length === 0) return [];
  // Intersectie nemen
  let gemeen = new Set(woordThemas[0].categorieen);
  woordThemas.slice(1).forEach(t => {
    gemeen = new Set(t.categorieen.filter(c => gemeen.has(c)));
  });
  return Array.from(gemeen);
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

function kiesWerkbladModus(modus) {
  werkbladModus = modus;
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

  // Bij 1 thema: geen modus-keuze, gewoon het per-thema-paneel
  if (werkbladThemaIds.length === 1) {
    const themaId = werkbladThemaIds[0];
    const paneel = document.createElement('div');
    paneel.className = 'thema-paneel';
    paneel.id = 'paneel-' + themaId;
    container.appendChild(paneel);
    rendererThemaPaneel(themaId);
    return;
  }

  // Bij ≥2 thema's: modus-keuze bovenaan
  const modusKeuze = document.createElement('div');
  modusKeuze.className = 'werkblad-modus-keuze';
  modusKeuze.innerHTML = `
    <div class="werkblad-modus-vraag">Hoe wil je de werkbundel?</div>
    <div class="werkblad-modus-knoppen">
      <button class="werkblad-modus-knop ${werkbladModus === 'per-thema' ? 'actief' : ''}" onclick="kiesWerkbladModus('per-thema')">
        <span class="modus-icoon">📚</span>
        <span class="modus-titel">Oefeningen per thema</span>
        <span class="modus-uitleg">Elk thema krijgt eigen pagina's met oefeningen</span>
      </button>
      <button class="werkblad-modus-knop ${werkbladModus === 'mix' ? 'actief' : ''}" onclick="kiesWerkbladModus('mix')">
        <span class="modus-icoon">🎲</span>
        <span class="modus-titel">Thema's gemengd per oefening</span>
        <span class="modus-uitleg">Eén werkblad met woorden uit alle thema's door elkaar</span>
      </button>
    </div>
  `;
  container.appendChild(modusKeuze);

  if (werkbladModus === 'per-thema') {
    werkbladThemaIds.forEach(themaId => {
      const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
      if (!thema) return;
      const paneel = document.createElement('div');
      paneel.className = 'thema-paneel';
      paneel.id = 'paneel-' + themaId;
      container.appendChild(paneel);
      rendererThemaPaneel(themaId);
    });
  } else {
    // Mix-modus: alleen mix-paneel zichtbaar
    rendererMixPaneel();
  }
}

// Render het mix-paneel.
// Wordt aangeroepen wanneer werkbladModus === 'mix' EN ≥2 thema's geselecteerd.
// Het paneel wordt inline toegevoegd aan #werkblad-thema-panelen door de caller
// (rendererThemaPanelen).
function rendererMixPaneel() {
  const container = document.getElementById('werkblad-thema-panelen');
  if (!container) return;
  if (werkbladThemaIds.length < 2 || werkbladModus !== 'mix') return;

  // Maak het mix-paneel aan en append het in de container
  const paneel = document.createElement('div');
  paneel.id = 'werkblad-mix-paneel';
  paneel.className = 'werkblad-mix-paneel';
  container.appendChild(paneel);

  // Bepaal of er zinnen-thema's tussen zitten — dan filter ongeschikte oefeningen
  const themas = werkbladThemaIds.map(id => ALLE_THEMAS_LK.find(t => t.id === id)).filter(Boolean);
  const heeftZinnenThema = themas.some(t => t.type === 'zinnen');
  const nietVoorZinnen = ['letter', 'woordzoeker', 'categoriseerBasis', 'categoriseerUitbreiding', 'categoriseerVerdieping'];

  // Schoon de set: oefeningen die niet meer kunnen door thema-mix verwijderen
  if (heeftZinnenThema) {
    nietVoorZinnen.forEach(k => werkbladMix.oefeningen.delete(k));
  }

  // Tel hoeveel woorden er totaal beschikbaar zijn (over alle thema's, na niveau-filter)
  const beschikbaarPerNiveau = _mixBeschikbarePerNiveau(themas);

  // Bouw de samenvatting bovenaan
  const themaNamen = themas.map(t => `${t.emoji} ${t.naam}`).join(' + ');
  let html = `
    <div class="mix-overzicht">
      <div class="mix-overzicht-themas">${themaNamen}</div>
      <div class="mix-overzicht-tellers">
        🌱 ${beschikbaarPerNiveau.basis} woorden ·
        🌿 ${beschikbaarPerNiveau.uitbreiding} woorden ·
        🌳 ${beschikbaarPerNiveau.verdieping} woorden
      </div>
    </div>
  `;

  // Niveau-filter
  html += `<div class="mix-veld">
    <div class="mix-veld-label">Welke niveaus mogen meedoen?</div>
    <div class="paneel-niveau-rij">`;
  WB_MIX_NIVEAU_OPTIES.forEach(opt => {
    const aan = werkbladMix.niveauFilter === opt.key;
    html += `<button class="mini-niveau-knop ${aan ? 'actief' : ''}" onclick="kiesMixNiveauFilter('${opt.key}')">${opt.label}</button>`;
  });
  html += `</div></div>`;

  // Aantal woorden
  html += `<div class="mix-veld">
    <div class="mix-veld-label">Hoeveel woorden in totaal?</div>
    <div class="paneel-niveau-rij">`;
  WB_MIX_AANTAL_OPTIES.forEach(n => {
    const aan = werkbladMix.aantalWoorden === n;
    html += `<button class="mini-niveau-knop ${aan ? 'actief' : ''}" onclick="kiesMixAantal(${n})">${n} woorden</button>`;
  });
  html += `</div></div>`;

  // Toon evenredige verdeling als hint
  const verdelingHint = _mixVerdelingHint(themas, werkbladMix.aantalWoorden);
  html += `<div class="mix-hint">📊 ${verdelingHint}</div>`;

  // Oefeningen per niveau-groep — zelfde structuur als per-thema-paneel
  WB_NIVEAU_VOLGORDE.forEach(niveau => {
    const bundel = WB_NIVEAU_BUNDELS[niveau];
    let oefeningenInGroep = bundel.oefeningen.slice();
    // Een vertelplaat hoort altijd bij één concreet thema, niet bij een mix.
    oefeningenInGroep = oefeningenInGroep.filter(k => k !== 'vertelplaatNummers');
    werkbladMix.oefeningen.delete('vertelplaatNummers');
    const heeftKorteZinnen = themas.some(t => (t.items || []).some(it => {
      const zin=(it.zin || (it.soort && it.soort.indexOf('zin')===0 ? it.tekst : '') || '').trim();
      const n=zin ? zin.split(/\s+/).length : 0;
      return n>=2 && n<=4;
    }));
    if(!heeftKorteZinnen){
      oefeningenInGroep = oefeningenInGroep.filter(k => k !== 'zinnenKnippen');
      werkbladMix.oefeningen.delete('zinnenKnippen');
    }
    if (heeftZinnenThema) {
      oefeningenInGroep = oefeningenInGroep.filter(k => !nietVoorZinnen.includes(k));
    }
    if (oefeningenInGroep.length === 0) return;

    html += `
      <div class="paneel-niveau-groep">
        <div class="paneel-niveau-kop">${bundel.naam}</div>
        <div class="paneel-oefeningen">
    `;
    oefeningenInGroep.forEach(oefKey => {
      const aan = werkbladMix.oefeningen.has(oefKey);
      const label = WB_OEFENING_LABELS[oefKey];
      html += `
        <label class="mini-check ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="toggleMixOefening('${oefKey}')">
          <span>${label}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  // Categorie-mode keuze — alleen tonen als minstens één categoriseer-oefening aanstaat
  const heeftCategoriseer = ['categoriseerBasis','categoriseerUitbreiding','categoriseerVerdieping']
    .some(k => werkbladMix.oefeningen.has(k));
  if (heeftCategoriseer) {
    const gemeenCats = _mixGemeenschappelijkeCategorieen(themas);
    const woordCatBeschikbaar = gemeenCats.length >= 2; // minstens 2 cats nodig om te sorteren
    // Als woord-categorie niet kan en huidige mode is daarop gezet → val terug op thema
    if (!woordCatBeschikbaar && werkbladMix.categorieMode === 'woord-categorie') {
      werkbladMix.categorieMode = 'thema';
    }
    const themaActief = werkbladMix.categorieMode === 'thema';
    const wcActief = werkbladMix.categorieMode === 'woord-categorie';

    // Bouw uitleg-tekst voor de woord-categorie-knop
    const wcUitleg = woordCatBeschikbaar
      ? `Gemeenschappelijke: ${gemeenCats.map(c => (CATEGORIE_LABELS[c] || {label: c}).label).join(', ')}`
      : 'Geen overlap tussen de gekozen thema\'s';

    html += `
      <div class="mix-veld" style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--kleur-rand)">
        <div class="mix-veld-label">🏷️ Categorieën in categoriseer-oefening</div>
        <div class="mix-categorie-mode">
          <button class="werkblad-modus-knop ${themaActief ? 'actief' : ''}" onclick="kiesMixCategorieMode('thema')">
            <span class="modus-icoon">📚</span>
            <span class="modus-titel">Per thema</span>
            <span class="modus-uitleg">Elk thema is een groep</span>
          </button>
          <button class="werkblad-modus-knop ${wcActief ? 'actief' : ''} ${woordCatBeschikbaar ? '' : 'gegrijsd'}"
                  ${woordCatBeschikbaar ? '' : 'disabled'}
                  onclick="kiesMixCategorieMode('woord-categorie')">
            <span class="modus-icoon">🏷️</span>
            <span class="modus-titel">Per woord-categorie</span>
            <span class="modus-uitleg">${wcUitleg}</span>
          </button>
        </div>
      </div>
    `;
  }

  // Teller hoeveel oefeningen aangevinkt — knoppen staan onderaan de tab
  const aantalAan = werkbladMix.oefeningen.size;
  html += `
    <div class="mix-teller-blok">
      <span class="mix-teller">${aantalAan} oefenvorm${aantalAan === 1 ? '' : 'en'} aangevinkt — gebruik de knoppen onderaan om de PDF te maken</span>
    </div>
  `;

  paneel.innerHTML = html;
}

// Helper: tel beschikbare woorden per niveau over alle gekozen thema's
function _mixBeschikbarePerNiveau(themas) {
  const tel = { basis: 0, uitbreiding: 0, verdieping: 0 };
  themas.forEach(thema => {
    const verrijkt = lkVerrijkThema(thema);
    (verrijkt.items || []).forEach(it => {
      if (tel[it.niveau] !== undefined) tel[it.niveau]++;
    });
  });
  return tel;
}

// Helper: bouw een leesbare verdelings-hint zoals "4 + 4 + 4 woorden"
function _mixVerdelingHint(themas, totaal) {
  const n = themas.length;
  const basis = Math.floor(totaal / n);
  const rest = totaal - basis * n;
  // Eerste `rest` thema's krijgen er 1 extra
  const verdeling = themas.map((_, i) => basis + (i < rest ? 1 : 0));
  return `Verdeling: ${verdeling.join(' + ')} woorden over ${n} thema's`;
}

function rendererThemaPaneel(themaId) {
  const paneel = document.getElementById('paneel-' + themaId);
  if (!paneel) return;
  const thema = ALLE_THEMAS_LK.find(t => t.id === themaId);
  const cfg = werkbladPerThema.get(themaId);
  if (!thema || !cfg) return;

  // Bepaal of dit thema "alleen zinnen" bevat — dan zijn letter-puzzel, woordzoeker en categoriseer uitgeschakeld
  const isZinnenThema = thema.type === 'zinnen';

  // Oefeningen die niet werken voor zinnen-thema's
  const nietVoorZinnen = ['letter', 'woordzoeker', 'categoriseerBasis', 'categoriseerUitbreiding', 'categoriseerVerdieping'];

  let html = `
    <div class="thema-paneel-kop">
      <span class="paneel-emoji">${thema.emoji}</span>
      <span class="paneel-naam">${thema.naam}</span>
      ${isZinnenThema ? '<span class="paneel-badge">zinnen-thema</span>' : ''}
    </div>
  `;

  // ===== Categorieën-chips (alleen tonen als thema categorieën heeft) =====
  if (thema.categorieen && thema.categorieen.length > 0) {
    // Tellers berekenen voor de "Kies woorden"-knop
    const verrijkt = lkVerrijkThema(thema);
    const totaalItems = (verrijkt.items || []).length;
    const aantalUitgesloten = cfg.uitgeslotenItems ? cfg.uitgeslotenItems.size : 0;
    const knopLabel = aantalUitgesloten > 0
      ? `🔍 Kies woorden (${aantalUitgesloten} uit)`
      : `🔍 Kies woorden`;

    html += `
      <div class="categorieen-paneel">
        <div class="categorieen-paneel-kop">
          <span>🏷️ Categorieën in dit werkblad</span>
          <button class="kies-woorden-knop" onclick="openWoordenKiezer('${themaId}')" title="Vink losse woorden uit die je niet wil gebruiken">
            ${knopLabel}
          </button>
        </div>
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
    html += `</div>`;

    // Uitleg + eventuele waarschuwing voor categoriseer-oefeningen
    const categoriseerKeys = ['categoriseerBasis', 'categoriseerUitbreiding', 'categoriseerVerdieping'];
    const heeftCategoriseerActief = categoriseerKeys.some(k => cfg.oefeningen.has(k));
    const aantalActieveCats = cfg.categorieen.size;

    html += `<div class="cat-uitleg">
      💡 De aangevinkte categorieën bepalen welke woorden in de oefeningen komen.
      Voor "Sorteer in groepen"-oefeningen heb je <strong>minstens 2 categorieën</strong> nodig.
    </div>`;

    if (heeftCategoriseerActief && aantalActieveCats < 2) {
      html += `<div class="cat-waarschuwing">
        ⚠️ Je hebt een sorteeroefening gekozen, maar er ${aantalActieveCats === 0 ? 'staan geen categorieën aan' : 'staat maar 1 categorie aan'}.
        Vink minstens 2 categorieën aan, anders kan deze oefening niet gemaakt worden.
      </div>`;
    }

    html += `</div>`;

    // CSS voor de knop één keer injecteren
    _kiesWoordenKnopCSS();
  }

  // Voor zinnen-thema's: ongeschikte oefeningen uit de actieve set halen zodat ze niet
  // toch in de PDF terechtkomen via een eerdere selectie
  if (isZinnenThema) {
    nietVoorZinnen.forEach(k => cfg.oefeningen.delete(k));
  }

  // ===== Oefeningen per niveau-groep =====
  WB_NIVEAU_VOLGORDE.forEach(niveau => {
    const bundel = WB_NIVEAU_BUNDELS[niveau];
    let oefeningenInGroep = bundel.oefeningen.slice();
    if (cfg.categorieen.size < 3) {
      oefeningenInGroep = oefeningenInGroep.filter(k => k !== 'categoriseerVerdieping');
      cfg.oefeningen.delete('categoriseerVerdieping');
    }
    if (!(thema.visueleOefening === 'vertelplaat-klas' || (thema.vertelplaat && thema.vertelplaat.beeld))) {
      oefeningenInGroep = oefeningenInGroep.filter(k => k !== 'vertelplaatNummers');
      cfg.oefeningen.delete('vertelplaatNummers');
    }
    const heeftKorteZinnen = (thema.items || []).some(it => {
      const zin=(it.zin || (it.soort && it.soort.indexOf('zin')===0 ? it.tekst : '') || '').trim();
      const n=zin ? zin.split(/\s+/).length : 0;
      return n>=2 && n<=4;
    });
    if(!heeftKorteZinnen){
      oefeningenInGroep = oefeningenInGroep.filter(k => k !== 'zinnenKnippen');
      cfg.oefeningen.delete('zinnenKnippen');
    }
    if (isZinnenThema) {
      oefeningenInGroep = oefeningenInGroep.filter(k => !nietVoorZinnen.includes(k));
    }
    if (oefeningenInGroep.length === 0) return; // niets te tonen voor deze groep

    html += `
      <div class="paneel-niveau-groep">
        <div class="paneel-niveau-kop">${bundel.naam}</div>
        <div class="paneel-oefeningen">
    `;
    oefeningenInGroep.forEach(oefKey => {
      const aan = cfg.oefeningen.has(oefKey);
      const label = WB_OEFENING_LABELS[oefKey];
      html += `
        <label class="mini-check ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan ? 'checked' : ''} onchange="toggleThemaOefening('${themaId}', '${oefKey}')">
          <span>${label}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  paneel.innerHTML = html;
}

function _kiesWoordenKnopCSS() {
  if (document.getElementById('kies-woorden-knop-style')) return;
  const style = document.createElement('style');
  style.id = 'kies-woorden-knop-style';
  style.textContent = `
    .categorieen-paneel-kop {
      display: flex !important;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .kies-woorden-knop {
      background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
      padding: 5px 11px; font-size: 13px; cursor: pointer; color: #374151;
      transition: all 0.15s;
    }
    .kies-woorden-knop:hover {
      background: #eff6ff; border-color: #93c5fd; color: #1e40af;
    }
    .cat-uitleg {
      margin-top: 8px; padding: 8px 12px;
      background: #eff6ff; border-left: 3px solid #93c5fd; border-radius: 4px;
      font-size: 13px; color: #1e3a8a; line-height: 1.4;
    }
    .cat-waarschuwing {
      margin-top: 6px; padding: 8px 12px;
      background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;
      font-size: 13px; color: #78350f; font-weight: 500; line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}

async function genereerWerkblad() {
  if (werkbladThemaIds.length === 0) {
    alert('Kies minstens één thema.');
    return;
  }
  // Bij ≥2 thema's en mix-modus: dispatch naar mix-genereer
  if (werkbladThemaIds.length >= 2 && werkbladModus === 'mix') {
    return genereerMixWerkblad();
  }

  // Belangrijk: pas Woordenbeheer toe vóór we naar de PDF-engine gaan,
  // anders zou het werkblad alleen het basispakket gebruiken zonder
  // overrides of eigen woorden.
  const themaConfigs = werkbladThemaIds.map(id => {
    const basis = ALLE_THEMAS_LK.find(t => t.id === id);
    const verrijkt = lkVerrijkThema(basis);
    const cfg = werkbladPerThema.get(id);
    // Pas item-uitsluiting toe op het verrijkte thema (clone met gefilterde items)
    const themaGefilterd = _pasUitsluitingToe(verrijkt, cfg.uitgeslotenItems);
    return {
      thema: themaGefilterd,
      oefeningen: Array.from(cfg.oefeningen),
      niveau: cfg.niveau,
      categorieen: Array.from(cfg.categorieen)
    };
  });
  themaConfigs.forEach(tc => {
    if (tc.categorieen.length < 3) tc.oefeningen = tc.oefeningen.filter(k => k !== 'categoriseerVerdieping');
  });

  const totaalOef = themaConfigs.reduce((acc, tc) => acc + tc.oefeningen.length, 0);
  if (totaalOef === 0) {
    alert('Vink minstens één oefening aan in een van de thema-panelen.');
    return;
  }

  // Controleer per thema dat er nog items overblijven na categorie-filter en uitsluiting
  const leegThema = themaConfigs.find(tc => {
    if (!tc.thema.categorieen || tc.thema.categorieen.length === 0) {
      // Geen categorieën, alleen item-uitsluiting telt
      return tc.thema.items.length === 0;
    }
    if (tc.categorieen.length === 0) return true;
    const overig = tc.thema.items.filter(it => !it.categorie || tc.categorieen.includes(it.categorie));
    return overig.length === 0;
  });
  if (leegThema) {
    alert(`In "${leegThema.thema.naam}" zijn er geen woorden geselecteerd. Vink minstens één categorie aan, of zet woorden terug aan via "Kies woorden".`);
    return;
  }

  // Validatie voor categoriseer-oefeningen: minstens 2 categorieën nodig
  const categoriseerKeys = ['categoriseerBasis', 'categoriseerUitbreiding', 'categoriseerVerdieping'];
  const themaMetTeWeinigCats = themaConfigs.find(tc => {
    const heeftCategoriseer = tc.oefeningen.some(k => categoriseerKeys.includes(k));
    if (!heeftCategoriseer) return false;
    // Alleen tellen als het thema überhaupt categorieën heeft (zinnen-thema's hebben er geen)
    if (!tc.thema.categorieen || tc.thema.categorieen.length === 0) return false;
    return tc.categorieen.length < 2;
  });
  if (themaMetTeWeinigCats) {
    alert(`In "${themaMetTeWeinigCats.thema.naam}" staan sorteer-oefeningen aan, maar er ${themaMetTeWeinigCats.categorieen.length === 0 ? 'staan geen categorieën' : 'staat maar 1 categorie'} aangevinkt.\n\nVink minstens 2 categorieën aan om sorteer-oefeningen te kunnen maken, of vink de sorteer-oefening uit.`);
    return;
  }

  try {
    await PDFEngine.maakWerkblad(themaConfigs, { verdeling: 'per-thema' });
  } catch (e) {
    console.error('Werkblad genereren mislukt:', e);
    alert('Het werkblad kon niet gemaakt worden. Probeer opnieuw.');
  }
}

// Helper: filter items van een (verrijkt) thema op basis van een Set met
// uitgesloten item-ids. Geeft een nieuw thema-object terug met gefilterde items.
// Als de set leeg is, wordt het origineel teruggegeven (geen onnodige clone).
function _pasUitsluitingToe(verrijktThema, uitgeslotenSet) {
  if (!uitgeslotenSet || uitgeslotenSet.size === 0) return verrijktThema;
  if (!verrijktThema || !Array.isArray(verrijktThema.items)) return verrijktThema;
  const gefilterd = verrijktThema.items.filter(it => !uitgeslotenSet.has(it.id));
  if (gefilterd.length === verrijktThema.items.length) return verrijktThema;
  return { ...verrijktThema, items: gefilterd };
}

async function genereerOplossingssleutel() {
  if (werkbladThemaIds.length === 0) {
    alert('Kies minstens één thema voor de oplossingssleutel.');
    return;
  }
  // Bij ≥2 thema's en mix-modus: dispatch naar mix-oplossing
  if (werkbladThemaIds.length >= 2 && werkbladModus === 'mix') {
    return genereerMixOplossing();
  }
  const themaConfigs = werkbladThemaIds.map(id => {
    const basis = ALLE_THEMAS_LK.find(t => t.id === id);
    const verrijkt = lkVerrijkThema(basis);
    const cfg = werkbladPerThema.get(id);
    // Pas item-uitsluiting toe — moet identiek zijn aan werkblad-versie
    const themaGefilterd = _pasUitsluitingToe(verrijkt, cfg.uitgeslotenItems);
    return {
      thema: themaGefilterd,
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
//  MIX-WERKBLAD — gecombineerde woordenpool over meerdere thema's
// =================================================================
//
// Bouwt één kunstmatig "gemengd" thema-object met evenredig getrokken
// woorden uit elk geselecteerd thema, gefilterd op het gekozen niveau.
// PDF-engine tekent dan elke aangevinkte oefening op deze pool.

// Bouw een gemengd thema-object met evenredige verdeling van woorden.
// Returns null als de pool leeg is na filtering.
function _bouwMixThemaObject() {
  const themas = werkbladThemaIds
    .map(id => ALLE_THEMAS_LK.find(t => t.id === id))
    .filter(Boolean);
  if (themas.length < 2) return null;

  // Niveau-filter
  const filter = werkbladMix.niveauFilter;
  const niveausIn = (filter === 'basis')              ? ['basis'] :
                    (filter === 'basis-uitbreiding')  ? ['basis', 'uitbreiding'] :
                                                        ['basis', 'uitbreiding', 'verdieping'];

  // Verzamel per thema de eligible items (na verrijking + niveau-filter)
  const verrijkteThemas = themas.map(t => lkVerrijkThema(t));
  const eligiblePerThema = verrijkteThemas.map(vt =>
    (vt.items || []).filter(it => niveausIn.indexOf(it.niveau) !== -1)
  );

  // Evenredige verdeling: floor(totaal / n) per thema, eerste rest-modulo-thema's
  // krijgen er 1 extra. Daarna desnoods bijschalen als een thema te weinig items
  // heeft, zodat we het totaal proberen te halen.
  const totaal = werkbladMix.aantalWoorden;
  const n = themas.length;
  const basisPerThema = Math.floor(totaal / n);
  const rest = totaal - basisPerThema * n;
  const doelPerThema = themas.map((_, i) => basisPerThema + (i < rest ? 1 : 0));

  // Trekking per thema: shuffle en pak het doel-aantal (of zoveel als beschikbaar)
  const getrokken = [];
  let tekort = 0;
  eligiblePerThema.forEach((items, i) => {
    const doel = doelPerThema[i];
    const geschud = [...items].sort(() => Math.random() - 0.5);
    const pak = geschud.slice(0, doel);
    getrokken.push(pak);
    if (pak.length < doel) tekort += (doel - pak.length);
  });

  // Probeer het tekort op te vangen door extra items te trekken uit thema's die
  // nog reserve hebben (zonder duplicaten)
  if (tekort > 0) {
    for (let i = 0; i < eligiblePerThema.length && tekort > 0; i++) {
      const reserve = eligiblePerThema[i].filter(it => getrokken[i].indexOf(it) === -1);
      const extra = reserve.slice(0, tekort);
      if (extra.length > 0) {
        getrokken[i] = getrokken[i].concat(extra);
        tekort -= extra.length;
      }
    }
  }

  // Vlak alle getrokken items samen tot één pool. Geef elk item een
  // synthetische categorie afhankelijk van werkbladMix.categorieMode:
  //   - 'thema'           → categorie = thema-id (bv. 'w-klas')
  //   - 'woord-categorie' → behoud originele categorie, filter items zonder
  //                         gemeenschappelijke cat eruit
  const pool = [];
  if (werkbladMix.categorieMode === 'woord-categorie') {
    const gemeenCats = _mixGemeenschappelijkeCategorieen(themas);
    const gemeenSet = new Set(gemeenCats);
    getrokken.forEach((arr) => {
      arr.forEach(it => {
        if (it.categorie && gemeenSet.has(it.categorie)) {
          pool.push(it);
        }
      });
    });
  } else {
    // 'thema'-mode: clone items met synthetische categorie = thema-id
    getrokken.forEach((arr, themaIdx) => {
      const themaId = themas[themaIdx].id;
      arr.forEach(it => {
        pool.push({ ...it, categorie: themaId });
      });
    });
  }

  if (pool.length === 0) return null;

  // Bouw kunstmatig thema. emoji + naam komen van de eerste — gebruikt voor de PDF-kop.
  // Bij categorieMode='thema' geven we elk thema-id een leesbaar label mee zodat de
  // PDF-engine "🎒 Klas" toont i.p.v. "w-klas" als kop.
  const themaNaam = themas.map(t => t.naam).join(' + ');
  const mixThema = {
    id: 'mix-' + themas.map(t => t.id).join('-'),
    naam: themaNaam,
    emoji: '🎲',
    type: 'woorden',
    items: pool
  };
  if (werkbladMix.categorieMode === 'thema') {
    mixThema._categorieLabels = {};
    themas.forEach(t => {
      // Hou de emoji en kort de naam in zodat het kop-vak in de PDF niet overloopt
      const kortName = t.naam.length > 18 ? t.naam.substring(0, 16) + '…' : t.naam;
      mixThema._categorieLabels[t.id] = { label: kortName, emoji: t.emoji };
    });
  }
  return mixThema;
}

async function genereerMixWerkblad() {
  if (werkbladThemaIds.length < 2) {
    alert('Selecteer minstens twee thema\'s om een mix-werkblad te maken.');
    return;
  }
  if (werkbladMix.oefeningen.size === 0) {
    alert('Vink minstens één oefenvorm aan in het mix-paneel.');
    return;
  }
  const mixThema = _bouwMixThemaObject();
  if (!mixThema || mixThema.items.length === 0) {
    alert('Geen woorden beschikbaar voor de mix met de huidige niveau-filter. Kies een ruimer niveau.');
    return;
  }
  const themaConfigs = [{
    thema: mixThema,
    oefeningen: Array.from(werkbladMix.oefeningen),
    niveau: 'basis',  // legacy-veld, niet meer functioneel
    categorieen: []   // mix gebruikt geen categorie-filter
  }];
  try {
    await PDFEngine.maakWerkblad(themaConfigs, { verdeling: 'per-thema' });
  } catch (e) {
    console.error('Mix-werkblad mislukt:', e);
    alert('Het mix-werkblad kon niet gemaakt worden. Probeer opnieuw.');
  }
}

async function genereerMixOplossing() {
  if (werkbladThemaIds.length < 2) {
    alert('Selecteer minstens twee thema\'s om een mix-oplossing te maken.');
    return;
  }
  if (werkbladMix.oefeningen.size === 0) {
    alert('Vink minstens één oefenvorm aan in het mix-paneel.');
    return;
  }
  const mixThema = _bouwMixThemaObject();
  if (!mixThema || mixThema.items.length === 0) {
    alert('Geen woorden beschikbaar voor de mix.');
    return;
  }
  const themaConfigs = [{
    thema: mixThema,
    oefeningen: Array.from(werkbladMix.oefeningen),
    niveau: 'basis',
    categorieen: []
  }];
  try {
    await PDFEngine.maakOplossingssleutel(themaConfigs, { verdeling: 'per-thema' });
  } catch (e) {
    console.error('Mix-oplossing mislukt:', e);
    alert('De mix-oplossingssleutel kon niet gemaakt worden. Probeer opnieuw.');
  }
}

// =================================================================
//  PUNTENBOEK — eigen toetsen per kind per rapportperiode
// =================================================================

// State per kind: _pbState[kindCode] = { periodeId, online, eigen, geladen, bezigMetLaden }
let _pbState = {};
let _pbHuidigKindCode = null;

// Welke vaardigheid is opengeklapt? Per kind apart.
let _pbOpenVaardigheid = {};

function _pbInitState(kindCode) {
  if (_pbState[kindCode]) return _pbState[kindCode];
  _pbState[kindCode] = {
    periodeId: null,
    online: { luisteren: [], lezen: [], schrijven: [], spreken: [] },
    eigen: [],
    geladen: false,
    bezigMetLaden: false
  };
  return _pbState[kindCode];
}

async function _lkPuntenboekLaden(kind) {
  if (!kind || !kind.code) return;
  _pbHuidigKindCode = kind.code;
  const s = _pbInitState(kind.code);

  // Default-periode = actieve, anders meest recente
  if (!s.periodeId) {
    if (_actievePeriode) s.periodeId = _actievePeriode.id;
    else if (_periodes && _periodes.length > 0) s.periodeId = _periodes[0].id;
    else {
      _lkPbRenderError(kind, 'Geen rapportperiode aangemaakt. Maak eerst een periode aan in de balk bovenaan.');
      return;
    }
  }

  if (s.geladen) {
    _lkPbRender(kind);
    return;
  }
  if (s.bezigMetLaden) return;
  s.bezigMetLaden = true;

  await _pbLaadDataVoorPeriode(kind.code, s.periodeId);
  s.bezigMetLaden = false;
  s.geladen = true;
  if (_pbHuidigKindCode === kind.code) _lkPbRender(kind);
}

function _lkPbRenderError(kind, melding) {
  const cont = document.getElementById('lk-pb-inline');
  if (!cont || cont.getAttribute('data-code') !== kind.code) return;
  cont.innerHTML = `<p class="lk-kind-leeg">${melding}</p>`;
}

async function _pbLaadDataVoorPeriode(kindCode, periodeId) {
  const s = _pbInitState(kindCode);
  const periode = (_periodes || []).find(p => p.id === periodeId);

  // Online toetsen ophalen + eigen toetsen ophalen, parallel
  try {
    const [online, eigen] = await Promise.all([
      Voortgang.haalOnlineToetsenVoorKindPeriode(kindCode, periodeId, periode),
      Voortgang.haalEigenToetsenVoorKindPeriode(kindCode, periodeId)
    ]);
    s.online = online || { luisteren: [], lezen: [], schrijven: [], spreken: [] };
    s.eigen = eigen || [];
  } catch (e) {
    console.warn('Puntenboek-data laden mislukt:', e);
    s.online = { luisteren: [], lezen: [], schrijven: [], spreken: [] };
    s.eigen = [];
  }
}

async function lkPbWisselPeriode(kindCode, periodeId) {
  if (!periodeId) return;
  const s = _pbInitState(kindCode);
  if (s.periodeId === periodeId) return;
  s.periodeId = periodeId;
  s.geladen = false;
  // Toon laden-melding
  const cont = document.getElementById('lk-pb-inline');
  if (cont && cont.getAttribute('data-code') === kindCode) {
    cont.innerHTML = '<div class="lk-rap-inline-laden"><p>⏳ Bezig met laden…</p></div>';
  }
  await _pbLaadDataVoorPeriode(kindCode, periodeId);
  s.geladen = true;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind && _pbHuidigKindCode === kindCode) _lkPbRender(kind);
}

function _lkPbRender(kind) {
  const cont = document.getElementById('lk-pb-inline');
  if (!cont || cont.getAttribute('data-code') !== kind.code) return;

  const s = _pbInitState(kind.code);
  const periodes = _periodes || [];
  const naam = kind.naam || kind.code;

  // Filter op actief schooljaar
  const sjId = (typeof _actiefSchooljaar !== 'undefined' && _actiefSchooljaar) ? _actiefSchooljaar.id : null;
  let zichtbarePeriodes = periodes;
  if (sjId && Voortgang.filterPeriodesOpSchooljaar) {
    zichtbarePeriodes = Voortgang.filterPeriodesOpSchooljaar(periodes, sjId);
  }

  // Sorteer: actief eerst, dan archief op datum desc
  zichtbarePeriodes = zichtbarePeriodes.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === 'actief' ? -1 : 1;
    return (b.startDatum || 0) - (a.startDatum || 0);
  });

  const periodeOpties = zichtbarePeriodes.map(p => {
    const sel = (p.id === s.periodeId) ? 'selected' : '';
    const label = p.nummer
      ? `Rapportperiode ${p.nummer}${p.status === 'afgesloten' ? ' (afgesloten)' : ''}`
      : `${p.naam}${p.status === 'afgesloten' ? ' (afgesloten)' : ''}`;
    return `<option value="${p.id}" ${sel}>${label}</option>`;
  }).join('');

  // Render 4 vaardigheids-blokken
  const vaardigheden = [
    { sl: 'luisteren', icoon: '👂', naam: 'Luisteren' },
    { sl: 'lezen',     icoon: '👁️', naam: 'Lezen' },
    { sl: 'schrijven', icoon: '✍️', naam: 'Schrijven' },
    { sl: 'spreken',   icoon: '🗣️', naam: 'Spreken' }
  ];

  const blokken = vaardigheden.map(v => _lkPbVaardigheidBlok(kind.code, v, s)).join('');

  cont.innerHTML = `
    <div class="lk-pb-kop">
      <h3>📓 Puntenboek voor ${naam}</h3>
      <div class="lk-pb-periode">
        <label>Periode:</label>
        <select class="lk-rap-periode-select" onchange="lkPbWisselPeriode('${kind.code}', this.value)">
          ${periodeOpties}
        </select>
      </div>
    </div>

    <p class="lk-rap-inline-uitleg">
      Online toetsen verschijnen automatisch. Voeg eigen toetsen toe (papieren toets, dictee, …) — ze tellen mee voor de sterren in het rapport volgens hun gewicht.
      Een opmerking koppelen aan "wat gaat goed", "groeipunten" of "werkhouding"? Dan verschijnt ze als suggestie in het rapport.
    </p>

    ${blokken}
  `;
}

function _lkPbVaardigheidBlok(kindCode, v, s) {
  const online = s.online[v.sl] || [];
  const eigen = (s.eigen || []).filter(t => t.vaardigheid === v.sl);
  const totaalToetsen = online.length + eigen.length;

  // Bereken totaal-percentage met gewichten
  let gewogenJuist = 0;
  let gewogenTotaal = 0;
  online.forEach(t => {
    gewogenJuist += (t.score || 0) * 1;
    gewogenTotaal += (t.maximum || 0) * 1;
  });
  eigen.forEach(t => {
    const g = (typeof t.gewicht === 'number' && t.gewicht > 0) ? t.gewicht : 1;
    gewogenJuist += (parseFloat(t.score) || 0) * g;
    gewogenTotaal += (parseFloat(t.maximum) || 0) * g;
  });
  const pct = gewogenTotaal > 0 ? Math.round(gewogenJuist / gewogenTotaal * 100) : null;

  // Open/dicht state
  const open = !!(_pbOpenVaardigheid[kindCode] && _pbOpenVaardigheid[kindCode][v.sl]);

  // Toets-rijen — alleen renderen als open
  let rijenHtml = '';
  if (open) {
    const alleRijen = [
      ...online.map(t => _lkPbToetsRij(kindCode, t, true)),
      ...eigen.map(t => _lkPbToetsRij(kindCode, t, false))
    ];
    rijenHtml = alleRijen.length > 0
      ? `<div class="lk-pb-toetsen-tabel">
          <div class="lk-pb-toetsen-kop">
            <span class="kop-naam">Naam</span>
            <span class="kop-datum">Datum</span>
            <span class="kop-score">Score</span>
            <span class="kop-gewicht">Gewicht</span>
            <span class="kop-pct">%</span>
            <span class="kop-acties"></span>
          </div>
          ${alleRijen.join('')}
         </div>`
      : '<p class="lk-pb-leeg">Nog geen toetsen voor deze vaardigheid.</p>';
    // Knop "+ eigen toets toevoegen"
    rijenHtml += `<button class="lk-knop-mini lk-pb-voeg-toe" onclick="lkPbNieuwModal('${kindCode}', '${v.sl}')">➕ Eigen toets toevoegen</button>`;
  }

  // Header tekst (totaal-percentage)
  const pctTekst = pct !== null ? `<span class="lk-pb-blok-pct">${pct}%</span>` : '<span class="lk-pb-blok-pct leeg">geen toetsen</span>';

  return `
    <div class="lk-pb-blok ${open ? 'open' : ''}">
      <div class="lk-pb-blok-header" onclick="lkPbToggle('${kindCode}', '${v.sl}')">
        <span class="lk-pb-blok-icoon">${v.icoon}</span>
        <span class="lk-pb-blok-naam">${v.naam}</span>
        <span class="lk-pb-blok-stat">${totaalToetsen} toets${totaalToetsen === 1 ? '' : 'en'}</span>
        ${pctTekst}
        <span class="lk-pb-blok-pijl">${open ? '▴' : '▾'}</span>
      </div>
      ${open ? `<div class="lk-pb-blok-inhoud">${rijenHtml}</div>` : ''}
    </div>
  `;
}

function _lkPbToetsRij(kindCode, t, isOnline) {
  const dt = t.datum ? new Date(t.datum) : null;
  const datumStr = dt ? `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(2)}` : '—';
  const score = t.score !== undefined && t.score !== null ? t.score : '?';
  const max = t.maximum !== undefined && t.maximum !== null ? t.maximum : '?';
  const gewicht = (typeof t.gewicht === 'number' && t.gewicht > 0) ? t.gewicht : 1;
  const pct = (parseFloat(t.maximum) > 0) ? Math.round(parseFloat(t.score) / parseFloat(t.maximum) * 100) : null;
  const naamHtml = `${(t.naam || '').replace(/</g, '&lt;')}${isOnline ? ' <span class="lk-pb-online-tag">online</span>' : ''}`;
  const opmerkingHtml = (!isOnline && t.opmerking)
    ? `<div class="lk-pb-opmerking">💬 ${(t.opmerking || '').replace(/</g, '&lt;')}${t.opmerkingCategorie ? ` <span class="lk-pb-opm-cat">→ ${_pbCatLabel(t.opmerkingCategorie)}</span>` : ''}</div>`
    : '';
  const acties = !isOnline
    ? `<button class="lk-knop-mini" title="Bewerken" onclick="lkPbBewerken('${kindCode}', '${t.id}')">✏️</button>
       <button class="lk-knop-mini gevaar" title="Verwijderen" onclick="lkPbVerwijder('${kindCode}', '${t.id}')">🗑️</button>`
    : '';
  return `
    <div class="lk-pb-rij ${isOnline ? 'online' : 'eigen'}">
      <div class="lk-pb-rij-hoofd">
        <span class="kop-naam">${naamHtml}</span>
        <span class="kop-datum">${datumStr}</span>
        <span class="kop-score">${score}/${max}</span>
        <span class="kop-gewicht">${gewicht}×</span>
        <span class="kop-pct">${pct !== null ? pct + '%' : '—'}</span>
        <span class="kop-acties">${acties}</span>
      </div>
      ${opmerkingHtml}
    </div>
  `;
}

function _pbCatLabel(cat) {
  if (cat === 'watGaatGoed') return '✨ Wat gaat goed';
  if (cat === 'groeipunten') return '🌱 Groeipunten';
  if (cat === 'werkhouding') return '💪 Werkhouding';
  return '';
}

function lkPbToggle(kindCode, vaardigheid) {
  if (!_pbOpenVaardigheid[kindCode]) _pbOpenVaardigheid[kindCode] = {};
  _pbOpenVaardigheid[kindCode][vaardigheid] = !_pbOpenVaardigheid[kindCode][vaardigheid];
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkPbRender(kind);
}

// =================================================================
//  Modal: nieuwe / bewerken eigen toets
// =================================================================

function lkPbNieuwModal(kindCode, vaardigheid, bestaandeToetsId) {
  const oud = document.getElementById('lk-pb-modal-bg');
  if (oud) oud.remove();

  const kind = lkKinderen.find(k => k.code === kindCode);
  if (!kind) return;
  const s = _pbInitState(kindCode);

  // Indien bewerken: zoek bestaande
  let bestaand = null;
  if (bestaandeToetsId) {
    bestaand = (s.eigen || []).find(t => t.id === bestaandeToetsId);
  }

  const naamInit = bestaand ? bestaand.naam : '';
  const datumInit = bestaand && bestaand.datum
    ? new Date(bestaand.datum).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const scoreInit = bestaand ? bestaand.score : '';
  const maxInit = bestaand ? bestaand.maximum : 10;
  const gewichtInit = bestaand && typeof bestaand.gewicht === 'number' ? bestaand.gewicht : 1;
  const opmerkingInit = bestaand ? (bestaand.opmerking || '') : '';
  const opmCatInit = bestaand ? bestaand.opmerkingCategorie : null;
  const vaardig = bestaand ? bestaand.vaardigheid : vaardigheid;

  const vaardigLabel = {
    luisteren: '👂 Luisteren',
    lezen: '👁️ Lezen',
    schrijven: '✍️ Schrijven',
    spreken: '🗣️ Spreken'
  };

  const bg = document.createElement('div');
  bg.id = 'lk-pb-modal-bg';
  bg.className = 'lk-cat-modal-bg';
  bg.onclick = (e) => { if (e.target === bg) bg.remove(); };

  bg.innerHTML = `
    <div class="lk-cat-modal" onclick="event.stopPropagation()">
      <h2>${bestaand ? '✏️ Toets bewerken' : '➕ Eigen toets toevoegen'}</h2>
      <p class="modal-uitleg">
        ${vaardigLabel[vaardig] || vaardig} — leerling: <strong>${kind.naam || kind.code}</strong>
      </p>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Naam van de toets</label>
        <input type="text" class="lk-taak-select" id="pb-naam" value="${(naamInit || '').replace(/"/g, '&quot;')}" placeholder="bv. Dictee thema dieren">
      </div>

      <div class="lk-taak-veld" style="display:flex;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:130px">
          <label class="lk-taak-label">Datum</label>
          <input type="date" class="lk-taak-select" id="pb-datum" value="${datumInit}">
        </div>
        <div style="flex:1;min-width:90px">
          <label class="lk-taak-label">Score</label>
          <input type="number" class="lk-taak-select" id="pb-score" value="${scoreInit}" min="0" step="0.5" placeholder="bv. 8">
        </div>
        <div style="flex:1;min-width:70px">
          <label class="lk-taak-label">Op</label>
          <input type="number" class="lk-taak-select" id="pb-max" value="${maxInit}" min="1" step="1" placeholder="10">
        </div>
        <div style="flex:1;min-width:90px">
          <label class="lk-taak-label">Gewicht</label>
          <select class="lk-taak-select" id="pb-gewicht">
            <option value="0.5" ${gewichtInit == 0.5 ? 'selected' : ''}>0.5× (telt half)</option>
            <option value="1" ${gewichtInit == 1 ? 'selected' : ''}>1× (normaal)</option>
            <option value="1.5" ${gewichtInit == 1.5 ? 'selected' : ''}>1.5×</option>
            <option value="2" ${gewichtInit == 2 ? 'selected' : ''}>2× (telt dubbel)</option>
            <option value="3" ${gewichtInit == 3 ? 'selected' : ''}>3× (telt drievoudig)</option>
          </select>
        </div>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Opmerking <small>(optioneel)</small></label>
        <textarea class="lk-pb-opmerking-veld" rows="3" id="pb-opmerking" placeholder="Bv. Sara werkte zelfstandig en heel netjes.">${(opmerkingInit || '').replace(/</g, '&lt;')}</textarea>
      </div>

      <div class="lk-taak-veld">
        <label class="lk-taak-label">Koppel opmerking aan rapport <small>(optioneel)</small></label>
        <div class="lk-pb-opm-cats">
          <label class="lk-pb-opm-cat-keuze ${opmCatInit === null || opmCatInit === undefined ? 'aan' : ''}">
            <input type="radio" name="pb-opm-cat" value="" ${opmCatInit == null ? 'checked' : ''}>
            <span>Niet koppelen</span>
          </label>
          <label class="lk-pb-opm-cat-keuze ${opmCatInit === 'watGaatGoed' ? 'aan' : ''}">
            <input type="radio" name="pb-opm-cat" value="watGaatGoed" ${opmCatInit === 'watGaatGoed' ? 'checked' : ''}>
            <span>✨ Wat gaat goed</span>
          </label>
          <label class="lk-pb-opm-cat-keuze ${opmCatInit === 'groeipunten' ? 'aan' : ''}">
            <input type="radio" name="pb-opm-cat" value="groeipunten" ${opmCatInit === 'groeipunten' ? 'checked' : ''}>
            <span>🌱 Groeipunten</span>
          </label>
          <label class="lk-pb-opm-cat-keuze ${opmCatInit === 'werkhouding' ? 'aan' : ''}">
            <input type="radio" name="pb-opm-cat" value="werkhouding" ${opmCatInit === 'werkhouding' ? 'checked' : ''}>
            <span>💪 Werkhouding</span>
          </label>
        </div>
      </div>

      <div class="lk-cat-modal-knoppen">
        <button class="lk-knop-mini" onclick="document.getElementById('lk-pb-modal-bg').remove()">Annuleren</button>
        <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkPbBewaren('${kindCode}', '${vaardig}', ${bestaand ? `'${bestaand.id}'` : 'null'})">💾 ${bestaand ? 'Opslaan' : 'Toevoegen'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);
  setTimeout(() => {
    const naamEl = document.getElementById('pb-naam');
    if (naamEl) naamEl.focus();
  }, 50);
}

function lkPbBewerken(kindCode, toetsId) {
  const s = _pbInitState(kindCode);
  const t = (s.eigen || []).find(x => x.id === toetsId);
  if (!t) return;
  lkPbNieuwModal(kindCode, t.vaardigheid, toetsId);
}

async function lkPbBewaren(kindCode, vaardigheid, bestaandeId) {
  const naam = (document.getElementById('pb-naam') || {}).value || '';
  const datumStr = (document.getElementById('pb-datum') || {}).value || '';
  const scoreStr = (document.getElementById('pb-score') || {}).value || '';
  const maxStr = (document.getElementById('pb-max') || {}).value || '';
  const gewichtStr = (document.getElementById('pb-gewicht') || {}).value || '1';
  const opmerking = (document.getElementById('pb-opmerking') || {}).value || '';
  const opmCatRadio = document.querySelector('input[name="pb-opm-cat"]:checked');
  const opmCat = opmCatRadio ? opmCatRadio.value : '';

  if (!naam.trim()) { alert('Geef de toets een naam.'); return; }
  if (!datumStr) { alert('Vul een datum in.'); return; }
  const score = parseFloat(scoreStr);
  const max = parseFloat(maxStr);
  if (isNaN(score) || score < 0) { alert('Score moet een getal zijn (0 of meer).'); return; }
  if (isNaN(max) || max <= 0) { alert('Het maximum moet een positief getal zijn.'); return; }
  if (score > max) { alert('Score mag niet groter zijn dan het maximum.'); return; }
  const gewicht = parseFloat(gewichtStr) || 1;

  const s = _pbInitState(kindCode);

  const knop = document.querySelector('#lk-pb-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    const datum = new Date(datumStr).getTime();
    const toetsData = {
      id: bestaandeId !== 'null' && bestaandeId ? bestaandeId : undefined,
      kindCode: kindCode,
      vaardigheid: vaardigheid,
      naam: naam.trim(),
      datum: datum,
      score: score,
      maximum: max,
      gewicht: gewicht,
      opmerking: opmerking.trim(),
      opmerkingCategorie: opmCat || null,
      rapportperiodeId: s.periodeId,
      schooljaar: Voortgang.bepaalSchooljaarUitDatum(datum)
    };
    await Voortgang.bewaarEigenToets(toetsData);
    document.getElementById('lk-pb-modal-bg').remove();
    // Refresh data
    s.geladen = false;
    await _pbLaadDataVoorPeriode(kindCode, s.periodeId);
    s.geladen = true;
    const kind = lkKinderen.find(k => k.code === kindCode);
    if (kind) _lkPbRender(kind);
  } catch (e) {
    console.error('Eigen toets bewaren mislukt:', e);
    alert('Bewaren mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = bestaandeId && bestaandeId !== 'null' ? '💾 Opslaan' : '💾 Toevoegen'; }
  }
}

async function lkPbVerwijder(kindCode, toetsId) {
  const s = _pbInitState(kindCode);
  const t = (s.eigen || []).find(x => x.id === toetsId);
  if (!t) return;
  if (!confirm(`Weet je zeker dat je de toets "${t.naam}" wil verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
  try {
    await Voortgang.verwijderEigenToets(toetsId);
    s.geladen = false;
    await _pbLaadDataVoorPeriode(kindCode, s.periodeId);
    s.geladen = true;
    const kind = lkKinderen.find(k => k.code === kindCode);
    if (kind) _lkPbRender(kind);
  } catch (e) {
    console.error('Verwijderen mislukt:', e);
    alert('Verwijderen mislukt: ' + (e.message || 'onbekend'));
  }
}
// =================================================================
//  RAPPORT — inline werkomgeving in uitklap-paneel per leerling
// =================================================================
//
// Per leerling: sterren-rij + 3 feedback-categorieën, allemaal direct
// zichtbaar wanneer de juf op de leerling klikt in de rapporten-tab.
// State wordt per kind+periode bewaard zodat je kan switchen zonder werk
// te verliezen. Bewaren is manueel (knop) — handgeschreven, geen auto-save.

// State per kind: _rapState[kindCode] = { periodeId, sterren, sterrenAuto,
//                                         toetsdata, foutWoorden,
//                                         feedbackVink, feedbackTekst, aiZinnen,
//                                         geladenVoorPeriode, geladenVoorKind }
let _rapState = {};

// Welke kind+periode is momenteel zichtbaar (voor re-render zonder data verlies)
let _rapHuidigKindCode = null;

// Standaard-feedback-zinnen per categorie (placeholders voor [Naam])
const _RAP_STANDAARDZINNEN = {
  watGaatGoed: [
    '[Naam] herkent veel woorden bij het luisteren.',
    '[Naam] leest de aangeleerde woorden vlot.',
    '[Naam] schrijft de meeste woorden correct.',
    '[Naam] durft te spreken in het Nederlands.',
    '[Naam] toont vooruitgang in alle vaardigheden.'
  ],
  groeipunten: [
    '[Naam] mag nog meer oefenen op het schrijven van woorden.',
    '[Naam] kan de uitspraak verder verfijnen.',
    '[Naam] mag woorden actiever gebruiken in zinnen.',
    '[Naam] heeft nog moeite met sommige klanken.',
    'Meer herhaling thuis kan helpen om de woorden vast te zetten.'
  ],
  werkhouding: [
    '[Naam] werkt zelfstandig en gemotiveerd.',
    '[Naam] vraagt hulp wanneer nodig.',
    '[Naam] heeft nog moeite met focus tijdens het werk.',
    '[Naam] werkt graag samen met klasgenoten.',
    '[Naam] kan nog leren om langer geconcentreerd te werken.'
  ]
};

// Vervang [Naam] door de voornaam
function _rapVervangNaam(zin, naam) {
  if (!naam) return zin;
  const voornaam = (naam || '').split(' ')[0];
  return zin.replace(/\[Naam\]/g, voornaam);
}

// Initialiseer state voor een kind als die nog niet bestaat
function _rapInitState(kindCode) {
  if (_rapState[kindCode]) return _rapState[kindCode];
  _rapState[kindCode] = {
    periodeId: null,
    sterren: { luisteren: null, lezen: null, schrijven: null, spreken: null, werkhouding: 3 },
    sterrenAuto: {},
    toetsdata: {},
    foutWoorden: {},
    feedbackVink: { watGaatGoed: [], groeipunten: [], werkhouding: [] },
    feedbackTekst: { watGaatGoed: {}, groeipunten: {}, werkhouding: {} },
    aiZinnen: { watGaatGoed: [], groeipunten: [], werkhouding: [] },
    // Opmerkingen uit puntenboek per categorie: [{ tekst, toetsId, toetsNaam }]
    pbOpmerkingen: { watGaatGoed: [], groeipunten: [], werkhouding: [] },
    pbVink: { watGaatGoed: [], groeipunten: [], werkhouding: [] }, // welke pb-opmerkingen zijn aangevinkt
    geladen: false,
    bezigMetLaden: false
  };
  return _rapState[kindCode];
}

// Reset state-velden voor een kind (bij periode-wissel)
function _rapResetStateVoorPeriode(kindCode) {
  const s = _rapState[kindCode];
  if (!s) return;
  s.feedbackVink = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  s.feedbackTekst = { watGaatGoed: {}, groeipunten: {}, werkhouding: {} };
  s.aiZinnen = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  s.pbOpmerkingen = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  s.pbVink = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  s.geladen = false;
}

// =================================================================
//  Inline rendering — wordt aangeroepen vanuit _lkRendererRapporten
// =================================================================

// Sync placeholder die meteen wordt teruggegeven aan _lkRendererRapporten.
// Daarna start _lkRapInlineLaden() asynchroon de echte render.
function _lkRapInlinePlaceholder(kind) {
  const naamSafe = (kind.naam || '').replace(/'/g, "\\'");
  return `
    <div id="lk-rap-inline" class="lk-rap-inline" data-code="${kind.code}">
      <div class="lk-rap-inline-laden">
        <p>⏳ Bezig met laden…</p>
      </div>
    </div>
  `;
}

// Async data-loader — wordt aangeroepen vanuit _lkRendererRapporten
async function _lkRapInlineLaden(kind) {
  if (!kind || !kind.code) return;
  _rapHuidigKindCode = kind.code;
  const s = _rapInitState(kind.code);

  // Welke periode? Default = actieve, anders meest recente
  if (!s.periodeId) {
    if (_actievePeriode) {
      s.periodeId = _actievePeriode.id;
    } else if (_periodes && _periodes.length > 0) {
      s.periodeId = _periodes[0].id;
    } else {
      _lkRapInlineRenderError(kind, 'Geen rapportperiode aangemaakt. Maak eerst een periode aan in de balk bovenaan.');
      return;
    }
  }

  // Al geladen voor deze periode? Direct renderen.
  if (s.geladen) {
    _lkRapInlineRender(kind);
    return;
  }

  // Geen periodes? Toon foutmelding
  if (!_periodes || _periodes.length === 0) {
    _lkRapInlineRenderError(kind, 'Geen rapportperiode aangemaakt. Maak eerst een periode aan in de balk bovenaan.');
    return;
  }

  if (s.bezigMetLaden) return; // dubbele triggers vermijden
  s.bezigMetLaden = true;

  await _rapLaadDataVoorKindPeriode(kind.code, s.periodeId, kind.naam);

  s.bezigMetLaden = false;
  s.geladen = true;

  // Alleen renderen als de juf nog op deze leerling staat
  if (_rapHuidigKindCode === kind.code) {
    _lkRapInlineRender(kind);
  }
}

function _lkRapInlineRenderError(kind, melding) {
  const cont = document.getElementById('lk-rap-inline');
  if (!cont || cont.getAttribute('data-code') !== kind.code) return;
  cont.innerHTML = `<p class="lk-kind-leeg">${melding}</p>`;
}

// Laad sterren-data + opgeslagen rapport voor een kind+periode
async function _rapLaadDataVoorKindPeriode(kindCode, periodeId, kindNaam) {
  const s = _rapInitState(kindCode);
  const periode = (_periodes || []).find(p => p.id === periodeId);

  // 1) Sterren berekenen (telt nu ook eigen toetsen mee via Voortgang)
  let berekend = null;
  try {
    berekend = await Voortgang.berekenRapportSterren(kindCode, periodeId, periode);
  } catch (e) {
    console.warn('Sterren berekenen mislukt:', e);
    berekend = { sterren: {}, toetsdata: {}, foutWoorden: {} };
  }
  s.sterrenAuto = berekend.sterren || {};
  s.toetsdata = berekend.toetsdata || {};
  s.foutWoorden = berekend.foutWoorden || {};

  // 2) Puntenboek-opmerkingen ophalen (per categorie)
  s.pbOpmerkingen = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  try {
    const eigenToetsen = await Voortgang.haalEigenToetsenVoorKindPeriode(kindCode, periodeId);
    eigenToetsen.forEach(t => {
      if (t.opmerking && t.opmerkingCategorie && s.pbOpmerkingen[t.opmerkingCategorie]) {
        s.pbOpmerkingen[t.opmerkingCategorie].push({
          tekst: t.opmerking,
          toetsId: t.id,
          toetsNaam: t.naam || ''
        });
      }
    });
  } catch (e) { /* stil falen */ }

  // 3) Opgeslagen rapport ophalen
  let opgeslagen = null;
  try {
    opgeslagen = await Voortgang.haalRapportOpVoorKind(kindCode, periodeId);
  } catch (e) { opgeslagen = null; }

  if (opgeslagen) {
    s.sterren = {
      luisteren:   (opgeslagen.sterren && opgeslagen.sterren.luisteren !== undefined) ? opgeslagen.sterren.luisteren : s.sterrenAuto.luisteren,
      lezen:       (opgeslagen.sterren && opgeslagen.sterren.lezen !== undefined)     ? opgeslagen.sterren.lezen     : s.sterrenAuto.lezen,
      schrijven:   (opgeslagen.sterren && opgeslagen.sterren.schrijven !== undefined) ? opgeslagen.sterren.schrijven : s.sterrenAuto.schrijven,
      spreken:     (opgeslagen.sterren && opgeslagen.sterren.spreken !== undefined)   ? opgeslagen.sterren.spreken   : s.sterrenAuto.spreken,
      werkhouding: (opgeslagen.sterren && opgeslagen.sterren.werkhouding !== undefined) ? opgeslagen.sterren.werkhouding : 3
    };
    if (opgeslagen.feedback) {
      ['watGaatGoed', 'groeipunten', 'werkhouding'].forEach(cat => {
        const opgeslagenZinnen = Array.isArray(opgeslagen.feedback[cat]) ? opgeslagen.feedback[cat] : [];
        const standaarden = (_RAP_STANDAARDZINNEN[cat] || []).map(z => _rapVervangNaam(z, kindNaam));
        const pbTeksten = (s.pbOpmerkingen[cat] || []).map(o => o.tekst);
        opgeslagenZinnen.forEach(zin => {
          // 1) Standaardzin?
          const stIdx = standaarden.indexOf(zin);
          if (stIdx >= 0) {
            s.feedbackVink[cat].push('std-' + stIdx);
            return;
          }
          // 2) Puntenboek-opmerking?
          const pbIdx = pbTeksten.indexOf(zin);
          if (pbIdx >= 0) {
            s.pbVink[cat].push('pb-' + pbIdx);
            return;
          }
          // 3) Bewerkte standaardzin?
          const bewerkteVan = standaarden.findIndex(st => zin.startsWith(st.slice(0, 15)));
          if (bewerkteVan >= 0 && !s.feedbackVink[cat].includes('std-' + bewerkteVan)) {
            s.feedbackVink[cat].push('std-' + bewerkteVan);
            s.feedbackTekst[cat]['std-' + bewerkteVan] = zin;
            return;
          }
          // 4) Anders → AI-zin
          const aiIdx = s.aiZinnen[cat].length;
          s.aiZinnen[cat].push(zin);
          s.feedbackVink[cat].push('ai-' + aiIdx);
        });
      });
    }
  } else {
    s.sterren = {
      luisteren: s.sterrenAuto.luisteren !== undefined ? s.sterrenAuto.luisteren : null,
      lezen:     s.sterrenAuto.lezen !== undefined     ? s.sterrenAuto.lezen     : null,
      schrijven: s.sterrenAuto.schrijven !== undefined ? s.sterrenAuto.schrijven : null,
      spreken:   s.sterrenAuto.spreken !== undefined   ? s.sterrenAuto.spreken   : null,
      werkhouding: 3
    };
  }
}

// =================================================================
//  Renderer voor inline werkomgeving
// =================================================================

function _lkRapInlineRender(kind) {
  const cont = document.getElementById('lk-rap-inline');
  // Container kan weg zijn als juf naar andere tab/leerling is gegaan
  if (!cont || cont.getAttribute('data-code') !== kind.code) return;

  const s = _rapInitState(kind.code);
  const periodes = _periodes || [];
  const naam = kind.naam || kind.code;

  // Filter periodes op huidig schooljaar (als gezet)
  const sjId = (typeof _actiefSchooljaar !== 'undefined' && _actiefSchooljaar) ? _actiefSchooljaar.id : null;
  let zichtbarePeriodes = periodes;
  if (sjId && Voortgang.filterPeriodesOpSchooljaar) {
    zichtbarePeriodes = Voortgang.filterPeriodesOpSchooljaar(periodes, sjId);
  }

  // Standaard: verberg afgesloten periodes — toon alleen actieve.
  // Met "Toon archief" knop kunnen ze toch tevoorschijn komen.
  const toonArchief = !!s.toonArchief;
  let dropdownPeriodes = toonArchief
    ? zichtbarePeriodes
    : zichtbarePeriodes.filter(p => p.status === 'actief');

  // Als de huidige periode toch in archief zit, voeg die altijd toe (anders mismatch)
  const huidigePeriode = zichtbarePeriodes.find(p => p.id === s.periodeId);
  if (huidigePeriode && !dropdownPeriodes.includes(huidigePeriode)) {
    dropdownPeriodes = [huidigePeriode, ...dropdownPeriodes];
  }

  // Sorteer: actieve eerst, dan archief op startDatum desc
  dropdownPeriodes = dropdownPeriodes.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === 'actief' ? -1 : 1;
    return (b.startDatum || 0) - (a.startDatum || 0);
  });

  // Periode-dropdown HTML
  const periodeOpties = dropdownPeriodes.map(p => {
    const sel = (p.id === s.periodeId) ? 'selected' : '';
    const label = p.nummer
      ? `Rapportperiode ${p.nummer}${p.status === 'afgesloten' ? ' (afgesloten)' : ''}`
      : `${p.naam}${p.status === 'afgesloten' ? ' (afgesloten)' : ''}`;
    return `<option value="${p.id}" ${sel}>${label}</option>`;
  }).join('');

  // Bestaan er afgesloten periodes voor archief-knop?
  const heeftArchief = zichtbarePeriodes.some(p => p.status === 'afgesloten');
  const archiefKnop = heeftArchief
    ? `<button class="lk-rap-archief-toggle" onclick="lkRapInlineToggleArchief('${kind.code}')">${toonArchief ? '🔓 Verberg archief' : '📁 Toon archief'}</button>`
    : '';

  // Is de huidige periode afgesloten? → alleen-lezen modus
  const isAfgesloten = !!(huidigePeriode && huidigePeriode.status === 'afgesloten');

  // Sterren-rijen
  const sterrenRijen = [
    { sl: 'luisteren',   icoon: '👂', naam: 'Luisteren',   manueel: false },
    { sl: 'lezen',       icoon: '👁️', naam: 'Lezen',       manueel: false },
    { sl: 'schrijven',   icoon: '✍️', naam: 'Schrijven',   manueel: false },
    { sl: 'spreken',     icoon: '🗣️', naam: 'Spreken',     manueel: false },
    { sl: 'werkhouding', icoon: '🎯', naam: 'Werkhouding', manueel: true  }
  ].map(v => _rapRenderSterRij(kind.code, v.sl, v.icoon, v.naam, v.manueel, isAfgesloten)).join('');

  // 3 feedback-categorieën
  const catGoed  = _rapRenderCategorie(kind.code, naam, 'watGaatGoed', '✨ Wat gaat goed', '#4CAF50', isAfgesloten);
  const catGroei = _rapRenderCategorie(kind.code, naam, 'groeipunten', '🌱 Groeipunten', '#FFB74D', isAfgesloten);
  const catWerk  = _rapRenderCategorie(kind.code, naam, 'werkhouding', '💪 Werkhouding & zelfstandigheid', '#FF8C42', isAfgesloten);

  // Banner + uitleg op basis van status
  let banner = '';
  if (isAfgesloten) {
    const datumAf = huidigePeriode.afgeslotenOp
      ? new Date(huidigePeriode.afgeslotenOp).toLocaleDateString('nl-BE')
      : '';
    banner = `
      <div class="lk-rap-inline-banner archief">
        🔒 Deze rapportperiode is afgesloten${datumAf ? ' op ' + datumAf : ''}.
        Je kan het rapport bekijken en de PDF opnieuw downloaden, maar niet meer wijzigen.
        <button class="lk-knop-mini-link" onclick="lkRapInlineHeropen('${kind.code}', '${huidigePeriode.id}')">🔓 Heropen periode om te wijzigen</button>
      </div>
    `;
  } else {
    banner = `
      <p class="lk-rap-inline-uitleg">
        Pas de sterren aan en vink feedback-zinnen aan. Klik op <strong>💾 Bewaar</strong> om je voortgang te bewaren — je kan over meerdere dagen blijven werken aan dit rapport.
      </p>
    `;
  }

  // Knoppen onderaan
  const knoppen = isAfgesloten
    ? `<button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkRapInlineGenereer('${kind.code}')">📄 Download PDF opnieuw</button>`
    : `<button class="lk-knop-mini" onclick="lkRapInlineBewaar('${kind.code}')">💾 Bewaar</button>
       <button class="lk-knop-mini" style="background:var(--kleur-zisa,#ffd166)" onclick="lkRapInlineGenereer('${kind.code}')">📄 Genereer PDF</button>`;

  const sterrenTitel = isAfgesloten
    ? `<div class="lk-rap-sterren-titel">Sterren <small>(alleen-lezen)</small></div>`
    : `<div class="lk-rap-sterren-titel">Sterren <small>(klik op de sterren om aan te passen)</small></div>`;

  cont.innerHTML = `
    <div class="lk-rap-inline-kop">
      <h3>📋 Rapport voor ${naam}</h3>
      <div class="lk-rap-inline-periode">
        <label>Periode:</label>
        <select class="lk-rap-periode-select" onchange="lkRapInlineWisselPeriode('${kind.code}', this.value)">
          ${periodeOpties}
        </select>
        ${archiefKnop}
      </div>
    </div>

    ${banner}

    <div class="lk-rap-sterren-blok ${isAfgesloten ? 'archief-modus' : ''}">
      ${sterrenTitel}
      ${sterrenRijen}
    </div>

    ${catGoed}
    ${catGroei}
    ${catWerk}

    <div class="lk-rap-inline-knoppen">
      ${knoppen}
    </div>
  `;
}

// Render één sterren-rij
function _rapRenderSterRij(kindCode, sl, icoon, naam, manueel, isAfgesloten) {
  const s = _rapInitState(kindCode);
  const aantal = s.sterren[sl];
  const auto = s.sterrenAuto[sl];
  const td = s.toetsdata[sl] || {};
  const heeftData = (td.aantal && td.aantal > 0);

  let sterren = '';
  for (let i = 1; i <= 4; i++) {
    const aan = (aantal !== null && aantal !== undefined && i <= aantal);
    const onclick = isAfgesloten ? '' : `onclick="lkRapInlineKliksterren('${kindCode}', '${sl}', ${i})"`;
    const cls = isAfgesloten ? 'lk-rap-ster vergrendeld' : 'lk-rap-ster';
    sterren += `<span class="${cls} ${aan ? 'aan' : ''}" ${onclick}>★</span>`;
  }

  let sub = '';
  if (manueel) {
    sub = '<span class="lk-rap-ster-sub manueel">manueel</span>';
  } else if (heeftData) {
    sub = `<span class="lk-rap-ster-sub">auto: ${td.pct}% · ${td.aantal} toets${td.aantal === 1 ? '' : 'en'}</span>`;
  } else {
    sub = '<span class="lk-rap-ster-sub leeg">Nog niet getest tijdens deze rapportperiode</span>';
  }

  let resetKnop = '';
  if (!isAfgesloten && !manueel && heeftData && aantal !== auto) {
    resetKnop = `<button class="lk-rap-ster-reset" title="Terug naar berekende waarde" onclick="lkRapInlineResetSterren('${kindCode}', '${sl}')">↻</button>`;
  }

  return `
    <div class="lk-rap-ster-rij">
      <span class="lk-rap-ster-icoon">${icoon}</span>
      <span class="lk-rap-ster-naam">${naam}</span>
      <span class="lk-rap-ster-sterren">${sterren}</span>
      ${sub}
      ${resetKnop}
    </div>
  `;
}

// Render één feedback-categorie met checkboxes + AI-knop
function _rapRenderCategorie(kindCode, naam, cat, titel, kleur, isAfgesloten) {
  const s = _rapInitState(kindCode);
  const standaarden = _RAP_STANDAARDZINNEN[cat] || [];
  const aiZinnen = s.aiZinnen[cat] || [];
  const vinkjes = s.feedbackVink[cat] || [];
  const pbOpm = (s.pbOpmerkingen && s.pbOpmerkingen[cat]) || [];
  const pbVinkjes = (s.pbVink && s.pbVink[cat]) || [];

  // Bij afgesloten modus: toon enkel de aangevinkte zinnen als rustige lees-lijst
  if (isAfgesloten) {
    const aangevinkteTeksten = [];
    standaarden.forEach((zin, idx) => {
      const id = 'std-' + idx;
      if (vinkjes.includes(id)) {
        const bewerkt = s.feedbackTekst[cat][id];
        aangevinkteTeksten.push(bewerkt || _rapVervangNaam(zin, naam));
      }
    });
    aiZinnen.forEach((zin, idx) => {
      const id = 'ai-' + idx;
      if (vinkjes.includes(id) && zin && zin.trim()) {
        aangevinkteTeksten.push(zin);
      }
    });
    pbOpm.forEach((o, idx) => {
      const id = 'pb-' + idx;
      if (pbVinkjes.includes(id) && o.tekst && o.tekst.trim()) {
        aangevinkteTeksten.push(o.tekst);
      }
    });

    if (aangevinkteTeksten.length === 0) {
      return ''; // geen lege categorie tonen in lees-modus
    }

    const bullets = aangevinkteTeksten.map(t => {
      const safe = (t || '').replace(/</g, '&lt;');
      return `<li>${safe}</li>`;
    }).join('');

    return `
      <div class="lk-rap-cat-blok lk-rap-cat-blok-leesmodus">
        <div class="lk-rap-cat-titel" style="color:${kleur}">${titel}</div>
        <ul class="lk-rap-cat-leeslijst">${bullets}</ul>
      </div>
    `;
  }

  const stdHtml = standaarden.map((zin, idx) => {
    const id = 'std-' + idx;
    const aangevinkt = vinkjes.includes(id);
    const bewerkt = s.feedbackTekst[cat][id];
    const tekst = bewerkt || _rapVervangNaam(zin, naam);
    const tekstSafe = tekst.replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `
      <div class="lk-rap-zin ${aangevinkt ? 'aangevinkt' : ''}">
        <input type="checkbox" id="rap-${kindCode}-${cat}-${id}" ${aangevinkt ? 'checked' : ''} onclick="lkRapInlineVink('${kindCode}', '${cat}', '${id}')">
        <input type="text" class="lk-rap-zin-tekst" value="${tekstSafe}" oninput="lkRapInlineBewerkZin('${kindCode}', '${cat}', '${id}', this.value)" ${aangevinkt ? '' : 'disabled'}>
      </div>
    `;
  }).join('');

  const aiHtml = aiZinnen.map((zin, idx) => {
    const id = 'ai-' + idx;
    const aangevinkt = vinkjes.includes(id);
    const tekstSafe = (zin || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `
      <div class="lk-rap-zin lk-rap-zin-ai ${aangevinkt ? 'aangevinkt' : ''}">
        <input type="checkbox" id="rap-${kindCode}-${cat}-${id}" ${aangevinkt ? 'checked' : ''} onclick="lkRapInlineVink('${kindCode}', '${cat}', '${id}')">
        <input type="text" class="lk-rap-zin-tekst" value="${tekstSafe}" oninput="lkRapInlineBewerkAiZin('${kindCode}', '${cat}', ${idx}, this.value)" ${aangevinkt ? '' : 'disabled'}>
        <button class="lk-rap-zin-wis" title="Verwijder deze zin" onclick="lkRapInlineWisAiZin('${kindCode}', '${cat}', ${idx})">🗑️</button>
      </div>
    `;
  }).join('');

  // Puntenboek-opmerkingen (uit eigen toetsen voor deze categorie)
  let pbHtml = '';
  if (pbOpm.length > 0) {
    pbHtml = '<div class="lk-rap-pb-blok">';
    pbHtml += '<div class="lk-rap-pb-kop">📓 Uit het puntenboek:</div>';
    pbHtml += pbOpm.map((o, idx) => {
      const id = 'pb-' + idx;
      const aangevinkt = pbVinkjes.includes(id);
      const tekstSafe = (o.tekst || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const bron = o.toetsNaam ? `<small class="lk-rap-pb-bron">uit "${(o.toetsNaam || '').replace(/</g, '&lt;')}"</small>` : '';
      return `
        <div class="lk-rap-zin lk-rap-zin-pb ${aangevinkt ? 'aangevinkt' : ''}">
          <input type="checkbox" id="rap-${kindCode}-${cat}-${id}" ${aangevinkt ? 'checked' : ''} onclick="lkRapInlinePbVink('${kindCode}', '${cat}', '${id}')">
          <div class="lk-rap-pb-tekst-blok">
            <input type="text" class="lk-rap-zin-tekst" value="${tekstSafe}" oninput="lkRapInlineBewerkPbOpm('${kindCode}', '${cat}', ${idx}, this.value)" ${aangevinkt ? '' : 'disabled'}>
            ${bron}
          </div>
        </div>
      `;
    }).join('');
    pbHtml += '</div>';
  }

  return `
    <div class="lk-rap-cat-blok">
      <div class="lk-rap-cat-titel" style="color:${kleur}">${titel}</div>
      ${stdHtml}
      ${aiHtml}
      ${pbHtml}
      <div class="lk-rap-cat-knoppen">
        <button class="lk-rap-eigen-knop" onclick="lkRapInlineEigenZinToevoegen('${kindCode}', '${cat}')">➕ Eigen zin toevoegen</button>
        <button class="lk-rap-suggestie-knop" onclick="lkRapInlineAiSuggestie('${kindCode}', '${cat}')">✨ Suggesties van Claude</button>
      </div>
    </div>
  `;
}

// =================================================================
//  Click-handlers (allemaal kindCode-aware)
// =================================================================

async function lkRapInlineWisselPeriode(kindCode, periodeId) {
  if (!periodeId) return;
  const s = _rapInitState(kindCode);
  if (s.periodeId === periodeId) return;
  s.periodeId = periodeId;
  _rapResetStateVoorPeriode(kindCode);
  // Toon laden-melding
  const cont = document.getElementById('lk-rap-inline');
  if (cont && cont.getAttribute('data-code') === kindCode) {
    cont.innerHTML = '<div class="lk-rap-inline-laden"><p>⏳ Bezig met laden…</p></div>';
  }
  // Laad nieuwe data
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (!kind) return;
  await _rapLaadDataVoorKindPeriode(kindCode, periodeId, kind.naam);
  s.geladen = true;
  if (_rapHuidigKindCode === kindCode) _lkRapInlineRender(kind);
}

function lkRapInlineKliksterren(kindCode, vaardigheid, nieuwAantal) {
  const s = _rapInitState(kindCode);
  const huidig = s.sterren[vaardigheid];
  if (huidig === nieuwAantal) {
    s.sterren[vaardigheid] = (vaardigheid === 'werkhouding') ? 1 : null;
  } else {
    s.sterren[vaardigheid] = nieuwAantal;
  }
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

function lkRapInlineResetSterren(kindCode, vaardigheid) {
  const s = _rapInitState(kindCode);
  s.sterren[vaardigheid] = s.sterrenAuto[vaardigheid];
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

function lkRapInlineVink(kindCode, cat, id) {
  const s = _rapInitState(kindCode);
  const lijst = s.feedbackVink[cat] || [];
  const idx = lijst.indexOf(id);
  if (idx >= 0) lijst.splice(idx, 1);
  else lijst.push(id);
  s.feedbackVink[cat] = lijst;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

function lkRapInlineBewerkZin(kindCode, cat, id, tekst) {
  const s = _rapInitState(kindCode);
  s.feedbackTekst[cat][id] = tekst;
  // Geen re-render — anders verliest input zijn focus tijdens typen
}

function lkRapInlineBewerkAiZin(kindCode, cat, idx, tekst) {
  const s = _rapInitState(kindCode);
  s.aiZinnen[cat][idx] = tekst;
}

function lkRapInlineWisAiZin(kindCode, cat, idx) {
  const s = _rapInitState(kindCode);
  s.aiZinnen[cat].splice(idx, 1);
  // Vink-lijst herschikken: hernummer hogere ai-indices
  const vinkjes = s.feedbackVink[cat] || [];
  const nieuw = [];
  vinkjes.forEach(v => {
    if (v === 'ai-' + idx) return;
    const m = v.match(/^ai-(\d+)$/);
    if (m) {
      const i = parseInt(m[1]);
      if (i > idx) nieuw.push('ai-' + (i - 1));
      else nieuw.push(v);
    } else {
      nieuw.push(v);
    }
  });
  s.feedbackVink[cat] = nieuw;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

// Voeg een lege eigen zin toe aan een categorie — vrij tekstveld voor de juf
// Behind the scenes opslagen als 'ai-zin' (hergebruikt aiZinnen-array).
function lkRapInlineEigenZinToevoegen(kindCode, cat) {
  const s = _rapInitState(kindCode);
  // Voeg een lege string toe → wordt na render een leeg input-veld dat aangevinkt is
  const idx = s.aiZinnen[cat].length;
  s.aiZinnen[cat].push('');
  // Meteen aanvinken zodat juf direct kan typen
  s.feedbackVink[cat].push('ai-' + idx);
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) {
    _lkRapInlineRender(kind);
    // Focus op het nieuwe veld zetten (na render)
    setTimeout(() => {
      const el = document.getElementById(`rap-${kindCode}-${cat}-ai-${idx}`);
      if (el) {
        const tekstInput = el.parentElement && el.parentElement.querySelector('.lk-rap-zin-tekst');
        if (tekstInput) tekstInput.focus();
      }
    }, 50);
  }
}

// Vink/ontvink een puntenboek-opmerking
function lkRapInlinePbVink(kindCode, cat, id) {
  const s = _rapInitState(kindCode);
  if (!s.pbVink) s.pbVink = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  const lijst = s.pbVink[cat] || [];
  const idx = lijst.indexOf(id);
  if (idx >= 0) lijst.splice(idx, 1);
  else lijst.push(id);
  s.pbVink[cat] = lijst;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

// Bewerk een puntenboek-opmerking inline (alleen lokaal in rapport — niet in puntenboek zelf)
function lkRapInlineBewerkPbOpm(kindCode, cat, idx, tekst) {
  const s = _rapInitState(kindCode);
  if (s.pbOpmerkingen && s.pbOpmerkingen[cat] && s.pbOpmerkingen[cat][idx]) {
    s.pbOpmerkingen[cat][idx].tekst = tekst;
  }
}

// Toon/verberg afgesloten periodes in dropdown
function lkRapInlineToggleArchief(kindCode) {
  const s = _rapInitState(kindCode);
  s.toonArchief = !s.toonArchief;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (kind) _lkRapInlineRender(kind);
}

// Heropen een afgesloten periode (juf wil toch nog wijzigen)
async function lkRapInlineHeropen(kindCode, periodeId) {
  if (!periodeId) return;
  const periode = (_periodes || []).find(p => p.id === periodeId);
  if (!periode) return;

  const bevestiging = confirm(
    `Weet je zeker dat je "${periode.naam}" wil heropenen?\n\n` +
    `LET OP: alle rapporten in deze periode zullen weer bewerkbaar zijn voor jou. ` +
    `De huidige actieve periode wordt automatisch afgesloten.`
  );
  if (!bevestiging) return;

  try {
    // Sluit huidige actieve periode eerst (als er één is en het niet deze is)
    if (_actievePeriode && _actievePeriode.id !== periodeId) {
      await Voortgang.sluitRapportperiode(_actievePeriode.id);
    }
    // Heropen deze periode
    await Voortgang.heropenRapportperiode(periodeId);
    // Periodes herladen
    _periodes = await Voortgang.alleRapportperiodes();
    _actievePeriode = _periodes.find(p => p.status === 'actief') || null;
    if (typeof _lkPeriodeBalkRenderer === 'function') _lkPeriodeBalkRenderer();
    // Re-render
    const kind = lkKinderen.find(k => k.code === kindCode);
    if (kind) _lkRapInlineRender(kind);
  } catch (e) {
    console.error('Heropenen mislukt:', e);
    alert('Heropenen mislukt: ' + (e.message || 'onbekend'));
  }
}

// =================================================================
//  AI-suggestie
// =================================================================

async function lkRapInlineAiSuggestie(kindCode, cat) {
  const s = _rapInitState(kindCode);
  if (!s.periodeId) return;

  // Knop disabled tonen
  let knopVoorCat = null;
  document.querySelectorAll('#lk-rap-inline .lk-rap-suggestie-knop').forEach(b => {
    const oc = b.getAttribute('onclick');
    if (oc && oc.includes(`'${cat}'`)) knopVoorCat = b;
  });
  if (knopVoorCat) { knopVoorCat.disabled = true; knopVoorCat.textContent = '⏳ Bezig…'; }

  try {
    const kind = lkKinderen.find(k => k.code === kindCode);
    const naam = kind ? (kind.naam || kindCode).split(' ')[0] : kindCode;
    const periode = (_periodes || []).find(p => p.id === s.periodeId);

    const foutNamen = _rapBouwFoutNamenVoorPrompt(kindCode);

    // Puntenboek-opmerkingen voor deze categorie ophalen
    const pbOpmerkingenVoorCat = (s.pbOpmerkingen && s.pbOpmerkingen[cat]) || [];
    const pbContext = pbOpmerkingenVoorCat
      .filter(o => o.tekst && o.tekst.trim())
      .map(o => ({
        opmerking: o.tekst.trim(),
        toets: o.toetsNaam || ''
      }));

    // Spreektoets-detail: welke woorden gingen vlot/aarzelt/niet?
    let spreekDetail = null;
    try {
      const spreekToetsen = await Voortgang.haalSpreektoetsenOpVoorKind(kindCode);
      const venster = periode ? { start: periode.startDatum, eind: periode.eindDatum } : null;
      const inPeriode = spreekToetsen.filter(st => {
        if (st.status === 'klaargezet') return false;
        if (st.rapportperiodeId === s.periodeId) return true;
        if (!venster || !st.datum) return false;
        return st.datum >= venster.start && st.datum <= venster.eind;
      });
      if (inPeriode.length > 0) {
        const vlot = [], aarzelt = [], niet = [];
        inPeriode.forEach(st => {
          const perWoord = st.perWoord || {};
          Object.keys(perWoord).forEach(id => {
            const waarde = perWoord[id];
            const oordeel = (waarde && typeof waarde === 'object') ? waarde.oordeel : waarde;
            const naam = _rapZoekWoordnaam(id);
            if (!naam) return;
            if (oordeel === 'vlot') vlot.push(naam);
            else if (oordeel === 'aarzelt') aarzelt.push(naam);
            else if (oordeel === 'niet') niet.push(naam);
          });
        });
        spreekDetail = {
          vlot: Array.from(new Set(vlot)).slice(0, 6),
          aarzelt: Array.from(new Set(aarzelt)).slice(0, 6),
          niet: Array.from(new Set(niet)).slice(0, 6)
        };
      }
    } catch (e) { /* stil falen */ }

    // Reeds aangevinkte zinnen (zodat Claude geen herhaling geeft)
    const reedsGekozen = [];
    const stdZinnen = _RAP_STANDAARDZINNEN[cat] || [];
    (s.feedbackVink[cat] || []).forEach(id => {
      if (id.startsWith('std-')) {
        const idx = parseInt(id.slice(4));
        const std = stdZinnen[idx];
        if (std) {
          const bewerkt = s.feedbackTekst[cat][id];
          reedsGekozen.push(bewerkt || _rapVervangNaam(std, naam));
        }
      } else if (id.startsWith('ai-')) {
        const idx = parseInt(id.slice(3));
        const ai = (s.aiZinnen[cat] || [])[idx];
        if (ai && ai.trim()) reedsGekozen.push(ai);
      }
    });

    const url = _RAP_AI_URL;
    const body = {
      kindNaam: naam,
      categorie: cat,
      periode: periode ? periode.naam : '',
      periodeNummer: periode && periode.nummer ? periode.nummer : null,
      toetsdata: s.toetsdata,
      foutWoorden: foutNamen,
      // Nieuwe context-velden:
      puntenboekOpmerkingen: pbContext,
      spreektoetsDetail: spreekDetail,
      reedsGekozen: reedsGekozen
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      // Probeer de error-details uit het response-body te lezen
      let detail = '';
      try {
        const errData = await resp.json();
        detail = '\n\nServer-fout: ' + (errData.error || 'onbekend');
        if (errData.debug) detail += '\nDebug: ' + JSON.stringify(errData.debug, null, 2);
        if (errData.anthropic) detail += '\nAnthropic: ' + JSON.stringify(errData.anthropic, null, 2);
      } catch (e) { /* response was geen JSON */ }
      throw new Error('Server gaf ' + resp.status + detail);
    }
    const data = await resp.json();
    const zinnen = Array.isArray(data.zinnen) ? data.zinnen : [];
    if (zinnen.length === 0) {
      alert('Geen suggesties ontvangen. Probeer opnieuw.');
      if (knopVoorCat) { knopVoorCat.disabled = false; knopVoorCat.textContent = '✨ Suggesties van Claude'; }
      return;
    }
    zinnen.forEach(z => s.aiZinnen[cat].push(z));
    if (kind) _lkRapInlineRender(kind);
  } catch (e) {
    console.error('AI-suggestie mislukt:', e);
    alert('Suggesties ophalen mislukt. Probeer later opnieuw.\n\n' + (e.message || ''));
    if (knopVoorCat) { knopVoorCat.disabled = false; knopVoorCat.textContent = '✨ Suggesties van Claude'; }
  }
}

const _RAP_AI_URL = (function() {
  if (window.RAPPORT_FEEDBACK_URL) return window.RAPPORT_FEEDBACK_URL;
  if (window.VRAAGSTUKKEN_URL) {
    return window.VRAAGSTUKKEN_URL.replace(/\/[^\/]+$/, '/rapportFeedback');
  }
  return '/api/rapportFeedback';
})();

function _rapBouwFoutNamenVoorPrompt(kindCode) {
  const s = _rapInitState(kindCode);
  const namen = new Set();
  ['luisteren', 'lezen', 'schrijven', 'spreken'].forEach(v => {
    const ids = s.foutWoorden[v] || [];
    ids.forEach(id => {
      const naam = _rapZoekWoordnaam(id);
      if (naam) namen.add(naam);
    });
  });
  return Array.from(namen).slice(0, 8);
}

function _rapZoekWoordnaam(itemId) {
  if (!window.ALLE_THEMAS_LK) return null;
  for (const thema of window.ALLE_THEMAS_LK) {
    const verrijkt = (typeof lkVerrijkThema === 'function') ? lkVerrijkThema(thema) : thema;
    const items = verrijkt.items || [];
    const it = items.find(x => x.id === itemId);
    if (it) return it.tekst || it.naam || null;
  }
  return null;
}

// =================================================================
//  Bewaren + PDF genereren
// =================================================================

function _rapVerzamelFeedback(kindCode, kindNaam) {
  const s = _rapInitState(kindCode);
  const result = { watGaatGoed: [], groeipunten: [], werkhouding: [] };
  ['watGaatGoed', 'groeipunten', 'werkhouding'].forEach(cat => {
    const vinkjes = s.feedbackVink[cat] || [];
    vinkjes.forEach(id => {
      if (id.startsWith('std-')) {
        const idx = parseInt(id.slice(4));
        const bewerkt = s.feedbackTekst[cat][id];
        const standaard = (_RAP_STANDAARDZINNEN[cat] || [])[idx];
        const tekst = bewerkt || (standaard ? _rapVervangNaam(standaard, kindNaam) : '');
        if (tekst.trim()) result[cat].push(tekst.trim());
      } else if (id.startsWith('ai-')) {
        const idx = parseInt(id.slice(3));
        const tekst = s.aiZinnen[cat][idx];
        if (tekst && tekst.trim()) result[cat].push(tekst.trim());
      }
    });
    // Puntenboek-opmerkingen die aangevinkt zijn
    const pbVinkjes = (s.pbVink && s.pbVink[cat]) || [];
    const pbOpm = (s.pbOpmerkingen && s.pbOpmerkingen[cat]) || [];
    pbVinkjes.forEach(id => {
      if (id.startsWith('pb-')) {
        const idx = parseInt(id.slice(3));
        const o = pbOpm[idx];
        if (o && o.tekst && o.tekst.trim()) result[cat].push(o.tekst.trim());
      }
    });
  });
  return result;
}

function _rapBouwRapport(kindCode, kindNaam) {
  const s = _rapInitState(kindCode);
  return {
    kindCode: kindCode,
    rapportperiodeId: s.periodeId,
    sterren: { ...s.sterren },
    toetsdata: { ...s.toetsdata },
    feedback: _rapVerzamelFeedback(kindCode, kindNaam)
  };
}

async function lkRapInlineBewaar(kindCode, stilletjes) {
  const s = _rapInitState(kindCode);
  if (!s.periodeId) return false;
  const kind = lkKinderen.find(k => k.code === kindCode);
  const naam = kind ? kind.naam : kindCode;
  const rapport = _rapBouwRapport(kindCode, naam);
  try {
    await Voortgang.bewaarRapport(rapport);
    if (!stilletjes) {
      // Visuele bevestiging
      const knop = document.querySelector(`#lk-rap-inline .lk-rap-inline-knoppen button:first-child`);
      if (knop) {
        const oud = knop.textContent;
        knop.textContent = '✓ Bewaard';
        knop.style.background = '#c8e6c9';
        setTimeout(() => {
          if (knop) { knop.textContent = oud; knop.style.background = ''; }
        }, 1800);
      }
    }
    return true;
  } catch (e) {
    console.error('Rapport bewaren mislukt:', e);
    if (!stilletjes) alert('Rapport bewaren mislukt: ' + (e.message || 'onbekend'));
    return false;
  }
}

async function lkRapInlineGenereer(kindCode) {
  const s = _rapInitState(kindCode);
  if (!s.periodeId) return;
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (!kind) return;

  const knop = document.querySelector('#lk-rap-inline .lk-rap-inline-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig…'; }

  try {
    // Bewaar stilletjes voor PDF
    await lkRapInlineBewaar(kindCode, true);

    const periode = (_periodes || []).find(p => p.id === s.periodeId);
    const rapport = _rapBouwRapport(kindCode, kind.naam);

    if (!window.RapportEngine || !RapportEngine.rapportPdf) {
      throw new Error('PDF-engine niet geladen.');
    }
    await RapportEngine.rapportPdf(kind, rapport, periode);

    if (knop) { knop.disabled = false; knop.textContent = '📄 Genereer PDF'; }
  } catch (e) {
    console.error('Rapport genereren mislukt:', e);
    alert('Rapport genereren mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '📄 Genereer PDF'; }
  }
}

// =================================================================
//  Compatibility-shims voor oude knoppen elders die lkOpenRapport()
//  aanroepen — die schakelen nu naar de rapporten-tab van het kind.
// =================================================================

async function lkOpenRapport(code, naam) {
  // Schakel naar rapporten-tab voor dit kind
  if (typeof lkKindtabKies === 'function') {
    lkKindtabKies('rapporten', code);
  }
  // Optioneel: scroll naar de rapport-sectie
  setTimeout(() => {
    const el = document.getElementById('lk-rap-inline');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

function lkSluitRapportModal() {
  // Niet meer nodig — inline werkomgeving heeft geen sluit-knop.
  // Functie behouden voor backward compat met oude HTML.
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
let _sprModalBestaandeId = null;   // als gezet → updaten i.p.v. nieuwe toetst toevoegen (voor klaargezette spreektoetsen)

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
  _sprModalBestaandeId = null;

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

// Alias voor _rendererSpreektoetsModal — voor leesbaarheid bij hervatten van klaargezette toets
function _toonSpreektoetsModal() {
  _rendererSpreektoetsModal();
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
        <button class="lk-knop-mini" onclick="lkSprKlaarzetten()" ${geselW === 0 ? 'disabled' : ''} title="Bewaar de selectie en neem later af met het kind">📅 Klaarzetten voor later</button>
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

// Klaarzetten voor later: bewaar selectie van woorden zonder af te nemen.
// De spreektoets verschijnt in de lijst met status 'klaargezet'; juf kan
// later afname starten met play-knop.
async function lkSprKlaarzetten() {
  const thema = ALLE_THEMAS_LK.find(t => t.id === _sprModalThemaId);
  if (!thema) return;
  const code = _sprModalCode;
  if (!code) return;

  const woordIds = Array.from(_sprModalGeselecteerd);
  if (woordIds.length === 0) {
    alert('Selecteer eerst minstens één woord.');
    return;
  }

  const knop = document.querySelector('#lk-spr-modal-bg .lk-cat-modal-knoppen button[onclick="lkSprKlaarzetten()"]');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    const periodeId = (typeof _actievePeriode !== 'undefined' && _actievePeriode) ? _actievePeriode.id : null;
    const id = 'spr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const toets = {
      id: id,
      themaId: _sprModalThemaId,
      datum: Date.now(),
      status: 'klaargezet',
      woordIds: woordIds,            // welke woorden geselecteerd zijn voor deze afname
      perWoord: {},                  // nog leeg — wordt ingevuld bij afname
      rapportperiodeId: periodeId
    };

    await Voortgang.bewaarSpreektoetsVoorKind(code, toets);

    // Sluit modal + ververs lijst
    lkSluitSpreektoetsModal();
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender('spreken');
    setTimeout(() => alert(`Spreektoets klaargezet. Je vindt ze in de lijst met de ▶ knop om af te nemen.`), 50);
  } catch (e) {
    console.error('Klaarzetten mislukt:', e);
    alert('Klaarzetten mislukt: ' + (e.message || 'onbekend'));
    if (knop) { knop.disabled = false; knop.textContent = '📅 Klaarzetten voor later'; }
  }
}

// Hervat een klaargezette spreektoets: open de afname-modal direct in fase 'afnemen'
async function lkSprStartKlaargezetteAfname(kindCode, toetsId) {
  const kind = lkKinderen.find(k => k.code === kindCode);
  if (!kind) return;
  const toetsen = await Voortgang.haalSpreektoetsenOpVoorKind(kindCode);
  const toets = toetsen.find(t => t.id === toetsId);
  if (!toets) {
    alert('Spreektoets niet gevonden.');
    return;
  }
  const thema = ALLE_THEMAS_LK.find(t => t.id === toets.themaId);
  if (!thema) {
    alert('Het thema van deze spreektoets bestaat niet meer.');
    return;
  }
  const verrijkt = lkVerrijkThema(thema);

  // Setup modal-state
  _sprModalCode = kindCode;
  _sprModalNaam = kind.naam || lkVolledigeNaam(kind) || kindCode;
  _sprModalThemaId = toets.themaId;
  _sprModalGeselecteerd = new Set(toets.woordIds || []);
  _sprModalItems = (verrijkt.items || []).filter(it => _sprModalGeselecteerd.has(it.id));
  _sprModalIdx = 0;
  _sprModalResultaten = { ...(toets.perWoord || {}) };
  _sprModalNotitie = toets.notitie || '';
  _sprModalFase = 'afnemen';
  _sprModalBestaandeId = toetsId; // voor latere update i.p.v. nieuwe toevoegen

  // Toon modal
  _toonSpreektoetsModal();
}

// Verwijder een spreektoets uit de lijst (klaargezet of afgenomen)
async function lkSprVerwijder(kindCode, toetsId) {
  const toetsen = await Voortgang.haalSpreektoetsenOpVoorKind(kindCode);
  const toets = toetsen.find(t => t.id === toetsId);
  const beschrijving = toets
    ? `de spreektoets van ${new Date(toets.datum || 0).toLocaleDateString('nl-BE')}`
    : 'deze spreektoets';
  if (!confirm(`Weet je zeker dat je ${beschrijving} wil verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
  try {
    await Voortgang.verwijderSpreektoetsVoorKind(kindCode, toetsId);
    if (typeof lkKindtabsRender === 'function') lkKindtabsRender('spreken');
  } catch (e) {
    console.error('Verwijderen mislukt:', e);
    alert('Verwijderen mislukt: ' + (e.message || 'onbekend'));
  }
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

  // Bij hervatten van klaargezette toets: behoud bestaande ID + update.
  // Anders nieuwe ID genereren.
  const toetsId = _sprModalBestaandeId || ('spr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

  const toets = {
    id: toetsId,
    themaId: _sprModalThemaId,
    datum: Date.now(),
    status: 'afgenomen',
    woordIds: Array.from(_sprModalGeselecteerd),
    perWoord: perWoord,
    notitie: _sprModalNotitie || '',
    rapportperiodeId: lkActievePeriodeId()
  };

  const knop = document.querySelector('#lk-spr-modal-bg .lk-cat-modal-knoppen button:last-child');
  if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig...'; }

  try {
    if (_sprModalBestaandeId) {
      // Update bestaande klaargezette toets
      await Voortgang.updateSpreektoetsVoorKind(_sprModalCode, _sprModalBestaandeId, toets);
    } else {
      // Nieuwe toets toevoegen
      await Voortgang.bewaarSpreektoetsVoorKind(_sprModalCode, toets);
    }
    _sprModalLaatstBewaardId = toetsId;
    _sprModalBestaandeId = null; // reset
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

  // Bouw oefenvorm-checkboxes per niveau-groep
  let oefHtml = '';
  WB_NIVEAU_VOLGORDE.forEach(niveau => {
    const bundel = WB_NIVEAU_BUNDELS[niveau];
    if (!bundel.oefeningen.length) return;
    oefHtml += `<div class="lk-twb-niveau-kop">${bundel.naam}</div>`;
    bundel.oefeningen.forEach(oefKey => {
      const aan = _twbModalState.oefeningen.has(oefKey) ? 'checked' : '';
      const label = WB_OEFENING_LABELS[oefKey];
      oefHtml += `
        <label class="lk-twb-oef-rij ${aan ? 'aan' : ''}">
          <input type="checkbox" ${aan} onchange="lkTwbToggleOef('${oefKey}')">
          <span>${label}</span>
        </label>
      `;
    });
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
  // De drie categoriseer-varianten zijn nu aparte oefen-keys, dus niveau is niet meer nodig.
  const themaConfigs = [{
    thema: { ...verrijkt, items: gefilterdeItems },
    oefeningen: Array.from(_twbModalState.oefeningen),
    niveau: 'basis',  // legacy-veld, niet meer functioneel gebruikt
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
      toetsResultaten: kind.taak.toetsResultaten ? JSON.parse(JSON.stringify(kind.taak.toetsResultaten)) : null,
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
