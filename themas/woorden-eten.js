// =================================================================
//  Thema: Eten & drinken (woorden) — herwerkt, Vlaamse context
//  Alles op niveau 'basis'. Categorieën:
//    groenten, fruit, drank, snoepgoed, broodbeleg, andere, optafel
// =================================================================
window.THEMA_WOORDEN_ETEN = {
  id: 'w-eten',
  type: 'woorden',
  naam: 'Eten & drinken',
  emoji: '🍎',
  kleur: '#06A77D',
  niveaus: ['basis'],
  categorieen: ['groenten', 'fruit', 'drank', 'snoepgoed', 'broodbeleg', 'andere', 'op tafel'],
  items: [
    // ========== GROENTEN ==========
    { id: 'wortel',     niveau: 'basis', categorie: 'groenten', tekst: 'de wortel',     kort: 'wortel',     beeld: '🥕', zin: 'Een konijn eet wortels.' },
    { id: 'sla',        niveau: 'basis', categorie: 'groenten', tekst: 'de sla',        kort: 'sla',        beeld: '🥬', picto: 'eten/sla.png', zin: 'Ik eet sla bij mijn boterham.' },
    { id: 'bloemkool',  niveau: 'basis', categorie: 'groenten', tekst: 'de bloemkool',  kort: 'bloemkool',  beeld: '🥦', picto: 'eten/bloemkool.png', zin: 'De bloemkool is wit.' },
    { id: 'witloof',    niveau: 'basis', categorie: 'groenten', tekst: 'het witloof',   kort: 'witloof',    beeld: '🥬', picto: 'eten/witloof.png',    zin: 'Witloof met hesp en kaas is lekker.' },
    { id: 'komkommer',  niveau: 'basis', categorie: 'groenten', tekst: 'de komkommer',  kort: 'komkommer',  beeld: '🥒', picto: 'eten/komkommer.png', zin: 'De komkommer is groen en lang.' },
    { id: 'paprika',    niveau: 'basis', categorie: 'groenten', tekst: 'de paprika',    kort: 'paprika',    beeld: '🫑', zin: 'Een paprika kan rood of groen zijn.' },
    { id: 'aardappel',  niveau: 'basis', categorie: 'groenten', tekst: 'de aardappel',  kort: 'aardappel',  beeld: '🥔', zin: 'Ik eet aardappelen met saus.' },
    { id: 'erwten',     niveau: 'basis', categorie: 'groenten', tekst: 'de erwten',     kort: 'erwten',     beeld: '🟢', picto: 'eten/erwten.png', zin: 'Erwten zijn klein en groen.' },
    { id: 'spruiten',   niveau: 'basis', categorie: 'groenten', tekst: 'de spruiten',   kort: 'spruiten',   beeld: '🥬', picto: 'eten/spruiten.png', zin: 'In de winter eten wij spruiten.' },
    { id: 'prei',       niveau: 'basis', categorie: 'groenten', tekst: 'de prei',       kort: 'prei',       beeld: '🥬', picto: 'eten/prei.png', zin: 'Mama maakt soep met prei.' },
    { id: 'ui',         niveau: 'basis', categorie: 'groenten', tekst: 'de ui',         kort: 'ui',         beeld: '🧅', zpicto: 'eten/ui.png', in: 'Van een ui moet ik wenen.' },
    { id: 'tomaat',     niveau: 'basis', categorie: 'groenten', tekst: 'de tomaat',     kort: 'tomaat',     beeld: '🍅', zin: 'De tomaat is rood.' },

    // ========== FRUIT ==========
    { id: 'appel',      niveau: 'basis', categorie: 'fruit', tekst: 'de appel',       kort: 'appel',      beeld: '🍎', zin: 'Ik eet een appel.' },
    { id: 'peer',       niveau: 'basis', categorie: 'fruit', tekst: 'de peer',        kort: 'peer',       beeld: '🍐', zin: 'De peer is zoet.' },
    { id: 'aardbei',    niveau: 'basis', categorie: 'fruit', tekst: 'de aardbei',     kort: 'aardbei',    beeld: '🍓', zin: 'Aardbeien zijn zoet en rood.' },
    { id: 'kiwi',       niveau: 'basis', categorie: 'fruit', tekst: 'de kiwi',        kort: 'kiwi',       beeld: '🥝', zin: 'Een kiwi is groen vanbinnen.' },
    { id: 'sinaasappel',niveau: 'basis', categorie: 'fruit', tekst: 'de sinaasappel', kort: 'sinaasappel',beeld: '🍊', picto: 'eten/sinaasappel.png', zin: 'De sinaasappel is oranje.' },
    { id: 'banaan',     niveau: 'basis', categorie: 'fruit', tekst: 'de banaan',      kort: 'banaan',     beeld: '🍌', zin: 'De banaan is geel.' },
    { id: 'druiven',    niveau: 'basis', categorie: 'fruit', tekst: 'de druiven',     kort: 'druiven',    beeld: '🍇', zin: 'Druiven groeien aan een tak.' },
    { id: 'ananas',     niveau: 'basis', categorie: 'fruit', tekst: 'de ananas',      kort: 'ananas',     beeld: '🍍', picto: 'eten/ananas.png',zin: 'Een ananas heeft een kroon.' },
    { id: 'bessen',     niveau: 'basis', categorie: 'fruit', tekst: 'de bessen',      kort: 'bessen',     beeld: '🫐', zin: 'Bessen zijn klein en rond.' },
    { id: 'kersen',     niveau: 'basis', categorie: 'fruit', tekst: 'de kersen',      kort: 'kersen',     beeld: '🍒', zin: 'Kersen zijn rood en zoet.' },
    { id: 'mango',      niveau: 'basis', categorie: 'fruit', tekst: 'de mango',       kort: 'mango',      beeld: '🥭', zin: 'Een mango is geel en zacht.' },

    // ========== DRANK ==========
    { id: 'water',      niveau: 'basis', categorie: 'drank', tekst: 'het water',      kort: 'water',      beeld: '💧', zin: 'Ik drink water.' },
    { id: 'melk',       niveau: 'basis', categorie: 'drank', tekst: 'de melk',        kort: 'melk',       beeld: '🥛', zin: 'Ik drink melk.' },
    { id: 'koffie',     niveau: 'basis', categorie: 'drank', tekst: 'de koffie',      kort: 'koffie',     beeld: '☕', zin: 'Papa drinkt koffie.' },
    { id: 'thee',       niveau: 'basis', categorie: 'drank', tekst: 'de thee',        kort: 'thee',       beeld: '🍵', zin: 'Mama drinkt thee.' },
    { id: 'chocomelk',  niveau: 'basis', categorie: 'drank', tekst: 'de chocomelk',   kort: 'chocomelk',  beeld: '🥛', zin: 'Chocomelk is bruin en zoet.' },
    { id: 'fruitsap',   niveau: 'basis', categorie: 'drank', tekst: 'het fruitsap',   kort: 'fruitsap',   beeld: '🧃', zin: 'Ik drink een glas fruitsap.' },

    // ========== SNOEPGOED ==========
    { id: 'snoep',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'het snoep',     kort: 'snoep',     beeld: '🍬', zin: 'Te veel snoep is niet gezond.' },
    { id: 'koek',       niveau: 'basis', categorie: 'snoepgoed', tekst: 'de koek',       kort: 'koek',      beeld: '🍪', zin: 'Ik eet een koek.' },
    { id: 'chocolade',  niveau: 'basis', categorie: 'snoepgoed', tekst: 'de chocolade',  kort: 'chocolade', beeld: '🍫', zin: 'Chocolade smelt in je mond.' },
    { id: 'ijs',        niveau: 'basis', categorie: 'snoepgoed', tekst: 'het ijs',       kort: 'ijs',       beeld: '🍦', zin: 'Het ijs is koud en zoet.' },
    { id: 'taart',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'de taart',      kort: 'taart',     beeld: '🎂', zin: 'Op mijn verjaardag eet ik taart.' },
    { id: 'wafel',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'de wafel',      kort: 'wafel',     beeld: '🧇', zin: 'Een warme wafel is heerlijk.' },

    // ========== BROODBELEG ==========
    { id: 'kaas',       niveau: 'basis', categorie: 'broodbeleg', tekst: 'de kaas',     kort: 'kaas',    beeld: '🧀', zin: 'Ik hou van kaas op mijn boterham.' },
    { id: 'choco',      niveau: 'basis', categorie: 'broodbeleg', tekst: 'de choco',    kort: 'choco',   beeld: '🍫', zin: 'Ik smeer choco op mijn boterham.' },
    { id: 'hesp',       niveau: 'basis', categorie: 'broodbeleg', tekst: 'de hesp',     kort: 'hesp',    beeld: '🥓', zin: 'Een boterham met hesp en kaas.' },
    { id: 'salami',     niveau: 'basis', categorie: 'broodbeleg', tekst: 'de salami',   kort: 'salami',  beeld: '🍕', zin: 'Salami is een soort worst.' },
    { id: 'boter',      niveau: 'basis', categorie: 'broodbeleg', tekst: 'de boter',    kort: 'boter',   beeld: '🧈', zin: 'Eerst smeer ik boter op mijn brood.' },

    // ========== ANDERE ==========
    { id: 'vlees',      niveau: 'basis', categorie: 'andere', tekst: 'het vlees',  kort: 'vlees',  beeld: '🍖', zin: 'Het vlees is lekker.' },
    { id: 'friet',      niveau: 'basis', categorie: 'andere', tekst: 'de friet',   kort: 'friet',  beeld: '🍟', zin: 'Op zondag eten wij friet.' },
    { id: 'soep',       niveau: 'basis', categorie: 'andere', tekst: 'de soep',    kort: 'soep',   beeld: '🍲', zin: 'De soep is warm.' },
    { id: 'pasta',      niveau: 'basis', categorie: 'andere', tekst: 'de pasta',   kort: 'pasta',  beeld: '🍝', zin: 'Pasta is mijn lievelingseten.' },
    { id: 'rijst',      niveau: 'basis', categorie: 'andere', tekst: 'de rijst',   kort: 'rijst',  beeld: '🍚', zin: 'Ik eet rijst met groenten.' },
    { id: 'ei',         niveau: 'basis', categorie: 'andere', tekst: 'het ei',     kort: 'ei',     beeld: '🥚', zin: 'Ik eet een ei.' },
    { id: 'brood',      niveau: 'basis', categorie: 'andere', tekst: 'het brood',  kort: 'brood',  beeld: '🍞', zin: 'Ik eet brood met kaas.' },

    // ========== OP TAFEL ==========
    { id: 'lepel',      niveau: 'basis', categorie: 'optafel', tekst: 'de lepel', kort: 'lepel', beeld: '🥄', zin: 'Ik eet soep met een lepel.' },
    { id: 'vork',       niveau: 'basis', categorie: 'optafel', tekst: 'de vork',  kort: 'vork',  beeld: '🍴', zin: 'Ik prik met mijn vork.' },
    { id: 'mes',        niveau: 'basis', categorie: 'optafel', tekst: 'het mes',  kort: 'mes',   beeld: '🔪', zin: 'Het mes is scherp, voorzichtig!' },
    { id: 'bord',       niveau: 'basis', categorie: 'optafel', tekst: 'het bord', kort: 'bord',  beeld: '🍽️', zin: 'Mijn eten ligt op het bord.' },
    { id: 'glas',       niveau: 'basis', categorie: 'optafel', tekst: 'het glas', kort: 'glas',  beeld: '🥛', zin: 'Ik drink uit mijn glas.' },
    { id: 'tas',        niveau: 'basis', categorie: 'optafel', tekst: 'de tas',   kort: 'tas',   beeld: '☕', zin: 'Mama drinkt uit een tas koffie.' },
    { id: 'kom',        niveau: 'basis', categorie: 'optafel', tekst: 'de kom',   kort: 'kom',   beeld: '🥣', zin: "'s Morgens eet ik uit een kom." },
  ]
};