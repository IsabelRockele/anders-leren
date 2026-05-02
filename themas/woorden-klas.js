// =================================================================
//  Thema: Klas & schoolspullen (woorden) — afgestemd op picto-set
//
//  Categorieën: voorwerpen / werkwoorden / personen / plaatsen / situaties
//  Niveaus:     basis (eerste week), uitbreiding, verdieping
//
//  Veld 'picto' is OPTIONEEL. Als ingevuld → PNG geladen uit /picto/<pad>.
//  Als leeg of bestand ontbreekt → fallback naar emoji in 'beeld'.
//  Bestandsnaamconventie: picto/klas/<bestandsnaam>.png
//
//  Item-id's met streepjes (in-de-rij), maar picto-bestanden mogen
//  ook underscores gebruiken (in_de_rij.png) — id en picto-pad
//  hoeven niet identiek te zijn.
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
    // ========== PERSONEN ==========
    { id: 'juf',         niveau: 'basis',       categorie: 'personen',    tekst: 'de juf',         kort: 'juf',         beeld: '👩‍🏫', picto: 'klas/juf.png',         zin: 'De juf helpt mij.' },
    { id: 'meester',     niveau: 'basis',       categorie: 'personen',    tekst: 'de meester',     kort: 'meester',     beeld: '👨‍🏫', picto: 'klas/meester.png',     zin: 'De meester legt het uit.' },

    // ========== PLAATSEN ==========
    { id: 'school',      niveau: 'basis',       categorie: 'plaatsen',    tekst: 'de school',      kort: 'school',      beeld: '🏫', picto: 'klas/school.png',      zin: 'Ik ga naar school.' },
    { id: 'speelplaats', niveau: 'basis',       categorie: 'plaatsen',    tekst: 'de speelplaats', kort: 'speelplaats', beeld: '🏃', picto: 'klas/speelplaats.png', zin: 'Wij spelen op de speelplaats.' },
    { id: 'refter',      niveau: 'uitbreiding', categorie: 'plaatsen',    tekst: 'de refter',      kort: 'refter',      beeld: '🍽️', picto: 'klas/refter.png',      zin: 'In de refter eten wij.' },
    { id: 'kapstok',     niveau: 'uitbreiding', categorie: 'plaatsen',    tekst: 'de kapstok',     kort: 'kapstok',     beeld: '🧥', picto: 'klas/kapstok.png',     zin: 'Mijn jas hangt aan de kapstok.' },
    { id: 'toilet',      niveau: 'basis',       categorie: 'plaatsen',    tekst: 'het toilet',     kort: 'toilet',      beeld: '🚽', picto: 'klas/toilet.png',      zin: 'Ik ga naar het toilet.' },

    // ========== VOORWERPEN — eten en drinken ==========
    { id: 'boekentas',   niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de boekentas',   kort: 'boekentas',   beeld: '🎒', picto: 'klas/boekentas.png',   zin: 'Ik draag mijn boekentas.' },
    { id: 'brooddoos',   niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de brooddoos',   kort: 'brooddoos',   beeld: '🥪', picto: 'klas/brooddoos.png',   zin: 'Mijn brood zit in mijn brooddoos.' },
    { id: 'drinkbus',    niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de drinkbus',    kort: 'drinkbus',    beeld: '🍶', picto: 'klas/drinkbus.png',    zin: 'Ik drink uit mijn drinkbus.' },
    { id: 'koek',        niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de koek',        kort: 'koek',        beeld: '🍪', picto: 'klas/koek.png',        zin: 'In de pauze eet ik een koek.' },
    { id: 'fruit',       niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'het fruit',      kort: 'fruit',       beeld: '🍎', picto: 'klas/fruit.png',       zin: 'Op woensdag eten wij fruit.' },

    // ========== VOORWERPEN — meubilair en klas ==========
    { id: 'bank',        niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de bank',        kort: 'bank',        beeld: '🪑', picto: 'klas/bank.png',        zin: 'Ik zit aan mijn bank.' },
    { id: 'stoel',       niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de stoel',       kort: 'stoel',       beeld: '🪑', picto: 'klas/stoel.png',       zin: 'Ik zit op een stoel.' },
    { id: 'bord',        niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'het bord',       kort: 'bord',        beeld: '📋', picto: 'klas/bord.png',        zin: 'De juf schrijft op het bord.' },
    { id: 'bel',         niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de bel',         kort: 'bel',         beeld: '🔔', picto: 'klas/bel.png',         zin: 'De bel rinkelt om tien uur.' },

    // ========== VOORWERPEN — schrijfgerei ==========
    { id: 'pen',         niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de pen',         kort: 'pen',         beeld: '🖊️', picto: 'klas/pen.png',         zin: 'Ik schrijf met een pen.' },
    { id: 'potlood',     niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'het potlood',    kort: 'potlood',     beeld: '✏️', picto: 'klas/potlood.png',     zin: 'Het potlood is scherp.' },
    { id: 'gom',         niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de gom',         kort: 'gom',         beeld: '🩹', picto: 'klas/gom.png',         zin: 'Ik gom de fout uit.' },
    { id: 'lat',         niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de lat',         kort: 'lat',         beeld: '📏', picto: 'klas/lat.png',         zin: 'Ik teken een lijn met de lat.' },
    { id: 'pennenzak',   niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de pennenzak',   kort: 'pennenzak',   beeld: '🎒', picto: 'klas/pennenzak.png',   zin: 'In mijn pennenzak zit mijn pen.' },
    { id: 'kleurpotloden', niveau: 'basis',     categorie: 'voorwerpen',  tekst: 'de kleurpotloden', kort: 'kleurpotloden', beeld: '🖍️', picto: 'klas/kleurpotloden.png', zin: 'Ik kleur met mijn kleurpotloden.' },
    { id: 'stiften',     niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de stiften',     kort: 'stiften',     beeld: '🖊️', picto: 'klas/stiften.png',     zin: 'De stiften zijn rood en blauw.' },
    { id: 'fluostift',   niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de fluostift',   kort: 'fluostift',   beeld: '🖍️', picto: 'klas/fluostift.png',   zin: 'Ik markeer met de fluostift.' },
    { id: 'schaar',      niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de schaar',      kort: 'schaar',      beeld: '✂️', picto: 'klas/schaar.png',      zin: 'Ik knip met de schaar.' },
    { id: 'lijm',        niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'de lijm',        kort: 'lijm',        beeld: '🧴', picto: 'klas/lijm.png',        zin: 'Ik plak met lijm.' },

    // ========== VOORWERPEN — boeken en papier ==========
    { id: 'agenda',      niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de agenda',      kort: 'agenda',      beeld: '📅', picto: 'klas/agenda.png',      zin: 'Ik schrijf in mijn agenda.' },
    { id: 'schrift',     niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'het schrift',    kort: 'schrift',     beeld: '📓', picto: 'klas/schrift.png',     zin: 'Ik schrijf in mijn schrift.' },
    { id: 'map',         niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de map',         kort: 'map',         beeld: '📁', picto: 'klas/map.png',         zin: 'De map is geel.' },
    { id: 'leesboek',    niveau: 'basis',       categorie: 'voorwerpen',  tekst: 'het leesboek',   kort: 'leesboek',    beeld: '📖', picto: 'klas/leesboek.png',    zin: 'Ik lees in mijn leesboek.' },
    { id: 'taalboek',    niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'het taalboek',   kort: 'taalboek',    beeld: '📕', picto: 'klas/taalboek.png',    zin: 'Open je taalboek op bladzijde tien.' },
    { id: 'rekenboek',   niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'het rekenboek',  kort: 'rekenboek',   beeld: '📘', picto: 'klas/rekenboek.png',   zin: 'In mijn rekenboek staan sommen.' },

    // ========== VOORWERPEN — knutselen ==========
    { id: 'penseel',     niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'het penseel',    kort: 'penseel',     beeld: '🖌️', picto: 'klas/penseel.png',     zin: 'Met het penseel schilder ik.' },
    { id: 'verf',        niveau: 'uitbreiding', categorie: 'voorwerpen',  tekst: 'de verf',        kort: 'verf',        beeld: '🎨', picto: 'klas/verf.png',        zin: 'De verf is blauw.' },

    // ========== WERKWOORDEN ==========
    { id: 'kijken',      niveau: 'basis',       categorie: 'werkwoorden', tekst: 'kijken',         kort: 'kijken',      beeld: '👀', picto: 'klas/kijken.png',      zin: 'Ik kijk naar de juf.' },
    { id: 'luisteren',   niveau: 'basis',       categorie: 'werkwoorden', tekst: 'luisteren',      kort: 'luisteren',   beeld: '👂', picto: 'klas/luisteren.png',   zin: 'Ik luister naar de juf.' },
    { id: 'lezen',       niveau: 'basis',       categorie: 'werkwoorden', tekst: 'lezen',          kort: 'lezen',       beeld: '📖', picto: 'klas/lezen.png',       zin: 'Ik kan lezen.' },
    { id: 'schrijven',   niveau: 'basis',       categorie: 'werkwoorden', tekst: 'schrijven',      kort: 'schrijven',   beeld: '✍️', picto: 'klas/schrijven.png',   zin: 'Ik schrijf in mijn schrift.' },
    { id: 'rekenen',     niveau: 'basis',       categorie: 'werkwoorden', tekst: 'rekenen',        kort: 'rekenen',     beeld: '🔢', picto: 'klas/rekenen.png',     zin: 'Ik kan rekenen tot tien.' },
    { id: 'kleuren',     niveau: 'basis',       categorie: 'werkwoorden', tekst: 'kleuren',        kort: 'kleuren',     beeld: '🎨', picto: 'klas/kleuren.png',     zin: 'Ik kleur de tekening.' },
    { id: 'knippen',     niveau: 'basis',       categorie: 'werkwoorden', tekst: 'knippen',        kort: 'knippen',     beeld: '✂️', picto: 'klas/knippen.png',     zin: 'Ik knip het papier.' },
    { id: 'schilderen',  niveau: 'uitbreiding', categorie: 'werkwoorden', tekst: 'schilderen',     kort: 'schilderen',  beeld: '🖌️', picto: 'klas/schilderen.png',  zin: 'In de klas mogen wij schilderen.' },
    { id: 'eten',        niveau: 'basis',       categorie: 'werkwoorden', tekst: 'eten',           kort: 'eten',        beeld: '🍴', picto: 'klas/eten.png',        zin: 'Wij eten in de refter.' },
    { id: 'drinken',     niveau: 'basis',       categorie: 'werkwoorden', tekst: 'drinken',        kort: 'drinken',     beeld: '🥤', picto: 'klas/drinken.png',     zin: 'Ik drink water.' },
    { id: 'spelen',      niveau: 'basis',       categorie: 'werkwoorden', tekst: 'spelen',         kort: 'spelen',      beeld: '🤸', picto: 'klas/spelen.png',      zin: 'Wij spelen op de speelplaats.' },
    { id: 'werken',      niveau: 'basis',       categorie: 'werkwoorden', tekst: 'werken',         kort: 'werken',      beeld: '✏️', picto: 'klas/werken.png',      zin: 'Nu werken wij in stilte.' },

    // ========== SITUATIES ==========
    // Item-id's hebben streepjes (codeconventie), maar picto-bestanden
    // hebben underscores (zoals door de leerkracht aangeleverd).
    { id: 'in-de-rij',   niveau: 'basis',       categorie: 'situaties',   tekst: 'in de rij',      kort: 'in de rij',   beeld: '🚶', picto: 'klas/in_de_rij.png',   zin: 'Wij staan in de rij.' },
    { id: 'stil-zijn',   niveau: 'basis',       categorie: 'situaties',   tekst: 'stil zijn',      kort: 'stil zijn',   beeld: '🤫', picto: 'klas/stil_zijn.png',   zin: 'In de klas moet je stil zijn.' }
  ]
};