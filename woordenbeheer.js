// =================================================================
//  woordenbeheer.js — Persoonlijke laag bovenop het basispakket
//
//  Het basispakket (themas/woorden-*.js) is de master en wordt door
//  Anthropic-Isabel onderhouden. Een leerkracht kan daarbovenop:
//    - bestaande items wijzigen (tekst/zin/categorie/niveau/foto)
//    - bestaande items verbergen
//    - nieuwe eigen items toevoegen
//
//  Datastructuur in Firestore (1 document per Firebase-project):
//
//  /instellingen/woordenbeheer = {
//    overrides: {
//      'w-klas': {
//        'juf':       { tekst: 'mijn juf Sara', foto: 'https://.../sara.jpg' },
//        'boekentas': { verborgen: true }
//      },
//      ...
//    },
//    eigen: {
//      'w-klas': [
//        { id: 'eigen-1727...', tekst: 'de mat', kort: 'mat', zin: '...',
//          categorie: 'voorwerpen', niveau: 'basis', foto: 'https://.../...' }
//      ]
//    }
//  }
//
//  Eigen items hebben een id-prefix 'eigen-' zodat ze nooit clashen
//  met basispakket-id's. Voortgang werkt automatisch (zelfde key).
// =================================================================

window.Woordenbeheer = (function() {
  let db = null;
  let cache = { overrides: {}, eigen: {} };
  let cacheGeladen = false;
  let _laadPromise = null;

  function init() {
    if (window.FIREBASE_INGESTELD && window.firebase) {
      db = window.firebase.firestore();
    }
  }

  // ------------------- Laden / bewaren -------------------
  // Eén keer laden en in cache houden. Aanroepers wachten op dezelfde Promise.
  async function laad() {
    if (cacheGeladen) return cache;
    if (_laadPromise) return _laadPromise;

    _laadPromise = (async () => {
      if (!db) {
        // Lokale fallback (zonder Firestore)
        const lokaal = localStorage.getItem('andersleren_woordenbeheer');
        if (lokaal) {
          try { cache = JSON.parse(lokaal); } catch (e) { /* leeg laten */ }
        }
        cacheGeladen = true;
        return cache;
      }
      try {
        const doc = await db.collection('instellingen').doc('woordenbeheer').get();
        if (doc.exists) {
          const data = doc.data();
          cache = {
            overrides: data.overrides || {},
            eigen: data.eigen || {}
          };
        }
      } catch (e) {
        console.warn('Woordenbeheer laden mislukt:', e);
      }
      cacheGeladen = true;
      return cache;
    })();

    return _laadPromise;
  }

  async function bewaar() {
    // Lokaal altijd bijwerken (zodat het direct werkt zonder rondreis)
    localStorage.setItem('andersleren_woordenbeheer', JSON.stringify(cache));

    if (!db) return;
    try {
      await db.collection('instellingen').doc('woordenbeheer').set(cache, { merge: false });
    } catch (e) {
      console.warn('Woordenbeheer bewaren mislukt:', e);
      throw e;
    }
  }

  // ------------------- Items toepassen -------------------
  // Pas overrides + verbergen + eigen toe op de basis-items van een thema.
  // Garandeert dat elk item alle vereiste velden heeft (defaults uit basis).
  function pasToeOpThema(thema) {
    if (!thema || !thema.items) return thema;

    const themaOverrides = (cache.overrides || {})[thema.id] || {};
    const themaEigen = (cache.eigen || {})[thema.id] || [];

    // Stap 1: basis-items met eventuele override
    const verwerkt = [];
    thema.items.forEach(basisItem => {
      const ov = themaOverrides[basisItem.id];
      if (ov && ov.verborgen) return; // verborgen → niet tonen
      if (ov) {
        verwerkt.push({
          ...basisItem,
          ...ov,
          // Als override een 'foto' heeft, gebruik die in plaats van picto-pad
          // Het renderdeel kijkt eerst naar 'foto', dan naar 'picto', dan naar 'beeld'
          _bron: 'override'
        });
      } else {
        verwerkt.push({ ...basisItem, _bron: 'basis' });
      }
    });

    // Stap 2: eigen items toevoegen
    themaEigen.forEach(eigenItem => {
      verwerkt.push({ ...eigenItem, _bron: 'eigen' });
    });

    // Geef een nieuw thema-object terug met aangepaste items
    // (we klonen bewust niet thema in z'n geheel, alleen items vervangen)
    return { ...thema, items: verwerkt };
  }

  // ------------------- Mutaties: overrides -------------------
  function getOverride(themaId, itemId) {
    return ((cache.overrides || {})[themaId] || {})[itemId] || null;
  }

  async function zetOverride(themaId, itemId, velden) {
    if (!cache.overrides) cache.overrides = {};
    if (!cache.overrides[themaId]) cache.overrides[themaId] = {};
    const huidig = cache.overrides[themaId][itemId] || {};
    cache.overrides[themaId][itemId] = { ...huidig, ...velden };
    await bewaar();
  }

  async function verwijderOverride(themaId, itemId) {
    if (!cache.overrides || !cache.overrides[themaId]) return;
    delete cache.overrides[themaId][itemId];
    if (Object.keys(cache.overrides[themaId]).length === 0) {
      delete cache.overrides[themaId];
    }
    await bewaar();
  }

  async function verbergItem(themaId, itemId) {
    await zetOverride(themaId, itemId, { verborgen: true });
  }

  async function toonItem(themaId, itemId) {
    // Verberg-vlag weghalen, maar andere overrides behouden
    if (!cache.overrides || !cache.overrides[themaId] || !cache.overrides[themaId][itemId]) return;
    const huidig = cache.overrides[themaId][itemId];
    delete huidig.verborgen;
    if (Object.keys(huidig).length === 0) {
      delete cache.overrides[themaId][itemId];
      if (Object.keys(cache.overrides[themaId]).length === 0) {
        delete cache.overrides[themaId];
      }
    }
    await bewaar();
  }

  // ------------------- Mutaties: eigen items -------------------
  function _genereerEigenId() {
    return 'eigen-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  async function voegEigenItemToe(themaId, item) {
    if (!cache.eigen) cache.eigen = {};
    if (!cache.eigen[themaId]) cache.eigen[themaId] = [];
    const nieuw = { ...item, id: item.id || _genereerEigenId() };
    cache.eigen[themaId].push(nieuw);
    await bewaar();
    return nieuw;
  }

  async function wijzigEigenItem(themaId, itemId, velden) {
    const lijst = (cache.eigen || {})[themaId];
    if (!lijst) return;
    const idx = lijst.findIndex(it => it.id === itemId);
    if (idx === -1) return;
    lijst[idx] = { ...lijst[idx], ...velden, id: itemId };
    await bewaar();
  }

  async function verwijderEigenItem(themaId, itemId) {
    if (!cache.eigen || !cache.eigen[themaId]) return;
    cache.eigen[themaId] = cache.eigen[themaId].filter(it => it.id !== itemId);
    if (cache.eigen[themaId].length === 0) {
      delete cache.eigen[themaId];
    }
    await bewaar();
  }

  // ------------------- Voor leerkracht-overzicht -------------------
  // Geef alle items terug van een thema in een gestructureerde vorm,
  // inclusief metadata over of het basis/override/eigen/verborgen is.
  function geefVolledigOverzicht(thema) {
    if (!thema || !thema.items) return [];
    const themaOverrides = (cache.overrides || {})[thema.id] || {};
    const themaEigen = (cache.eigen || {})[thema.id] || [];

    const lijst = [];
    thema.items.forEach(basisItem => {
      const ov = themaOverrides[basisItem.id];
      if (ov && ov.verborgen) {
        lijst.push({ ...basisItem, _bron: 'verborgen', _origineel: { ...basisItem } });
      } else if (ov) {
        lijst.push({ ...basisItem, ...ov, _bron: 'override', _origineel: { ...basisItem } });
      } else {
        lijst.push({ ...basisItem, _bron: 'basis' });
      }
    });
    themaEigen.forEach(eigenItem => {
      lijst.push({ ...eigenItem, _bron: 'eigen' });
    });

    return lijst;
  }

  return {
    init,
    laad,
    pasToeOpThema,
    geefVolledigOverzicht,
    getOverride,
    zetOverride,
    verwijderOverride,
    verbergItem,
    toonItem,
    voegEigenItemToe,
    wijzigEigenItem,
    verwijderEigenItem
  };
})();
