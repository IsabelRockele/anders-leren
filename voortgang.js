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
          // Update laatst-actief
          db.collection('kinderen').doc(code).update({
            laatstActief: window.firebase.firestore.FieldValue.serverTimestamp()
          }).catch(() => {});
          // Lokale spiegel ook bewaren (voor offline)
          localStorage.setItem('andersleren_categorieen_' + code, JSON.stringify(categorieCache));
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
  // Items zonder categorie-veld (oude thema's) blijven altijd zichtbaar.
  function filterItemsOpCategorieen(thema) {
    const actief = getCategorieenVoorThema(thema);
    // Als het thema geen categorieën definieert → alles tonen (backward-compat).
    if (!thema.categorieen || thema.categorieen.length === 0) return thema.items;
    return thema.items.filter(it => !it.categorie || actief.includes(it.categorie));
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
      voortgang: {}
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
    haalCategorieenOpVoorKind
  };
})();
