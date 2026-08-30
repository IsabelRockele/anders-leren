// =================================================================
//  voortgang.js — Voortgangsopslag in Firestore (met lokale fallback)
//
//  Datastructuur in Firestore:
//  /kinderen/{code} = {
//      naam: 'optioneel — alleen voor leerkracht',
//      gemaakt: timestamp,
//      laatstActief: timestamp,
//      voortgang: {
//          'w-klas': {
//              'boekentas': { gezien: 5, juist: 3, fout: 1, sterren: 2 },
//              ...
//          },
//          'z-school': { ... }
//      }
//  }
//
//  Sterrensysteem:
//  - 0 sterren: nog niet getest
//  - 1 ster: eerste keer juist
//  - 2 sterren: 3 keer juist achtereen
//  - 3 sterren: 5 keer juist achtereen (= "gekend")
// =================================================================

window.Voortgang = (function() {
  let db = null;
  let lokaalCache = {};
  let categorieCache = {}; // { themaId: ['voorwerpen','personen',...] } per kind
  let uitgeslotenCache = {}; // { themaId: ['itemId1', 'itemId2'] } — items expliciet uit voor dit kind
  // themaActiefCache: array of null. null = "geen instelling" → backward-compat: alles aan.
  // [] = expliciet niets aan. ['w-klas', ...] = die thema's aan.
  let themaActiefCache = null;

  // ============================================================
  //  PREVIEW-MODUS — leerkracht bekijkt taak van een kind
  // ============================================================
  // Wanneer aan: ALLE schrijfmethodes naar Firebase worden geblokkeerd.
  // Lezen werkt normaal — anders zou de leerkracht niets te zien krijgen.
  // De voortgang van het kind blijft dus 100% intact.
  // Wordt geactiveerd door zetPreviewModus(true) of via URL-parameter.
  let _previewModus = false;
  function zetPreviewModus(aan) {
    _previewModus = !!aan;
    if (aan) console.info('[Voortgang] PREVIEW-MODUS actief — geen schrijfacties naar Firebase.');
  }
  function isPreviewModus() {
    return _previewModus;
  }

  // taakCache: huidige taak voor dit kind, of null. Schema:
  // {
  //   themaId, woordIds[],
  //   vaardigheden: ['luisteren'|'lezen'|'schrijven'],
  //   oefenvormen_luisteren: ['klikspel'|'verbinden'|'verslepen'],
  //   oefenvormen_schrijven: ['slepen'|'typen'],
  //   zinscontext: bool,
  //   huidigeFase: 'leren'|'luisteren'|'lezen'|'schrijven'|'klaar',
  //   perWoord: {
  //     [woordId]: {
  //       luisteren_juist: 0..3, lezen_juist: 0..3, schrijven_juist: 0..3,
  //       laatstGeoefend: timestamp
  //     }
  //   },
  //   status: 'bezig'|'voltooid'|'moeilijk',
  //   foutWoordenLaatsteToets: [],
  //   aantalPogingen: { luisteren: 0, lezen: 0, schrijven: 0 },
  //   gestart: timestamp,
  //   klassikaalId: null|'klas-taak-uuid'
  // }
  let taakCache = null;
  // taakgeschiedenisCache: voor rapport — array van voltooide taken
  let taakgeschiedenisCache = [];
  // spreektoetsenCache: array van afgenomen spreektoetsen
  let spreektoetsenCache = [];
  // rapportNotitiesCache: tekst die juf invult voor ouders
  let rapportNotitiesCache = '';
  let huidigKindCode = null; // welke kind is geladen — voor categorie-bewaring

  async function init() {
    if (window.FIREBASE_INGESTELD && window.firebase) {
      if (window.TaalgroeiData && typeof window.TaalgroeiData.init === 'function') {
        await window.TaalgroeiData.init();
      }
      db = window.db;
    }
  }

  // ------------------- Firestore helpers -------------------
  async function codeBestaat(code) {
    if (!db) return true; // in lokaal modus altijd OK
    const doc = await db.collection('kinderen').doc(code).get();
    return doc.exists;
  }

  async function haalNaamOp(code) {
    if (!db) return null;
    const doc = await db.collection('kinderen').doc(code).get();
    return doc.exists ? doc.data() : null;
  }

  async function laad(code) {
    huidigKindCode = code;
    if (db) {
      try {
        const doc = await db.collection('kinderen').doc(code).get();
        if (doc.exists) {
          const data = doc.data();
          lokaalCache = data.voortgang || {};
          categorieCache = data.categorieen || {};
          uitgeslotenCache = data.uitgesloten || {};
          taakCache = data.taak || null;
          taakgeschiedenisCache = Array.isArray(data.taakgeschiedenis) ? data.taakgeschiedenis : [];
          spreektoetsenCache = Array.isArray(data.spreektoetsen) ? data.spreektoetsen : [];
          rapportNotitiesCache = data.rapportNotities || '';
          // Bewust check op "is het veld aanwezig?" — niet hetzelfde als "is leeg".
          themaActiefCache = ('thema_actief' in data) ? (Array.isArray(data.thema_actief) ? data.thema_actief : []) : null;
          // Update laatst-actief
          db.collection('kinderen').doc(code).update({
            laatstActief: window.firebase.firestore.FieldValue.serverTimestamp()
          }).catch(() => {});
          // Lokale spiegel ook bewaren (voor offline)
          localStorage.setItem('andersleren_categorieen_' + code, JSON.stringify(categorieCache));
          localStorage.setItem('andersleren_uitgesloten_' + code, JSON.stringify(uitgeslotenCache));
          localStorage.setItem('andersleren_thema_actief_' + code, JSON.stringify(themaActiefCache));
          localStorage.setItem('andersleren_taak_' + code, JSON.stringify(taakCache));
          localStorage.setItem('andersleren_taakgeschiedenis_' + code, JSON.stringify(taakgeschiedenisCache));
          localStorage.setItem('andersleren_spreektoetsen_' + code, JSON.stringify(spreektoetsenCache));
          localStorage.setItem('andersleren_rapportnotities_' + code, rapportNotitiesCache);
          return lokaalCache;
        }
      } catch (e) {
        console.warn('Laden uit Firestore mislukt, val terug op lokaal:', e);
      }
    }
    // Lokale fallback
    const lokaal = localStorage.getItem('andersleren_voortgang_' + code);
    lokaalCache = lokaal ? JSON.parse(lokaal) : {};
    const lokaleCat = localStorage.getItem('andersleren_categorieen_' + code);
    categorieCache = lokaleCat ? JSON.parse(lokaleCat) : {};
    const lokaalUitgesloten = localStorage.getItem('andersleren_uitgesloten_' + code);
    uitgeslotenCache = lokaalUitgesloten ? JSON.parse(lokaalUitgesloten) : {};
    const lokaalActief = localStorage.getItem('andersleren_thema_actief_' + code);
    themaActiefCache = lokaalActief ? JSON.parse(lokaalActief) : null;
    const lokaleTaak = localStorage.getItem('andersleren_taak_' + code);
    taakCache = lokaleTaak ? JSON.parse(lokaleTaak) : null;
    const lokaleGes = localStorage.getItem('andersleren_taakgeschiedenis_' + code);
    taakgeschiedenisCache = lokaleGes ? JSON.parse(lokaleGes) : [];
    const lokaleSpr = localStorage.getItem('andersleren_spreektoetsen_' + code);
    spreektoetsenCache = lokaleSpr ? JSON.parse(lokaleSpr) : [];
    rapportNotitiesCache = localStorage.getItem('andersleren_rapportnotities_' + code) || '';
    return lokaalCache;
  }

  async function bewaar(code) {
    if (!code) return;
    if (_previewModus) return; // preview: geen schrijfacties
    // Lokaal altijd opslaan
    localStorage.setItem('andersleren_voortgang_' + code, JSON.stringify(lokaalCache));

    if (db) {
      try {
        await db.collection('kinderen').doc(code).set({
          voortgang: lokaalCache,
          laatstActief: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Bewaren in Firestore mislukt:', e);
      }
    }
  }

  // ------------------- Item-niveau registratie -------------------
  function getItem(themaId, itemId) {
    if (!lokaalCache[themaId]) lokaalCache[themaId] = {};
    if (!lokaalCache[themaId][itemId]) {
      lokaalCache[themaId][itemId] = { gezien: 0, juist: 0, fout: 0, opRij: 0, sterren: 0 };
    }
    return lokaalCache[themaId][itemId];
  }

  function registreerGezien(themaId, itemId) {
    const item = getItem(themaId, itemId);
    item.gezien = (item.gezien || 0) + 1;
  }

  function registreerJuist(themaId, itemId) {
    const item = getItem(themaId, itemId);
    item.juist = (item.juist || 0) + 1;
    item.opRij = (item.opRij || 0) + 1;
    item.laatstGeoefend = Date.now();
    // Sterren bijwerken
    if (item.opRij >= 5) item.sterren = 3;
    else if (item.opRij >= 3) item.sterren = Math.max(item.sterren || 0, 2);
    else if (item.opRij >= 1) item.sterren = Math.max(item.sterren || 0, 1);
  }

  function registreerFout(themaId, itemId) {
    const item = getItem(themaId, itemId);
    item.fout = (item.fout || 0) + 1;
    item.opRij = 0; // streak gebroken
    item.laatstGeoefend = Date.now();
    // Sterren niet verminderen — kind mag niet "achteruit gaan" zien
  }

  // ------------------- Slim leren: kies volgend item -------------------
  // Spaced repetition logica: kiest het item dat het meest aandacht nodig heeft
  function kiesVolgendItem(themas, opties = {}) {
    const nu = Date.now();
    const DAG_MS = 24 * 60 * 60 * 1000;
    const kandidaten = [];

    themas.forEach(thema => {
      // Thema-niveau filter: als dit thema niet actief is voor het kind, sla over.
      if (!isThemaActiefVoorKind(thema)) return;
      const themaData = lokaalCache[thema.id] || {};
      const actieveItems = filterItemsOpCategorieen(thema);
      actieveItems.forEach(item => {
        if (opties.niveau && item.niveau && item.niveau !== opties.niveau) return;

        const data = themaData[item.id] || {};
        const sterren = data.sterren || 0;
        const opRij = data.opRij || 0;
        const gezien = data.gezien || 0;
        const laatst = data.laatstGeoefend || 0;
        const dagenGeleden = laatst === 0 ? 999 : (nu - laatst) / DAG_MS;

        let prioriteit = 99;
        let reden = '';

        if (sterren > 0 && opRij === 0) {
          prioriteit = 1; reden = 'herhaling';
        } else if (gezien > 0 && sterren === 0) {
          prioriteit = 2; reden = 'verder';
        } else if (sterren === 0 && gezien === 0) {
          prioriteit = 3; reden = 'nieuw';
        } else if (sterren === 1) {
          prioriteit = 4; reden = 'oefenen';
        } else if (sterren === 2) {
          prioriteit = 5; reden = 'bijna';
        } else if (sterren === 3 && dagenGeleden > 7) {
          prioriteit = 6; reden = 'opfrissen';
        } else {
          return;
        }

        kandidaten.push({ thema, item, prioriteit, reden, dagenGeleden });
      });
    });

    if (kandidaten.length === 0) return null;

    kandidaten.sort((a, b) => {
      if (a.prioriteit !== b.prioriteit) return a.prioriteit - b.prioriteit;
      return b.dagenGeleden - a.dagenGeleden;
    });

    const top = kandidaten.slice(0, Math.min(5, kandidaten.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  // ------------------- Statistieken -------------------
  function statsThema(thema) {
    const themaData = lokaalCache[thema.id] || {};
    const actieveItems = filterItemsOpCategorieen(thema);
    const totaal = actieveItems.length;
    let gezien = 0, gekend = 0, geleerd = 0, sterrenTotaal = 0;

    actieveItems.forEach(item => {
      const it = themaData[item.id];
      if (it) {
        if (it.gezien > 0) gezien++;
        if ((it.sterren || 0) >= 1) geleerd++;
        if ((it.sterren || 0) >= 3) gekend++;
        sterrenTotaal += (it.sterren || 0);
      }
    });

    return {
      totaal,
      gezien,
      geleerd,        // minstens 1 ster
      gekend,         // 3 sterren
      sterrenTotaal,
      sterrenMax: totaal * 3,
      procent: totaal > 0 ? Math.round((gekend / totaal) * 100) : 0
    };
  }

  function getCache() {
    return lokaalCache;
  }

  // ------------------- Categorieën per kind ------------------
  // Bewaarstructuur:
  //   /kinderen/{code}.categorieen = { 'w-klas': ['voorwerpen','personen'], ... }
  // Conventie: leeg of ontbrekend = ALLE categorieën van het thema actief.

  // Geef de actieve categorieën voor een thema terug.
  // Als er niets ingesteld is voor dit kind, krijg je alle thema-categorieën.
  function getCategorieenVoorThema(thema) {
    const ingesteld = categorieCache[thema.id];
    if (!ingesteld || !Array.isArray(ingesteld) || ingesteld.length === 0) {
      return thema.categorieen ? [...thema.categorieen] : [];
    }
    // Filter: alleen categorieën die ook echt in dit thema voorkomen
    const themaCats = thema.categorieen || [];
    return ingesteld.filter(c => themaCats.includes(c));
  }

  // Filter de items van een thema op de actieve categorieën voor dit kind.
  // Volgorde:
  //   1. Categorie-filter (categorie aan?)
  //   2. Uitsluitings-filter (item expliciet uitgezet voor dit kind?)
  // Items zonder categorie-veld (oude thema's) blijven door cat-filter heen.
  function filterItemsOpCategorieen(thema) {
    const actief = getCategorieenVoorThema(thema);
    const uitgesloten = uitgeslotenCache[thema.id] || [];
    // Als het thema geen categorieën definieert → alleen uitsluiting toepassen.
    if (!thema.categorieen || thema.categorieen.length === 0) {
      if (uitgesloten.length === 0) return thema.items;
      return thema.items.filter(it => !uitgesloten.includes(it.id));
    }
    return thema.items.filter(it => {
      // Categorie-check
      if (it.categorie && !actief.includes(it.categorie)) return false;
      // Uitsluitings-check
      if (uitgesloten.includes(it.id)) return false;
      return true;
    });
  }

  // Geef de uitgesloten item-id's voor een thema (voor dit kind).
  function getUitgeslotenVoorThema(thema) {
    return [...(uitgeslotenCache[thema.id] || [])];
  }

  // Sla categorieën op voor een specifiek kind én thema.
  // Bedoeld voor gebruik in het leerkracht-paneel.
  async function zetCategorieenVoorKind(code, themaId, categorieenLijst) {
    if (!code) return;
    // Lokale cache bijwerken — ALLEEN als dit het huidige kind is.
    if (code === huidigKindCode) {
      if (!categorieenLijst || categorieenLijst.length === 0) {
        delete categorieCache[themaId];
      } else {
        categorieCache[themaId] = [...categorieenLijst];
      }
      // localStorage spiegelen
      localStorage.setItem('andersleren_categorieen_' + code, JSON.stringify(categorieCache));
    }
    // Firestore-update — onafhankelijk van huidig kind (leerkracht beheert vanop afstand)
    if (db) {
      try {
        const veld = `categorieen.${themaId}`;
        const update = {};
        if (!categorieenLijst || categorieenLijst.length === 0) {
          // Helemaal verwijderen → terug naar default (alles aan)
          update[veld] = window.firebase.firestore.FieldValue.delete();
        } else {
          update[veld] = [...categorieenLijst];
        }
        await db.collection('kinderen').doc(code).update(update);
      } catch (e) {
        console.warn('Bewaren categorieën in Firestore mislukt:', e);
        throw e;
      }
    }
  }

  // Sla expliciet uitgesloten item-id's op voor een specifiek kind én thema.
  // Lege lijst (of null) = niets uitgesloten.
  async function zetUitgeslotenVoorKind(code, themaId, uitgeslotenLijst) {
    if (!code) return;
    if (code === huidigKindCode) {
      if (!uitgeslotenLijst || uitgeslotenLijst.length === 0) {
        delete uitgeslotenCache[themaId];
      } else {
        uitgeslotenCache[themaId] = [...uitgeslotenLijst];
      }
      localStorage.setItem('andersleren_uitgesloten_' + code, JSON.stringify(uitgeslotenCache));
    }
    if (db) {
      try {
        const veld = `uitgesloten.${themaId}`;
        const update = {};
        if (!uitgeslotenLijst || uitgeslotenLijst.length === 0) {
          update[veld] = window.firebase.firestore.FieldValue.delete();
        } else {
          update[veld] = [...uitgeslotenLijst];
        }
        await db.collection('kinderen').doc(code).update(update);
      } catch (e) {
        console.warn('Bewaren uitgesloten in Firestore mislukt:', e);
        throw e;
      }
    }
  }

  // Haal alle categorieën-instellingen voor een specifiek kind op (vanop afstand,
  // d.w.z. zonder dat dit kind nu "ingelogd" hoeft te zijn). Voor leerkracht-paneel.
  async function haalCategorieenOpVoorKind(code) {
    if (!db) return {};
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return {};
      return doc.data().categorieen || {};
    } catch (e) {
      console.warn('Ophalen categorieën mislukt:', e);
      return {};
    }
  }

  // Haal uitgesloten-instellingen voor een specifiek kind op.
  async function haalUitgeslotenOpVoorKind(code) {
    if (!db) return {};
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return {};
      return doc.data().uitgesloten || {};
    } catch (e) {
      console.warn('Ophalen uitgesloten mislukt:', e);
      return {};
    }
  }

  // ------------------- Thema's aan/uit per kind ------------------
  // Datastructuur: thema_actief = array van themaId's, OF afwezig.
  //   afwezig (null) = "geen instelling" → alles aan (backward-compat).
  //   []             = expliciet niets aan.
  //   ['w-klas']     = enkel die thema's aan.
  //
  // Voor het kind-gedrag in de app gebruik je 'isThemaActiefVoorKind(thema)'.
  //
  // Voor het leerkracht-paneel: getThemaActiefRaw() geeft null/array terug
  // zodat je het verschil ziet tussen "default" en "expliciet leeg".

  function getThemaActiefRaw() {
    return themaActiefCache;
  }

  function isThemaActiefVoorKind(themaOfId) {
    const id = (typeof themaOfId === 'string') ? themaOfId : (themaOfId && themaOfId.id);
    if (!id) return true;
    if (themaActiefCache === null || themaActiefCache === undefined) return true; // default = alles aan
    return themaActiefCache.indexOf(id) !== -1;
  }

  async function zetThemaActiefVoorKind(code, themaIdsLijst) {
    if (!code) return;
    // null = veld verwijderen (backward compat: oude leerlingen → alles aan).
    // array (ook leeg) = expliciet ingesteld.
    const nieuweWaarde = (themaIdsLijst === null || themaIdsLijst === undefined)
      ? null
      : [...themaIdsLijst];

    if (code === huidigKindCode) {
      themaActiefCache = nieuweWaarde;
      if (nieuweWaarde === null) {
        localStorage.removeItem('andersleren_thema_actief_' + code);
      } else {
        localStorage.setItem('andersleren_thema_actief_' + code, JSON.stringify(nieuweWaarde));
      }
    }
    if (db) {
      try {
        const update = {};
        if (nieuweWaarde === null) {
          update.thema_actief = window.firebase.firestore.FieldValue.delete();
        } else {
          update.thema_actief = nieuweWaarde;
        }
        await db.collection('kinderen').doc(code).update(update);
      } catch (e) {
        console.warn('Bewaren thema_actief in Firestore mislukt:', e);
        throw e;
      }
    }
  }

  async function haalThemaActiefOpVoorKind(code) {
    if (!db) return null;
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (!('thema_actief' in data)) return null;
      return Array.isArray(data.thema_actief) ? data.thema_actief : [];
    } catch (e) {
      console.warn('Ophalen thema_actief mislukt:', e);
      return null;
    }
  }

  // ------------------- Taak-systeem ------------------
  // Eén zichtbare taak per kind + een wachtrij met geplande taken.
  // Zo blijft het kindscherm eenvoudig, terwijl meerdere leerkrachten taken
  // kunnen klaarzetten zonder elkaars werk te overschrijven.

  // Bouw een leeg taak-object met defaults op basis van de taakObj.
  function _bouwTaak(taakObj) {
    if (taakObj === null) return null;
    const taak = {
      themaId: taakObj.themaId,
      woordIds: [...(taakObj.woordIds || [])],
      vaardigheden: Array.isArray(taakObj.vaardigheden) && taakObj.vaardigheden.length > 0
                       ? [...taakObj.vaardigheden]
                       : ['luisteren'],
      oefenvormen_luisteren: Array.isArray(taakObj.oefenvormen_luisteren) && taakObj.oefenvormen_luisteren.length > 0
                       ? [...taakObj.oefenvormen_luisteren]
                       : ['klikspel'],
      oefenvormen_lezen: Array.isArray(taakObj.oefenvormen_lezen) && taakObj.oefenvormen_lezen.length > 0
                       ? [...taakObj.oefenvormen_lezen]
                       : ['woord-beeld'],
      oefenvormen_schrijven: Array.isArray(taakObj.oefenvormen_schrijven) && taakObj.oefenvormen_schrijven.length > 0
                       ? [...taakObj.oefenvormen_schrijven]
                       : ['overtypen'],
      toetsen: Array.isArray(taakObj.toetsen)
                       ? [...taakObj.toetsen]
                       : ['luisteren'],
      zinscontext: taakObj.zinscontext === true,
      huidigeFase: taakObj.huidigeFase || 'leren',
      perWoord: taakObj.perWoord || {},
      status: taakObj.status || 'bezig',
      foutWoordenLaatsteToets: taakObj.foutWoordenLaatsteToets || [],
      // Resultaten per vaardigheids-toets, voor de PDF na afloop. Elk veld bevat
      // 'pogingen' (array van afnames) en 'afgenomen' (vlag of er een poging gedaan is).
      // Elke poging: { foutIds: [...], datum: timestamp }.
      // Bij herkansing wordt een 2e poging-object toegevoegd.
      toetsResultaten: taakObj.toetsResultaten || {
        luisteren: { afgenomen: false, pogingen: [], foutIds: [] },
        lezen:     { afgenomen: false, pogingen: [], foutIds: [] },
        schrijven: { afgenomen: false, pogingen: [], foutIds: [] }
      },
      // Ronde-status per vaardigheid: in welke ronde zit het kind, en welke
      // woorden zijn al behandeld in die ronde. Wanneer alle woorden behandeld
      // zijn → ronde + 1 en lijst leegmaken. Eindigt wanneer huidigeRonde > max.
      // Schrijven heeft max 2 rondes (of 3 als er fout-woorden zijn).
      rondeStatus: taakObj.rondeStatus || {
        luisteren: { huidigeRonde: 1, behandeldDezeRonde: [] },
        lezen:     { huidigeRonde: 1, behandeldDezeRonde: [] },
        schrijven: { huidigeRonde: 1, behandeldDezeRonde: [] }
      },
      aantalPogingen: taakObj.aantalPogingen || { luisteren: 0, lezen: 0, schrijven: 0 },
      gestart: taakObj.gestart || Date.now(),
      klassikaalId: taakObj.klassikaalId || null,
      rapportperiodeId: taakObj.rapportperiodeId || null,
      taakId: taakObj.taakId || ('taak-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
      toegewezenOp: taakObj.toegewezenOp || Date.now(),
      toegewezenDoorRol: taakObj.toegewezenDoorRol || 'leerkracht',
      doel: taakObj.doel || '',
      bronGroepNaam: taakObj.bronGroepNaam || '',
      vrijHerhalenNaAfronding: taakObj.vrijHerhalenNaAfronding === true
    };
    // Initialiseer perWoord-data voor elk woord dat nog geen entry heeft
    taak.woordIds.forEach(id => {
      if (!taak.perWoord[id]) {
        taak.perWoord[id] = {
          luisteren_juist: 0,
          lezen_juist: 0,
          schrijven_juist: 0,
          laatstGeoefend: 0
        };
      }
    });
    return taak;
  }

  function getTaak() {
    return taakCache;
  }

  function heeftTaak() {
    return !!(taakCache && taakCache.themaId && Array.isArray(taakCache.woordIds) && taakCache.woordIds.length > 0);
  }

  // Schrijf een nieuwe taak voor het huidige kind.
  async function zetTaak(taakObj) {
    taakCache = _bouwTaak(taakObj);
    if (_previewModus) return; // preview: cache wel updaten zodat UI werkt, maar niet persisten
    if (huidigKindCode) {
      localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
      if (db) {
        try {
          const update = {};
          if (taakCache === null) {
            update.taak = window.firebase.firestore.FieldValue.delete();
          } else {
            update.taak = taakCache;
          }
          await db.collection('kinderen').doc(huidigKindCode).update(update);
        } catch (e) {
          console.warn('Bewaren taak in Firestore mislukt:', e);
          throw e;
        }
      }
    }
  }

  // Werk afzonderlijke velden bij (status, fase, ...).
  async function updateTaak(velden) {
    if (!taakCache) return;
    Object.assign(taakCache, velden);
    if (_previewModus) return; // preview: in-memory bijwerken volstaat
    if (huidigKindCode) {
      localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({ taak: taakCache });
        } catch (e) {
          console.warn('Update taak in Firestore mislukt:', e);
        }
      }
    }
  }

  // Verhoog "juist"-teller voor een woord in een vaardigheid (max 3).
  async function registreerJuistInTaak(woordId, vaardigheid) {
    if (!taakCache || !taakCache.perWoord || !taakCache.perWoord[woordId]) return;
    const sleutel = vaardigheid + '_juist';
    const huidig = taakCache.perWoord[woordId][sleutel] || 0;
    if (huidig < 3) {
      taakCache.perWoord[woordId][sleutel] = huidig + 1;
    }
    taakCache.perWoord[woordId].laatstGeoefend = Date.now();
    if (_previewModus) return; // preview: lokaal bijhouden, niet persisten
    if (huidigKindCode) {
      localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({ taak: taakCache });
        } catch (e) {
          console.warn('Update taak in Firestore mislukt:', e);
        }
      }
    }
  }

  // Markeer dat een woord behandeld is in de huidige ronde voor een vaardigheid.
  // Wordt aangeroepen na elke oefening (klikspel/verbinden/verslepen/lezen/schrijven).
  // Geeft een object terug { rondeAfgerond: bool, nieuweRonde: number }.
  async function registreerWoordBehandeldInRonde(woordId, vaardigheid, alleWoordIds) {
    if (!taakCache) return { rondeAfgerond: false, nieuweRonde: 1 };
    if (!taakCache.rondeStatus) {
      taakCache.rondeStatus = {
        luisteren: { huidigeRonde: 1, behandeldDezeRonde: [] },
        lezen:     { huidigeRonde: 1, behandeldDezeRonde: [] },
        schrijven: { huidigeRonde: 1, behandeldDezeRonde: [] }
      };
    }
    const status = taakCache.rondeStatus[vaardigheid] ||
                   { huidigeRonde: 1, behandeldDezeRonde: [] };
    if (!Array.isArray(status.behandeldDezeRonde)) status.behandeldDezeRonde = [];
    if (status.behandeldDezeRonde.indexOf(woordId) === -1) {
      status.behandeldDezeRonde.push(woordId);
    }
    taakCache.rondeStatus[vaardigheid] = status;

    // Controleer of de huidige ronde compleet is
    let rondeAfgerond = false;
    if (Array.isArray(alleWoordIds) && alleWoordIds.length > 0) {
      const alleBehandeld = alleWoordIds.every(id => status.behandeldDezeRonde.indexOf(id) !== -1);
      if (alleBehandeld) {
        rondeAfgerond = true;
        status.huidigeRonde = (status.huidigeRonde || 1) + 1;
        status.behandeldDezeRonde = [];
      }
    }

    if (_previewModus) return { rondeAfgerond, nieuweRonde: status.huidigeRonde };
    if (huidigKindCode) {
      localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({ taak: taakCache });
        } catch (e) {
          console.warn('Update ronde-status in Firestore mislukt:', e);
        }
      }
    }
    return { rondeAfgerond, nieuweRonde: status.huidigeRonde };
  }

  // Reset de juist-teller voor een woord in een vaardigheid (bij fout antwoord).
  // Houd ook een fout-teller bij die niet wordt afgebouwd — handig voor de oefen-
  // logica om te weten of een woord ooit fout was (dan extra herhaling).
  async function registreerFoutInTaak(woordId, vaardigheid) {
    if (!taakCache || !taakCache.perWoord || !taakCache.perWoord[woordId]) return;
    const sleutel = vaardigheid + '_juist';
    const foutSleutel = vaardigheid + '_fout';
    const huidig = taakCache.perWoord[woordId][sleutel] || 0;
    // Bij fout: 1 stap terug (3→2, 2→1, 1→0). Niet onder 0.
    taakCache.perWoord[woordId][sleutel] = Math.max(0, huidig - 1);
    // Fout-teller verhogen (cumulatief, gaat niet omlaag)
    taakCache.perWoord[woordId][foutSleutel] = (taakCache.perWoord[woordId][foutSleutel] || 0) + 1;
    taakCache.perWoord[woordId].laatstGeoefend = Date.now();
    if (_previewModus) return; // preview: geen persistence
    if (huidigKindCode) {
      localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({ taak: taakCache });
        } catch (e) { console.warn('Update taak in Firestore mislukt:', e); }
      }
    }
  }

  // Verplaats huidige taak naar geschiedenis en wis hem als actieve.
  async function archiveerHuidigeTaak() {
    if (!taakCache || !huidigKindCode) return;
    const archief = {
      themaId: taakCache.themaId,
      woordIds: [...taakCache.woordIds],
      vaardigheden: [...taakCache.vaardigheden],
      voltooidOp: Date.now(),
      status: taakCache.status,
      perWoord: JSON.parse(JSON.stringify(taakCache.perWoord || {})),
      foutWoordenLaatsteToets: [...(taakCache.foutWoordenLaatsteToets || [])],
      toetsResultaten: taakCache.toetsResultaten ? JSON.parse(JSON.stringify(taakCache.toetsResultaten)) : null,
      rapportperiodeId: taakCache.rapportperiodeId || null,
      gestart: taakCache.gestart || null,
      taakId: taakCache.taakId || null,
      toegewezenOp: taakCache.toegewezenOp || taakCache.gestart || null,
      toegewezenDoorRol: taakCache.toegewezenDoorRol || 'leerkracht',
      doel: taakCache.doel || '',
      bronGroepNaam: taakCache.bronGroepNaam || '',
      vrijHerhalenNaAfronding: taakCache.vrijHerhalenNaAfronding === true
    };
    taakgeschiedenisCache.push(archief);
    // Beperk geschiedenis tot laatste 50 taken om Firestore-grootte beheersbaar te houden
    if (taakgeschiedenisCache.length > 50) {
      taakgeschiedenisCache = taakgeschiedenisCache.slice(-50);
    }
    let volgendeTaak = null;
    let resterendeWachtrij = [];
    let vrijeThemasNaAfronding = null;
    if (db) {
      try {
        const snap = await db.collection('kinderen').doc(huidigKindCode).get();
        const data = snap.exists ? snap.data() : {};
        const wachtrij = Array.isArray(data.taakwachtrij) ? data.taakwachtrij : [];
        volgendeTaak = wachtrij.length ? _bouwTaak(wachtrij[0]) : null;
        resterendeWachtrij = wachtrij.slice(1);
        if (taakCache.vrijHerhalenNaAfronding === true && taakCache.themaId) {
          const huidigVrij = Array.isArray(data.thema_actief) ? data.thema_actief : [];
          vrijeThemasNaAfronding = [...new Set([...huidigVrij, taakCache.themaId])];
        }
      } catch (e) {
        console.warn('Wachtrij ophalen bij archiveren mislukt:', e);
      }
    }
    taakCache = volgendeTaak;
    if (_previewModus) return; // preview: geen persistence
    localStorage.setItem('andersleren_taak_' + huidigKindCode, JSON.stringify(taakCache));
    localStorage.setItem('andersleren_taakgeschiedenis_' + huidigKindCode, JSON.stringify(taakgeschiedenisCache));
    if (db) {
      try {
        const update = {
          taakgeschiedenis: taakgeschiedenisCache,
          taakwachtrij: resterendeWachtrij
        };
        update.taak = volgendeTaak || window.firebase.firestore.FieldValue.delete();
        if (vrijeThemasNaAfronding) update.thema_actief = vrijeThemasNaAfronding;
        await db.collection('kinderen').doc(huidigKindCode).update(update);
      } catch (e) {
        console.warn('Archiveren taak in Firestore mislukt:', e);
      }
    }
  }

  function getTaakgeschiedenis() {
    return taakgeschiedenisCache;
  }

  // Voor het leerkracht-paneel: vanop afstand de taak van een ander kind ophalen/zetten.
  async function haalTaakOpVoorKind(code) {
    if (!db) return null;
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return null;
      return doc.data().taak || null;
    } catch (e) {
      console.warn('Ophalen taak mislukt:', e);
      return null;
    }
  }

  // Haal actieve én reeds geplande taken op voor het gedeelde leerkrachtoverzicht.
  async function haalOpenTakenOpVoorKind(code) {
    if (!db || !code) return { actief: null, gepland: [] };
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return { actief: null, gepland: [] };
      const data = doc.data();
      return {
        actief: data.taak || null,
        gepland: Array.isArray(data.taakwachtrij) ? data.taakwachtrij : []
      };
    } catch (e) {
      console.warn('Open taken ophalen mislukt:', e);
      return { actief: null, gepland: [] };
    }
  }

  // Voeg toe zonder een bestaande actieve taak te vervangen. De eerste taak
  // wordt actief; alle volgende taken komen in de wachtrij.
  async function voegTaakToeVoorKind(code, taakObj) {
    if (!db || !code) return { positie: 'onbekend', taak: null };
    const nieuw = _bouwTaak(taakObj);
    const ref = db.collection('kinderen').doc(code);
    let positie = 'gepland';
    await db.runTransaction(async transactie => {
      const snap = await transactie.get(ref);
      if (!snap.exists) throw new Error('Leerling niet gevonden.');
      const data = snap.data();
      const actief = data.taak;
      const actiefGeldig = actief && actief.themaId && Array.isArray(actief.woordIds) && actief.woordIds.length > 0;
      if (!actiefGeldig) {
        positie = 'actief';
        transactie.update(ref, { taak: nieuw });
      } else {
        const wachtrij = Array.isArray(data.taakwachtrij) ? [...data.taakwachtrij] : [];
        wachtrij.push(nieuw);
        transactie.update(ref, { taakwachtrij: wachtrij });
      }
    });
    if (code === huidigKindCode && positie === 'actief') {
      taakCache = nieuw;
      localStorage.setItem('andersleren_taak_' + code, JSON.stringify(nieuw));
    }
    return { positie, taak: nieuw };
  }

  async function verwijderGeplandeTaakVoorKind(code, taakId, indexFallback) {
    if (!db || !code) return [];
    const ref = db.collection('kinderen').doc(code);
    let nieuw = [];
    await db.runTransaction(async transactie => {
      const snap = await transactie.get(ref);
      if (!snap.exists) throw new Error('Leerling niet gevonden.');
      const wachtrij = Array.isArray(snap.data().taakwachtrij) ? [...snap.data().taakwachtrij] : [];
      const index = taakId ? wachtrij.findIndex(t => t.taakId === taakId) : Number(indexFallback);
      if (index >= 0 && index < wachtrij.length) wachtrij.splice(index, 1);
      nieuw = wachtrij;
      transactie.update(ref, { taakwachtrij: wachtrij });
    });
    return nieuw;
  }

  async function zetTaakVoorKind(code, taakObj) {
    if (!code) return;
    const nieuw = _bouwTaak(taakObj);

    // ARCHIVEER de oude taak (indien aanwezig) voor we hem overschrijven.
    // Belangrijk: alleen archiveren als de oude taak AFGEWERKT was (voltooid,
    // moeilijk of haperde). Bezige taken die bewerkt worden moeten gewoon
    // overschreven worden — anders verschijnt dezelfde taak twee keer in de lijst.
    if (db) {
      try {
        const oudeDoc = await db.collection('kinderen').doc(code).get();
        if (oudeDoc.exists) {
          const oudeData = oudeDoc.data();
          const oudeStatus = oudeData.taak && oudeData.taak.status;
          const oudeAfgewerkt = (oudeStatus === 'voltooid' ||
                                 oudeStatus === 'moeilijk' ||
                                 oudeStatus === 'haperde');
          if (oudeAfgewerkt && oudeData.taak && oudeData.taak.themaId &&
              Array.isArray(oudeData.taak.woordIds) && oudeData.taak.woordIds.length > 0) {
            const archief = {
              themaId: oudeData.taak.themaId,
              woordIds: [...oudeData.taak.woordIds],
              vaardigheden: Array.isArray(oudeData.taak.vaardigheden) ? [...oudeData.taak.vaardigheden] : ['luisteren'],
              voltooidOp: Date.now(),
              gestart: oudeData.taak.gestart || null,
              status: oudeData.taak.status || 'bezig',
              perWoord: JSON.parse(JSON.stringify(oudeData.taak.perWoord || {})),
              foutWoordenLaatsteToets: Array.isArray(oudeData.taak.foutWoordenLaatsteToets)
                                          ? [...oudeData.taak.foutWoordenLaatsteToets] : [],
              toetsResultaten: oudeData.taak.toetsResultaten ? JSON.parse(JSON.stringify(oudeData.taak.toetsResultaten)) : null,
              rapportperiodeId: oudeData.taak.rapportperiodeId || null
            };
            const huidigeGeschiedenis = Array.isArray(oudeData.taakgeschiedenis) ? oudeData.taakgeschiedenis : [];
            huidigeGeschiedenis.push(archief);
            // Beperk tot laatste 50 archieven
            const beperkt = huidigeGeschiedenis.length > 50
                             ? huidigeGeschiedenis.slice(-50)
                             : huidigeGeschiedenis;
            // Update direct hier
            const updateArchief = { taakgeschiedenis: beperkt };
            await db.collection('kinderen').doc(code).update(updateArchief);
            // Lokale cache bijwerken als het over huidig kind gaat
            if (code === huidigKindCode) {
              taakgeschiedenisCache = beperkt;
              localStorage.setItem('andersleren_taakgeschiedenis_' + code, JSON.stringify(beperkt));
            }
          }
        }
      } catch (e) {
        console.warn('Archiveren oude taak mislukt (gaan toch verder):', e);
      }
    }

    if (code === huidigKindCode) {
      taakCache = nieuw;
      localStorage.setItem('andersleren_taak_' + code, JSON.stringify(taakCache));
    }
    if (db) {
      try {
        const update = {};
        if (nieuw === null) {
          update.taak = window.firebase.firestore.FieldValue.delete();
        } else {
          update.taak = nieuw;
        }
        await db.collection('kinderen').doc(code).update(update);
      } catch (e) {
        console.warn('Bewaren taak voor kind in Firestore mislukt:', e);
        throw e;
      }
    }
  }

  // Voor leerkracht-paneel: haal de taakgeschiedenis op van een specifiek kind.
  async function haalTaakgeschiedenisOpVoorKind(code) {
    if (!db) return [];
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return [];
      const arr = doc.data().taakgeschiedenis;
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('Ophalen geschiedenis mislukt:', e);
      return [];
    }
  }

  // Schrijf een (gewijzigde) geschiedenis-array terug naar Firestore.
  // Gebruikt door leerkracht-UI om individuele archief-rijen te wissen.
  async function zetTaakgeschiedenisVoorKind(code, geschiedenis) {
    if (!code) return;
    const arr = Array.isArray(geschiedenis) ? geschiedenis : [];
    // Lokale cache bijwerken als het over huidig kind gaat
    if (code === huidigKindCode) {
      taakgeschiedenisCache = arr;
      localStorage.setItem('andersleren_taakgeschiedenis_' + code, JSON.stringify(arr));
    }
    if (db) {
      try {
        await db.collection('kinderen').doc(code).update({ taakgeschiedenis: arr });
      } catch (e) {
        console.warn('Bewaren geschiedenis mislukt:', e);
        throw e;
      }
    }
  }

  // ------------------- Spreektoetsen ------------------
  function getSpreektoetsen() {
    return spreektoetsenCache;
  }

  async function bewaarSpreektoets(toets) {
    spreektoetsenCache.push(toets);
    if (_previewModus) return; // preview: geen persistence
    if (huidigKindCode) {
      localStorage.setItem('andersleren_spreektoetsen_' + huidigKindCode, JSON.stringify(spreektoetsenCache));
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({
            spreektoetsen: spreektoetsenCache
          });
        } catch (e) {
          console.warn('Bewaren spreektoets in Firestore mislukt:', e);
          throw e;
        }
      }
    }
  }

  // Voor leerkracht: spreektoetsen van een ander kind.
  async function haalSpreektoetsenOpVoorKind(code) {
    if (!db) return [];
    try {
      const doc = await db.collection('kinderen').doc(code).get();
      if (!doc.exists) return [];
      return Array.isArray(doc.data().spreektoetsen) ? doc.data().spreektoetsen : [];
    } catch (e) {
      return [];
    }
  }

  async function bewaarSpreektoetsVoorKind(code, toets) {
    if (!code || !db) return;
    const huidige = await haalSpreektoetsenOpVoorKind(code);
    huidige.push(toets);
    if (code === huidigKindCode) {
      spreektoetsenCache = huidige;
      localStorage.setItem('andersleren_spreektoetsen_' + code, JSON.stringify(huidige));
    }
    try {
      await db.collection('kinderen').doc(code).update({ spreektoetsen: huidige });
    } catch (e) {
      console.warn('Bewaren spreektoets voor kind mislukt:', e);
      throw e;
    }
  }

  // Update een bestaande spreektoets (op basis van id) in plaats van toevoegen
  async function updateSpreektoetsVoorKind(code, toetsId, updates) {
    if (!code || !db || !toetsId) return;
    const huidige = await haalSpreektoetsenOpVoorKind(code);
    const idx = huidige.findIndex(t => t.id === toetsId);
    if (idx < 0) {
      // niet gevonden — fallback: toevoegen
      huidige.push(updates);
    } else {
      huidige[idx] = { ...huidige[idx], ...updates };
    }
    if (code === huidigKindCode) {
      spreektoetsenCache = huidige;
      localStorage.setItem('andersleren_spreektoetsen_' + code, JSON.stringify(huidige));
    }
    try {
      await db.collection('kinderen').doc(code).update({ spreektoetsen: huidige });
    } catch (e) {
      console.warn('Update spreektoets voor kind mislukt:', e);
      throw e;
    }
  }

  // Verwijder een spreektoets op basis van id
  async function verwijderSpreektoetsVoorKind(code, toetsId) {
    if (!code || !db || !toetsId) return;
    const huidige = await haalSpreektoetsenOpVoorKind(code);
    const filtered = huidige.filter(t => t.id !== toetsId);
    if (code === huidigKindCode) {
      spreektoetsenCache = filtered;
      localStorage.setItem('andersleren_spreektoetsen_' + code, JSON.stringify(filtered));
    }
    try {
      await db.collection('kinderen').doc(code).update({ spreektoetsen: filtered });
    } catch (e) {
      console.warn('Verwijder spreektoets voor kind mislukt:', e);
      throw e;
    }
  }

  // ------------------- Rapport-notities ------------------
  function getRapportNotities() {
    return rapportNotitiesCache;
  }

  async function zetRapportNotities(tekst) {
    rapportNotitiesCache = tekst || '';
    if (huidigKindCode) {
      localStorage.setItem('andersleren_rapportnotities_' + huidigKindCode, rapportNotitiesCache);
      if (db) {
        try {
          await db.collection('kinderen').doc(huidigKindCode).update({
            rapportNotities: rapportNotitiesCache
          });
        } catch (e) {
          console.warn('Bewaren rapport-notities mislukt:', e);
        }
      }
    }
  }

  async function zetRapportNotitiesVoorKind(code, tekst) {
    if (!code || !db) return;
    if (code === huidigKindCode) {
      rapportNotitiesCache = tekst || '';
      localStorage.setItem('andersleren_rapportnotities_' + code, rapportNotitiesCache);
    }
    try {
      await db.collection('kinderen').doc(code).update({ rapportNotities: tekst || '' });
    } catch (e) {
      console.warn('Bewaren rapport-notities voor kind mislukt:', e);
      throw e;
    }
  }

  // ------------------- School-instellingen ------------------
  // Eenmalig instelbaar door de leerkracht: schoolnaam, klas, leerkracht-naam,
  // logo (als data-URL). Wordt gebruikt in PDF-rapporten.
  async function haalSchoolinstellingenOp() {
    if (!db) return null;
    try {
      const doc = await db.collection('instellingen').doc('school').get();
      if (!doc.exists) return null;
      return doc.data();
    } catch (e) {
      console.warn('Ophalen schoolinstellingen mislukt:', e);
      return null;
    }
  }

  async function bewaarSchoolinstellingen(data) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    // data = { schoolnaam, klas, leerkrachtnaam, logoDataUrl }
    await db.collection('instellingen').doc('school').set(data, { merge: true });
  }

  // ------------------- Rapportperiodes ------------------
  // Een rapportperiode = een tijdsvenster waarbinnen taken en spreektoetsen
  // worden uitgevoerd. Eén periode is "actief" (status: 'actief'); de rest
  // is afgesloten (status: 'afgesloten'). Nieuwe taken/toetsen krijgen
  // automatisch de ID van de actieve periode.
  //
  // Doc-structuur in /rapportperiodes/{periodeId}:
  //   { id, naam, startDatum (ts), eindDatum (ts), status, gemaakt (ts) }

  async function alleRapportperiodes() {
    if (!db) return [];
    try {
      const snap = await db.collection('rapportperiodes').orderBy('startDatum', 'desc').get();
      const lijst = [];
      snap.forEach(doc => {
        lijst.push({ id: doc.id, ...doc.data() });
      });
      return lijst;
    } catch (e) {
      console.warn('Ophalen rapportperiodes mislukt:', e);
      return [];
    }
  }

  async function actieveRapportperiode() {
    const lijst = await alleRapportperiodes();
    return lijst.find(p => p.status === 'actief') || null;
  }

  async function maakRapportperiode(naam, startDatum, eindDatum) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!naam || !naam.trim()) throw new Error('Naam is verplicht.');
    if (!startDatum || !eindDatum) throw new Error('Start- en einddatum zijn verplicht.');
    if (eindDatum <= startDatum) throw new Error('Einddatum moet na startdatum liggen.');

    // Genereer ID op basis van startdatum + naam (slug)
    const startD = new Date(startDatum);
    const slug = naam.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const periodeId = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${slug || 'periode'}`;

    // Bepaal schooljaar uit startdatum en het volgnummer binnen dat schooljaar
    const schooljaar = bepaalSchooljaarUitDatum(startDatum);
    let nummer = 1;
    try {
      const bestaande = await alleRapportperiodes();
      const inHetzelfdeSchooljaar = bestaande.filter(p => {
        if (p.schooljaar) return p.schooljaar === schooljaar;
        return bepaalSchooljaarUitDatum(p.startDatum) === schooljaar;
      });
      nummer = inHetzelfdeSchooljaar.length + 1;
    } catch (e) {
      // Als ophalen faalt, default nummer 1
    }

    const data = {
      naam: naam.trim(),
      startDatum: startDatum,
      eindDatum: eindDatum,
      status: 'actief',
      gemaakt: Date.now(),
      schooljaar: schooljaar,
      nummer: nummer
    };
    await db.collection('rapportperiodes').doc(periodeId).set(data);

    // Voeg deze periode-ID toe aan het schooljaar-document
    try {
      const sjDoc = await db.collection('schooljaren').doc(schooljaar).get();
      if (sjDoc.exists) {
        const huidige = Array.isArray(sjDoc.data().rapportperiodes) ? sjDoc.data().rapportperiodes : [];
        if (!huidige.includes(periodeId)) {
          await sjDoc.ref.update({ rapportperiodes: [...huidige, periodeId] });
        }
      }
    } catch (e) {
      console.warn('Periode toevoegen aan schooljaar mislukt:', e);
    }

    return { id: periodeId, ...data };
  }

  // Bewerk een bestaande periode (naam, datums)
  async function wijzigRapportperiode(periodeId, naam, startDatum, eindDatum) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!periodeId) throw new Error('Periode-ID is verplicht.');
    const upd = {};
    if (naam && naam.trim()) upd.naam = naam.trim();
    if (startDatum) upd.startDatum = startDatum;
    if (eindDatum) upd.eindDatum = eindDatum;
    if (startDatum && eindDatum && eindDatum <= startDatum) {
      throw new Error('Einddatum moet na startdatum liggen.');
    }
    // Als startdatum verandert: schooljaar herberekenen
    if (startDatum) {
      const nieuwSj = bepaalSchooljaarUitDatum(startDatum);
      upd.schooljaar = nieuwSj;
    }
    if (Object.keys(upd).length === 0) return;
    await db.collection('rapportperiodes').doc(periodeId).update(upd);
  }

  async function sluitRapportperiode(periodeId) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    await db.collection('rapportperiodes').doc(periodeId).update({
      status: 'afgesloten',
      afgeslotenOp: Date.now()
    });
  }

  async function heropenRapportperiode(periodeId) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    // Check of er al een actieve is — die moet eerst gesloten worden
    const actieve = await actieveRapportperiode();
    if (actieve && actieve.id !== periodeId) {
      throw new Error(`Er is al een actieve periode ("${actieve.naam}"). Sluit die eerst af.`);
    }
    await db.collection('rapportperiodes').doc(periodeId).update({
      status: 'actief',
      heropendOp: Date.now()
    });
  }

  async function verwijderRapportperiode(periodeId) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    await db.collection('rapportperiodes').doc(periodeId).delete();
  }

  // Migratie: zorg dat er minstens één periode bestaat. Als er geen is,
  // maak een default-periode aan en wijs alle bestaande taken/toetsen toe.
  async function migreerNaarRapportperiodes() {
    if (!db) return null;
    const bestaande = await alleRapportperiodes();
    if (bestaande.length > 0) return null; // al gemigreerd

    // Maak default-periode: huidige schooljaar
    const nu = new Date();
    let startJaar = nu.getFullYear();
    let eindJaar = startJaar + 1;
    // Schooljaar loopt van september tot juni; bepaal welk schooljaar nu loopt
    if (nu.getMonth() < 8) { // jan-aug → vorig schooljaar
      startJaar = nu.getFullYear() - 1;
      eindJaar = nu.getFullYear();
    }
    const start = new Date(startJaar, 8, 1).getTime(); // 1 september
    const eind = new Date(eindJaar, 5, 30).getTime();  // 30 juni

    const periode = await maakRapportperiode(
      `Schooljaar ${startJaar}-${eindJaar}`,
      start,
      eind
    );

    // Bestaande taken & spreektoetsen krijgen deze periode-ID toegewezen
    try {
      const snap = await db.collection('kinderen').get();
      const updates = [];
      snap.forEach(doc => {
        const data = doc.data();
        const update = {};
        if (data.taak && !data.taak.rapportperiodeId) {
          update['taak.rapportperiodeId'] = periode.id;
        }
        // Taakgeschiedenis: array, vereist hele array opnieuw zetten
        if (Array.isArray(data.taakgeschiedenis) && data.taakgeschiedenis.length > 0) {
          const nieuwGesch = data.taakgeschiedenis.map(t => ({ ...t, rapportperiodeId: t.rapportperiodeId || periode.id }));
          update.taakgeschiedenis = nieuwGesch;
        }
        if (Array.isArray(data.spreektoetsen) && data.spreektoetsen.length > 0) {
          const nieuwSpr = data.spreektoetsen.map(t => ({ ...t, rapportperiodeId: t.rapportperiodeId || periode.id }));
          update.spreektoetsen = nieuwSpr;
        }
        if (Object.keys(update).length > 0) {
          updates.push(doc.ref.update(update));
        }
      });
      await Promise.all(updates);
    } catch (e) {
      console.warn('Migratie van bestaande data faalde (nieuwe periode wel aangemaakt):', e);
    }

    return periode;
  }


  async function alleKinderen() {
    if (!db) return [];
    const centraal = !!window.TAALGROEI_CENTRAAL;
    const sessie = window.SchoolSessie && typeof window.SchoolSessie.get === 'function'
      ? window.SchoolSessie.get() : null;
    const rol = String(sessie && sessie.rol || '').toLowerCase();
    const schoolbreed = ['beheerder', 'directie', 'zorgcoordinator', 'zorgleerkracht'].includes(rol);

    let docs = [];
    if (centraal && sessie && sessie.aangemeld && !schoolbreed) {
      // Een klasleerkracht vraagt alleen de klassen op waaraan het centrale
      // schoolaccount gekoppeld is. Zo voldoen query en beveiligingsregel aan
      // dezelfde beperking.
      const koppelingen = Array.isArray(sessie.klassen) ? sessie.klassen : [];
      const gezien = new Map();
      for (const koppeling of koppelingen) {
        const schooljaar = String(koppeling.schooljaar || '').trim();
        const klas = String(koppeling.klas || koppeling.klasId || '').trim();
        if (!schooljaar || !klas) continue;
        const deel = await db.collection('kinderen')
          .where('centraleSchooljaar', '==', schooljaar)
          .where('klas', '==', klas)
          .get();
        deel.forEach(doc => gezien.set(doc.id, doc));
      }
      docs = [...gezien.values()];
    } else {
      const snap = await db.collection('kinderen').orderBy('gemaakt', 'desc').get();
      docs = snap.docs;
    }
    const lijst = [];
    docs.forEach(doc => {
      lijst.push({ code: doc.id, ...doc.data() });
    });
    lijst.sort((a, b) => {
      const av = a.gemaakt && typeof a.gemaakt.toMillis === 'function' ? a.gemaakt.toMillis() : 0;
      const bv = b.gemaakt && typeof b.gemaakt.toMillis === 'function' ? b.gemaakt.toMillis() : 0;
      return bv - av;
    });
    return lijst;
  }

  async function maakKind(code, naamOfData) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    const codeNorm = code.trim().toUpperCase();

    // Backward compat: ofwel string (oude naam), ofwel object {voornaam, achternaam, klas}
    let velden;
    if (typeof naamOfData === 'string') {
      velden = {
        naam: naamOfData || '',
        voornaam: '',
        achternaam: '',
        klas: ''
      };
    } else {
      const v = (naamOfData && naamOfData.voornaam) ? naamOfData.voornaam.trim() : '';
      const a = (naamOfData && naamOfData.achternaam) ? naamOfData.achternaam.trim() : '';
      const k = (naamOfData && naamOfData.klas) ? naamOfData.klas.trim() : '';
      velden = {
        naam: [v, a].filter(Boolean).join(' '),
        voornaam: v,
        achternaam: a,
        klas: k
      };
    }

    const bronVelden = (naamOfData && typeof naamOfData === 'object') ? {
      centraleKoppelHash: naamOfData.centraleKoppelHash || null,
      centraleSchooljaar: naamOfData.centraleSchooljaar || null,
      bron: naamOfData.bron || null
    } : {};

    await db.collection('kinderen').doc(codeNorm).set({
      ...velden,
      ...bronVelden,
      gemaakt: window.firebase.firestore.FieldValue.serverTimestamp(),
      voortgang: {},
      thema_actief: []
    });
    return codeNorm;
  }

  // Verbind een bestaande Taalgroei-leerling met een onomkeerbare koppelsleutel
  // uit de centrale klaslijst. De echte centrale ID wordt hier niet opgeslagen.
  async function koppelCentraleLeerling(code, gegevens) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!code || !gegevens || !gegevens.centraleKoppelHash) throw new Error('Leerling en koppelsleutel zijn verplicht.');
    const k = String(gegevens.klas || '').trim();
    await db.collection('kinderen').doc(code).update({
      centraleKoppelHash: String(gegevens.centraleKoppelHash),
      centraleSchooljaar: String(gegevens.centraleSchooljaar || ''),
      bron: 'schoolportaal',
      klas: k
    });
  }

  async function verwijderKind(code) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    await db.collection('kinderen').doc(code).delete();
  }

  // Verouderd — blijft werken voor backward compat
  async function wijzigNaamVanKind(code, nieuweNaam) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!code) throw new Error('Code is verplicht.');
    await db.collection('kinderen').doc(code).update({
      naam: (nieuweNaam || '').trim()
    });
  }

  // Nieuwe centrale functie: wijzig voornaam + achternaam + klas in één keer
  async function wijzigKindGegevens(code, voornaam, achternaam, klas) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!code) throw new Error('Code is verplicht.');
    const v = (voornaam || '').trim();
    const a = (achternaam || '').trim();
    const k = (klas || '').trim();
    await db.collection('kinderen').doc(code).update({
      voornaam: v,
      achternaam: a,
      klas: k,
      naam: [v, a].filter(Boolean).join(' ') // voor backward compat met oudere code
    });
  }

  // ------------------- Rapporten ------------------
  // Een rapport = snapshot van sterren + feedback voor een leerling per
  // rapportperiode. Wordt bewaard in /rapporten/{kindCode}-{periodeId}
  // zodat deterministische upsert mogelijk is (geen duplicaten).
  //
  // Doc-structuur:
  //   { kindCode, rapportperiodeId, gemaakt, laatstAangepast,
  //     sterren: { luisteren, lezen, schrijven, spreken, werkhouding },
  //     toetsdata: { luisteren: {aantal, pct}, ... },
  //     feedback: { watGaatGoed: [...], groeipunten: [...], werkhouding: [...] } }

  function _rapportId(kindCode, periodeId) {
    return `${kindCode}-${periodeId}`;
  }

  async function haalRapportOpVoorKind(kindCode, periodeId) {
    if (!db || !kindCode || !periodeId) return null;
    try {
      const doc = await db.collection('rapporten').doc(_rapportId(kindCode, periodeId)).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (e) {
      console.warn('Rapport ophalen mislukt:', e);
      return null;
    }
  }

  async function bewaarRapport(rapport) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!rapport || !rapport.kindCode || !rapport.rapportperiodeId) {
      throw new Error('Rapport mist kindCode of rapportperiodeId.');
    }
    const id = _rapportId(rapport.kindCode, rapport.rapportperiodeId);
    const data = {
      kindCode: rapport.kindCode,
      rapportperiodeId: rapport.rapportperiodeId,
      sterren: rapport.sterren || {},
      toetsdata: rapport.toetsdata || {},
      feedback: rapport.feedback || {},
      gemaakt: rapport.gemaakt || Date.now(),
      laatstAangepast: Date.now()
    };
    await db.collection('rapporten').doc(id).set(data, { merge: true });
    return { id, ...data };
  }

  // Score-grenzen: <50% = 1*, 50-60% = 2*, 60-80% = 3*, 80-100% = 4*
  function _pctNaarSterren(pct) {
    if (pct == null || isNaN(pct)) return null;
    if (pct < 50) return 1;
    if (pct < 60) return 2;
    if (pct < 80) return 3;
    return 4;
  }

  // Bereken sterren + toetsdata uit taak-geschiedenis en spreektoetsen
  // voor een specifieke rapportperiode. Returnt:
  //   { sterren: {luisteren, lezen, schrijven, spreken, werkhouding},
  //     toetsdata: {luisteren: {aantal, pct, juist, totaal}, ...},
  //     foutWoorden: {luisteren: [woordIds], ...} }
  // Sterren zijn null voor vaardigheden zonder data; werkhouding is altijd null
  // (manuele invoer door leerkracht).
  async function berekenRapportSterren(kindCode, periodeId, periode) {
    const result = {
      sterren: {
        luisteren: null,
        lezen: null,
        schrijven: null,
        spreken: null,
        werkhouding: null
      },
      toetsdata: {
        luisteren: { aantal: 0, juist: 0, totaal: 0, pct: null },
        lezen:     { aantal: 0, juist: 0, totaal: 0, pct: null },
        schrijven: { aantal: 0, juist: 0, totaal: 0, pct: null },
        spreken:   { aantal: 0, juist: 0, totaal: 0, pct: null }
      },
      foutWoorden: {
        luisteren: [],
        lezen:     [],
        schrijven: [],
        spreken:   []
      }
    };
    if (!kindCode || !periodeId) return result;

    // ----- Taken: huidige + geschiedenis -----
    let huidigeTaak = null;
    let geschiedenis = [];
    try {
      huidigeTaak = await haalTaakOpVoorKind(kindCode);
    } catch (e) { huidigeTaak = null; }
    try {
      geschiedenis = await haalTaakgeschiedenisOpVoorKind(kindCode) || [];
    } catch (e) { geschiedenis = []; }

    // Verzamel alle taken die in deze periode vallen.
    // Voorkeur: rapportperiodeId. Fallback: voltooidOp/gestart binnen periode-venster.
    const alleTaken = [];
    if (huidigeTaak && huidigeTaak.themaId) alleTaken.push(huidigeTaak);
    geschiedenis.forEach(t => alleTaken.push(t));

    const venster = periode ? { start: periode.startDatum, eind: periode.eindDatum } : null;
    function taakInPeriode(t) {
      if (t.rapportperiodeId === periodeId) return true;
      if (!venster) return false;
      const ts = t.voltooidOp || t.gestart;
      if (!ts) return false;
      return ts >= venster.start && ts <= venster.eind;
    }

    const takenInPeriode = alleTaken.filter(taakInPeriode);

    // Per vaardigheid: tel toetsen + woorden via laatste poging per taak
    ['luisteren', 'lezen', 'schrijven'].forEach(vaardigheid => {
      let aantalToetsen = 0;
      let totaalWoorden = 0;
      let juisteWoorden = 0;
      const fouteIds = [];

      takenInPeriode.forEach(taak => {
        const aantalW = (taak.woordIds || []).length;
        if (aantalW === 0) return;

        // Nieuwe data: toetsResultaten met pogingen
        const tr = taak.toetsResultaten && taak.toetsResultaten[vaardigheid];
        if (tr && tr.afgenomen && Array.isArray(tr.pogingen) && tr.pogingen.length > 0) {
          const laatste = tr.pogingen[tr.pogingen.length - 1];
          aantalToetsen++;
          totaalWoorden += aantalW;
          const fout = Array.isArray(laatste.foutIds) ? laatste.foutIds : [];
          juisteWoorden += (aantalW - fout.length);
          fout.forEach(id => fouteIds.push(id));
        }
        // Oude data: alleen voor 'luisteren', val terug op foutWoordenLaatsteToets
        else if (vaardigheid === 'luisteren' && Array.isArray(taak.foutWoordenLaatsteToets)
                 && (taak.status === 'voltooid' || taak.status === 'moeilijk' || taak.status === 'haperde')) {
          aantalToetsen++;
          totaalWoorden += aantalW;
          const fout = taak.foutWoordenLaatsteToets;
          juisteWoorden += (aantalW - fout.length);
          fout.forEach(id => fouteIds.push(id));
        }
      });

      const pct = totaalWoorden > 0 ? Math.round(juisteWoorden / totaalWoorden * 100) : null;
      result.toetsdata[vaardigheid] = {
        aantal: aantalToetsen,
        juist: juisteWoorden,
        totaal: totaalWoorden,
        pct: pct
      };
      result.sterren[vaardigheid] = _pctNaarSterren(pct);
      result.foutWoorden[vaardigheid] = fouteIds;
    });

    // ----- Spreektoetsen -----
    let spreekt = [];
    try {
      spreekt = await haalSpreektoetsenOpVoorKind(kindCode) || [];
    } catch (e) { spreekt = []; }

    function sprToetsInPeriode(st) {
      if (st.rapportperiodeId === periodeId) return true;
      if (!venster || !st.datum) return false;
      return st.datum >= venster.start && st.datum <= venster.eind;
    }
    const spreektInPeriode = spreekt.filter(sprToetsInPeriode);

    let aantalSpr = 0;
    let totaalZinnen = 0;
    let scoreZinnen = 0; // vlot=1, aarzelt=0.5, niet=0
    const fouteSpr = [];
    spreektInPeriode.forEach(st => {
      const perWoord = st.perWoord || {};
      const ids = Object.keys(perWoord);
      if (ids.length === 0) return;
      aantalSpr++;
      ids.forEach(id => {
        // perWoord[id] kan string ('vlot'|'aarzelt'|'niet') of object zijn
        const waarde = perWoord[id];
        const oordeel = (waarde && typeof waarde === 'object') ? waarde.oordeel : waarde;
        totaalZinnen++;
        if (oordeel === 'vlot') scoreZinnen += 1;
        else if (oordeel === 'aarzelt') {
          scoreZinnen += 0.5;
          fouteSpr.push(id);
        } else if (oordeel === 'niet') {
          fouteSpr.push(id);
        }
      });
    });
    const pctSpr = totaalZinnen > 0 ? Math.round(scoreZinnen / totaalZinnen * 100) : null;
    result.toetsdata.spreken = {
      aantal: aantalSpr,
      juist: scoreZinnen,
      totaal: totaalZinnen,
      pct: pctSpr
    };
    result.sterren.spreken = _pctNaarSterren(pctSpr);
    result.foutWoorden.spreken = fouteSpr;

    // ==========================================================
    //  Integreer eigen toetsen (puntenboek) in de sterren-berekening
    // ==========================================================
    // Eigen toetsen kunnen alle 4 vaardigheden raken (luisteren/lezen/schrijven/spreken).
    // Elk heeft een score (juist/totaal) + gewicht. Het percentage wordt herberekend
    // met de gewogen som van online + eigen toetsen.
    try {
      const eigenToetsen = await haalEigenToetsenVoorKindPeriode(kindCode, periodeId);
      ['luisteren', 'lezen', 'schrijven', 'spreken'].forEach(v => {
        const eigen = eigenToetsen.filter(t => t.vaardigheid === v);
        if (eigen.length === 0) return;

        // Online toetsen tellen elk woord = 1 punt, gewicht 1×.
        // Eigen toetsen tellen score-juist met opgegeven gewicht.
        const huidigeData = result.toetsdata[v] || { aantal: 0, juist: 0, totaal: 0 };

        // Begin bij online-totalen (gewicht 1×)
        let gewogenJuist = (huidigeData.juist || 0) * 1;
        let gewogenTotaal = (huidigeData.totaal || 0) * 1;
        let aantal = huidigeData.aantal || 0;

        eigen.forEach(t => {
          const gewicht = (typeof t.gewicht === 'number' && t.gewicht > 0) ? t.gewicht : 1;
          const score = parseFloat(t.score) || 0;
          const max = parseFloat(t.maximum) || 0;
          if (max <= 0) return;
          gewogenJuist += score * gewicht;
          gewogenTotaal += max * gewicht;
          aantal += 1;
        });

        const nieuwPct = gewogenTotaal > 0 ? Math.round(gewogenJuist / gewogenTotaal * 100) : null;
        result.toetsdata[v] = {
          aantal: aantal,
          juist: Math.round(gewogenJuist * 10) / 10,
          totaal: Math.round(gewogenTotaal * 10) / 10,
          pct: nieuwPct
        };
        result.sterren[v] = _pctNaarSterren(nieuwPct);
      });
    } catch (e) {
      console.warn('Eigen toetsen integreren in sterren-berekening mislukt:', e);
    }

    // werkhouding blijft null — manueel door leerkracht in te vullen
    return result;
  }

  // ==========================================================
  //  PUNTENBOEK — eigen toetsen toevoegen door de leerkracht
  // ==========================================================
  //
  // Doc-structuur in /eigenToetsen/{toetsId}:
  //   {
  //     id, kindCode, vaardigheid: 'luisteren'|'lezen'|'schrijven'|'spreken',
  //     naam: 'Dictee thema dieren',
  //     datum: timestamp,
  //     score: 8, maximum: 10,
  //     gewicht: 1.0,    // 0.5, 1, 2, ...
  //     opmerking: 'Werkte heel netjes',
  //     opmerkingCategorie: null|'watGaatGoed'|'groeipunten'|'werkhouding',
  //     rapportperiodeId, schooljaar,
  //     gemaakt, laatstAangepast
  //   }
  //
  // Toets-ID = `et-{kindCode}-{timestamp}-{random}` (deterministisch genoeg voor index)

  function _eigenToetsId(kindCode) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    return `et-${kindCode}-${ts}-${rand}`;
  }

  // Haal alle eigen toetsen voor een kind binnen een specifieke rapportperiode
  async function haalEigenToetsenVoorKindPeriode(kindCode, periodeId) {
    if (!db || !kindCode || !periodeId) return [];
    try {
      const snap = await db.collection('eigenToetsen')
        .where('kindCode', '==', kindCode)
        .where('rapportperiodeId', '==', periodeId)
        .get();
      const lijst = [];
      snap.forEach(doc => lijst.push({ id: doc.id, ...doc.data() }));
      // Sorteer op datum (oudste eerst)
      lijst.sort((a, b) => (a.datum || 0) - (b.datum || 0));
      return lijst;
    } catch (e) {
      console.warn('Eigen toetsen ophalen mislukt:', e);
      return [];
    }
  }

  // Haal alle eigen toetsen voor een kind (alle periodes) — zelden nodig
  async function haalAlleEigenToetsenVoorKind(kindCode) {
    if (!db || !kindCode) return [];
    try {
      const snap = await db.collection('eigenToetsen')
        .where('kindCode', '==', kindCode)
        .get();
      const lijst = [];
      snap.forEach(doc => lijst.push({ id: doc.id, ...doc.data() }));
      lijst.sort((a, b) => (b.datum || 0) - (a.datum || 0));
      return lijst;
    } catch (e) {
      console.warn('Alle eigen toetsen ophalen mislukt:', e);
      return [];
    }
  }

  // Voeg een eigen toets toe of update een bestaande
  async function bewaarEigenToets(toets) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!toets || !toets.kindCode) throw new Error('kindCode is verplicht.');
    if (!toets.vaardigheid) throw new Error('Vaardigheid is verplicht.');
    if (!toets.rapportperiodeId) throw new Error('Rapportperiode is verplicht.');
    if (typeof toets.score !== 'number' || typeof toets.maximum !== 'number' || toets.maximum <= 0) {
      throw new Error('Score en maximum moeten getallen zijn (maximum > 0).');
    }

    const id = toets.id || _eigenToetsId(toets.kindCode);
    const data = {
      kindCode: toets.kindCode,
      vaardigheid: toets.vaardigheid,
      naam: (toets.naam || '').trim(),
      datum: toets.datum || Date.now(),
      score: toets.score,
      maximum: toets.maximum,
      gewicht: (typeof toets.gewicht === 'number' && toets.gewicht > 0) ? toets.gewicht : 1,
      opmerking: (toets.opmerking || '').trim(),
      opmerkingCategorie: toets.opmerkingCategorie || null,
      rapportperiodeId: toets.rapportperiodeId,
      schooljaar: toets.schooljaar || bepaalSchooljaarUitDatum(toets.datum || Date.now()),
      gemaakt: toets.gemaakt || Date.now(),
      laatstAangepast: Date.now()
    };
    await db.collection('eigenToetsen').doc(id).set(data, { merge: true });
    return { id, ...data };
  }

  async function verwijderEigenToets(toetsId) {
    if (!db || !toetsId) throw new Error('Toets-ID ontbreekt.');
    await db.collection('eigenToetsen').doc(toetsId).delete();
  }

  // Hulp: tel ook online toetsen mee voor het puntenboek-overzicht
  // (zonder ze uit taakgeschiedenis te wijzigen — alleen lezen)
  async function haalOnlineToetsenVoorKindPeriode(kindCode, periodeId, periode) {
    const result = { luisteren: [], lezen: [], schrijven: [], spreken: [] };
    if (!kindCode || !periodeId) return result;

    let huidigeTaak = null;
    let geschiedenis = [];
    try {
      huidigeTaak = await haalTaakOpVoorKind(kindCode);
    } catch (e) { /* ok */ }
    try {
      geschiedenis = await haalTaakgeschiedenisOpVoorKind(kindCode) || [];
    } catch (e) { /* ok */ }

    const alle = [];
    if (huidigeTaak && huidigeTaak.themaId) alle.push(huidigeTaak);
    geschiedenis.forEach(t => alle.push(t));

    const venster = periode ? { start: periode.startDatum, eind: periode.eindDatum } : null;
    function inPeriode(t) {
      if (t.rapportperiodeId === periodeId) return true;
      if (!venster) return false;
      const ts = t.voltooidOp || t.gestart;
      if (!ts) return false;
      return ts >= venster.start && ts <= venster.eind;
    }

    const inPeriodeArr = alle.filter(inPeriode);
    inPeriodeArr.forEach(taak => {
      const aantalW = (taak.woordIds || []).length;
      if (aantalW === 0) return;
      const ts = taak.voltooidOp || taak.gestart || 0;
      const themaNaam = _haalThemaNaam(taak.themaId);

      ['luisteren', 'lezen', 'schrijven'].forEach(v => {
        const tr = taak.toetsResultaten && taak.toetsResultaten[v];
        if (tr && tr.afgenomen && Array.isArray(tr.pogingen) && tr.pogingen.length > 0) {
          const laatste = tr.pogingen[tr.pogingen.length - 1];
          const fout = Array.isArray(laatste.foutIds) ? laatste.foutIds.length : 0;
          const score = aantalW - fout;
          result[v].push({
            id: 'online-' + (taak.themaId || '') + '-' + ts + '-' + v,
            isOnline: true,
            naam: 'Online toets — ' + themaNaam,
            datum: ts,
            score: score,
            maximum: aantalW,
            gewicht: 1,
            vaardigheid: v
          });
        } else if (v === 'luisteren' && Array.isArray(taak.foutWoordenLaatsteToets)
                   && (taak.status === 'voltooid' || taak.status === 'moeilijk' || taak.status === 'haperde')) {
          // Backwards compat: oude data
          const score = aantalW - taak.foutWoordenLaatsteToets.length;
          result.luisteren.push({
            id: 'online-' + (taak.themaId || '') + '-' + ts + '-luisteren-oud',
            isOnline: true,
            naam: 'Online toets — ' + themaNaam,
            datum: ts,
            score: score,
            maximum: aantalW,
            gewicht: 1,
            vaardigheid: 'luisteren'
          });
        }
      });
    });

    // Spreektoetsen
    let spreekt = [];
    try {
      spreekt = await haalSpreektoetsenOpVoorKind(kindCode) || [];
    } catch (e) { /* ok */ }
    spreekt.forEach(st => {
      let inDezePeriode = (st.rapportperiodeId === periodeId);
      if (!inDezePeriode && venster && st.datum) {
        inDezePeriode = (st.datum >= venster.start && st.datum <= venster.eind);
      }
      if (!inDezePeriode) return;

      const perWoord = st.perWoord || {};
      const ids = Object.keys(perWoord);
      if (ids.length === 0) return;
      let score = 0;
      ids.forEach(id => {
        const waarde = perWoord[id];
        const oordeel = (waarde && typeof waarde === 'object') ? waarde.oordeel : waarde;
        if (oordeel === 'vlot') score += 1;
        else if (oordeel === 'aarzelt') score += 0.5;
      });
      const themaNaam = _haalThemaNaam(st.themaId);
      result.spreken.push({
        id: 'online-spreek-' + (st.id || st.datum),
        isOnline: true,
        naam: 'Spreektoets — ' + themaNaam,
        datum: st.datum || 0,
        score: score,
        maximum: ids.length,
        gewicht: 1,
        vaardigheid: 'spreken'
      });
    });

    // Sorteer per vaardigheid op datum (oudste eerst)
    Object.keys(result).forEach(v => {
      result[v].sort((a, b) => (a.datum || 0) - (b.datum || 0));
    });
    return result;
  }

  function _haalThemaNaam(themaId) {
    if (!themaId) return 'thema';
    if (typeof window !== 'undefined' && Array.isArray(window.ALLE_THEMAS_LK)) {
      const t = window.ALLE_THEMAS_LK.find(x => x.id === themaId);
      if (t) return t.naam || themaId;
    }
    return themaId;
  }

  // ==========================================================
  //  SCHOOLJAREN — multi-jaar architectuur
  // ==========================================================
  //
  // Een schooljaar is een container: kinderen, klassen, rapportperiodes.
  // Schooljaar loopt van 1 sept tot 31 aug (Vlaamse standaard).
  //
  // Doc-structuur in /schooljaren/{schooljaarId}:
  //   { id: "2025-2026", startDatum, eindDatum, status: 'actief'|'archief',
  //     gemaakt, kinderen: [kindCodes], klasPerKind: { kindCode: "2A" },
  //     rapportperiodes: [periodeIds] }

  // Bepaal schooljaar-ID uit een timestamp.
  // Datums tussen 1 sept en 31 aug van volgend jaar = "20XX-20YY".
  // Bv. 5 oktober 2025 → "2025-2026"; 5 maart 2026 → "2025-2026"; 5 september 2026 → "2026-2027"
  function bepaalSchooljaarUitDatum(ts) {
    if (!ts) ts = Date.now();
    const d = new Date(ts);
    const maand = d.getMonth(); // 0-11
    const jaar = d.getFullYear();
    // Maand 0-7 (jan-aug) → schooljaar startte vorig kalenderjaar
    // Maand 8-11 (sept-dec) → schooljaar startte dit kalenderjaar
    const startJaar = (maand < 8) ? jaar - 1 : jaar;
    return `${startJaar}-${startJaar + 1}`;
  }

  // Standaard start/eind-datums voor een schooljaar
  function _schooljaarDatums(schooljaarId) {
    const m = schooljaarId.match(/^(\d{4})-(\d{4})$/);
    if (!m) return null;
    const startJaar = parseInt(m[1]);
    const eindJaar = parseInt(m[2]);
    return {
      startDatum: new Date(startJaar, 8, 1).getTime(),     // 1 september
      eindDatum: new Date(eindJaar, 7, 31, 23, 59, 59).getTime() // 31 augustus
    };
  }

  async function alleSchooljaren() {
    if (!db) return [];
    try {
      const snap = await db.collection('schooljaren').orderBy('startDatum', 'desc').get();
      const lijst = [];
      snap.forEach(doc => lijst.push({ id: doc.id, ...doc.data() }));
      return lijst;
    } catch (e) {
      console.warn('Ophalen schooljaren mislukt:', e);
      return [];
    }
  }

  async function actiefSchooljaar() {
    const lijst = await alleSchooljaren();
    return lijst.find(s => s.status === 'actief') || null;
  }

  async function maakSchooljaar(schooljaarId, opties) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    if (!schooljaarId) throw new Error('Schooljaar-ID is verplicht.');
    const datums = _schooljaarDatums(schooljaarId);
    if (!datums) throw new Error(`Ongeldig schooljaar-ID "${schooljaarId}". Verwacht: "YYYY-YYYY".`);
    opties = opties || {};
    const data = {
      startDatum: datums.startDatum,
      eindDatum: datums.eindDatum,
      status: 'actief',
      gemaakt: Date.now(),
      kinderen: opties.kinderen || [],
      klasPerKind: opties.klasPerKind || {},
      rapportperiodes: []
    };
    await db.collection('schooljaren').doc(schooljaarId).set(data);
    return { id: schooljaarId, ...data };
  }

  async function archiveerSchooljaar(schooljaarId) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    await db.collection('schooljaren').doc(schooljaarId).update({
      status: 'archief',
      gearchiveerdOp: Date.now()
    });
  }

  async function verwijderSchooljaar(schooljaarId) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    // Verwijder ALLEEN het schooljaar-document. Kinderen + periodes + rapporten
    // blijven bestaan (kunnen aan ander schooljaar gekoppeld zijn).
    await db.collection('schooljaren').doc(schooljaarId).delete();
  }

  // Update kinderen-lijst en klas-toewijzing van een schooljaar
  async function updateSchooljaarKinderen(schooljaarId, kinderenCodes, klasPerKind) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    const upd = {};
    if (Array.isArray(kinderenCodes)) upd.kinderen = kinderenCodes;
    if (klasPerKind && typeof klasPerKind === 'object') upd.klasPerKind = klasPerKind;
    await db.collection('schooljaren').doc(schooljaarId).update(upd);
  }

  // Bewaring: max N schooljaren behouden — oudste worden automatisch verwijderd
  async function ruimOudeSchooljarenOp(maxBewaren) {
    if (!db) return [];
    maxBewaren = maxBewaren || 3;
    const alle = await alleSchooljaren(); // gesorteerd op startDatum desc
    if (alle.length <= maxBewaren) return [];
    const teVerwijderen = alle.slice(maxBewaren);
    const verwijderdeIds = [];
    for (const sj of teVerwijderen) {
      try {
        await verwijderSchooljaar(sj.id);
        verwijderdeIds.push(sj.id);
      } catch (e) {
        console.warn('Schooljaar opruimen mislukt voor', sj.id, e);
      }
    }
    return verwijderdeIds;
  }

  // ==========================================================
  //  MIGRATIE: oude data → multi-schooljaar
  // ==========================================================
  // Logica:
  //   1. Bepaal welke schooljaren er moeten zijn op basis van bestaande
  //      rapportperiodes (hun startDatum geeft het schooljaar).
  //   2. Maak voor elk uniek schooljaar een /schooljaren/-doc als die nog
  //      niet bestaat.
  //   3. Update bestaande rapportperiodes met `schooljaar` + `nummer`.
  //   4. Update bestaande rapporten met `schooljaar` (afgeleid uit periode).
  //   5. Update bestaande kinderen met `actiefInSchooljaar` + `klasPerSchooljaar`.
  //
  // dryRun=true: geeft alleen rapport terug, schrijft niets.
  async function migreerNaarMultiSchooljaar(dryRun) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    const rapport = {
      dryRun: !!dryRun,
      schooljarenAangemaakt: [],
      periodesGemigreerd: 0,
      rapportenGemigreerd: 0,
      kinderenGemigreerd: 0,
      waarschuwingen: [],
      fouten: []
    };

    try {
      // 1) Periodes ophalen + schooljaren bepalen
      const periodes = await alleRapportperiodes();
      const schooljaarMap = {}; // { "2025-2026": [periode, ...] }
      periodes.forEach(p => {
        const sj = bepaalSchooljaarUitDatum(p.startDatum);
        if (!schooljaarMap[sj]) schooljaarMap[sj] = [];
        schooljaarMap[sj].push(p);
      });

      // 2) Bestaande schooljaren ophalen
      const bestaande = await alleSchooljaren();
      const bestaandeIds = new Set(bestaande.map(s => s.id));

      // 3) Per schooljaar: aanmaken en periodes updaten
      const kinderenLijst = await alleKinderen();

      for (const [sjId, sjPeriodes] of Object.entries(schooljaarMap)) {
        // Sorteer periodes binnen schooljaar op startDatum (oudste eerst → nummer 1)
        sjPeriodes.sort((a, b) => (a.startDatum || 0) - (b.startDatum || 0));

        if (!bestaandeIds.has(sjId)) {
          // Schooljaar moet aangemaakt worden
          const status = (Date.now() < _schooljaarDatums(sjId).eindDatum) ? 'actief' : 'archief';

          // Bepaal welke kinderen in dit schooljaar zaten:
          // alle kinderen waar minstens één taak/spreektoets/rapport in een
          // periode van dit schooljaar valt. Voor migratie: simpelweg alle
          // huidige kinderen toewijzen aan het meest recente schooljaar.
          const kinderenCodes = kinderenLijst.map(k => k.code);
          const klasPerKind = {};
          kinderenLijst.forEach(k => { if (k.klas) klasPerKind[k.code] = k.klas; });

          const sjData = {
            id: sjId,
            startDatum: _schooljaarDatums(sjId).startDatum,
            eindDatum: _schooljaarDatums(sjId).eindDatum,
            status: status,
            gemaakt: Date.now(),
            kinderen: kinderenCodes,
            klasPerKind: klasPerKind,
            rapportperiodes: sjPeriodes.map(p => p.id)
          };
          rapport.schooljarenAangemaakt.push({ id: sjId, periodes: sjPeriodes.length, status });

          if (!dryRun) {
            await db.collection('schooljaren').doc(sjId).set(sjData);
          }
        } else {
          // Schooljaar bestaat al: voeg periodes toe aan rapportperiodes-lijst
          if (!dryRun) {
            const periodesIds = sjPeriodes.map(p => p.id);
            const sj = bestaande.find(s => s.id === sjId);
            const huidigePeriodes = Array.isArray(sj.rapportperiodes) ? sj.rapportperiodes : [];
            const samengevoegd = Array.from(new Set([...huidigePeriodes, ...periodesIds]));
            await db.collection('schooljaren').doc(sjId).update({ rapportperiodes: samengevoegd });
          }
        }

        // 4) Periodes updaten met schooljaar + nummer
        for (let i = 0; i < sjPeriodes.length; i++) {
          const p = sjPeriodes[i];
          const nummer = i + 1;
          rapport.periodesGemigreerd++;
          if (!dryRun) {
            try {
              await db.collection('rapportperiodes').doc(p.id).update({
                schooljaar: sjId,
                nummer: nummer
              });
            } catch (e) {
              rapport.fouten.push(`Periode ${p.id} updaten faalde: ${e.message}`);
            }
          }
        }
      }

      // 5) Rapporten updaten met schooljaar
      try {
        const rapSnap = await db.collection('rapporten').get();
        for (const docu of rapSnap.docs) {
          const r = docu.data();
          const periodeId = r.rapportperiodeId;
          if (!periodeId) continue;
          // Vind schooljaar van die periode
          const periode = periodes.find(p => p.id === periodeId);
          if (!periode) {
            rapport.waarschuwingen.push(`Rapport ${docu.id} verwijst naar onbekende periode ${periodeId}`);
            continue;
          }
          const sj = bepaalSchooljaarUitDatum(periode.startDatum);
          rapport.rapportenGemigreerd++;
          if (!dryRun) {
            try {
              await docu.ref.update({ schooljaar: sj });
            } catch (e) {
              rapport.fouten.push(`Rapport ${docu.id} updaten faalde: ${e.message}`);
            }
          }
        }
      } catch (e) {
        rapport.fouten.push(`Rapporten ophalen faalde: ${e.message}`);
      }

      // 6) Kinderen: actiefInSchooljaar + klasPerSchooljaar
      // Default: meest recente schooljaar uit schooljaarMap. Als geen schooljaren
      // hebben (geen periodes), maak het huidige schooljaar aan op basis van vandaag.
      const schooljaarIds = Object.keys(schooljaarMap).sort().reverse();
      const meestRecent = schooljaarIds[0] || bepaalSchooljaarUitDatum(Date.now());

      // Als geen enkel schooljaar bestaat → maak een minimaal schooljaar aan
      if (schooljaarIds.length === 0 && !bestaandeIds.has(meestRecent)) {
        const datums = _schooljaarDatums(meestRecent);
        const klasPerKind = {};
        kinderenLijst.forEach(k => { if (k.klas) klasPerKind[k.code] = k.klas; });
        rapport.schooljarenAangemaakt.push({ id: meestRecent, periodes: 0, status: 'actief' });
        if (!dryRun) {
          await db.collection('schooljaren').doc(meestRecent).set({
            startDatum: datums.startDatum,
            eindDatum: datums.eindDatum,
            status: 'actief',
            gemaakt: Date.now(),
            kinderen: kinderenLijst.map(k => k.code),
            klasPerKind: klasPerKind,
            rapportperiodes: []
          });
        }
      }

      for (const k of kinderenLijst) {
        rapport.kinderenGemigreerd++;
        if (!dryRun) {
          try {
            await db.collection('kinderen').doc(k.code).update({
              actiefInSchooljaar: meestRecent,
              klasPerSchooljaar: { [meestRecent]: k.klas || '' }
            });
          } catch (e) {
            rapport.fouten.push(`Kind ${k.code} updaten faalde: ${e.message}`);
          }
        }
      }

    } catch (e) {
      rapport.fouten.push('Globale fout: ' + (e.message || e.toString()));
    }

    return rapport;
  }

  // Check of migratie nog moet gebeuren (geen schooljaar-collectie of geen
  // schooljaar-veld op periodes).
  async function migratieNodig() {
    if (!db) return false;
    try {
      const sjSnap = await db.collection('schooljaren').limit(1).get();
      if (sjSnap.empty) return true; // geen enkel schooljaar bestaat
      // Check of er periodes zijn zonder schooljaar-veld
      const periodes = await alleRapportperiodes();
      const ongekoppeld = periodes.filter(p => !p.schooljaar);
      return ongekoppeld.length > 0;
    } catch (e) {
      return false;
    }
  }

  // ==========================================================
  //  Helpers voor schooljaar-context
  // ==========================================================

  // Filter kinderen op een schooljaar. Werkt met zowel multi-jaar als
  // pre-migratie data (val terug op alle kinderen als schooljaar onbekend is).
  function filterKinderenOpSchooljaar(kinderen, schooljaarObj) {
    if (!schooljaarObj || !Array.isArray(schooljaarObj.kinderen)) {
      return kinderen; // backwards-compat
    }
    const codes = new Set(schooljaarObj.kinderen);
    return kinderen.filter(k => codes.has(k.code));
  }

  // Geef de klas voor een kind in een schooljaar
  function klasVoorKindInSchooljaar(kind, schooljaarObj) {
    if (!schooljaarObj) return kind.klas || '';
    if (schooljaarObj.klasPerKind && schooljaarObj.klasPerKind[kind.code]) {
      return schooljaarObj.klasPerKind[kind.code];
    }
    return kind.klas || '';
  }

  // Filter rapportperiodes op een schooljaar
  function filterPeriodesOpSchooljaar(periodes, schooljaarId) {
    if (!schooljaarId) return periodes;
    return periodes.filter(p => {
      if (p.schooljaar) return p.schooljaar === schooljaarId;
      // Fallback: leid af uit startDatum
      return bepaalSchooljaarUitDatum(p.startDatum) === schooljaarId;
    });
  }

  return {
    init,
    // Preview-modus (leerkracht bekijkt taak van een kind)
    zetPreviewModus,
    isPreviewModus,
    codeBestaat,
    haalNaamOp,
    laad,
    bewaar,
    registreerGezien,
    registreerJuist,
    registreerFout,
    kiesVolgendItem,
    statsThema,
    getCache,
    alleKinderen,
    maakKind,
    koppelCentraleLeerling,
    verwijderKind,
    wijzigNaamVanKind,
    wijzigKindGegevens,
    // Categorieën
    getCategorieenVoorThema,
    filterItemsOpCategorieen,
    zetCategorieenVoorKind,
    haalCategorieenOpVoorKind,
    // Uitsluiting per item
    getUitgeslotenVoorThema,
    zetUitgeslotenVoorKind,
    haalUitgeslotenOpVoorKind,
    // Thema's aan/uit per kind (vrij oefenen)
    isThemaActiefVoorKind,
    getThemaActiefRaw,
    zetThemaActiefVoorKind,
    haalThemaActiefOpVoorKind,
    // Taak-systeem
    getTaak,
    heeftTaak,
    zetTaak,
    updateTaak,
    registreerJuistInTaak,
    registreerFoutInTaak,
    registreerWoordBehandeldInRonde,
    archiveerHuidigeTaak,
    getTaakgeschiedenis,
    haalTaakOpVoorKind,
    haalOpenTakenOpVoorKind,
    haalTaakgeschiedenisOpVoorKind,
    zetTaakVoorKind,
    voegTaakToeVoorKind,
    verwijderGeplandeTaakVoorKind,
    zetTaakgeschiedenisVoorKind,
    // Spreektoetsen
    getSpreektoetsen,
    bewaarSpreektoets,
    haalSpreektoetsenOpVoorKind,
    bewaarSpreektoetsVoorKind,
    updateSpreektoetsVoorKind,
    verwijderSpreektoetsVoorKind,
    // Rapport-notities
    getRapportNotities,
    zetRapportNotities,
    zetRapportNotitiesVoorKind,
    // School-instellingen
    haalSchoolinstellingenOp,
    bewaarSchoolinstellingen,
    // Rapportperiodes
    alleRapportperiodes,
    actieveRapportperiode,
    maakRapportperiode,
    wijzigRapportperiode,
    sluitRapportperiode,
    heropenRapportperiode,
    verwijderRapportperiode,
    migreerNaarRapportperiodes,
    // Rapporten (sterren + feedback per kind per periode)
    haalRapportOpVoorKind,
    bewaarRapport,
    berekenRapportSterren,
    // Puntenboek — eigen toetsen
    haalEigenToetsenVoorKindPeriode,
    haalAlleEigenToetsenVoorKind,
    bewaarEigenToets,
    verwijderEigenToets,
    haalOnlineToetsenVoorKindPeriode,
    // Schooljaren — multi-jaar architectuur
    alleSchooljaren,
    actiefSchooljaar,
    maakSchooljaar,
    archiveerSchooljaar,
    verwijderSchooljaar,
    updateSchooljaarKinderen,
    ruimOudeSchooljarenOp,
    bepaalSchooljaarUitDatum,
    migreerNaarMultiSchooljaar,
    migratieNodig,
    filterKinderenOpSchooljaar,
    klasVoorKindInSchooljaar,
    filterPeriodesOpSchooljaar
  };
})();
