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

  function init() {
    if (window.FIREBASE_INGESTELD && window.firebase) {
      db = window.firebase.firestore();
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
  // Eén actieve taak per kind. Voor het huidige geladen kind in taakCache.
  // Voor een ander kind: gebruik haalTaakOpVoorKind/zetTaakVoorKind.

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
      oefenvormen_schrijven: Array.isArray(taakObj.oefenvormen_schrijven) && taakObj.oefenvormen_schrijven.length > 0
                       ? [...taakObj.oefenvormen_schrijven]
                       : ['slepen'],
      zinscontext: taakObj.zinscontext === true,
      huidigeFase: taakObj.huidigeFase || 'leren',
      perWoord: taakObj.perWoord || {},
      status: taakObj.status || 'bezig',
      foutWoordenLaatsteToets: taakObj.foutWoordenLaatsteToets || [],
      aantalPogingen: taakObj.aantalPogingen || { luisteren: 0, lezen: 0, schrijven: 0 },
      gestart: taakObj.gestart || Date.now(),
      klassikaalId: taakObj.klassikaalId || null
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

  // Reset de juist-teller voor een woord in een vaardigheid (bij fout antwoord).
  async function registreerFoutInTaak(woordId, vaardigheid) {
    if (!taakCache || !taakCache.perWoord || !taakCache.perWoord[woordId]) return;
    const sleutel = vaardigheid + '_juist';
    const huidig = taakCache.perWoord[woordId][sleutel] || 0;
    // Bij fout: 1 stap terug (3→2, 2→1, 1→0). Niet onder 0.
    taakCache.perWoord[woordId][sleutel] = Math.max(0, huidig - 1);
    taakCache.perWoord[woordId].laatstGeoefend = Date.now();
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
      perWoord: JSON.parse(JSON.stringify(taakCache.perWoord || {}))
    };
    taakgeschiedenisCache.push(archief);
    // Beperk geschiedenis tot laatste 50 taken om Firestore-grootte beheersbaar te houden
    if (taakgeschiedenisCache.length > 50) {
      taakgeschiedenisCache = taakgeschiedenisCache.slice(-50);
    }
    taakCache = null;
    localStorage.setItem('andersleren_taak_' + huidigKindCode, 'null');
    localStorage.setItem('andersleren_taakgeschiedenis_' + huidigKindCode, JSON.stringify(taakgeschiedenisCache));
    if (db) {
      try {
        await db.collection('kinderen').doc(huidigKindCode).update({
          taak: window.firebase.firestore.FieldValue.delete(),
          taakgeschiedenis: taakgeschiedenisCache
        });
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

  async function zetTaakVoorKind(code, taakObj) {
    if (!code) return;
    const nieuw = _bouwTaak(taakObj);
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

  // ------------------- Spreektoetsen ------------------
  function getSpreektoetsen() {
    return spreektoetsenCache;
  }

  async function bewaarSpreektoets(toets) {
    spreektoetsenCache.push(toets);
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


  async function alleKinderen() {
    if (!db) return [];
    const snap = await db.collection('kinderen').orderBy('gemaakt', 'desc').get();
    const lijst = [];
    snap.forEach(doc => {
      lijst.push({ code: doc.id, ...doc.data() });
    });
    return lijst;
  }

  async function maakKind(code, naam) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    const codeNorm = code.trim().toUpperCase();
    await db.collection('kinderen').doc(codeNorm).set({
      naam: naam || '',
      gemaakt: window.firebase.firestore.FieldValue.serverTimestamp(),
      voortgang: {},
      // Lege thema_actief = nieuwe leerling start zonder thema's.
      // Leerkracht moet expliciet thema's aanvinken in het paneel.
      thema_actief: []
    });
    return codeNorm;
  }

  async function verwijderKind(code) {
    if (!db) throw new Error('Firebase niet ingesteld.');
    await db.collection('kinderen').doc(code).delete();
  }

  return {
    init,
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
    verwijderKind,
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
    archiveerHuidigeTaak,
    getTaakgeschiedenis,
    haalTaakOpVoorKind,
    zetTaakVoorKind,
    // Spreektoetsen
    getSpreektoetsen,
    bewaarSpreektoets,
    haalSpreektoetsenOpVoorKind,
    bewaarSpreektoetsVoorKind,
    // Rapport-notities
    getRapportNotities,
    zetRapportNotities,
    zetRapportNotitiesVoorKind
  };
})();
