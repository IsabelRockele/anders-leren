// =================================================================
//  Survival-thema: In de klas
//  Wat het kind dagelijks in de klas hoort en zegt
//  Type 'gemengd' = combinatie van woorden en zinnen
//
//  Veel items krijgen dezelfde PNG als in 'klas-en-schoolspullen'.
//  Picto-paden verwijzen naar /picto/klas/<bestand>.png — als er
//  geen PNG is, valt het systeem terug op de emoji uit 'beeld'.
// =================================================================
window.THEMA_SURVIVAL_KLAS = {
  id: 's-klas',
  type: 'gemengd',
  categorie: 'survival',
  naam: 'Klas',
  emoji: '🏫',
  kleur: '#FF8C42',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — schoolwerk-acties (werkwoorden van elke dag) ==========
    { id: 'sk-werken',    niveau: 'basis', soort: 'woord', tekst: 'werken',     kort: 'werken',     beeld: '✏️', picto: 'klas/werken.png',    zin: 'Wij gaan nu werken.' },
    { id: 'sk-schrijven', niveau: 'basis', soort: 'woord', tekst: 'schrijven',  kort: 'schrijven',  beeld: '✍️', picto: 'klas/schrijven.png', zin: 'Schrijf je naam.' },
    { id: 'sk-lezen',     niveau: 'basis', soort: 'woord', tekst: 'lezen',      kort: 'lezen',      beeld: '📖', picto: 'klas/lezen.png',     zin: 'Lees deze zin.' },
    { id: 'sk-rekenen',   niveau: 'basis', soort: 'woord', tekst: 'rekenen',    kort: 'rekenen',    beeld: '🧮', picto: 'klas/rekenen.png',   zin: 'Wij gaan rekenen.' },
    { id: 'sk-tekenen',   niveau: 'basis', soort: 'woord', tekst: 'tekenen',    kort: 'tekenen',    beeld: '🎨', zin: 'Teken een huis.' },
    { id: 'sk-kleuren',   niveau: 'basis', soort: 'woord', tekst: 'kleuren',    kort: 'kleuren',    beeld: '🖍️', picto: 'klas/kleuren.png',   zin: 'Kleur de bloem rood.' },
    { id: 'sk-knippen',   niveau: 'basis', soort: 'woord', tekst: 'knippen',    kort: 'knippen',    beeld: '✂️', picto: 'klas/knippen.png',   zin: 'Knip langs de lijn.' },
    { id: 'sk-plakken',   niveau: 'basis', soort: 'woord', tekst: 'plakken',    kort: 'plakken',    beeld: '🧴', zin: 'Plak het in je schrift.' },
    { id: 'sk-luisteren', niveau: 'basis', soort: 'woord', tekst: 'luisteren',  kort: 'luisteren',  beeld: '👂', picto: 'klas/luisteren.png', zin: 'Luister goed naar de juf.' },
    { id: 'sk-kijken',    niveau: 'basis', soort: 'woord', tekst: 'kijken',     kort: 'kijken',     beeld: '👀', picto: 'klas/kijken.png',    zin: 'Kijk naar het bord.' },

    // ========== UITBREIDING — boeken & spullen ==========
    { id: 'sk-rekenboek', niveau: 'uitbreiding', soort: 'woord', tekst: 'het rekenboek',    kort: 'rekenboek',     beeld: '🧮', picto: 'klas/rekenboek.png',  zin: 'Neem je rekenboek.' },
    { id: 'sk-taalboek',  niveau: 'uitbreiding', soort: 'woord', tekst: 'het taalboek',     kort: 'taalboek',      beeld: '📕', picto: 'klas/taalboek.png',   zin: 'Neem je taalboek.' },
    { id: 'sk-leesboek',  niveau: 'uitbreiding', soort: 'woord', tekst: 'het leesboek',     kort: 'leesboek',      beeld: '📗', picto: 'klas/leesboek.png',   zin: 'Neem je leesboek.' },
    { id: 'sk-schrift',   niveau: 'uitbreiding', soort: 'woord', tekst: 'het schrift',      kort: 'schrift',       beeld: '📓', picto: 'klas/schrift.png',    zin: 'Open je schrift.' },
    { id: 'sk-blad',      niveau: 'uitbreiding', soort: 'woord', tekst: 'het blad',         kort: 'blad',          beeld: '📄', zin: 'Pak een blad papier.' },
    { id: 'sk-bladzijde', niveau: 'uitbreiding', soort: 'woord', tekst: 'de bladzijde',     kort: 'bladzijde',     beeld: '📑', zin: 'Open op bladzijde tien.' },
    { id: 'sk-taak',      niveau: 'uitbreiding', soort: 'woord', tekst: 'de taak',          kort: 'taak',          beeld: '📋', zin: 'Hier is jouw taak.' },
    { id: 'sk-bord',      niveau: 'uitbreiding', soort: 'woord', tekst: 'het bord',         kort: 'bord',          beeld: '🖼️', picto: 'klas/bord.png',       zin: 'Op het bord staat het antwoord.' },

    // ========== UITBREIDING — klastaal van de juf/meester (hoor-zinnen) ==========
    { id: 'sk-zit',       niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Ga zitten.',                    kort: 'ga zitten',    beeld: '🪑', picto: 'klas/zitten.png',         zin: 'Iedereen, ga nu zitten.' },
    { id: 'sk-stilte',    niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Stilte alstublieft.',           kort: 'stilte',       beeld: '🤫', picto: 'klas/stil_zijn.png',      zin: 'Stilte alstublieft, kinderen.' },
    { id: 'sk-luister-z', niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Luister goed.',                 kort: 'luister goed', beeld: '👂', picto: 'klas/luisteren.png',      zin: 'Luister goed naar mij.' },
    { id: 'sk-pak-boek',  niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Neem je boek.',                 kort: 'neem boek',    beeld: '📖', picto: 'klas/leesboek.png',       zin: 'Neem allemaal je boek.' },
    { id: 'sk-jas',       niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Hang je jas aan de kapstok.',   kort: 'jas kapstok',  beeld: '🧥', picto: 'klas/kapstok.png',        zin: 'Hang je jas aan de kapstok.' },

    // ========== VERDIEPING — meer schoolspullen & klastaal ==========
    { id: 'sk-agenda',    niveau: 'verdieping', soort: 'woord',   tekst: 'de agenda',          kort: 'agenda',         beeld: '📅', picto: 'klas/agenda.png',     zin: 'Schrijf in je agenda.' },
    { id: 'sk-map',       niveau: 'verdieping', soort: 'woord',   tekst: 'de map',             kort: 'map',            beeld: '📁', picto: 'klas/map.png',        zin: 'Pak je gele map.' },
    { id: 'sk-beurt',     niveau: 'verdieping', soort: 'woord',   tekst: 'vinger opsteken',    kort: 'vinger opsteken', beeld: '☝️', zin: 'Steek je vinger op als je iets wil zeggen.' },
    { id: 'sk-opdracht',  niveau: 'verdieping', soort: 'woord',   tekst: 'de opdracht',        kort: 'opdracht',       beeld: '📝', zin: 'Lees de opdracht goed.' },
    { id: 'sk-juist',     niveau: 'verdieping', soort: 'woord',   tekst: 'juist',              kort: 'juist',          beeld: '✅', zin: 'Dat is juist!' },
    { id: 'sk-fout',      niveau: 'verdieping', soort: 'woord',   tekst: 'fout',               kort: 'fout',           beeld: '❌', zin: 'Hier staat een fout.' },
    { id: 'sk-klaar',     niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Ik ben klaar.',      kort: 'ik ben klaar',   beeld: '✅', zin: 'Juf, ik ben klaar.' },

    // ========== VERDIEPING — meer hoor-zinnen ==========
    { id: 'sk-rij',       niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Maak een rij.',                kort: 'maak rij',       beeld: '🚶', picto: 'klas/in_de_rij.png',         zin: 'Maak nu een rij aan de deur.' },
    { id: 'sk-stoel',     niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Sta achter je stoel.',         kort: 'achter stoel',   beeld: '🪑', picto: 'klas/achter_de_stoel.png',   zin: 'Iedereen achter je stoel staan.' },
    { id: 'sk-kijk-bord', niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Kijk naar het bord.',          kort: 'kijk bord',      beeld: '🖼️', picto: 'klas/bord.png',              zin: 'Kinderen, kijk naar het bord.' },
    { id: 'sk-kom',       niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Kom hier.',                    kort: 'kom hier',       beeld: '👉', zin: 'Mohammed, kom even hier.' },
    { id: 'sk-vinger',    niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Vinger op de mond.',           kort: 'vinger mond',    beeld: '🤫', picto: 'klas/stil_zijn.png',         zin: 'Vinger op de mond, alstublieft.' },

    // ========== VERDIEPING — zelf-zinnen (zeg-zinnen) ==========
    { id: 'sk-snapniet',  niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Ik snap het niet.',            kort: 'snap niet',      beeld: '🤔', zin: 'Sorry juf, ik snap het niet.' },
  ]
};