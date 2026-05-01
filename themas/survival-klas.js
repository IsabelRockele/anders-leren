// =================================================================
//  Survival-thema: In de klas
//  Wat het kind dagelijks in de klas hoort en zegt
//  Type 'gemengd' = combinatie van woorden en zinnen
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
    { id: 'sk-werken',    niveau: 'basis', soort: 'woord', tekst: 'werken',     kort: 'werken',     beeld: '✏️', zin: 'Wij gaan nu werken.' },
    { id: 'sk-schrijven', niveau: 'basis', soort: 'woord', tekst: 'schrijven',  kort: 'schrijven',  beeld: '✍️', zin: 'Schrijf je naam.' },
    { id: 'sk-lezen',     niveau: 'basis', soort: 'woord', tekst: 'lezen',      kort: 'lezen',      beeld: '📖', zin: 'Lees deze zin.' },
    { id: 'sk-rekenen',   niveau: 'basis', soort: 'woord', tekst: 'rekenen',    kort: 'rekenen',    beeld: '🧮', zin: 'Wij gaan rekenen.' },
    { id: 'sk-tekenen',   niveau: 'basis', soort: 'woord', tekst: 'tekenen',    kort: 'tekenen',    beeld: '🎨', zin: 'Teken een huis.' },
    { id: 'sk-kleuren',   niveau: 'basis', soort: 'woord', tekst: 'kleuren',    kort: 'kleuren',    beeld: '🖍️', zin: 'Kleur de bloem rood.' },
    { id: 'sk-knippen',   niveau: 'basis', soort: 'woord', tekst: 'knippen',    kort: 'knippen',    beeld: '✂️', zin: 'Knip langs de lijn.' },
    { id: 'sk-plakken',   niveau: 'basis', soort: 'woord', tekst: 'plakken',    kort: 'plakken',    beeld: '🧴', zin: 'Plak het in je schrift.' },
    { id: 'sk-luisteren', niveau: 'basis', soort: 'woord', tekst: 'luisteren',  kort: 'luisteren',  beeld: '👂', zin: 'Luister goed naar de juf.' },
    { id: 'sk-kijken',    niveau: 'basis', soort: 'woord', tekst: 'kijken',     kort: 'kijken',     beeld: '👀', zin: 'Kijk naar het bord.' },

    // ========== UITBREIDING — boeken & spullen ==========
    { id: 'sk-boek',      niveau: 'uitbreiding', soort: 'woord', tekst: 'het boek',         kort: 'boek',          beeld: '📖', zin: 'Pak je boek.' },
    { id: 'sk-rekenboek', niveau: 'uitbreiding', soort: 'woord', tekst: 'het rekenboek',    kort: 'rekenboek',     beeld: '🧮', zin: 'Neem je rekenboek.' },
    { id: 'sk-taalboek',  niveau: 'uitbreiding', soort: 'woord', tekst: 'het taalboek',     kort: 'taalboek',      beeld: '📕', zin: 'Neem je taalboek.' },
    { id: 'sk-leesboek',  niveau: 'uitbreiding', soort: 'woord', tekst: 'het leesboek',     kort: 'leesboek',      beeld: '📗', zin: 'Neem je leesboek.' },
    { id: 'sk-schrift',   niveau: 'uitbreiding', soort: 'woord', tekst: 'het schrift',      kort: 'schrift',       beeld: '📓', zin: 'Open je schrift.' },
    { id: 'sk-blad',      niveau: 'uitbreiding', soort: 'woord', tekst: 'het blad',         kort: 'blad',          beeld: '📄', zin: 'Pak een blad papier.' },
    { id: 'sk-bladzijde', niveau: 'uitbreiding', soort: 'woord', tekst: 'de bladzijde',     kort: 'bladzijde',     beeld: '📑', zin: 'Open op bladzijde tien.' },
    { id: 'sk-oefening',  niveau: 'uitbreiding', soort: 'woord', tekst: 'de oefening',      kort: 'oefening',      beeld: '🎯', zin: 'Maak deze oefening.' },
    { id: 'sk-taak',      niveau: 'uitbreiding', soort: 'woord', tekst: 'de taak',          kort: 'taak',          beeld: '📋', zin: 'Hier is jouw taak.' },
    { id: 'sk-bord',      niveau: 'uitbreiding', soort: 'woord', tekst: 'het bord',         kort: 'bord',          beeld: '🖼️', zin: 'Op het bord staat het antwoord.' },

    // ========== UITBREIDING — klastaal van de juf/meester (hoor-zinnen) ==========
    { id: 'sk-zit',       niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Ga zitten.',                    kort: 'ga zitten',    beeld: '🪑', zin: 'Iedereen, ga nu zitten.' },
    { id: 'sk-sta',       niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Sta op.',                       kort: 'sta op',       beeld: '🧍', zin: 'Sta nu allemaal op.' },
    { id: 'sk-stilte',    niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Stilte alstublieft.',           kort: 'stilte',       beeld: '🤫', zin: 'Stilte alstublieft, kinderen.' },
    { id: 'sk-luister-z', niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Luister goed.',                 kort: 'luister goed', beeld: '👂', zin: 'Luister goed naar mij.' },
    { id: 'sk-pak-boek',  niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Neem je boek.',                 kort: 'neem boek',    beeld: '📖', zin: 'Neem allemaal je boek.' },
    { id: 'sk-jas',       niveau: 'uitbreiding', soort: 'zin-hoor', tekst: 'Hang je jas aan de kapstok.',   kort: 'jas kapstok',  beeld: '🧥', zin: 'Hang je jas aan de kapstok.' },

    // ========== VERDIEPING — meer schoolspullen & klastaal ==========
    { id: 'sk-agenda',    niveau: 'verdieping', soort: 'woord', tekst: 'de agenda',         kort: 'agenda',     beeld: '📅', zin: 'Schrijf in je agenda.' },
    { id: 'sk-map',       niveau: 'verdieping', soort: 'woord', tekst: 'de map',            kort: 'map',        beeld: '📁', zin: 'Pak je gele map.' },
    { id: 'sk-beurt',     niveau: 'verdieping', soort: 'woord', tekst: 'de beurt',          kort: 'beurt',      beeld: '☝️', zin: 'Het is jouw beurt.' },
    { id: 'sk-opdracht',  niveau: 'verdieping', soort: 'woord', tekst: 'de opdracht',       kort: 'opdracht',   beeld: '📝', zin: 'Lees de opdracht goed.' },
    { id: 'sk-juist',     niveau: 'verdieping', soort: 'woord', tekst: 'juist',             kort: 'juist',      beeld: '✅', zin: 'Dat is juist!' },
    { id: 'sk-fout',      niveau: 'verdieping', soort: 'woord', tekst: 'fout',              kort: 'fout',       beeld: '❌', zin: 'Hier staat een fout.' },
    { id: 'sk-klaar',     niveau: 'verdieping', soort: 'woord', tekst: 'klaar',             kort: 'klaar',      beeld: '🏁', zin: 'Ben je al klaar?' },

    // ========== VERDIEPING — meer hoor-zinnen ==========
    { id: 'sk-rij',       niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Maak een rij.',                kort: 'maak rij',       beeld: '🚶', zin: 'Maak nu een rij aan de deur.' },
    { id: 'sk-stoel',     niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Sta achter je stoel.',         kort: 'achter stoel',   beeld: '🪑', zin: 'Iedereen achter je stoel staan.' },
    { id: 'sk-open',      niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Sla je boek open.',            kort: 'boek open',      beeld: '📖', zin: 'Sla je boek open op bladzijde 12.' },
    { id: 'sk-kijk-bord', niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Kijk naar het bord.',          kort: 'kijk bord',      beeld: '🖼️', zin: 'Kinderen, kijk naar het bord.' },
    { id: 'sk-kom',       niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Kom hier.',                    kort: 'kom hier',       beeld: '👉', zin: 'Mohammed, kom even hier.' },
    { id: 'sk-vinger',    niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Vinger op de mond.',           kort: 'vinger mond',    beeld: '🤫', zin: 'Vinger op de mond, alstublieft.' },

    // ========== VERDIEPING — zelf-zinnen (zeg-zinnen) ==========
    { id: 'sk-ikklaar',   niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Ik ben klaar.',                kort: 'ik klaar',       beeld: '✅', zin: 'Juf, ik ben klaar.' },
    { id: 'sk-magbeg',    niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Mag ik beginnen?',             kort: 'mag beginnen',   beeld: '🙋', zin: 'Juf, mag ik beginnen?' },
    { id: 'sk-snapniet',  niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Ik snap het niet.',            kort: 'snap niet',      beeld: '🤔', zin: 'Sorry juf, ik snap het niet.' },
  ]
};
