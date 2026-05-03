// =================================================================
//  Thema: Familie & gevoelens (woorden) — uitgebreid
// =================================================================
window.THEMA_WOORDEN_FAMILIE = {
  id: 'w-familie',
  type: 'woorden',
  naam: 'Familie & gevoelens',
  emoji: '👨‍👩‍👧',
  kleur: '#9D4EDD',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  categorieen: ['familie', 'gevoelens'],
  items: [
    // ========== BASIS — directe familie ==========
    { id: 'mama',        niveau: 'basis', categorie: 'familie', tekst: 'de mama',     kort: 'mama',        beeld: '👩', zin: 'Mama is lief.' },
    { id: 'papa',        niveau: 'basis', categorie: 'familie', tekst: 'de papa',     kort: 'papa',        beeld: '👨', zin: 'Papa is groot.' },
    { id: 'broer',       niveau: 'basis', categorie: 'familie', tekst: 'de broer',    kort: 'broer',       beeld: '👦', zin: 'Mijn broer is klein.' },
    { id: 'zus',         niveau: 'basis', categorie: 'familie', tekst: 'de zus',      kort: 'zus',         beeld: '👧', zin: 'Mijn zus is lief.' },
    { id: 'baby',        niveau: 'basis', categorie: 'familie', tekst: 'de baby',     kort: 'baby',        beeld: '👶', zin: 'De baby slaapt.' },

    // ========== BASIS — basisgevoelens ==========
    { id: 'blij',        niveau: 'basis', categorie: 'gevoelens', tekst: 'blij',        kort: 'blij',        beeld: '😀', zin: 'Ik ben blij.' },
    { id: 'verdrietig',  niveau: 'basis', categorie: 'gevoelens', tekst: 'verdrietig',  kort: 'verdrietig',  beeld: '😢', zin: 'Ik ben verdrietig.' },
    { id: 'boos',        niveau: 'basis', categorie: 'gevoelens', tekst: 'boos',        kort: 'boos',        beeld: '😡', zin: 'Ik ben boos.' },
    { id: 'bang',        niveau: 'basis', categorie: 'gevoelens', tekst: 'bang',        kort: 'bang',        beeld: '😨', zin: 'Ik ben bang.' },
    { id: 'moe',         niveau: 'basis', categorie: 'gevoelens', tekst: 'moe',         kort: 'moe',         beeld: '😴', zin: 'Ik ben moe.' },

    // ========== UITBREIDING — bredere familie ==========
    { id: 'oma',         niveau: 'uitbreiding', categorie: 'familie', tekst: 'de oma',        kort: 'oma',     beeld: '👵', zin: 'Oma is oud en lief.' },
    { id: 'opa',         niveau: 'uitbreiding', categorie: 'familie', tekst: 'de opa',        kort: 'opa',     beeld: '👴', zin: 'Opa vertelt verhalen.' },
    { id: 'tante',       niveau: 'uitbreiding', categorie: 'familie', tekst: 'de tante',      kort: 'tante',   beeld: '👩', zin: 'Mijn tante komt op bezoek.' },
    { id: 'nonkel',      niveau: 'uitbreiding', categorie: 'familie', tekst: 'de nonkel',     kort: 'nonkel',  beeld: '👨', zin: 'Mijn nonkel woont in Brussel.' },
    { id: 'neef',        niveau: 'uitbreiding', categorie: 'familie', tekst: 'de neef',       kort: 'neef',    beeld: '👦', zin: 'Mijn neef speelt met mij.' },
    { id: 'nicht',       niveau: 'uitbreiding', categorie: 'familie', tekst: 'de nicht',      kort: 'nicht',   beeld: '👧', zin: 'Mijn nicht is mijn vriendinnetje.' },
    { id: 'vriend',      niveau: 'uitbreiding', categorie: 'familie', tekst: 'de vriend',     kort: 'vriend',  beeld: '🤝', zin: 'Hij is mijn beste vriend.' },
    { id: 'vriendin',    niveau: 'uitbreiding', categorie: 'familie', tekst: 'de vriendin',   kort: 'vriendin',beeld: '🤝', zin: 'Mijn vriendin heet Layla.' },

    // ========== UITBREIDING — meer gevoelens ==========
    { id: 'rustig',      niveau: 'uitbreiding', categorie: 'gevoelens', tekst: 'rustig',     kort: 'rustig',     beeld: '😌', zin: 'Ik ben rustig vandaag.' },
    { id: 'verlegen',    niveau: 'uitbreiding', categorie: 'gevoelens', tekst: 'verlegen',   kort: 'verlegen',   beeld: '😳', zin: 'Soms ben ik verlegen.' },
    { id: 'trots',       niveau: 'uitbreiding', categorie: 'gevoelens', tekst: 'trots',      kort: 'trots',      beeld: '😎', zin: 'Ik ben trots op mijn werk.' },
    { id: 'verbaasd',    niveau: 'uitbreiding', categorie: 'gevoelens', tekst: 'verbaasd',   kort: 'verbaasd',   beeld: '😮', zin: 'Ik ben verbaasd.' },

    // ========== VERDIEPING ==========
    { id: 'liefste',     niveau: 'verdieping', categorie: 'gevoelens', tekst: 'lief',         kort: 'lief',        beeld: '💖', zin: 'Mijn mama is heel lief.' },
    { id: 'eenzaam',     niveau: 'verdieping', categorie: 'gevoelens', tekst: 'eenzaam',      kort: 'eenzaam',     beeld: '😔', zin: 'Soms voel ik me eenzaam.' },
    { id: 'jaloers',     niveau: 'verdieping', categorie: 'gevoelens', tekst: 'jaloers',      kort: 'jaloers',     beeld: '😒', zin: 'Hij is jaloers op mijn fiets.' },
    { id: 'opgewonden',  niveau: 'verdieping', categorie: 'gevoelens', tekst: 'opgewonden',   kort: 'opgewonden',  beeld: '🤗', zin: 'Ik ben opgewonden voor mijn verjaardag.' },
    { id: 'huisdier',    niveau: 'verdieping', tekst: 'het huisdier', kort: 'huisdier',    beeld: '🐕', zin: 'Mijn huisdier is een hond.' },
    { id: 'huis',        niveau: 'verdieping', tekst: 'het huis',     kort: 'huis',        beeld: '🏠', zin: 'Mijn huis is groot.' },
  ]
};
