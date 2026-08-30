// ============================================================================
// school-sessie.js — voorbereiding centrale aanmelding voor Taalgroei
//
// Het schoolportaal en Taalgroei staan op dezelfde website-origin. Wanneer
// Taalgroei via het portaal wordt geopend, herkent Firebase Auth daardoor de
// bestaande sessie. Er worden nooit wachtwoorden of toegangstokens via de URL
// doorgegeven.
// ============================================================================

(function () {
  const params = new URLSearchParams(window.location.search);
  const viaSchoolportaal = params.get('van') === 'schoolportaal';
  let gereedResolve;
  const gereed = new Promise(resolve => { gereedResolve = resolve; });

  const toestand = {
    gereed: false,
    viaSchoolportaal,
    aangemeld: false,
    gebruiker: null,
    rol: '',
    klassen: []
  };

  function toonStatus() {
    if (!toestand.aangemeld || !toestand.gebruiker) return;
    const header = document.querySelector('.lk-header');
    if (!header || document.getElementById('school-sessie-status')) return;

    const badge = document.createElement('div');
    badge.id = 'school-sessie-status';
    badge.className = 'school-sessie-status';
    const naam = toestand.gebruiker.email || 'schoolaccount';
    badge.innerHTML = '<span aria-hidden="true">✓</span><span><strong>Schoolaanmelding</strong><small></small></span>';
    badge.querySelector('small').textContent = naam;
    badge.title = toestand.rol ? `Aangemeld als ${toestand.rol}` : 'Aangemeld via het schoolportaal';
    header.appendChild(badge);
  }

  function toonAanmeldMelding() {
    if (!viaSchoolportaal || document.getElementById('school-sessie-melding')) return;
    const scherm = document.createElement('div');
    scherm.id = 'school-sessie-melding';
    scherm.className = 'school-sessie-melding';
    scherm.innerHTML = `
      <div class="school-sessie-kaart" role="alert">
        <div class="school-sessie-icoon">🔐</div>
        <h1>Je schoolaanmelding is niet meer actief</h1>
        <p>Ga terug naar het schoolportaal en meld je daar opnieuw aan. Daarna opent Taalgroei zonder een tweede wachtwoord.</p>
        <a href="../opvolging_huistaken/">Naar het schoolportaal</a>
      </div>`;
    document.body.appendChild(scherm);
  }

  async function laadSchoolContext(user) {
    toestand.gebruiker = { uid: user.uid, email: user.email || '', displayName: user.displayName || '' };
    toestand.aangemeld = true;

    if (!window.schoolDb) return;
    try {
      const email = String(user.email || '').toLowerCase();
      const rolRef = await window.schoolDb.collection('schoolrollen').doc(user.uid).get();
      toestand.rol = rolRef.exists ? String(rolRef.data().rol || '').toLowerCase() : '';

      const resultaten = await Promise.all([
        window.schoolDb.collection('klasleerkrachten').where('leerkracht_uids', 'array-contains', user.uid).get(),
        email
          ? window.schoolDb.collection('klasleerkrachten').where('leerkracht_emails', 'array-contains', email).get()
          : Promise.resolve(null)
      ]);
      const gezien = new Set();
      resultaten.filter(Boolean).forEach(snap => snap.forEach(doc => {
        if (gezien.has(doc.id)) return;
        gezien.add(doc.id);
        toestand.klassen.push({ id: doc.id, ...doc.data() });
      }));
    } catch (fout) {
      // De aanmelding is geldig, ook als bestaande Firestore-regels de extra
      // rol- of klascontext voorlopig nog niet toelaten.
      console.warn('[school-sessie] Schoolcontext nog niet volledig beschikbaar:', fout.message);
    }
  }

  window.SchoolSessie = {
    wachtTotKlaar: () => gereed,
    get: () => ({ ...toestand, klassen: [...toestand.klassen] }),
    isCentraalAangemeld: () => toestand.aangemeld
  };

  if (!window.schoolAuth) {
    toestand.gereed = true;
    gereedResolve(window.SchoolSessie.get());
    return;
  }

  window.schoolAuth.onAuthStateChanged(async user => {
    if (user) {
      await laadSchoolContext(user);
      toonStatus();
    } else {
      toestand.aangemeld = false;
      toestand.gebruiker = null;
      toonAanmeldMelding();
    }
    toestand.gereed = true;
    gereedResolve(window.SchoolSessie.get());
    window.dispatchEvent(new CustomEvent('taalgroei:schoolsessie', { detail: window.SchoolSessie.get() }));
  });
})();
