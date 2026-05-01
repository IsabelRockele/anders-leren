// =================================================================
//  Survival-thema: Heen en terug
//  Naar school komen, naar huis gaan, ziek zijn, opgehaald worden
// =================================================================
window.THEMA_SURVIVAL_HEENTERUG = {
  id: 's-heenterug',
  type: 'gemengd',
  categorie: 'survival',
  naam: 'Heen en terug',
  emoji: '🏠→🏫',
  kleur: '#3A86FF',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — beweging tussen thuis en school ==========
    { id: 'sh-school',    niveau: 'basis', soort: 'woord', tekst: 'naar school',     kort: 'naar school',  beeld: '🏫', zin: 'Ik ga naar school.' },
    { id: 'sh-huis',      niveau: 'basis', soort: 'woord', tekst: 'naar huis',       kort: 'naar huis',    beeld: '🏠', zin: 'Ik ga naar huis.' },
    { id: 'sh-mama',      niveau: 'basis', soort: 'woord', tekst: 'mama',            kort: 'mama',         beeld: '👩', zin: 'Mama brengt mij.' },
    { id: 'sh-papa',      niveau: 'basis', soort: 'woord', tekst: 'papa',            kort: 'papa',         beeld: '👨', zin: 'Papa haalt mij op.' },
    { id: 'sh-oma',       niveau: 'basis', soort: 'woord', tekst: 'oma',             kort: 'oma',          beeld: '👵', zin: 'Oma wacht op mij.' },
    { id: 'sh-opa',       niveau: 'basis', soort: 'woord', tekst: 'opa',             kort: 'opa',          beeld: '👴', zin: 'Opa brengt mij naar school.' },
    { id: 'sh-fiets',     niveau: 'basis', soort: 'woord', tekst: 'de fiets',        kort: 'fiets',        beeld: '🚲', zin: 'Ik kom met de fiets.' },
    { id: 'sh-tevoet',    niveau: 'basis', soort: 'woord', tekst: 'te voet',         kort: 'te voet',      beeld: '🚶', zin: 'Wij gaan te voet.' },
    { id: 'sh-auto',      niveau: 'basis', soort: 'woord', tekst: 'de auto',         kort: 'auto',         beeld: '🚗', zin: 'Mama heeft een auto.' },
    { id: 'sh-bus',       niveau: 'basis', soort: 'woord', tekst: 'de bus',          kort: 'bus',          beeld: '🚌', zin: 'Ik kom met de bus.' },

    // ========== UITBREIDING — tijd & dag ==========
    { id: 'sh-vroeg',     niveau: 'uitbreiding', soort: 'woord', tekst: 'vroeg',          kort: 'vroeg',         beeld: '🌅', zin: 'Ik ben vroeg op school.' },
    { id: 'sh-laat',      niveau: 'uitbreiding', soort: 'woord', tekst: 'laat',           kort: 'laat',          beeld: '🌆', zin: 'Sorry juf, ik ben laat.' },
    { id: 'sh-telaat',    niveau: 'uitbreiding', soort: 'woord', tekst: 'te laat',        kort: 'te laat',       beeld: '⏰', zin: 'Ik ben te laat vandaag.' },
    { id: 'sh-vandaag',   niveau: 'uitbreiding', soort: 'woord', tekst: 'vandaag',        kort: 'vandaag',       beeld: '📅', zin: 'Vandaag is woensdag.' },
    { id: 'sh-morgen',    niveau: 'uitbreiding', soort: 'woord', tekst: 'morgen',         kort: 'morgen',        beeld: '➡️', zin: 'Tot morgen!' },
    { id: 'sh-gisteren',  niveau: 'uitbreiding', soort: 'woord', tekst: 'gisteren',       kort: 'gisteren',      beeld: '⬅️', zin: 'Gisteren was ik ziek.' },
    { id: 'sh-vrijdag',   niveau: 'uitbreiding', soort: 'woord', tekst: 'vrijdag',        kort: 'vrijdag',       beeld: '📅', zin: 'Op vrijdag is het zwemmen.' },
    { id: 'sh-weekend',   niveau: 'uitbreiding', soort: 'woord', tekst: 'het weekend',    kort: 'weekend',       beeld: '🎉', zin: 'In het weekend ga ik naar oma.' },

    // ========== UITBREIDING — opvang & ophalen ==========
    { id: 'sh-ophalen',   niveau: 'uitbreiding', soort: 'woord', tekst: 'ophalen',        kort: 'ophalen',       beeld: '🤝', zin: 'Mama komt mij ophalen.' },
    { id: 'sh-opvang',    niveau: 'uitbreiding', soort: 'woord', tekst: 'de opvang',      kort: 'opvang',        beeld: '🏫', zin: 'Ik ga naar de opvang.' },

    // ========== UITBREIDING — zelf-zinnen ==========
    { id: 'sh-mama-haalt',niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Mama komt mij ophalen.',     kort: 'mama haalt',    beeld: '👩', zin: 'Juf, mama komt mij ophalen om vier uur.' },
    { id: 'sh-papa-haalt',niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Papa komt mij ophalen.',     kort: 'papa haalt',    beeld: '👨', zin: 'Juf, papa komt mij ophalen.' },
    { id: 'sh-naaropvang',niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Ik ga naar de opvang.',      kort: 'naar opvang',   beeld: '🏫', zin: 'Vandaag ga ik naar de opvang.' },
    { id: 'sh-totmorgen', niveau: 'uitbreiding', soort: 'zin-zeg', tekst: 'Tot morgen!',                kort: 'tot morgen',    beeld: '👋', zin: 'Dag juf, tot morgen!' },

    // ========== VERDIEPING — ziekte & afwezigheid ==========
    { id: 'sh-ziek',      niveau: 'verdieping', soort: 'woord', tekst: 'ziek',           kort: 'ziek',          beeld: '🤒', zin: 'Ik ben ziek vandaag.' },
    { id: 'sh-koorts',    niveau: 'verdieping', soort: 'woord', tekst: 'koorts',         kort: 'koorts',        beeld: '🌡️', zin: 'Ik heb koorts.' },
    { id: 'sh-dokter',    niveau: 'verdieping', soort: 'woord', tekst: 'de dokter',      kort: 'dokter',        beeld: '👨‍⚕️', zin: 'Ik ga naar de dokter.' },
    { id: 'sh-thuis',     niveau: 'verdieping', soort: 'woord', tekst: 'thuis',          kort: 'thuis',         beeld: '🏠', zin: 'Ik blijf thuis.' },

    // ========== VERDIEPING — woensdag & vrije momenten ==========
    { id: 'sh-woensdag',  niveau: 'verdieping', soort: 'woord', tekst: 'woensdag',       kort: 'woensdag',      beeld: '📅', zin: "Op woensdag is er 's namiddags geen school." },
    { id: 'sh-vakantie',  niveau: 'verdieping', soort: 'woord', tekst: 'de vakantie',    kort: 'vakantie',      beeld: '🏖️', zin: 'Volgende week is het vakantie.' },

    // ========== VERDIEPING — meer zelf-zinnen ==========
    { id: 'sh-ikziek',    niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Ik ben ziek.',                kort: 'ik ziek',       beeld: '🤒', zin: 'Juf, ik ben ziek vandaag.' },
    { id: 'sh-magnaarhuis',niveau:'verdieping', soort: 'zin-zeg', tekst: 'Mag ik naar huis?',           kort: 'naar huis vraag',beeld: '🏠', zin: 'Juf, mag ik naar huis? Ik voel me niet goed.' },
    { id: 'sh-morgenniet',niveau: 'verdieping', soort: 'zin-zeg', tekst: 'Morgen kom ik niet.',         kort: 'morgen niet',   beeld: '❌', zin: 'Juf, morgen kom ik niet.' },

    // ========== VERDIEPING — hoor-zinnen ==========
    { id: 'sh-tassen',    niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Pak je boekentas.',          kort: 'pak tas',       beeld: '🎒', zin: 'Kinderen, pak je boekentas.' },
    { id: 'sh-jasaan-z',  niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Trek je jas aan.',           kort: 'jas aan',       beeld: '🧥', zin: 'Trek je jas aan, wij gaan naar buiten.' },
    { id: 'sh-tothuis',   niveau: 'verdieping', soort: 'zin-hoor', tekst: 'Tot thuis!',                 kort: 'tot thuis',     beeld: '🏠', zin: 'Dag schat, tot thuis!' },
  ]
};
