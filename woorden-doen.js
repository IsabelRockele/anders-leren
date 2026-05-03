// =================================================================
//  Thema: Wat doe ik? (werkwoorden) — NIEUW
//  Cruciaal voor zinsbouw — "ik + werkwoord"
// =================================================================
window.THEMA_WOORDEN_DOEN = {
  id: 'w-doen',
  type: 'woorden',
  naam: 'Wat doe ik?',
  emoji: '🏃',
  kleur: '#F77F00',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  categorieen: ['op-school', 'thuis', 'sociale-acties'],
  items: [
    // ========== BASIS — wat doe ik op school ==========
    { id: 'lopen',     niveau: 'basis', categorie: 'op-school', tekst: 'lopen',     kort: 'lopen',     beeld: '🚶', zin: 'Ik loop naar school.' },
    { id: 'zitten',    niveau: 'basis', categorie: 'op-school', tekst: 'zitten',    kort: 'zitten',    beeld: '🪑', zin: 'Ik zit op mijn stoel.' },
    { id: 'staan',     niveau: 'basis', categorie: 'op-school', tekst: 'staan',     kort: 'staan',     beeld: '🧍', zin: 'Ik sta in de rij.' },
    { id: 'kijken',    niveau: 'basis', categorie: 'op-school', tekst: 'kijken',    kort: 'kijken',    beeld: '👀', zin: 'Ik kijk naar het bord.' },
    { id: 'luisteren', niveau: 'basis', categorie: 'op-school', tekst: 'luisteren', kort: 'luisteren', beeld: '👂', zin: 'Ik luister naar de juf.' },
    { id: 'lezen',     niveau: 'basis', categorie: 'op-school', tekst: 'lezen',     kort: 'lezen',     beeld: '📖', zin: 'Ik lees een boek.' },
    { id: 'schrijven', niveau: 'basis', categorie: 'op-school', tekst: 'schrijven', kort: 'schrijven', beeld: '✍️', zin: 'Ik schrijf in mijn schrift.' },
    { id: 'praten',    niveau: 'basis', categorie: 'op-school', tekst: 'praten',    kort: 'praten',    beeld: '💬', zin: 'Ik praat Nederlands.' },
    { id: 'spelen',    niveau: 'basis', categorie: 'op-school', tekst: 'spelen',    kort: 'spelen',    beeld: '🎮', zin: 'Ik speel op de speelplaats.' },

    // ========== UITBREIDING — eten/drinken/slapen ==========
    { id: 'eten',      niveau: 'uitbreiding', categorie: 'thuis', tekst: 'eten',      kort: 'eten',      beeld: '🍽️', zin: 'Ik eet mijn boterham.' },
    { id: 'drinken',   niveau: 'uitbreiding', categorie: 'thuis', tekst: 'drinken',   kort: 'drinken',   beeld: '🥤', zin: 'Ik drink water.' },
    { id: 'slapen',    niveau: 'uitbreiding', categorie: 'thuis', tekst: 'slapen',    kort: 'slapen',    beeld: '😴', zin: 'Ik slaap in mijn bed.' },
    { id: 'wassen',    niveau: 'uitbreiding', categorie: 'thuis', tekst: 'wassen',    kort: 'wassen',    beeld: '🧼', zin: 'Ik was mijn handen.' },
    { id: 'tandenpoetsen', niveau: 'uitbreiding', categorie: 'thuis', tekst: 'tandenpoetsen', kort: 'tandenpoetsen', beeld: '🪥', zin: 'Ik poets mijn tanden.' },
    { id: 'zingen',    niveau: 'uitbreiding', categorie: 'op-school', tekst: 'zingen',    kort: 'zingen',    beeld: '🎤', zin: 'Wij zingen samen.' },
    { id: 'tekenen',   niveau: 'uitbreiding', categorie: 'op-school', tekst: 'tekenen',   kort: 'tekenen',   beeld: '🎨', zin: 'Ik teken een huis.' },
    { id: 'kleuren',   niveau: 'uitbreiding', categorie: 'op-school', tekst: 'kleuren',   kort: 'kleuren',   beeld: '🖍️', zin: 'Ik kleur de bloem rood.' },
    { id: 'knippen',   niveau: 'uitbreiding', categorie: 'op-school', tekst: 'knippen',   kort: 'knippen',   beeld: '✂️', zin: 'Ik knip met de schaar.' },
    { id: 'plakken',   niveau: 'uitbreiding', categorie: 'op-school', tekst: 'plakken',   kort: 'plakken',   beeld: '🧴', zin: 'Ik plak het blad in mijn schrift.' },

    // ========== VERDIEPING — sociale handelingen ==========
    { id: 'helpen',    niveau: 'verdieping', categorie: 'sociale-acties', tekst: 'helpen',     kort: 'helpen',     beeld: '🤝', zin: 'Ik help mijn vriend.' },
    { id: 'lachen',    niveau: 'verdieping', categorie: 'sociale-acties', tekst: 'lachen',     kort: 'lachen',     beeld: '😄', zin: 'Wij lachen samen.' },
    { id: 'huilen',    niveau: 'verdieping', categorie: 'sociale-acties', tekst: 'huilen',     kort: 'huilen',     beeld: '😭', zin: 'De baby huilt.' },
    { id: 'wachten',   niveau: 'verdieping', categorie: 'sociale-acties', tekst: 'wachten',    kort: 'wachten',    beeld: '⏳', zin: 'Ik wacht op mijn beurt.' },
    { id: 'rennen',    niveau: 'verdieping', categorie: 'op-school', tekst: 'rennen',     kort: 'rennen',     beeld: '🏃', zin: 'Ik ren over de speelplaats.' },
    { id: 'springen',  niveau: 'verdieping', categorie: 'op-school', tekst: 'springen',   kort: 'springen',   beeld: '🤸', zin: 'Ik spring over een touw.' },
    { id: 'dansen',    niveau: 'verdieping', categorie: 'sociale-acties', tekst: 'dansen',     kort: 'dansen',     beeld: '💃', zin: 'Wij dansen op muziek.' },
    { id: 'denken',    niveau: 'verdieping', categorie: 'op-school', tekst: 'denken',     kort: 'denken',     beeld: '🤔', zin: 'Ik denk goed na.' },
    { id: 'tellen',    niveau: 'verdieping', categorie: 'op-school', tekst: 'tellen',     kort: 'tellen',     beeld: '🔢', zin: 'Ik tel tot tien.' },
    { id: 'rekenen',   niveau: 'verdieping', categorie: 'op-school', tekst: 'rekenen',    kort: 'rekenen',    beeld: '🧮', zin: 'Ik reken goed.' },
  ]
};
