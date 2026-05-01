// =================================================================
//  Survival-thema: Speelplaats & buiten de klas
//  Wat het kind dagelijks meemaakt buiten de les: pauze, eten, spelen
// =================================================================
window.THEMA_SURVIVAL_SPEELPLAATS = {
  id: 's-speelplaats',
  type: 'gemengd',
  categorie: 'survival',
  naam: 'Speelplaats',
  emoji: '⚽',
  kleur: '#06A77D',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — speelplaats-actie ==========
    { id: 'ss-speelplaats',niveau: 'basis', soort: 'woord', tekst: 'de speelplaats',  kort: 'speelplaats', beeld: '🏃', zin: 'Wij gaan naar de speelplaats.' },
    { id: 'ss-pauze',      niveau: 'basis', soort: 'woord', tekst: 'de pauze',        kort: 'pauze',       beeld: '⏸️', zin: 'Het is pauze!' },
    { id: 'ss-speeltijd',  niveau: 'basis', soort: 'woord', tekst: 'de speeltijd',    kort: 'speeltijd',   beeld: '🎉', zin: 'Speeltijd is leuk.' },
    { id: 'ss-spelen',     niveau: 'basis', soort: 'woord', tekst: 'spelen',          kort: 'spelen',      beeld: '🎮', zin: 'Wij gaan spelen.' },
    { id: 'ss-bal',        niveau: 'basis', soort: 'woord', tekst: 'de bal',          kort: 'bal',         beeld: '⚽', zin: 'Geef de bal!' },
    { id: 'ss-vriend',     niveau: 'basis', soort: 'woord', tekst: 'de vriend',       kort: 'vriend',      beeld: '🤝', zin: 'Ali is mijn vriend.' },
    { id: 'ss-vriendin',   niveau: 'basis', soort: 'woord', tekst: 'de vriendin',     kort: 'vriendin',    beeld: '🤝', zin: 'Layla is mijn vriendin.' },
    { id: 'ss-rennen',     niveau: 'basis', soort: 'woord', tekst: 'rennen',          kort: 'rennen',      beeld: '🏃', zin: 'Ik ren snel.' },
    { id: 'ss-springen',   niveau: 'basis', soort: 'woord', tekst: 'springen',        kort: 'springen',    beeld: '🤸', zin: 'Wij springen touwtje.' },
    { id: 'ss-lopen',      niveau: 'basis', soort: 'woord', tekst: 'lopen',           kort: 'lopen',       beeld: '🚶', zin: 'Loop niet zo snel.' },

    // ========== UITBREIDING — eten & drinken op school ==========
    { id: 'ss-eetzaal',    niveau: 'uitbreiding', soort: 'woord', tekst: 'de eetzaal',      kort: 'eetzaal',      beeld: '🍽️', zin: 'In de eetzaal eten wij.' },
    { id: 'ss-refter',     niveau: 'uitbreiding', soort: 'woord', tekst: 'de refter',       kort: 'refter',       beeld: '🍽️', zin: 'Wij eten in de refter.' },
    { id: 'ss-brooddoos',  niveau: 'uitbreiding', soort: 'woord', tekst: 'de brooddoos',    kort: 'brooddoos',    beeld: '🥪', zin: 'Pak je brooddoos.' },
    { id: 'ss-drinkbus',   niveau: 'uitbreiding', soort: 'woord', tekst: 'de drinkbus',     kort: 'drinkbus',     beeld: '🍶', zin: 'Drink uit je drinkbus.' },
    { id: 'ss-eten',       niveau: 'uitbreiding', soort: 'woord', tekst: 'eten',            kort: 'eten',         beeld: '🍽️', zin: 'Tijd om te eten.' },
    { id: 'ss-drinken',    niveau: 'uitbreiding', soort: 'woord', tekst: 'drinken',         kort: 'drinken',      beeld: '🥤', zin: 'Vergeet niet te drinken.' },
    { id: 'ss-toilet',     niveau: 'uitbreiding', soort: 'woord', tekst: 'het toilet',      kort: 'toilet',       beeld: '🚽', zin: 'Ik ga naar het toilet.' },
    { id: 'ss-wassen',     niveau: 'uitbreiding', soort: 'woord', tekst: 'handen wassen',   kort: 'handen wassen',beeld: '🧼', zin: 'Was je handen.' },
    { id: 'ss-jas',        niveau: 'uitbreiding', soort: 'woord', tekst: 'de jas',          kort: 'jas',          beeld: '🧥', zin: 'Trek je jas aan.' },
    { id: 'ss-schoenen',   niveau: 'uitbreiding', soort: 'woord', tekst: 'de schoenen',     kort: 'schoenen',     beeld: '👟', zin: 'Trek je schoenen aan.' },

    // ========== UITBREIDING — zelf-zinnen ==========
    { id: 'ss-meespelen',  niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Mag ik meespelen?',         kort: 'meespelen',  beeld: '🙌', zin: 'Mag ik meespelen alstublieft?' },
    { id: 'ss-geefbal',    niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Geef de bal!',              kort: 'geef bal',   beeld: '⚽', zin: 'Hé, geef de bal!' },
    { id: 'ss-plassen',    niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Ik moet plassen.',          kort: 'plassen',    beeld: '🚽', zin: 'Juf, ik moet plassen.' },
    { id: 'ss-honger',     niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Ik heb honger.',            kort: 'honger',     beeld: '🍽️', zin: 'Ik heb honger.' },
    { id: 'ss-dorst',      niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Ik heb dorst.',             kort: 'dorst',      beeld: '💧', zin: 'Mag ik drinken? Ik heb dorst.' },

    // ========== VERDIEPING — sport & turnen ==========
    { id: 'ss-turnen',     niveau: 'verdieping', soort: 'woord', tekst: 'turnen',           kort: 'turnen',       beeld: '🤸', zin: 'Vandaag is er turnen.' },
    { id: 'ss-zwemmen',    niveau: 'verdieping', soort: 'woord', tekst: 'zwemmen',          kort: 'zwemmen',      beeld: '🏊', zin: 'Op vrijdag gaan wij zwemmen.' },
    { id: 'ss-voetballen', niveau: 'verdieping', soort: 'woord', tekst: 'voetballen',       kort: 'voetballen',   beeld: '⚽', zin: 'Wij voetballen op de speelplaats.' },
    { id: 'ss-tikkertje',  niveau: 'verdieping', soort: 'woord', tekst: 'tikkertje',        kort: 'tikkertje',    beeld: '🏃', zin: 'Wij spelen tikkertje.' },
    { id: 'ss-touwspringen',niveau: 'verdieping', soort: 'woord', tekst: 'touwspringen',    kort: 'touwspringen', beeld: '🤸', zin: 'Ik kan goed touwspringen.' },

    // ========== VERDIEPING — beweging & richting ==========
    { id: 'ss-binnen',     niveau: 'verdieping', soort: 'woord', tekst: 'naar binnen',      kort: 'naar binnen',  beeld: '🚪', zin: 'Iedereen naar binnen!' },
    { id: 'ss-buiten',     niveau: 'verdieping', soort: 'woord', tekst: 'naar buiten',      kort: 'naar buiten',  beeld: '🚪', zin: 'Wij gaan naar buiten.' },
    { id: 'ss-rij',        niveau: 'verdieping', soort: 'woord', tekst: 'in de rij',        kort: 'in de rij',    beeld: '🚶', zin: 'Ga in de rij staan.' },
    { id: 'ss-bel',        niveau: 'verdieping', soort: 'woord', tekst: 'de bel',           kort: 'bel',          beeld: '🔔', zin: 'De bel rinkelt.' },

    // ========== VERDIEPING — meer zelf-zinnen ==========
    { id: 'ss-wacht',      niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Wacht op mij!',             kort: 'wacht',         beeld: '⏳', zin: 'Wacht even op mij!' },
    { id: 'ss-mijnbeurt',  niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Mag ik meedoen?',           kort: 'mag meedoen',   beeld: '🙌', zin: 'Hé, mag ik meedoen?' },
    { id: 'ss-magmee',     niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Mag ik mee?',               kort: 'mag mee',       beeld: '🙋', zin: 'Mag ik mee voetballen?' },
    { id: 'ss-stop',       niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Stop, dat doet pijn!',      kort: 'stop pijn',     beeld: '🛑', zin: 'Stop, dat doet pijn!' },

    // ========== VERDIEPING — hoor-zinnen ==========
    { id: 'ss-binnen-z',   niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Iedereen naar binnen.',    kort: 'allen binnen',  beeld: '🚪', zin: 'Kinderen, iedereen naar binnen.' },
    { id: 'ss-rij-z',      niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Ga in de rij staan.',      kort: 'in rij staan',  beeld: '🚶', zin: 'Ga allemaal in de rij staan.' },
    { id: 'ss-jas-aan',    niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Trek je jas aan.',         kort: 'jas aan',       beeld: '🧥', zin: 'Trek je jas aan, het is koud.' },
  ]
};
