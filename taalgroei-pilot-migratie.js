// ============================================================================
// Eenmalige, niet-destructieve migratie naar de beveiligde schooldatabase.
// Alleen beschikbaar voor schoolbrede rollen. De brondata wordt nooit gewist.
// ============================================================================

(function () {
  const BRONCOLLECTIES = [
    'kinderen', 'instellingen', 'rapportperiodes',
    'rapporten', 'schooljaren', 'klastaken'
  ];
  const SCHOOLBREED = ['beheerder', 'directie', 'zorgcoordinator', 'zorgleerkracht'];

  function knopPlaatsen(context) {
    if (!context || !context.aangemeld || !SCHOOLBREED.includes(String(context.rol || '').toLowerCase())) return;
    if (document.getElementById('taalgroei-pilot-migratie')) return;
    const badge = document.getElementById('school-sessie-status');
    if (!badge) return;

    const knop = document.createElement('button');
    knop.id = 'taalgroei-pilot-migratie';
    knop.type = 'button';
    knop.className = 'taalgroei-pilot-knop';
    knop.textContent = window.TAALGROEI_CENTRAAL ? '🔒 Veilige pilot actief' : '🛡️ Veilige pilot activeren';
    knop.disabled = !!window.TAALGROEI_CENTRAAL;
    knop.onclick = startMigratie;
    badge.insertAdjacentElement('afterend', knop);
  }

  async function kopieerCollectie(bronNaam) {
    const bron = window.legacyTaalgroeiDb;
    const doel = window.schoolDb;
    const doelNaam = window.TaalgroeiData.collectieNaam(bronNaam);
    const snap = await bron.collection(bronNaam).get();
    let batch = doel.batch();
    let inBatch = 0;
    let aantal = 0;

    for (const doc of snap.docs) {
      batch.set(doel.collection(doelNaam).doc(doc.id), doc.data(), { merge: true });
      inBatch++;
      aantal++;
      if (inBatch >= 350) {
        await batch.commit();
        batch = doel.batch();
        inBatch = 0;
      }
    }
    if (inBatch > 0) await batch.commit();

    const controle = await doel.collection(doelNaam).get();
    if (controle.size < snap.size) {
      throw new Error(`${bronNaam}: ${snap.size} brondocumenten, maar slechts ${controle.size} veilig gekopieerd.`);
    }
    return { collectie: bronNaam, aantal };
  }

  async function startMigratie() {
    const knop = document.getElementById('taalgroei-pilot-migratie');
    if (!knop || knop.disabled) return;
    const akkoord = confirm(
      'Veilige Taalgroei-pilot activeren?\n\n' +
      'Alle bestaande Taalgroei-gegevens worden gekopieerd naar afzonderlijke taalgroei_* collecties in de schooldatabase. ' +
      'De oorspronkelijke gegevens worden NIET verwijderd. Andere schooltools en collecties worden niet gewijzigd.'
    );
    if (!akkoord) return;

    knop.disabled = true;
    knop.textContent = '⏳ Gegevens veilig kopiëren…';
    try {
      const resultaten = [];
      for (const naam of BRONCOLLECTIES) resultaten.push(await kopieerCollectie(naam));

      const sessie = window.SchoolSessie.get();
      await window.schoolDb.collection('taalgroei_config').doc('pilot').set({
        actief: true,
        versie: 1,
        geactiveerdOp: window.firebase.firestore.FieldValue.serverTimestamp(),
        geactiveerdDoorUid: sessie.gebruiker ? sessie.gebruiker.uid : '',
        bronProject: 'anders-leren-jufzisa',
        doelProject: 'huiswerkapp-a311e',
        bronBehouden: true,
        aantallen: resultaten.reduce((acc, item) => {
          acc[item.collectie] = item.aantal;
          return acc;
        }, {})
      }, { merge: true });

      knop.textContent = '✅ Veilige pilot geactiveerd';
      alert('De veilige Taalgroei-pilot is geactiveerd. De pagina wordt opnieuw geladen. De oude gegevens blijven als reserve bewaard.');
      location.reload();
    } catch (fout) {
      console.error('[Taalgroei pilot] Migratie mislukt:', fout);
      knop.disabled = false;
      knop.textContent = '🛡️ Veilige pilot opnieuw proberen';
      alert('De veilige kopie is niet volledig afgerond. Er is niets uit de oude omgeving verwijderd.\n\n' + (fout.message || fout));
    }
  }

  window.TaalgroeiPilotMigratie = { start: startMigratie, collecties: [...BRONCOLLECTIES] };
  window.addEventListener('taalgroei:schoolsessie', e => knopPlaatsen(e.detail));
  document.addEventListener('DOMContentLoaded', async () => {
    if (!window.SchoolSessie) return;
    const context = await window.SchoolSessie.wachtTotKlaar();
    knopPlaatsen(context);
  });
})();
