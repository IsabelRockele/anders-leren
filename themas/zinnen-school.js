// =================================================================
//  Thema: Op school (zinnen) — herwerkt
//  Functionele zinnen voor in de klas. Alles op niveau 'basis'.
// =================================================================
window.THEMA_ZINNEN_SCHOOL = {
  id: 'z-school',
  type: 'zinnen',
  naam: 'Op school',
  emoji: '🏫',
  kleur: '#FF8C42',
  niveaus: ['basis'],
  items: [
    // ========== JEZELF VOORSTELLEN ==========
    { id: 's-naam',       niveau: 'basis', tekst: 'Ik heet ...',                 kort: 'ik heet',       beeld: '👋', zin: 'Hallo, ik heet Sara.' },

    // ========== BASISVRAGEN IN DE KLAS ==========
    { id: 's-toilet',     niveau: 'basis', tekst: 'Mag ik naar het toilet?',     kort: 'naar toilet',   beeld: '🚽', zin: 'Juf, mag ik naar het toilet?' },
    { id: 's-drinken',    niveau: 'basis', tekst: 'Mag ik drinken?',             kort: 'drinken',       beeld: '🥤', zin: 'Juf, mag ik drinken?' },
    { id: 's-help',       niveau: 'basis', tekst: 'Kan je mij helpen?',          kort: 'helpen',        beeld: '🙋', zin: 'Juf, kan je mij helpen?' },
    { id: 's-vraag',      niveau: 'basis', tekst: 'Ik heb een vraag.',           kort: 'vraag',         beeld: '❓', zin: 'Juf, ik heb een vraag.' },
    { id: 's-mag-zo',     niveau: 'basis', tekst: 'Mag ik dit zo doen?',         kort: 'zo doen',       beeld: '🤔', zin: 'Juf, mag ik dit zo doen?' },
    { id: 's-papier',     niveau: 'basis', tekst: 'Mag ik een blad papier?',     kort: 'papier',        beeld: '📄', zin: 'Juf, mag ik een blad papier?' },
    { id: 's-potlood',    niveau: 'basis', tekst: 'Mag ik een potlood lenen?',   kort: 'potlood lenen', beeld: '✏️', zin: 'Juf, mag ik een potlood lenen?' },
    { id: 's-opnieuw',    niveau: 'basis', tekst: 'Mag ik het opnieuw doen?',    kort: 'opnieuw',       beeld: '🔁', zin: 'Juf, mag ik het opnieuw doen?' },

    // ========== JA / NEE / KLAAR ==========
    { id: 's-ja',         niveau: 'basis', tekst: 'Ja.',                         kort: 'ja',            beeld: '👍', zin: 'Ja, dat klopt.' },
    { id: 's-nee',        niveau: 'basis', tekst: 'Nee.',                        kort: 'nee',           beeld: '👎', zin: 'Nee, dat is niet juist.' },
    { id: 's-klaar',      niveau: 'basis', tekst: 'Ik ben klaar.',               kort: 'klaar',         beeld: '✅', zin: 'Juf, ik ben klaar.' },
    { id: 's-mijn-beurt', niveau: 'basis', tekst: 'Het is mijn beurt.',          kort: 'mijn beurt',    beeld: '☝️', zin: 'Juf, het is mijn beurt.' },

    // ========== NIET BEGRIJPEN / NIET WETEN ==========
    { id: 's-niet',       niveau: 'basis', tekst: 'Ik begrijp het niet.',        kort: 'niet snap',     beeld: '🤔', zin: 'Juf, ik begrijp het niet.' },
    { id: 's-weet-niet',  niveau: 'basis', tekst: 'Ik weet het niet.',           kort: 'weet niet',     beeld: '🤷', zin: 'Sorry juf, ik weet het niet.' },
    { id: 's-langzaam',   niveau: 'basis', tekst: 'Wil je langzamer praten?',    kort: 'langzaam',      beeld: '🐢', zin: 'Juf, wil je langzamer praten?' },
    { id: 's-nogmaals',   niveau: 'basis', tekst: 'Wil je het nog eens zeggen?', kort: 'nog eens',      beeld: '🔁', zin: 'Juf, wil je het nog eens zeggen?' },

    // ========== VERGETEN / NIET GOED ==========
    { id: 's-vergeten',   niveau: 'basis', tekst: 'Ik ben mijn boek vergeten.',  kort: 'boek vergeten', beeld: '🤦', zin: 'Sorry juf, ik ben mijn boek vergeten.' },
    { id: 's-ziek',       niveau: 'basis', tekst: 'Ik voel mij niet goed.',      kort: 'niet goed',     beeld: '🤒', zin: 'Juf, ik voel mij niet goed.' },
    { id: 's-zoek',       niveau: 'basis', tekst: 'Ik zoek mijn ...',            kort: 'ik zoek',       beeld: '🔍', zin: 'Juf, ik zoek mijn schaar.' },

    // ========== KLASINSTRUCTIES (begrijpen) ==========
    { id: 's-zitten',     niveau: 'basis', tekst: 'Ga zitten.',                  kort: 'ga zitten',     beeld: '🪑', zin: 'Iedereen, ga nu zitten.' },
    { id: 's-stilte',     niveau: 'basis', tekst: 'Stilte alstublieft.',         kort: 'stilte',        beeld: '🤫', zin: 'Stilte alstublieft, kinderen.' },
    { id: 's-luisteren',  niveau: 'basis', tekst: 'Luister goed.',               kort: 'luister',       beeld: '👂', zin: 'Luister goed naar de juf.' },
    { id: 's-kijken',     niveau: 'basis', tekst: 'Kijk naar het bord.',         kort: 'naar bord',     beeld: '👁️', zin: 'Kinderen, kijk naar het bord.' },
    { id: 's-pak-boek',   niveau: 'basis', tekst: 'Pak je boek.',                kort: 'pak boek',      beeld: '📖', zin: 'Pak nu je boek erbij.' },
    { id: 's-rij',        niveau: 'basis', tekst: 'Sta in de rij.',              kort: 'in de rij',     beeld: '🚶', zin: 'Sta netjes in de rij.' },

    // ========== SAMEN MET ANDEREN ==========
    { id: 's-deel',       niveau: 'basis', tekst: 'Mag ik delen met ...?',       kort: 'delen',         beeld: '🤝', zin: 'Juf, mag ik delen met Ali?' },
    { id: 's-mee',        niveau: 'basis', tekst: 'Mag ik meedoen?',             kort: 'meedoen',       beeld: '🙌', zin: 'Mogen wij ook meedoen?' },
  ]
};
