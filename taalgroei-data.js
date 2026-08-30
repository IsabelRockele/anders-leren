// ============================================================================
// Veilige gegevenskeuze voor de Taalgroei-pilot.
//
// - Tot de centrale pilot geactiveerd is, blijft de bestaande Taalgroei-
//   database actief.
// - Na activatie gebruikt Taalgroei uitsluitend eigen, voorvoegde collecties
//   in het schoolproject. Andere schooltools en collecties worden nooit geraakt.
// ============================================================================

(function () {
  const PREFIX = 'taalgroei_';
  let centraleModus = false;

  function centraleFacade(firestore) {
    return {
      collection(naam) {
        return firestore.collection(PREFIX + naam);
      },
      runTransaction(werk) {
        return firestore.runTransaction(werk);
      },
      batch() {
        return firestore.batch();
      }
    };
  }

  async function init() {
    const legacy = window.legacyTaalgroeiDb || window.db || null;
    const centraal = window.schoolDb || null;
    if (!centraal) {
      window.db = legacy;
      return { centraal: false, reden: 'geen-schooldatabase' };
    }

    try {
      const marker = await centraal.collection('taalgroei_config').doc('pilot').get();
      centraleModus = marker.exists && marker.data().actief === true;
    } catch (fout) {
      console.warn('[TaalgroeiData] Pilotstatus niet leesbaar; bestaande database blijft actief.', fout.message);
      centraleModus = false;
    }

    window.db = centraleModus ? centraleFacade(centraal) : legacy;
    window.TAALGROEI_CENTRAAL = centraleModus;
    document.documentElement.dataset.taalgroeiData = centraleModus ? 'centraal' : 'legacy';
    return { centraal: centraleModus, reden: centraleModus ? 'pilot-actief' : 'pilot-niet-actief' };
  }

  function collectieNaam(bronNaam) {
    return PREFIX + bronNaam;
  }

  window.TaalgroeiData = {
    init,
    isCentraal: () => centraleModus,
    collectieNaam,
    prefix: PREFIX
  };
})();
