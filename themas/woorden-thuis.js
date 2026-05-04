// =================================================================
//  Thema: Thuis (woorden) — herwerkt
//  Alles op niveau 'basis'. Categorieën:
//    kamers, meubels, toestellen, andere
// =================================================================
window.THEMA_WOORDEN_THUIS = {
  id: 'w-thuis',
  type: 'woorden',
  naam: 'Thuis',
  emoji: '🏠',
  kleur: '#8338EC',
  niveaus: ['basis'],
  categorieen: ['kamers', 'meubels', 'toestellen', 'andere'],
  items: [
    // ========== KAMERS ==========
    { id: 'slaapkamer', niveau: 'basis', categorie: 'kamers', tekst: 'de slaapkamer', kort: 'slaapkamer', beeld: '🛏️', zin: "'s Avonds ga ik naar mijn slaapkamer." },
    { id: 'badkamer',   niveau: 'basis', categorie: 'kamers', tekst: 'de badkamer',   kort: 'badkamer',   beeld: '🛁', zin: 'Ik was mij in de badkamer.' },
    { id: 'keuken',     niveau: 'basis', categorie: 'kamers', tekst: 'de keuken',     kort: 'keuken',     beeld: '🍳', zin: 'Mama kookt in de keuken.' },
    { id: 'woonkamer',  niveau: 'basis', categorie: 'kamers', tekst: 'de woonkamer',  kort: 'woonkamer',  beeld: '🛋️', zin: "'s Avonds zitten wij samen in de woonkamer." },
    { id: 'zolder',     niveau: 'basis', categorie: 'kamers', tekst: 'de zolder',     kort: 'zolder',     beeld: '🏠', zin: 'Op zolder staan oude dozen.' },
    { id: 'kelder',     niveau: 'basis', categorie: 'kamers', tekst: 'de kelder',     kort: 'kelder',     beeld: '🏠', zin: 'In de kelder is het koud en donker.' },
    { id: 'toilet',     niveau: 'basis', categorie: 'kamers', tekst: 'het toilet',    kort: 'toilet',     beeld: '🚽', zin: 'Het toilet is naast de badkamer.' },

    // ========== MEUBELS ==========
    { id: 'kast',     niveau: 'basis', categorie: 'meubels', tekst: 'de kast',     kort: 'kast',     beeld: '🗄️', zin: 'Mijn kleren zitten in de kast.' },
    { id: 'zetel',    niveau: 'basis', categorie: 'meubels', tekst: 'de zetel',    kort: 'zetel',    beeld: '🛋️', zin: 'Ik zit op de zetel.' },
    { id: 'stoel',    niveau: 'basis', categorie: 'meubels', tekst: 'de stoel',    kort: 'stoel',    beeld: '🪑', zin: 'Ga op je stoel zitten.' },
    { id: 'tafel',    niveau: 'basis', categorie: 'meubels', tekst: 'de tafel',    kort: 'tafel',    beeld: '🪑', zin: 'Wij eten aan de tafel.' },
    { id: 'bed',      niveau: 'basis', categorie: 'meubels', tekst: 'het bed',     kort: 'bed',      beeld: '🛏️', zin: "'s Avonds slaap ik in mijn bed." },
     { id: 'douche',      niveau: 'basis', categorie: 'andere', tekst: 'de douche',      kort: 'douche',      beeld: '🚿', zin: 'Ik neem een douche.' },
    { id: 'bad',         niveau: 'basis', categorie: 'andere', tekst: 'het bad',        kort: 'bad',         beeld: '🛁', zin: 'Het bad zit vol warm water.' },
    { id: 'lamp',     niveau: 'basis', categorie: 'meubels', tekst: 'de lamp',     kort: 'lamp',     beeld: '💡', zin: 'Doe de lamp aan.' },
    { id: 'wastafel', niveau: 'basis', categorie: 'meubels', tekst: 'de wastafel', kort: 'wastafel', beeld: '🚰', zin: 'Ik was mijn handen aan de wastafel.' },

    // ========== TOESTELLEN ==========
    { id: 'koelkast',  niveau: 'basis', categorie: 'toestellen', tekst: 'de koelkast',  kort: 'koelkast',  beeld: '🧊', zin: 'De melk zit in de koelkast.' },
    { id: 'fornuis',   niveau: 'basis', categorie: 'toestellen', tekst: 'het fornuis',  kort: 'fornuis',   beeld: '🍳', zin: 'Mama kookt op het fornuis.' },
    { id: 'televisie', niveau: 'basis', categorie: 'toestellen', tekst: 'de televisie', kort: 'televisie', beeld: '📺', zin: 'Ik kijk televisie.' },
    { id: 'computer',  niveau: 'basis', categorie: 'toestellen', tekst: 'de computer',  kort: 'computer',  beeld: '💻', zin: 'Ik werk op de computer.' },
    { id: 'tablet',    niveau: 'basis', categorie: 'toestellen', tekst: 'de tablet',    kort: 'tablet',    beeld: '📱', zin: 'Op mijn tablet leer ik Nederlands.' },
    { id: 'gsm',       niveau: 'basis', categorie: 'toestellen', tekst: 'de gsm',       kort: 'gsm',       beeld: '📱', zin: 'Mama belt met haar gsm.' },

    // ========== ANDERE ==========
    { id: 'tapijt',      niveau: 'basis', categorie: 'andere', tekst: 'het tapijt',     kort: 'tapijt',      beeld: '🟫', zin: 'Het tapijt ligt op de grond.' },
    { id: 'spiegel',     niveau: 'basis', categorie: 'andere', tekst: 'de spiegel',     kort: 'spiegel',     beeld: '🪞', zin: 'Ik kijk in de spiegel.' },
    { id: 'deur',        niveau: 'basis', categorie: 'andere', tekst: 'de deur',        kort: 'deur',        beeld: '🚪', zin: 'Doe de deur open.' },
    { id: 'raam',        niveau: 'basis', categorie: 'andere', tekst: 'het raam',       kort: 'raam',        beeld: '🪟', zin: 'Door het raam zie ik de tuin.' },
    { id: 'brievenbus',  niveau: 'basis', categorie: 'andere', tekst: 'de brievenbus',  kort: 'brievenbus',  beeld: '📮', zin: 'De post zit in de brievenbus.' },
  ]
};