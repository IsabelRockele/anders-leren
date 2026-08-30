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
  visueleOefening: 'hulpzinnen',
  niveaus: ['basis'],
  categorieen: ['lichaam-behoeften', 'hulp-vragen', 'beleefd', 'jezelf', 'gevoel'],
  items: [
    // ========== 🆘 LICHAAMSBEHOEFTEN — wat een kind écht nu moet kunnen zeggen ==========
    { id: 'sp-toilet',     niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Mag ik naar het toilet?',  kort: 'naar toilet', beeld: '🚽', foto: 'assets/hulpzinnen/mag-ik-naar-het-toilet.png', zinPicto: 'assets/hulpzinnen/mag-ik-naar-het-toilet.png', zin: 'Juf, mag ik naar het toilet?' },
    { id: 'sp-honger',     niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb honger.',           kort: 'honger',      beeld: '🍽️', foto: 'assets/zinsbeelden/ik-heb-honger.png', zinPicto: 'assets/zinsbeelden/ik-heb-honger.png', zin: 'Juf, ik heb honger.' },
    { id: 'sp-dorst',      niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb dorst.',            kort: 'dorst',       beeld: '💧', foto: 'assets/zinsbeelden/ik-heb-dorst.png', zinPicto: 'assets/zinsbeelden/ik-heb-dorst.png', zin: 'Juf, ik heb dorst.' },
    { id: 'sp-moe',        niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik ben moe.',              kort: 'moe',         beeld: '😴', foto: 'assets/zinsbeelden/ik-ben-moe.png', zinPicto: 'assets/zinsbeelden/ik-ben-moe.png', zin: 'Juf, ik ben moe.' },
    { id: 'sp-pijn',       niveau: 'basis', categorie: 'lichaam-behoeften', soort: 'zin-zeg',
      tekst: 'Ik heb pijn.',             kort: 'pijn',        beeld: '🤕', foto: 'assets/zinsbeelden/ik-heb-pijn.png', zinPicto: 'assets/zinsbeelden/ik-heb-pijn.png', zin: 'Juf, ik heb pijn.' },

    // ========== ❓ HULP & ONBEGRIP ==========
    { id: 'sp-snap-niet',  niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Ik snap het niet.',        kort: 'snap niet',   beeld: '🤔', foto: 'assets/hulpzinnen/ik-begrijp-het-niet.png', zinPicto: 'assets/hulpzinnen/ik-begrijp-het-niet.png', zin: 'Sorry, ik snap het niet.' },
    { id: 'sp-help',       niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Help mij.',                kort: 'help mij',    beeld: '🆘', foto: 'assets/zinsbeelden/help-mij.png', zinPicto: 'assets/zinsbeelden/help-mij.png', zin: 'Juf, help mij.' },
    { id: 'sp-weet-niet',  niveau: 'basis', categorie: 'hulp-vragen', soort: 'zin-zeg',
      tekst: 'Ik weet het niet.',        kort: 'weet niet',   beeld: '🤷', foto: 'assets/zinsbeelden/ik-weet-het-niet.png', zinPicto: 'assets/zinsbeelden/ik-weet-het-niet.png', zin: 'Sorry, ik weet het niet.' },

    // ========== 👋 BELEEFD — eerste sociale woorden ==========
    { id: 'sp-hallo',      niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'hallo',                    kort: 'hallo',       beeld: '👋', foto: 'assets/zinsbeelden/hallo.png', zinPicto: 'assets/zinsbeelden/hallo.png', zin: 'Hallo juf!' },
    { id: 'sp-dag',        niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'dag',                      kort: 'dag',         beeld: '👋', foto: 'assets/zinsbeelden/dag-tot-morgen.png', zinPicto: 'assets/zinsbeelden/dag-tot-morgen.png', zin: 'Dag, tot morgen!' },
    { id: 'sp-dankjewel',  niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'dankjewel',                kort: 'dankjewel',   beeld: '🙏', foto: 'assets/zinsbeelden/dankjewel.png', zinPicto: 'assets/zinsbeelden/dankjewel.png', zin: 'Dankjewel voor je hulp.' },
    { id: 'sp-alsjeblieft',niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'alsjeblieft',              kort: 'alsjeblieft', beeld: '🤲', foto: 'assets/zinsbeelden/alsjeblieft.png', zinPicto: 'assets/zinsbeelden/alsjeblieft.png', zin: 'Hier, alsjeblieft.' },
    { id: 'sp-sorry',      niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'sorry',                    kort: 'sorry',       beeld: '😔', foto: 'assets/zinsbeelden/sorry.png', zinPicto: 'assets/zinsbeelden/sorry.png', zin: 'Sorry, dat was niet de bedoeling.' },
    { id: 'sp-ja',         niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'ja',                       kort: 'ja',          beeld: '👍', foto: 'assets/zinsbeelden/ja.png', zinPicto: 'assets/zinsbeelden/ja.png', zin: 'Ja, dat klopt.' },
    { id: 'sp-nee',        niveau: 'basis', categorie: 'beleefd', soort: 'woord',
      tekst: 'nee',                      kort: 'nee',         beeld: '👎', foto: 'assets/zinsbeelden/nee.png', zinPicto: 'assets/zinsbeelden/nee.png', zin: 'Nee, dat is niet juist.' },

    // ========== 🙋 JEZELF VOORSTELLEN ==========
    { id: 'sp-naam',       niveau: 'basis', categorie: 'jezelf', soort: 'zin-zeg',
      tekst: 'Ik heet ...',              kort: 'ik heet',     beeld: '👤', foto: 'assets/zinsbeelden/ik-heet.png', zinPicto: 'assets/zinsbeelden/ik-heet.png', zin: 'Hallo, ik heet Sara.', knipZin: 'Ik heet Sara.', zinsdelen: [{tekst:'Ik',rol:'wie'},{tekst:'heet',rol:'doet'},{tekst:'Sara',rol:'wat'}] },
    { id: 'sp-mama',       niveau: 'basis', categorie: 'jezelf', soort: 'woord',
      tekst: 'mama',                     kort: 'mama',        beeld: '👩', foto: 'assets/zinsbeelden/mama-brengt-mij-naar-school.png', zinPicto: 'assets/zinsbeelden/mama-brengt-mij-naar-school.png', zin: 'Mama brengt mij naar school.' },
    { id: 'sp-papa',       niveau: 'basis', categorie: 'jezelf', soort: 'woord',
      tekst: 'papa',                     kort: 'papa',        beeld: '👨', foto: 'assets/zinsbeelden/papa-komt-mij-ophalen.png', zinPicto: 'assets/zinsbeelden/papa-komt-mij-ophalen.png', zin: 'Papa komt mij ophalen.' },

    // ========== ❤️ GEVOEL UITDRUKKEN ==========
    { id: 'sp-ziek',       niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik ben ziek.',             kort: 'ziek',        beeld: '🤒', foto: 'assets/zinsbeelden/ik-ben-ziek.png', zinPicto: 'assets/zinsbeelden/ik-ben-ziek.png', zin: 'Juf, ik ben ziek.' },
    { id: 'sp-bang',       niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik ben bang.',             kort: 'bang',        beeld: '😨', foto: 'assets/zinsbeelden/ik-ben-bang.png', zinPicto: 'assets/zinsbeelden/ik-ben-bang.png', zin: 'Ik ben een beetje bang.' },
    { id: 'sp-mis-mama',   niveau: 'basis', categorie: 'gevoel', soort: 'zin-zeg',
      tekst: 'Ik mis mijn mama.',        kort: 'mis mama',    beeld: '💔', foto: 'assets/zinsbeelden/ik-mis-mijn-mama.png', zinPicto: 'assets/zinsbeelden/ik-mis-mijn-mama.png', zin: 'Juf, ik mis mijn mama.' },
  ]
};
