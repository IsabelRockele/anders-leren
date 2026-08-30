// ============================================================================
// centrale-klaslijsten.js — leerlingen 2026-2027 vanuit het schoolportaal
// ============================================================================

window.CentraleKlaslijsten = (function () {
  const SCHOOLJAAR = '2026-2027';
  const BREDE_ROLLEN = new Set(['beheerder', 'directie', 'zorgcoordinator', 'zorgleerkracht']);
  let klassen = {};
  let geladen = false;
  let bezig = false;

  const veilig = waarde => String(waarde == null ? '' : waarde)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const naamSleutel = waarde => String(waarde || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  async function maakKoppelHash(student) {
    const invoer = `${SCHOOLJAAR}|${student.centraleLeerlingId}`;
    const bytes = new TextEncoder().encode(invoer);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function voegHashesToe(lijst) {
    await Promise.all(lijst.map(async student => { student.centraleKoppelHash = await maakKoppelHash(student); }));
    return lijst;
  }

  function leerlingId(raw, klas, index) {
    return String(raw.id || raw.leerlingId || `${klas}-${naamSleutel(volledigeNaam(raw))}-${index}`);
  }
  function volledigeNaam(raw) {
    const voor = raw.first || raw.firstName || raw.voornaam || '';
    const achter = raw.last || raw.lastName || raw.achternaam || '';
    return [voor, achter].filter(Boolean).join(' ').trim() || String(raw.naam || raw.name || '').trim();
  }
  function normaliseerLeerling(raw, klas, index) {
    const naam = volledigeNaam(raw);
    let voornaam = String(raw.first || raw.firstName || raw.voornaam || '').trim();
    let achternaam = String(raw.last || raw.lastName || raw.achternaam || '').trim();
    if (!voornaam && naam) {
      const delen = naam.split(/\s+/);
      voornaam = delen.shift() || '';
      achternaam = delen.join(' ');
    }
    return {
      centraleLeerlingId: leerlingId(raw, klas, index),
      voornaam,
      achternaam,
      naam: naam || 'Naam ontbreekt',
      klas,
      start: raw.start || raw.startDatum || '',
      einde: raw.end || raw.eindDatum || '',
      raw
    };
  }
  function actiefInSchooljaar(s) {
    return (!s.start || s.start <= '2027-06-30') && (!s.einde || s.einde >= '2026-09-01');
  }
  function eigenKlassen(sessie) {
    const set = new Set();
    (sessie.klassen || []).forEach(koppeling => {
      const jaar = String(koppeling.schooljaar || SCHOOLJAAR);
      const klas = String(koppeling.klas || koppeling.klasId || '').trim();
      if (klas && jaar === SCHOOLJAAR) set.add(klas);
    });
    return [...set];
  }
  function vergelijkKlassen(a, b) {
    return String(a).localeCompare(String(b), 'nl', { numeric: true, sensitivity: 'base' });
  }
  function gekoppeldKind(student) {
    const centraal = (lkKinderen || []).find(k =>
      String(k.centraleKoppelHash || '') === student.centraleKoppelHash &&
      (!k.centraleSchooljaar || k.centraleSchooljaar === SCHOOLJAAR));
    if (centraal) return centraal;
    const sleutel = naamSleutel(student.naam);
    return (lkKinderen || []).find(k =>
      naamSleutel(lkVolledigeNaam(k)) === sleutel && String(k.klas || '') === student.klas) || null;
  }

  async function laad() {
    const vak = document.getElementById('centrale-klaslijsten-inhoud');
    if (!vak || bezig) return;
    bezig = true;
    vak.innerHTML = '<p class="ckl-status">⏳ Klaslijsten 2026-2027 laden…</p>';
    try {
      const sessie = window.SchoolSessie ? await SchoolSessie.wachtTotKlaar() : null;
      if (!sessie || !sessie.aangemeld || !window.schoolDb) {
        vak.innerHTML = '<div class="ckl-melding">Open Taalgroei vanuit het schoolportaal om de centrale klaslijsten te gebruiken.</div>';
        return;
      }

      klassen = {};
      const rol = String(sessie.rol || '').toLowerCase();
      if (BREDE_ROLLEN.has(rol)) {
        const snap = await window.schoolDb.collection('schoolbeheer').doc(SCHOOLJAAR).collection('klassen').get();
        snap.forEach(doc => {
          const data = doc.data() || {};
          klassen[doc.id] = (Array.isArray(data.leerlingen) ? data.leerlingen : [])
            .map((s, i) => normaliseerLeerling(s, doc.id, i)).filter(actiefInSchooljaar);
        });
        await Promise.all(Object.values(klassen).map(voegHashesToe));
      } else {
        const ids = eigenKlassen(sessie);
        if (!ids.length) throw new Error('Aan dit schoolaccount is voor 2026-2027 nog geen klas gekoppeld.');
        const snaps = await Promise.all(ids.map(id =>
          window.schoolDb.collection('schoolbeheer').doc(SCHOOLJAAR).collection('klassen').doc(id).get()));
        snaps.forEach((snap, index) => {
          const id = ids[index], data = snap.exists ? snap.data() : {};
          klassen[id] = (Array.isArray(data.leerlingen) ? data.leerlingen : [])
            .map((s, i) => normaliseerLeerling(s, id, i)).filter(actiefInSchooljaar);
        });
        await Promise.all(Object.values(klassen).map(voegHashesToe));
      }
      geladen = true;
      verrijkTaalgroeiKinderen(lkKinderen || []);
      render();
    } catch (fout) {
      console.error('[centrale-klaslijsten] Laden mislukt:', fout);
      vak.innerHTML = `<div class="ckl-melding fout"><strong>Klaslijsten konden niet worden geladen.</strong><br>${veilig(fout.message || 'Controleer de schoolaanmelding en toegangsrechten.')}</div>`;
    } finally {
      bezig = false;
    }
  }

  function render() {
    const vak = document.getElementById('centrale-klaslijsten-inhoud');
    if (!vak) return;
    if (!geladen) { laad(); return; }
    const ids = Object.keys(klassen).sort(vergelijkKlassen);
    const totaal = ids.reduce((som, id) => som + klassen[id].length, 0);
    if (!totaal) {
      vak.innerHTML = '<div class="ckl-melding">Er staan nog geen actieve leerlingen in de bereikbare klaslijsten van 2026-2027.</div>';
      return;
    }
    vak.innerHTML = `
      <div class="ckl-werkbalk">
        <div><strong>${totaal} leerlingen gevonden</strong><span>${ids.length} klas${ids.length === 1 ? '' : 'sen'} · centrale schoollijst</span></div>
        <div class="ckl-acties"><button class="lk-knop-mini" onclick="CentraleKlaslijsten.kiesAlles(true)">Alles kiezen</button><button class="lk-knop-mini" onclick="CentraleKlaslijsten.kiesAlles(false)">Niets kiezen</button></div>
      </div>
      <div class="ckl-klassen">${ids.map(klas => `
        <section class="ckl-klas">
          <h3>${veilig(klas)} <span>${klassen[klas].length}</span></h3>
          <div class="ckl-leerlingen">${klassen[klas].sort((a,b)=>a.naam.localeCompare(b.naam,'nl')).map(student => {
            const bestaand = gekoppeldKind(student);
            const echtGekoppeld = bestaand && String(bestaand.centraleKoppelHash || '') === student.centraleKoppelHash;
            return `<label class="ckl-leerling ${echtGekoppeld ? 'gekoppeld' : ''}">
              <input type="checkbox" data-centraal-id="${veilig(student.centraleLeerlingId)}" data-klas="${veilig(klas)}" ${echtGekoppeld ? 'checked disabled' : ''}>
              <span><strong>${veilig(student.naam)}</strong><small>${echtGekoppeld ? `✓ in Taalgroei · ${veilig(bestaand.code)}` : (bestaand ? 'bestaande leerling wordt veilig gekoppeld' : 'nog toevoegen')}</small></span>
            </label>`;
          }).join('')}</div>
        </section>`).join('')}</div>
      <div class="ckl-onderbalk">
        <span id="ckl-keuze-status">Vink leerlingen aan die Taalgroei nodig hebben.</span>
        <button id="ckl-importeer" class="lk-knop-mini primair" onclick="CentraleKlaslijsten.voegGeselecteerdeToe()">＋ Geselecteerde leerlingen toevoegen</button>
      </div>`;
    vak.querySelectorAll('input[data-centraal-id]').forEach(input => input.addEventListener('change', werkKeuzeStatusBij));
    werkKeuzeStatusBij();
  }

  function kiesAlles(aan) {
    document.querySelectorAll('#centrale-klaslijsten-inhoud input[data-centraal-id]:not(:disabled)')
      .forEach(input => { input.checked = aan; });
    werkKeuzeStatusBij();
  }
  function werkKeuzeStatusBij() {
    const aantal = document.querySelectorAll('#centrale-klaslijsten-inhoud input[data-centraal-id]:checked:not(:disabled)').length;
    const status = document.getElementById('ckl-keuze-status');
    if (status) status.textContent = aantal ? `${aantal} leerling${aantal === 1 ? '' : 'en'} gekozen` : 'Vink leerlingen aan die Taalgroei nodig hebben.';
  }
  function vindCentraal(id, klas) {
    return (klassen[klas] || []).find(s => s.centraleLeerlingId === id) || null;
  }
  async function uniekeCode(gereserveerd) {
    const tekens = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let poging = 0; poging < 30; poging++) {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      const code = 'TAAL-' + [...bytes].map(b => tekens[b % tekens.length]).join('');
      if (!gereserveerd.has(code) && !(await Voortgang.codeBestaat(code))) return code;
    }
    throw new Error('Er kon geen unieke leerlingcode worden gemaakt. Probeer opnieuw.');
  }
  async function zorgVoorSchooljaar(codesMetKlas) {
    const jaren = await Voortgang.alleSchooljaren();
    let doel = jaren.find(j => j.id === SCHOOLJAAR);
    if (!doel) doel = await Voortgang.maakSchooljaar(SCHOOLJAAR, { kinderen: [], klasPerKind: {} });
    const codes = new Set(Array.isArray(doel.kinderen) ? doel.kinderen : []);
    const klasPerKind = { ...(doel.klasPerKind || {}) };
    codesMetKlas.forEach(({ code, klas }) => { codes.add(code); klasPerKind[code] = klas; });
    await Voortgang.updateSchooljaarKinderen(SCHOOLJAAR, [...codes], klasPerKind);
  }

  async function voegGeselecteerdeToe() {
    const selecties = [...document.querySelectorAll('#centrale-klaslijsten-inhoud input[data-centraal-id]:checked:not(:disabled)')];
    if (!selecties.length) return alert('Vink eerst minstens één leerling aan.');
    const knop = document.getElementById('ckl-importeer');
    if (knop) { knop.disabled = true; knop.textContent = '⏳ Bezig…'; }
    try {
      // Ook leerlingen uit een ander Taalgroei-schooljaar meenemen in de
      // duplicaatcontrole, niet alleen wat nu in de tabel gefilterd staat.
      const alleTaalgroei = await Voortgang.alleKinderen();
      const gereserveerd = new Set(alleTaalgroei.map(k => k.code));
      const gekoppeld = [];
      let nieuw = 0, bestaand = 0;

      for (const keuze of selecties) {
        const student = vindCentraal(keuze.dataset.centraalId, keuze.dataset.klas);
        if (!student) continue;
        let kind = alleTaalgroei.find(k => String(k.centraleKoppelHash || '') === student.centraleKoppelHash);
        if (!kind) {
          const sleutel = naamSleutel(student.naam);
          kind = alleTaalgroei.find(k => naamSleutel(lkVolledigeNaam(k)) === sleutel && String(k.klas || '') === student.klas);
        }
        if (kind) {
          await Voortgang.koppelCentraleLeerling(kind.code, { centraleKoppelHash: student.centraleKoppelHash, klas: student.klas, centraleSchooljaar: SCHOOLJAAR });
          bestaand++;
        } else {
          const code = await uniekeCode(gereserveerd);
          gereserveerd.add(code);
          await Voortgang.maakKind(code, {
            voornaam: '',
            achternaam: '',
            klas: student.klas,
            centraleKoppelHash: student.centraleKoppelHash,
            centraleSchooljaar: SCHOOLJAAR,
            bron: 'schoolportaal'
          });
          kind = { code };
          nieuw++;
        }
        gekoppeld.push({ code: kind.code, klas: student.klas });
      }

      await zorgVoorSchooljaar(gekoppeld);
      await lkSchooljarenInit();
      const doelJaar = (_schooljaren || []).find(j => j.id === SCHOOLJAAR);
      if (doelJaar) _actiefSchooljaar = doelJaar;
      if (typeof _lkSchooljaarBalkRenderer === 'function') _lkSchooljaarBalkRenderer();
      await lkLaadKinderen();
      verrijkTaalgroeiKinderen(lkKinderen || []);
      lkRendererTabel();
      if (typeof lkKindtabsRender === 'function') lkKindtabsRender();
      render();
      if (window.Taalgroei) Taalgroei.render();
      alert(`${nieuw} nieuwe leerling${nieuw === 1 ? '' : 'en'} toegevoegd en ${bestaand} bestaande leerling${bestaand === 1 ? '' : 'en'} gekoppeld. Je kunt hen nu kiezen voor groepen en taken.`);
    } catch (fout) {
      console.error('[centrale-klaslijsten] Koppelen mislukt:', fout);
      alert('Koppelen is niet volledig gelukt: ' + (fout.message || 'onbekende fout'));
    } finally {
      if (knop) { knop.disabled = false; knop.textContent = '＋ Geselecteerde leerlingen toevoegen'; }
    }
  }

  async function init() {
    if (!document.getElementById('centrale-klaslijsten-inhoud')) return;
    if (geladen) { render(); return; }
    await laad();
  }
  function verrijkTaalgroeiKinderen(lijst) {
    if (!geladen || !Array.isArray(lijst)) return lijst;
    const perHash = new Map(Object.values(klassen).flat().map(student => [student.centraleKoppelHash, student]));
    lijst.forEach(kind => {
      const student = perHash.get(String(kind.centraleKoppelHash || ''));
      if (!student) return;
      // Alleen het lokale schermbeeld verrijken. Deze naam wordt niet naar de
      // afzonderlijke Taalgroei-databank teruggeschreven.
      kind.voornaam = student.voornaam;
      kind.achternaam = student.achternaam;
      kind.naam = student.naam;
      kind.klas = student.klas;
    });
    return lijst;
  }
  window.addEventListener('taalgroei:schoolsessie', init);
  document.addEventListener('DOMContentLoaded', init);

  return { init, laad, render, kiesAlles, voegGeselecteerdeToe, verrijkTaalgroeiKinderen, schooljaar: SCHOOLJAAR };
})();
