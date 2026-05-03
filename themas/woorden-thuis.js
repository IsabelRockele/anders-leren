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
  categorieen: ['kamers', 'meubels', 'keukenspullen'],
  items: [
    // ========== BASIS — kamers ==========
    { id: 'huis',      niveau: 'basis', categorie: 'kamers', tekst: 'het huis',      kort: 'huis',      beeld: '🏠', zin: 'Mijn huis is groot.' },
    { id: 'kamer',     niveau: 'basis', categorie: 'kamers', tekst: 'de kamer',      kort: 'kamer',     beeld: '🛏️', zin: 'Mijn kamer is mooi.' },
    { id: 'keuken',    niveau: 'basis', categorie: 'kamers', tekst: 'de keuken',     kort: 'keuken',    beeld: '🍳', zin: 'Mama kookt in de keuken.' },
    { id: 'badkamer',  niveau: 'basis', categorie: 'kamers', tekst: 'de badkamer',   kort: 'badkamer',  beeld: '🛁', zin: 'Ik was mij in de badkamer.' },
    { id: 'wc',        niveau: 'basis', categorie: 'kamers', tekst: 'het toilet',    kort: 'toilet',    beeld: '🚽', zin: 'Het toilet is naast de badkamer.' },
    { id: 'tuin',      niveau: 'basis', categorie: 'kamers', tekst: 'de tuin',       kort: 'tuin',      beeld: '🌳', zin: 'Ik speel in de tuin.' },
    { id: 'deur',      niveau: 'basis', categorie: 'meubels', tekst: 'de deur',       kort: 'deur',      beeld: '🚪', zin: 'Doe de deur open.' },
    { id: 'raam',      niveau: 'basis', categorie: 'meubels', tekst: 'het raam',      kort: 'raam',      beeld: '🪟', zin: 'Door het raam zie ik de tuin.' },

    // ========== UITBREIDING — meubels ==========
    { id: 'bed',       niveau: 'uitbreiding', categorie: 'meubels', tekst: 'het bed',        kort: 'bed',       beeld: '🛏️', zin: "'s Avonds slaap ik in mijn bed." },
    { id: 'tafel',     niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de tafel',       kort: 'tafel',     beeld: '🪑', zin: 'Wij eten aan de tafel.' },
    { id: 'kast',      niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de kast',        kort: 'kast',      beeld: '🗄️', zin: 'Mijn kleren zitten in de kast.' },
    { id: 'zetel',     niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de zetel',       kort: 'zetel',     beeld: '🛋️', zin: 'Ik zit op de zetel.' },
    { id: 'lamp',      niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de lamp',        kort: 'lamp',      beeld: '💡', zin: 'Doe de lamp aan.' },
    { id: 'tv',        niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de televisie',   kort: 'televisie', beeld: '📺', zin: 'Ik kijk televisie.' },
    { id: 'douche',    niveau: 'uitbreiding', categorie: 'meubels', tekst: 'de douche',      kort: 'douche',    beeld: '🚿', zin: 'Ik neem een douche.' },

    // ========== UITBREIDING — keuken ==========
    { id: 'fornuis',   niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'het fornuis',    kort: 'fornuis',   beeld: '🍳', zin: 'Mama kookt op het fornuis.' },
    { id: 'koelkast',  niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'de koelkast',    kort: 'koelkast',  beeld: '🧊', zin: 'De melk zit in de koelkast.' },
    { id: 'pan',       niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'de pan',         kort: 'pan',       beeld: '🍳', zin: 'In de pan ligt een eitje.' },
    { id: 'bord',      niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'het bord',       kort: 'bord',      beeld: '🍽️', zin: 'Mijn eten ligt op het bord.' },
    { id: 'glas',      niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'het glas',       kort: 'glas',      beeld: '🥛', zin: 'Ik drink uit een glas.' },
    { id: 'tas',       niveau: 'uitbreiding', categorie: 'keukenspullen', tekst: 'de tas',         kort: 'tas',       beeld: '☕', zin: 'Ik drink uit een tas.' },

    // ========== VERDIEPING ==========
    { id: 'sleutel',   niveau: 'verdieping', tekst: 'de sleutel',    kort: 'sleutel',   beeld: '🔑', zin: 'Ik open de deur met de sleutel.' },
    { id: 'klok',      niveau: 'verdieping', categorie: 'meubels', tekst: 'de klok',       kort: 'klok',      beeld: '🕐', zin: 'De klok hangt aan de muur.' },
    { id: 'speelgoed', niveau: 'verdieping', categorie: 'meubels', tekst: 'het speelgoed', kort: 'speelgoed', beeld: '🧸', zin: 'Mijn speelgoed staat op een rij.' },
    { id: 'computer',  niveau: 'verdieping', categorie: 'meubels', tekst: 'de computer',   kort: 'computer',  beeld: '💻', zin: 'Ik werk op de computer.' },
    { id: 'tablet',    niveau: 'verdieping', categorie: 'meubels', tekst: 'de tablet',     kort: 'tablet',    beeld: '📱', zin: 'Op mijn tablet leer ik Nederlands.' },
    { id: 'telefoon',  niveau: 'verdieping', categorie: 'meubels', tekst: 'de telefoon',   kort: 'telefoon',  beeld: '📞', zin: 'De telefoon rinkelt.' },
    { id: 'boekenrek', niveau: 'verdieping', categorie: 'meubels', tekst: 'het boekenrek', kort: 'boekenrek', beeld: '📚', zin: 'In het boekenrek staan veel boeken.' },
    { id: 'tapijt',    niveau: 'verdieping', categorie: 'meubels', tekst: 'het tapijt',    kort: 'tapijt',    beeld: '🟫', zin: 'Het tapijt ligt op de grond.' },
  ]
};
