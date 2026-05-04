// =================================================================
//  Thema: Startpakket — voor anderstalige nieuwkomers
//  De ALLEREERSTE woorden en zinnetjes die een kind moet kunnen
//  zeggen op school als het nog geen Nederlands kent.
//
//  Bewust klein gehouden (~20 items): zo voelt het haalbaar voor
//  het kind én voor de leerkracht.
//
//  Type 'gemengd' = combinatie woorden + zin-zeg + zin-hoor.
//  Items met soort: 'zin-zeg' of 'zin-hoor' worden door pdf-engine
//  niet meegenomen in letter-puzzels (dat klopt voor zinnen).
// =================================================================
window.THEMA_STARTPAKKET = {
  id: 'startpakket',
  type: 'gemengd',
  categorie: 'startpakket',  // speciale label voor groepering in leerkracht-UI
  naam: 'Startpakket',
  emoji: '🌱',
  kleur: '#E63946',
  niveaus: ['basis'],
  categorieen: ['lichaam-behoeften', 'hulp-vragen', 'beleefd', 'jezelf', 'gevoel'],
  items: [
    // ========== 🆘 LICHAAMSBEHOEFTEN — wat een kind écht nu moet kunnen zeggen ==========
    { id: 'sp-toilet',     niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Mag ik naar het toilet?',  kort: 'naar toilet', beeld: '🚽', zin: 'Juf, mag ik naar het toilet?' },
    { id: 'sp-honger',     niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb honger.',           kort: 'honger',      beeld: '🍽️', zin: 'Juf, ik heb honger.' },
    { id: 'sp-dorst',      niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb dorst.',            kort: 'dorst',       beeld: '💧', zin: 'Juf, ik heb dorst.' },
    { id: 'sp-moe',        niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik ben moe.',              kort: 'moe',         beeld: '😴', zin: 'Juf, ik ben moe.' },
    { id: 'sp-pijn',       niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb pijn.',             kort: 'pijn',        beeld: '🤕', zin: 'Juf, ik heb pijn.' },

    // ========== ❓ HULP & ONBEGRIP ==========
    { id: 'sp-snap-niet',  niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Ik snap het niet.',        kort: 'snap niet',   beeld: '🤔', zin: 'Sorry, ik snap het niet.' },
    { id: 'sp-help',       niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Help mij.',                kort: 'help mij',    beeld: '🆘', zin: 'Juf, help mij.' },
    { id: 'sp-weet-niet',  niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Ik weet het niet.',        kort: 'weet niet',   beeld: '🤷', zin: 'Sorry, ik weet het niet.' },

    // ========== 👋 BELEEFD — eerste sociale woorden ==========
    { id: 'sp-hallo',      niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'hallo',                    kort: 'hallo',       beeld: '👋', zin: 'Hallo juf!' },
    { id: 'sp-dag',        niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'dag',                      kort: 'dag',         beeld: '👋', zin: 'Dag, tot morgen!' },
    { id: 'sp-dankjewel',  niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'dankjewel',                kort: 'dankjewel',   beeld: '🙏', zin: 'Dankjewel voor je hulp.' },
    { id: 'sp-alsjeblieft',niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'alsjeblieft',              kort: 'alsjeblieft', beeld: '🤲', zin: 'Hier, alsjeblieft.' },
    { id: 'sp-sorry',      niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'sorry',                    kort: 'sorry',       beeld: '😔', zin: 'Sorry, dat was niet de bedoeling.' },
    { id: 'sp-ja',         niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'ja',                       kort: 'ja',          beeld: '👍', zin: 'Ja, dat klopt.' },
    { id: 'sp-nee',        niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'nee',                      kort: 'nee',         beeld: '👎', zin: 'Nee, dat is niet juist.' },

    // ========== 🙋 JEZELF VOORSTELLEN ==========
    { id: 'sp-naam',       niveau: 'basis', categorie: 'jezelf', soort: 'zin-zeg',
      tekst: 'Ik heet ...',              kort: 'ik heet',     beeld: '👤', zin: 'Hallo, ik heet Sara.' },
    { id: 'sp-mama',       niveau: 'basis', categorie: 'jezelf', soort: 'woord',
      tekst: 'mama',                     kort: 'mama',        beeld: '👩', zin: 'Mama brengt mij naar school.' },
    { id: 'sp-papa',       niveau: 'basis', categorie: 'jezelf', soort: 'woord',
      tekst: 'papa',                     kort: 'papa',        beeld: '👨', zin: 'Papa komt mij ophalen.' },

    // ========== ❤️ GEVOEL UITDRUKKEN ==========
    { id: 'sp-ziek',       niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik ben ziek.',             kort: 'ziek',        beeld: '🤒', zin: 'Juf, ik ben ziek.' },
    { id: 'sp-bang',       niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik ben bang.',             kort: 'bang',        beeld: '😨', zin: 'Ik ben een beetje bang.' },
    { id: 'sp-mis-mama',   niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik mis mijn mama.',        kort: 'mis mama',    beeld: '💔', zin: 'Juf, ik mis mijn mama.' },
  ]
};
