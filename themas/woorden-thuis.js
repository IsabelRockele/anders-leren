// =================================================================
//  Thema: Thuis (woorden) — NIEUW
//  Thuiscontext nodig voor ouder-track ook
// =================================================================
window.THEMA_WOORDEN_THUIS = {
  id: 'w-thuis',
  type: 'woorden',
  naam: 'Thuis',
  emoji: '🏠',
  kleur: '#8338EC',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — kamers ==========
    { id: 'huis',      niveau: 'basis', tekst: 'het huis',      kort: 'huis',      beeld: '🏠', zin: 'Mijn huis is groot.' },
    { id: 'kamer',     niveau: 'basis', tekst: 'de kamer',      kort: 'kamer',     beeld: '🛏️', zin: 'Mijn kamer is mooi.' },
    { id: 'keuken',    niveau: 'basis', tekst: 'de keuken',     kort: 'keuken',    beeld: '🍳', zin: 'Mama kookt in de keuken.' },
    { id: 'badkamer',  niveau: 'basis', tekst: 'de badkamer',   kort: 'badkamer',  beeld: '🛁', zin: 'Ik was mij in de badkamer.' },
    { id: 'wc',        niveau: 'basis', tekst: 'het toilet',    kort: 'toilet',    beeld: '🚽', zin: 'Het toilet is naast de badkamer.' },
    { id: 'tuin',      niveau: 'basis', tekst: 'de tuin',       kort: 'tuin',      beeld: '🌳', zin: 'Ik speel in de tuin.' },
    { id: 'deur',      niveau: 'basis', tekst: 'de deur',       kort: 'deur',      beeld: '🚪', zin: 'Doe de deur open.' },
    { id: 'raam',      niveau: 'basis', tekst: 'het raam',      kort: 'raam',      beeld: '🪟', zin: 'Door het raam zie ik de tuin.' },

    // ========== UITBREIDING — meubels ==========
    { id: 'bed',       niveau: 'uitbreiding', tekst: 'het bed',        kort: 'bed',       beeld: '🛏️', zin: "'s Avonds slaap ik in mijn bed." },
    { id: 'tafel',     niveau: 'uitbreiding', tekst: 'de tafel',       kort: 'tafel',     beeld: '🪑', zin: 'Wij eten aan de tafel.' },
    { id: 'kast',      niveau: 'uitbreiding', tekst: 'de kast',        kort: 'kast',      beeld: '🗄️', zin: 'Mijn kleren zitten in de kast.' },
    { id: 'zetel',     niveau: 'uitbreiding', tekst: 'de zetel',       kort: 'zetel',     beeld: '🛋️', zin: 'Ik zit op de zetel.' },
    { id: 'lamp',      niveau: 'uitbreiding', tekst: 'de lamp',        kort: 'lamp',      beeld: '💡', zin: 'Doe de lamp aan.' },
    { id: 'tv',        niveau: 'uitbreiding', tekst: 'de televisie',   kort: 'televisie', beeld: '📺', zin: 'Ik kijk televisie.' },
    { id: 'douche',    niveau: 'uitbreiding', tekst: 'de douche',      kort: 'douche',    beeld: '🚿', zin: 'Ik neem een douche.' },

    // ========== UITBREIDING — keuken ==========
    { id: 'fornuis',   niveau: 'uitbreiding', tekst: 'het fornuis',    kort: 'fornuis',   beeld: '🍳', zin: 'Mama kookt op het fornuis.' },
    { id: 'koelkast',  niveau: 'uitbreiding', tekst: 'de koelkast',    kort: 'koelkast',  beeld: '🧊', zin: 'De melk zit in de koelkast.' },
    { id: 'pan',       niveau: 'uitbreiding', tekst: 'de pan',         kort: 'pan',       beeld: '🍳', zin: 'In de pan ligt een eitje.' },
    { id: 'bord',      niveau: 'uitbreiding', tekst: 'het bord',       kort: 'bord',      beeld: '🍽️', zin: 'Mijn eten ligt op het bord.' },
    { id: 'glas',      niveau: 'uitbreiding', tekst: 'het glas',       kort: 'glas',      beeld: '🥛', zin: 'Ik drink uit een glas.' },
    { id: 'tas',       niveau: 'uitbreiding', tekst: 'de tas',         kort: 'tas',       beeld: '☕', zin: 'Ik drink uit een tas.' },

    // ========== VERDIEPING ==========
    { id: 'sleutel',   niveau: 'verdieping', tekst: 'de sleutel',    kort: 'sleutel',   beeld: '🔑', zin: 'Ik open de deur met de sleutel.' },
    { id: 'klok',      niveau: 'verdieping', tekst: 'de klok',       kort: 'klok',      beeld: '🕐', zin: 'De klok hangt aan de muur.' },
    { id: 'speelgoed', niveau: 'verdieping', tekst: 'het speelgoed', kort: 'speelgoed', beeld: '🧸', zin: 'Mijn speelgoed staat op een rij.' },
    { id: 'computer',  niveau: 'verdieping', tekst: 'de computer',   kort: 'computer',  beeld: '💻', zin: 'Ik werk op de computer.' },
    { id: 'tablet',    niveau: 'verdieping', tekst: 'de tablet',     kort: 'tablet',    beeld: '📱', zin: 'Op mijn tablet leer ik Nederlands.' },
    { id: 'telefoon',  niveau: 'verdieping', tekst: 'de telefoon',   kort: 'telefoon',  beeld: '📞', zin: 'De telefoon rinkelt.' },
    { id: 'boekenrek', niveau: 'verdieping', tekst: 'het boekenrek', kort: 'boekenrek', beeld: '📚', zin: 'In het boekenrek staan veel boeken.' },
    { id: 'tapijt',    niveau: 'verdieping', tekst: 'het tapijt',    kort: 'tapijt',    beeld: '🟫', zin: 'Het tapijt ligt op de grond.' },
  ]
};
