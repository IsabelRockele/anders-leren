// =================================================================
//  Thema: Dieren & natuur (woorden) — herwerkt
//  Alles op niveau 'basis'. Categorieën:
//    boerderijdieren, huisdieren, waterdieren, dierentuindieren,
//    planten, weer, natuur
// =================================================================
window.THEMA_WOORDEN_DIEREN = {
  id: 'w-dieren',
  type: 'woorden',
  naam: 'Dieren & natuur',
  emoji: '🐶',
  kleur: '#2A9D8F',
  niveaus: ['basis'],
  categorieen: ['boerderijdieren', 'huisdieren', 'waterdieren', 'dierentuindieren', 'planten', 'weer', 'natuur'],
  items: [
    // ========== BOERDERIJDIEREN ==========
    { id: 'koe',    niveau: 'basis', categorie: 'boerderijdieren', tekst: 'de koe',     kort: 'koe',    beeld: '🐮', zin: 'De koe geeft melk.' },
    { id: 'paard',  niveau: 'basis', categorie: 'boerderijdieren', tekst: 'het paard',  kort: 'paard',  beeld: '🐴', zin: 'Het paard loopt snel.' },
    { id: 'geit',   niveau: 'basis', categorie: 'boerderijdieren', tekst: 'de geit',    kort: 'geit',   beeld: '🐐', zin: 'De geit eet gras.' },
    { id: 'schaap', niveau: 'basis', categorie: 'boerderijdieren', tekst: 'het schaap', kort: 'schaap', beeld: '🐑', zin: 'Het schaap heeft wol.' },
    { id: 'varken', niveau: 'basis', categorie: 'boerderijdieren', tekst: 'het varken', kort: 'varken', beeld: '🐷', zin: 'Het varken is roze.' },
    { id: 'kip',    niveau: 'basis', categorie: 'boerderijdieren', tekst: 'de kip',     kort: 'kip',    beeld: '🐔', zin: 'De kip legt een ei.' },

    // ========== HUISDIEREN ==========
    { id: 'kat',    niveau: 'basis', categorie: 'huisdieren', tekst: 'de kat',     kort: 'kat',    beeld: '🐱', zin: 'De kat miauwt.' },
    { id: 'hond',   niveau: 'basis', categorie: 'huisdieren', tekst: 'de hond',    kort: 'hond',   beeld: '🐶', zin: 'De hond blaft.' },
    { id: 'muis',   niveau: 'basis', categorie: 'huisdieren', tekst: 'de muis',    kort: 'muis',   beeld: '🐭', zin: 'De muis is heel klein.' },
    { id: 'konijn', niveau: 'basis', categorie: 'huisdieren', tekst: 'het konijn', kort: 'konijn', beeld: '🐰', zin: 'Het konijn springt.' },
    { id: 'vogel',  niveau: 'basis', categorie: 'huisdieren', tekst: 'de vogel',   kort: 'vogel',  beeld: '🐦', zin: 'De vogel vliegt.' },

    // ========== WATERDIEREN ==========
    { id: 'vis',    niveau: 'basis', categorie: 'waterdieren', tekst: 'de vis',    kort: 'vis',    beeld: '🐟', zin: 'De vis zwemt.' },
    { id: 'eend',   niveau: 'basis', categorie: 'waterdieren', tekst: 'de eend',   kort: 'eend',   beeld: '🦆', zin: 'De eend zwemt in de vijver.' },
    { id: 'kikker', niveau: 'basis', categorie: 'waterdieren', tekst: 'de kikker', kort: 'kikker', beeld: '🐸', zin: 'De kikker springt in het water.' },

    // ========== DIERENTUINDIEREN ==========
    { id: 'leeuw',   niveau: 'basis', categorie: 'dierentuindieren', tekst: 'de leeuw',    kort: 'leeuw',   beeld: '🦁', zin: 'De leeuw brult.' },
    { id: 'tijger',  niveau: 'basis', categorie: 'dierentuindieren', tekst: 'de tijger',   kort: 'tijger',  beeld: '🐯', zin: 'De tijger heeft strepen.' },
    { id: 'olifant', niveau: 'basis', categorie: 'dierentuindieren', tekst: 'de olifant',  kort: 'olifant', beeld: '🐘', zin: 'De olifant heeft een grote slurf.' },
    { id: 'giraf',   niveau: 'basis', categorie: 'dierentuindieren', tekst: 'de giraf',    kort: 'giraf',   beeld: '🦒', zin: 'De giraf heeft een lange nek.' },
    { id: 'aap',     niveau: 'basis', categorie: 'dierentuindieren', tekst: 'de aap',      kort: 'aap',     beeld: '🐵', zin: 'De aap klimt in de boom.' },

    // ========== PLANTEN ==========
    { id: 'boom',   niveau: 'basis', categorie: 'planten', tekst: 'de boom',   kort: 'boom',   beeld: '🌳', zin: 'De boom is groot.' },
    { id: 'bloem',  niveau: 'basis', categorie: 'planten', tekst: 'de bloem',  kort: 'bloem',  beeld: '🌸', zin: 'De bloem is mooi.' },
    { id: 'gras',   niveau: 'basis', categorie: 'planten', tekst: 'het gras',  kort: 'gras',   beeld: '🌿', zin: 'Het gras is groen.' },
    { id: 'struik', niveau: 'basis', categorie: 'planten', tekst: 'de struik', kort: 'struik', beeld: '🌳', zin: 'De struik staat in de tuin.' },
    { id: 'blad',   niveau: 'basis', categorie: 'planten', tekst: 'het blad',  kort: 'blad',   beeld: '🍃', zin: 'In de herfst vallen de bladeren.' },
    { id: 'tak',    niveau: 'basis', categorie: 'planten', tekst: 'de tak',    kort: 'tak',    beeld: '🌿', zin: 'Een vogel zit op een tak.' },

    // ========== WEER ==========
    { id: 'zon',    niveau: 'basis', categorie: 'weer', tekst: 'de zon',    kort: 'zon',    beeld: '☀️', zin: 'De zon schijnt.' },
    { id: 'regen',  niveau: 'basis', categorie: 'weer', tekst: 'de regen',  kort: 'regen',  beeld: '🌧️', zin: 'Het regent buiten.' },
    { id: 'wolk',   niveau: 'basis', categorie: 'weer', tekst: 'de wolk',   kort: 'wolk',   beeld: '☁️', zin: 'Er hangt een wolk in de lucht.' },
    { id: 'sneeuw', niveau: 'basis', categorie: 'weer', tekst: 'de sneeuw', kort: 'sneeuw', beeld: '❄️', zin: 'In de winter valt sneeuw.' },
    { id: 'wind',   niveau: 'basis', categorie: 'weer', tekst: 'de wind',   kort: 'wind',   beeld: '💨', zin: 'De wind waait hard.' },

    // ========== NATUUR ==========
    { id: 'bos',    niveau: 'basis', categorie: 'natuur', tekst: 'het bos',    kort: 'bos',    beeld: '🌲', zin: 'Wij wandelen in het bos.' },
    { id: 'rivier', niveau: 'basis', categorie: 'natuur', tekst: 'de rivier',  kort: 'rivier', beeld: '🏞️', zin: 'In de rivier zwemmen vissen.' },
    { id: 'berg',   niveau: 'basis', categorie: 'natuur', tekst: 'de berg',    kort: 'berg',   beeld: '⛰️', zin: 'De berg is heel hoog.' },
    { id: 'zee',    niveau: 'basis', categorie: 'natuur', tekst: 'de zee',     kort: 'zee',    beeld: '🌊', zin: 'In de zomer ga ik naar de zee.' },
    { id: 'park',   niveau: 'basis', categorie: 'natuur', tekst: 'het park',   kort: 'park',   beeld: '🏞️', zin: 'In het park spelen kinderen.' },
  ]
};
