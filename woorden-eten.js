// =================================================================
//  Thema: Eten & drinken (woorden) — uitgebreid, Vlaamse context
// =================================================================
window.THEMA_WOORDEN_ETEN = {
  id: 'w-eten',
  type: 'woorden',
  naam: 'Eten & drinken',
  emoji: '🍎',
  kleur: '#06A77D',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  categorieen: ['eten', 'drinken', 'bestek'],
  items: [
    // ========== BASIS — wat in een brooddoos zit ==========
    { id: 'brood',  niveau: 'basis', categorie: 'eten', tekst: 'het brood',  kort: 'brood',  beeld: '🍞', zin: 'Ik eet brood met kaas.' },
    { id: 'boterham',niveau: 'basis', categorie: 'eten', tekst: 'de boterham',kort: 'boterham',beeld: '🥪', zin: 'Mijn boterham is met choco.' },
    { id: 'kaas',   niveau: 'basis', categorie: 'eten', tekst: 'de kaas',    kort: 'kaas',   beeld: '🧀', zin: 'Ik hou van kaas.' },
    { id: 'appel',  niveau: 'basis', categorie: 'eten', tekst: 'de appel',   kort: 'appel',  beeld: '🍎', zin: 'Ik eet een appel.' },
    { id: 'banaan', niveau: 'basis', categorie: 'eten', tekst: 'de banaan',  kort: 'banaan', beeld: '🍌', zin: 'De banaan is geel.' },
    { id: 'koek',   niveau: 'basis', categorie: 'eten', tekst: 'de koek',    kort: 'koek',   beeld: '🍪', zin: 'Ik eet een koek.' },
    { id: 'water',  niveau: 'basis', categorie: 'drinken', tekst: 'het water',  kort: 'water',  beeld: '💧', zin: 'Ik drink water.' },
    { id: 'melk',   niveau: 'basis', categorie: 'drinken', tekst: 'de melk',    kort: 'melk',   beeld: '🥛', zin: 'Ik drink melk.' },

    // ========== UITBREIDING — warme maaltijd ==========
    { id: 'soep',   niveau: 'uitbreiding', categorie: 'eten', tekst: 'de soep',    kort: 'soep',   beeld: '🍲', zin: 'De soep is warm.' },
    { id: 'patat',  niveau: 'uitbreiding', categorie: 'eten', tekst: 'de patatten',kort: 'patatten',beeld: '🥔', zin: 'Ik eet patatten met saus.' },
    { id: 'frieten',niveau: 'uitbreiding', categorie: 'eten', tekst: 'de frieten', kort: 'frieten',beeld: '🍟', zin: 'Op zondag eten wij frieten.' },
    { id: 'rijst',  niveau: 'uitbreiding', categorie: 'eten', tekst: 'de rijst',   kort: 'rijst',  beeld: '🍚', zin: 'Ik eet rijst met groenten.' },
    { id: 'pasta',  niveau: 'uitbreiding', categorie: 'eten', tekst: 'de pasta',   kort: 'pasta',  beeld: '🍝', zin: 'Pasta is mijn lievelingseten.' },
    { id: 'vlees',  niveau: 'uitbreiding', categorie: 'eten', tekst: 'het vlees',  kort: 'vlees',  beeld: '🍖', zin: 'Het vlees is lekker.' },
    { id: 'vis',    niveau: 'uitbreiding', categorie: 'eten', tekst: 'de vis',     kort: 'vis',    beeld: '🐟', zin: 'Op vrijdag eten wij vis.' },
    { id: 'ei',     niveau: 'uitbreiding', categorie: 'eten', tekst: 'het ei',     kort: 'ei',     beeld: '🥚', zin: 'Ik eet een ei.' },

    // ========== UITBREIDING — fruit & groenten ==========
    { id: 'tomaat', niveau: 'uitbreiding', categorie: 'eten', tekst: 'de tomaat',  kort: 'tomaat', beeld: '🍅', zin: 'De tomaat is rood.' },
    { id: 'wortel', niveau: 'uitbreiding', categorie: 'eten', tekst: 'de wortel',  kort: 'wortel', beeld: '🥕', zin: 'Een konijn eet wortels.' },
    { id: 'peer',   niveau: 'uitbreiding', categorie: 'eten', tekst: 'de peer',    kort: 'peer',   beeld: '🍐', zin: 'De peer is zoet.' },
    { id: 'druif',  niveau: 'uitbreiding', categorie: 'eten', tekst: 'de druiven', kort: 'druiven',beeld: '🍇', zin: 'Druiven groeien aan een tak.' },
    { id: 'aardbei',niveau: 'uitbreiding', categorie: 'eten', tekst: 'de aardbei', kort: 'aardbei',beeld: '🍓', zin: 'Aardbeien zijn zoet en rood.' },

    // ========== VERDIEPING — uitgebreid ==========
    { id: 'yoghurt',niveau: 'verdieping', categorie: 'eten', tekst: 'de yoghurt', kort: 'yoghurt',beeld: '🥛', zin: 'Ik eet yoghurt met fruit.' },
    { id: 'sap',    niveau: 'verdieping', categorie: 'drinken', tekst: 'het sap',    kort: 'sap',    beeld: '🧃', zin: 'Ik drink appelsap.' },
    { id: 'thee',   niveau: 'verdieping', categorie: 'drinken', tekst: 'de thee',    kort: 'thee',   beeld: '🍵', zin: 'Mama drinkt thee.' },
    { id: 'taart',  niveau: 'verdieping', categorie: 'eten', tekst: 'de taart',   kort: 'taart',  beeld: '🎂', zin: 'Op mijn verjaardag eet ik taart.' },
    { id: 'snoep',  niveau: 'verdieping', categorie: 'eten', tekst: 'het snoep',  kort: 'snoep',  beeld: '🍬', zin: 'Te veel snoep is niet gezond.' },
    { id: 'ijs',    niveau: 'verdieping', categorie: 'eten', tekst: 'het ijs',    kort: 'ijs',    beeld: '🍦', zin: 'Het ijs is koud en zoet.' },
    { id: 'choco',  niveau: 'verdieping', categorie: 'eten', tekst: 'de choco',   kort: 'choco',  beeld: '🍫', zin: 'Ik smeer choco op mijn boterham.' },
    { id: 'lepel',  niveau: 'verdieping', categorie: 'bestek', tekst: 'de lepel',   kort: 'lepel',  beeld: '🥄', zin: 'Ik eet soep met een lepel.' },
    { id: 'vork',   niveau: 'verdieping', categorie: 'bestek', tekst: 'de vork',    kort: 'vork',   beeld: '🍴', zin: 'Ik prik met mijn vork.' },
    { id: 'mes',    niveau: 'verdieping', categorie: 'bestek', tekst: 'het mes',    kort: 'mes',    beeld: '🔪', zin: 'Het mes is scherp, voorzichtig!' },
  ]
};
