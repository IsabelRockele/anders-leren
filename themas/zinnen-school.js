// =================================================================
//  Thema: Op school (zinnen) — uitgebreid
//  Functionele zinnen voor in de klas
// =================================================================
window.THEMA_ZINNEN_SCHOOL = {
  id: 'z-school',
  type: 'zinnen',
  naam: 'Op school',
  emoji: '🏫',
  kleur: '#FF8C42',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — overlevingsnederlands ==========
    { id: 's-naam',     niveau: 'basis', tekst: 'Ik heet ...',                kort: 'ik heet',     beeld: '👋', zin: 'Hallo, ik heet Sara.' },
    { id: 's-toilet',   niveau: 'basis', tekst: 'Mag ik naar het toilet?',    kort: 'naar toilet', beeld: '🚽', zin: 'Juf, mag ik naar het toilet?' },
    { id: 's-drinken',  niveau: 'basis', tekst: 'Mag ik drinken?',            kort: 'drinken',     beeld: '🥤', zin: 'Juf, mag ik drinken?' },
    { id: 's-klaar',    niveau: 'basis', tekst: 'Ik ben klaar.',              kort: 'klaar',       beeld: '✅', zin: 'Juf, ik ben klaar.' },
    { id: 's-niet',     niveau: 'basis', tekst: 'Ik begrijp het niet.',       kort: 'niet snap',   beeld: '🤔', zin: 'Juf, ik begrijp het niet.' },
    { id: 's-help',     niveau: 'basis', tekst: 'Kan je mij helpen?',         kort: 'helpen',      beeld: '🙋', zin: 'Juf, kan je mij helpen?' },
    { id: 's-ja',       niveau: 'basis', tekst: 'Ja.',                        kort: 'ja',          beeld: '👍', zin: 'Ja, dat klopt.' },
    { id: 's-nee',      niveau: 'basis', tekst: 'Nee.',                       kort: 'nee',         beeld: '👎', zin: 'Nee, dat is niet juist.' },
    { id: 's-weet-niet',niveau: 'basis', tekst: 'Ik weet het niet.',          kort: 'weet niet',   beeld: '🤷', zin: 'Sorry juf, ik weet het niet.' },
    { id: 's-goedemorgen', niveau: 'basis', tekst: 'Goedemorgen!',             kort: 'morgen',      beeld: '☀️', zin: 'Goedemorgen juf!' },

    // ========== UITBREIDING — vragen stellen ==========
    { id: 's-langzaam', niveau: 'uitbreiding', tekst: 'Wil je langzamer praten?',   kort: 'langzaam',    beeld: '🐢', zin: 'Juf, wil je langzamer praten?' },
    { id: 's-nogmaals', niveau: 'uitbreiding', tekst: 'Wil je het nog eens zeggen?',kort: 'nog eens',    beeld: '🔁', zin: 'Juf, wil je het nog eens zeggen?' },
    { id: 's-opnieuw',  niveau: 'uitbreiding', tekst: 'Mag ik het opnieuw doen?',   kort: 'opnieuw',     beeld: '🔁', zin: 'Juf, mag ik het opnieuw doen?' },
    { id: 's-papier',   niveau: 'uitbreiding', tekst: 'Mag ik een blad papier?',    kort: 'papier',      beeld: '📄', zin: 'Juf, mag ik een blad papier?' },
    { id: 's-potlood',  niveau: 'uitbreiding', tekst: 'Mag ik een potlood lenen?',  kort: 'potlood lenen', beeld: '✏️', zin: 'Juf, mag ik een potlood lenen?' },
    { id: 's-vergeten', niveau: 'uitbreiding', tekst: 'Ik ben mijn boek vergeten.', kort: 'boek vergeten', beeld: '🤦', zin: 'Sorry juf, ik ben mijn boek vergeten.' },
    { id: 's-ziek',     niveau: 'uitbreiding', tekst: 'Ik voel mij niet goed.',     kort: 'niet goed',     beeld: '🤒', zin: 'Juf, ik voel mij niet goed.' },

    // ========== UITBREIDING — klasinstructies begrijpen (passief) ==========
    { id: 's-zitten',   niveau: 'uitbreiding', tekst: 'Ga zitten.',                 kort: 'ga zitten',   beeld: '🪑', zin: 'Iedereen, ga nu zitten.' },
    { id: 's-stilte',   niveau: 'uitbreiding', tekst: 'Stilte alstublieft.',        kort: 'stilte',      beeld: '🤫', zin: 'Stilte alstublieft, kinderen.' },
    { id: 's-luisteren',niveau: 'uitbreiding', tekst: 'Luister goed.',              kort: 'luister',     beeld: '👂', zin: 'Luister goed naar de juf.' },
    { id: 's-kijken',   niveau: 'uitbreiding', tekst: 'Kijk naar het bord.',        kort: 'naar bord',   beeld: '👁️', zin: 'Kinderen, kijk naar het bord.' },
    { id: 's-pak-boek', niveau: 'uitbreiding', tekst: 'Pak je boek.',               kort: 'pak boek',    beeld: '📖', zin: 'Pak nu je boek erbij.' },
    { id: 's-rij',      niveau: 'uitbreiding', tekst: 'Sta in de rij.',             kort: 'in de rij',   beeld: '🚶', zin: 'Sta netjes in de rij.' },

    // ========== VERDIEPING — meer geavanceerd ==========
    { id: 's-mijn-beurt',niveau: 'verdieping', tekst: 'Het is mijn beurt.',         kort: 'mijn beurt',   beeld: '☝️', zin: 'Juf, het is mijn beurt.' },
    { id: 's-vraag',    niveau: 'verdieping', tekst: 'Ik heb een vraag.',          kort: 'vraag',        beeld: '❓', zin: 'Juf, ik heb een vraag.' },
    { id: 's-mag-zo',   niveau: 'verdieping', tekst: 'Mag ik dit zo doen?',        kort: 'zo doen',      beeld: '🤔', zin: 'Juf, mag ik dit zo doen?' },
    { id: 's-niet-juist',niveau: 'verdieping', tekst: 'Dat is niet juist.',         kort: 'niet juist',   beeld: '❌', zin: 'Juf, dit is volgens mij niet juist.' },
    { id: 's-zoek',     niveau: 'verdieping', tekst: 'Ik zoek mijn ...',           kort: 'ik zoek',      beeld: '🔍', zin: 'Juf, ik zoek mijn schaar.' },
    { id: 's-deel',     niveau: 'verdieping', tekst: 'Mag ik delen met ...?',      kort: 'delen',        beeld: '🤝', zin: 'Juf, mag ik delen met Ali?' },
    { id: 's-mee',      niveau: 'verdieping', tekst: 'Mag ik meedoen?',            kort: 'meedoen',      beeld: '🙌', zin: 'Mogen wij ook meedoen?' },
  ]
};
