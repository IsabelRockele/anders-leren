// =================================================================
//  Thema: Klas & schoolspullen (woorden) — uitgebreid
//
//  Categorieën: voorwerpen / werkwoorden / personen / plaatsen / situaties
//  Niveaus:     basis (eerste week), uitbreiding, verdieping
//
//  Veld 'picto' is OPTIONEEL. Als ingevuld → PNG geladen uit /picto/<pad>.
//  Als leeg of bestand ontbreekt → fallback naar emoji in 'beeld'.
//  Bestandsnaamconventie: picto/klas/<item-id>.png
// =================================================================
window.THEMA_WOORDEN_KLAS = {
  id: 'w-klas',
  type: 'woorden',
  naam: 'Klas & schoolspullen',
  emoji: '🎒',
  kleur: '#FF8C42',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  categorieen: ['personen', 'voorwerpen', 'plaatsen', 'werkwoorden', 'situaties'],
  items: [
    // ========== BASIS — eerste week ==========
    // Personen
    { id: 'juf',         niveau: 'basis', categorie: 'personen',    tekst: 'de juf',         kort: 'juf',         beeld: '👩‍🏫', picto: 'klas/juf.png',         zin: 'De juf helpt mij.' },
    { id: 'meester',     niveau: 'basis', categorie: 'personen',    tekst: 'de meester',     kort: 'meester',     beeld: '👨‍🏫', picto: 'klas/meester.png',     zin: 'De meester legt het uit.' },
    { id: 'kind',        niveau: 'basis', categorie: 'personen',    tekst: 'het kind',       kort: 'kind',        beeld: '🧒', picto: 'klas/kind.png',        zin: 'Het kind speelt.' },
    { id: 'klasgenoot',  niveau: 'basis', categorie: 'personen',    tekst: 'de klasgenoot',  kort: 'klasgenoot',  beeld: '👫', picto: 'klas/klasgenoot.png',  zin: 'Mijn klasgenoot zit naast mij.' },

    // Voorwerpen
    { id: 'bank',        niveau: 'basis', categorie: 'voorwerpen',  tekst: 'de bank',        kort: 'bank',        beeld: '🪑', picto: 'klas/bank.png',        zin: 'Ik zit aan mijn bank.' },
    { id: 'stoel',       niveau: 'basis', categorie: 'voorwerpen',  tekst: 'de stoel',       kort: 'stoel',       beeld: '🪑', picto: 'klas/stoel.png',       zin: 'Ik zit op een stoel.' },
    { id: 'bord',        niveau: 'basis', categorie: 'voorwerpen',  tekst: 'het bord',       kort: 'bord',        beeld: '📋', picto: 'klas/bord.png',        zin: 'De juf schrijft op het bord.' },
    { id: 'boekentas',   niveau: 'basis', categorie: 'voorwerpen',  tekst: 'de boekentas',   kort: 'boekentas',   beeld: '🎒', picto: 'klas/boekentas.png',   zin: 'Ik draag mijn boekentas.' },
    { id: 'brooddoos',   niveau: 'basis', categorie: 'voorwerpen',  tekst: 'de brooddoos',   kort: 'brooddoos',   beeld: '🥪', picto: 'klas/brooddoos.png',   zin: 'Mijn brood zit in mijn brooddoos.' },
    { id: 'drinkbus',    niveau: 'basis', categorie: 'voorwerpen',  tekst: 'de drinkbus',    kort: 'drinkbus',    beeld: '🍶', picto: 'klas/drinkbus.png',    zin: 'Ik drink uit mijn drinkbus.' },

    // Plaatsen
    { id: 'klas',        niveau: 'basis', categorie: 'plaatsen',    tekst: 'de klas',        kort: 'klas',        beeld: '🏫', picto: 'klas/klas.png',        zin: 'Ik ga naar de klas.' },

    // ========== UITBREIDING — schrijfgerei + werkwoorden ==========
    // Voorwerpen — schrijfgerei
    { id: 'boek',        niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'het boek',         kort: 'boek',         beeld: '📖', picto: 'klas/boek.png',         zin: 'Ik lees een boek.' },
    { id: 'schrift',     niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'het schrift',      kort: 'schrift',      beeld: '📓', picto: 'klas/schrift.png',      zin: 'Ik schrijf in mijn schrift.' },
    { id: 'pen',         niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de pen',           kort: 'pen',          beeld: '🖊️', picto: 'klas/pen.png',          zin: 'Ik schrijf met een pen.' },
    { id: 'potlood',     niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'het potlood',      kort: 'potlood',      beeld: '✏️', picto: 'klas/potlood.png',      zin: 'Het potlood is scherp.' },
    { id: 'gom',         niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de gom',           kort: 'gom',          beeld: '🩹', picto: 'klas/gom.png',          zin: 'Ik gom de fout uit.' },
    { id: 'lat',         niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de lat',           kort: 'lat',          beeld: '📏', picto: 'klas/lat.png',          zin: 'Ik teken een lijn met de lat.' },
    { id: 'kleurpotloden', niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de kleurpotloden', kort: 'kleurpotloden', beeld: '🖍️', picto: 'klas/kleurpotloden.png', zin: 'Ik kleur met mijn kleurpotloden.' },
    { id: 'stiften',     niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de stiften',       kort: 'stiften',      beeld: '🖊️', picto: 'klas/stiften.png',      zin: 'De stiften zijn rood en blauw.' },
    { id: 'schaar',      niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de schaar',        kort: 'schaar',       beeld: '✂️', picto: 'klas/schaar.png',       zin: 'Ik knip met de schaar.' },
    { id: 'lijm',        niveau: 'uitbreiding', categorie: 'voorwerpen', tekst: 'de lijm',          kort: 'lijm',         beeld: '🧴', picto: 'klas/lijm.png',         zin: 'Ik plak met lijm.' },

    // Werkwoorden — wat doe je in de klas
    { id: 'lezen',       niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'lezen',           kort: 'lezen',        beeld: '📖', picto: 'klas/lezen.png',        zin: 'Ik kan lezen.' },
    { id: 'schrijven',   niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'schrijven',       kort: 'schrijven',    beeld: '✍️', picto: 'klas/schrijven.png',    zin: 'Ik schrijf in mijn schrift.' },
    { id: 'kleuren',     niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'kleuren',         kort: 'kleuren',      beeld: '🎨', picto: 'klas/kleuren.png',      zin: 'Ik kleur de tekening.' },
    { id: 'knippen',     niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'knippen',         kort: 'knippen',      beeld: '✂️', picto: 'klas/knippen.png',      zin: 'Ik knip het papier.' },
    { id: 'plakken',     niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'plakken',         kort: 'plakken',      beeld: '🧴', picto: 'klas/plakken.png',      zin: 'Ik plak het in mijn schrift.' },
    { id: 'luisteren',   niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'luisteren',       kort: 'luisteren',    beeld: '👂', picto: 'klas/luisteren.png',    zin: 'Ik luister naar de juf.' },

    // ========== VERDIEPING — klasruimte + situaties ==========
    // Voorwerpen
    { id: 'agenda',      niveau: 'verdieping', categorie: 'voorwerpen', tekst: 'de agenda',         kort: 'agenda',       beeld: '📅', picto: 'klas/agenda.png',       zin: 'Ik schrijf in mijn agenda.' },
    { id: 'map',         niveau: 'verdieping', categorie: 'voorwerpen', tekst: 'de map',            kort: 'map',          beeld: '📁', picto: 'klas/map.png',          zin: 'De map is geel.' },
    { id: 'bladzijde',   niveau: 'verdieping', categorie: 'voorwerpen', tekst: 'de bladzijde',      kort: 'bladzijde',    beeld: '📄', picto: 'klas/bladzijde.png',    zin: 'Open je boek op bladzijde tien.' },

    // Plaatsen — ruimtes in de school
    { id: 'kapstok',     niveau: 'verdieping', categorie: 'plaatsen',    tekst: 'de kapstok',       kort: 'kapstok',      beeld: '🧥', picto: 'klas/kapstok.png',      zin: 'Mijn jas hangt aan de kapstok.' },
    { id: 'speelplaats', niveau: 'verdieping', categorie: 'plaatsen',    tekst: 'de speelplaats',   kort: 'speelplaats',  beeld: '🏃', picto: 'klas/speelplaats.png',  zin: 'Wij spelen op de speelplaats.' },
    { id: 'toilet',      niveau: 'verdieping', categorie: 'plaatsen',    tekst: 'het toilet',       kort: 'toilet',       beeld: '🚽', picto: 'klas/toilet.png',       zin: 'Ik ga naar het toilet.' },
    { id: 'eetzaal',     niveau: 'verdieping', categorie: 'plaatsen',    tekst: 'de eetzaal',       kort: 'eetzaal',      beeld: '🍽️', picto: 'klas/eetzaal.png',      zin: 'In de eetzaal eten wij.' },
    { id: 'gang',        niveau: 'verdieping', categorie: 'plaatsen',    tekst: 'de gang',          kort: 'gang',         beeld: '🚶', picto: 'klas/gang.png',         zin: 'In de gang loop ik stil.' },

    // Situaties — momenten in de klas
    { id: 'bel',         niveau: 'verdieping', categorie: 'situaties',   tekst: 'de bel',           kort: 'bel',          beeld: '🔔', picto: 'klas/bel.png',          zin: 'De bel rinkelt om tien uur.' },
    { id: 'pauze',       niveau: 'verdieping', categorie: 'situaties',   tekst: 'de pauze',         kort: 'pauze',        beeld: '☕', picto: 'klas/pauze.png',        zin: 'In de pauze speel ik buiten.' },
    { id: 'les',         niveau: 'verdieping', categorie: 'situaties',   tekst: 'de les',           kort: 'les',          beeld: '📚', picto: 'klas/les.png',          zin: 'De les begint nu.' },
    { id: 'toets',       niveau: 'verdieping', categorie: 'situaties',   tekst: 'de toets',         kort: 'toets',        beeld: '📝', picto: 'klas/toets.png',        zin: 'Vandaag is er een toets.' },
    { id: 'huiswerk',    niveau: 'verdieping', categorie: 'situaties',   tekst: 'het huiswerk',     kort: 'huiswerk',     beeld: '🏠', picto: 'klas/huiswerk.png',     zin: 'Ik maak mijn huiswerk thuis.' }
  ]
};
