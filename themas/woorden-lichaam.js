// =================================================================
//  Thema: Lichaam & kleding (woorden) — herwerkt
//  Alles op niveau 'basis'. Categorieën: lichaam, kleren
// =================================================================
window.THEMA_WOORDEN_LICHAAM = {
  id: 'w-lichaam',
  type: 'woorden',
  naam: 'Lichaam & kleding',
  emoji: '👕',
  kleur: '#E63946',
  visueleOefening: 'vertelplaat-thema',
  vertelplaat: {
    titel: 'Vertelplaat: lichaam & kleding',
    beeld: 'vertelplaten/lichaam-en-kleding.png',
    alt: 'Drie kinderen in de schoolvestiaire met verschillende kleren',
    werkbladItems: ['hand', 'been', 'tshirt', 'broek', 'schoenen', 'muts', 'sjaal', 'jas', 'handschoenen', 'kousen', 'kleed', 'laarzen'],
    hotspots: [
      { id: 'vp-hoofd', woord: 'het hoofd', x: 22, y: 18, rol: 'wie' },
      { id: 'vp-haar', woord: 'het haar', x: 22, y: 11, rol: 'wat' },
      { id: 'vp-oor', woord: 'het oor', x: 17, y: 24, rol: 'wat' },
      { id: 'vp-hand', woord: 'de hand', x: 10, y: 32, rol: 'wat' },
      { id: 'vp-vingers', woord: 'de vingers', x: 8, y: 27, rol: 'wat' },
      { id: 'vp-arm', woord: 'de arm', x: 28, y: 43, rol: 'wat' },
      { id: 'vp-been', woord: 'het been', x: 18, y: 72, rol: 'wat' },
      { id: 'vp-voet', woord: 'de voet', x: 20, y: 91, rol: 'wat' },
      { id: 'vp-tshirt', woord: 'het t-shirt', x: 22, y: 43, rol: 'wat' },
      { id: 'vp-broek', woord: 'de broek', x: 22, y: 65, rol: 'wat' },
      { id: 'vp-schoenen', woord: 'de schoenen', x: 22, y: 89, rol: 'wat' },
      { id: 'vp-muts', woord: 'de muts', x: 54, y: 12, rol: 'wat' },
      { id: 'vp-sjaal', woord: 'de sjaal', x: 53, y: 42, rol: 'wat' },
      { id: 'vp-jas', woord: 'de jas', x: 56, y: 48, rol: 'wat' },
      { id: 'vp-handschoenen', woord: 'de handschoenen', x: 67, y: 34, rol: 'wat' },
      { id: 'vp-kousen', woord: 'de kousen', x: 48, y: 70, rol: 'wat' },
      { id: 'vp-pyjama', woord: 'de pyjama', x: 39, y: 68, rol: 'wat' },
      { id: 'vp-bril', woord: 'de bril', x: 84, y: 27, rol: 'wat' },
      { id: 'vp-kleed', woord: 'het kleedje', x: 85, y: 66, rol: 'wat' },
      { id: 'vp-laarzen', woord: 'de laarzen', x: 85, y: 87, rol: 'wat' },
      { id: 'vp-zin-tshirt', woord: 'een t-shirt dragen', x: 22, y: 43, rol: 'doet', zin: 'De jongen draagt een wit t-shirt.' },
      { id: 'vp-zin-jas', woord: 'een jas dragen', x: 56, y: 48, rol: 'doet', zin: 'Het meisje draagt een gele jas.' },
      { id: 'vp-zin-handschoenen', woord: 'handschoenen dragen', x: 67, y: 34, rol: 'doet', zin: 'Het meisje draagt rode handschoenen.' },
      { id: 'vp-zin-pyjama', woord: 'de pyjama ligt op de bank', x: 39, y: 68, rol: 'doet', zin: 'De pyjama ligt op de bank.' },
      { id: 'vp-zin-laarzen', woord: 'laarzen dragen', x: 85, y: 87, rol: 'doet', zin: 'Het meisje draagt gele laarzen.' }
    ],
    bouwZinnen: [
      [{ tekst: 'De jongen', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'een wit t-shirt', rol: 'wat' }],
      [{ tekst: 'Het meisje', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'een gele jas', rol: 'wat' }],
      [{ tekst: 'Het meisje', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'rode handschoenen', rol: 'wat' }],
      [{ tekst: 'De pyjama', rol: 'wie' }, { tekst: 'ligt', rol: 'doet' }, { tekst: 'op de bank', rol: 'waar' }],
      [{ tekst: 'Het meisje', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'gele laarzen', rol: 'wat' }]
    ]
  },
  niveaus: ['basis'],
  categorieen: ['lichaam', 'kleren'],
  items: [
    // ========== LICHAAM ==========
    { id: 'hoofd',    niveau: 'basis', categorie: 'lichaam', tekst: 'het hoofd',    kort: 'hoofd',    beeld: '👤', picto: 'lichaam/hoofd.png', zinPicto: 'assets/zinsbeelden/lichaam/mijn-hoofd-doet-pijn.png', zin: 'Mijn hoofd doet pijn.', zinsdelen: [{ tekst: 'Mijn hoofd', rol: 'wie' }, { tekst: 'doet pijn', rol: 'doet' }] },
    { id: 'oog',      niveau: 'basis', categorie: 'lichaam', tekst: 'het oog',      kort: 'oog',      beeld: '👁️', picto: 'lichaam/oog.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-zie-met-mijn-oog.png', zin: 'Ik zie met mijn oog.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'zie', rol: 'doet' }, { tekst: 'met mijn oog', rol: 'wat' }] },
    { id: 'neus',     niveau: 'basis', categorie: 'lichaam', tekst: 'de neus',      kort: 'neus',     beeld: '👃', picto: 'lichaam/neus.png', zinPicto: 'assets/zinsbeelden/lichaam/mijn-neus-loopt.png', zin: 'Mijn neus loopt.', zinsdelen: [{ tekst: 'Mijn neus', rol: 'wie' }, { tekst: 'loopt', rol: 'doet' }] },
    { id: 'mond',     niveau: 'basis', categorie: 'lichaam', tekst: 'de mond',      kort: 'mond',     beeld: '👄', picto: 'lichaam/mond.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-praat-met-mijn-mond.png', zin: 'Ik praat met mijn mond.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'praat', rol: 'doet' }, { tekst: 'met mijn mond', rol: 'wat' }] },
    { id: 'oor',      niveau: 'basis', categorie: 'lichaam', tekst: 'het oor',      kort: 'oor',      beeld: '👂', picto: 'lichaam/oor.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-hoor-met-mijn-oor.png', zin: 'Ik hoor met mijn oor.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'hoor', rol: 'doet' }, { tekst: 'met mijn oor', rol: 'wat' }] },
    { id: 'hand',     niveau: 'basis', categorie: 'lichaam', tekst: 'de hand',      kort: 'hand',     beeld: '✋', picto: 'lichaam/hand.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-geef-een-hand.png', zin: 'Ik geef een hand.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'geef', rol: 'doet' }, { tekst: 'een hand', rol: 'wat' }] },
    { id: 'voet',     niveau: 'basis', categorie: 'lichaam', tekst: 'de voet',      kort: 'voet',     beeld: '🦶', picto: 'lichaam/voet.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-trap-met-mijn-voet-tegen-de-bal.png', zin: 'Ik trap tegen de bal.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'trap', rol: 'doet' }, { tekst: 'tegen de bal', rol: 'wat' }] },
    { id: 'buik',     niveau: 'basis', categorie: 'lichaam', tekst: 'de buik',      kort: 'buik',     beeld: '🤰', picto: 'lichaam/buik.png', zinPicto: 'assets/zinsbeelden/lichaam/mijn-buik-doet-pijn.png', zin: 'Mijn buik doet pijn.', zinsdelen: [{ tekst: 'Mijn buik', rol: 'wie' }, { tekst: 'doet pijn', rol: 'doet' }] },
    { id: 'haar',     niveau: 'basis', categorie: 'lichaam', tekst: 'het haar',     kort: 'haar',     beeld: '💇', picto: 'lichaam/haar.png', zinPicto: 'assets/zinsbeelden/lichaam/mijn-haar-is-bruin.png', zin: 'Mijn haar is bruin.', zinsdelen: [{ tekst: 'Mijn haar', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'bruin', rol: 'hoe' }] },
    { id: 'arm',      niveau: 'basis', categorie: 'lichaam', tekst: 'de arm',       kort: 'arm',      beeld: '💪', picto: 'lichaam/arm.png', zinPicto: 'assets/zinsbeelden/lichaam/mijn-arm-is-sterk.png', zin: 'Mijn arm is sterk.', zinsdelen: [{ tekst: 'Mijn arm', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'sterk', rol: 'hoe' }] },
    { id: 'been',     niveau: 'basis', categorie: 'lichaam', tekst: 'het been',     kort: 'been',     beeld: '🦵', picto: 'lichaam/been.png', zinPicto: 'assets/zinsbeelden/lichaam/ik-sta-op-een-been.png', zin: 'Ik sta op één been.', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'sta', rol: 'doet' }, { tekst: 'op één been', rol: 'waar' }] },
    { id: 'vinger',   niveau: 'basis', categorie: 'lichaam', tekst: 'de vinger',    kort: 'vinger',   beeld: '☝️', picto: 'lichaam/vinger.png', zin: 'Ik wijs met mijn vinger.', zinPicto: 'assets/zinsbeelden/lichaam/ik-wijs-met-mijn-vinger.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'wijs', rol: 'doet' }, { tekst: 'met mijn vinger', rol: 'wat' }] },
    { id: 'rug',      niveau: 'basis', categorie: 'lichaam', tekst: 'de rug',       kort: 'rug',      beeld: '🚶', picto: 'lichaam/rug.png', zin: 'Mijn rug doet pijn.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-rug-doet-pijn.png', zinsdelen: [{ tekst: 'Mijn rug', rol: 'wie' }, { tekst: 'doet pijn', rol: 'doet' }] },
    { id: 'tand',     niveau: 'basis', categorie: 'lichaam', tekst: 'de tand',      kort: 'tand',     beeld: '🦷', picto: 'lichaam/tand.png', zin: 'Mijn tand wiebelt.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-tand-wiebelt.png', zinsdelen: [{ tekst: 'Mijn tand', rol: 'wie' }, { tekst: 'wiebelt', rol: 'doet' }] },

    // ========== KLEREN ==========
    { id: 'trui',         niveau: 'basis', categorie: 'kleren', tekst: 'de trui',         kort: 'trui',         beeld: '🧥', picto: 'lichaam/trui.png', zin: 'Ik draag een trui.', zinPicto: 'assets/zinsbeelden/lichaam/ik-draag-een-trui.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'draag', rol: 'doet' }, { tekst: 'een trui', rol: 'wat' }] },
    { id: 'broek',        niveau: 'basis', categorie: 'kleren', tekst: 'de broek',        kort: 'broek',        beeld: '👖', picto: 'lichaam/broek.png', zin: 'Mijn broek is blauw.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-broek-is-blauw.png', zinsdelen: [{ tekst: 'Mijn broek', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'blauw', rol: 'hoe' }] },
    { id: 'schoenen',     niveau: 'basis', categorie: 'kleren', tekst: 'de schoenen',     kort: 'schoenen',     beeld: '👟', picto: 'lichaam/schoenen.png', zin: 'Ik trek mijn schoenen aan.', zinPicto: 'assets/zinsbeelden/lichaam/ik-trek-mijn-schoenen-aan.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'trek', rol: 'doet' }, { tekst: 'mijn schoenen', rol: 'wat' }, { tekst: 'aan', rol: 'doet' }] },
    { id: 'jas',          niveau: 'basis', categorie: 'kleren', tekst: 'de jas',          kort: 'jas',          beeld: '🧥', picto: 'lichaam/jas.png', zin: 'Ik draag een warme jas.', zinPicto: 'assets/zinsbeelden/lichaam/het-is-koud-ik-draag-een-jas.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'draag', rol: 'doet' }, { tekst: 'een warme jas', rol: 'wat' }] },
    { id: 'muts',         niveau: 'basis', categorie: 'kleren', tekst: 'de muts',         kort: 'muts',         beeld: '🧢', picto: 'lichaam/muts.png', zin: 'Ik zet mijn muts op.', zinPicto: 'assets/zinsbeelden/lichaam/ik-zet-mijn-muts-op.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'zet', rol: 'doet' }, { tekst: 'mijn muts', rol: 'wat' }, { tekst: 'op', rol: 'doet' }] },
    { id: 'kousen',       niveau: 'basis', categorie: 'kleren', tekst: 'de kousen',       kort: 'kousen',       beeld: '🧦', picto: 'lichaam/kousen.png', zin: 'Ik trek mijn kousen aan.', zinPicto: 'assets/zinsbeelden/lichaam/ik-trek-mijn-kousen-aan.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'trek', rol: 'doet' }, { tekst: 'mijn kousen', rol: 'wat' }, { tekst: 'aan', rol: 'doet' }] },
    { id: 'kleed',        niveau: 'basis', categorie: 'kleren', tekst: 'het kleedje',     kort: 'kleedje',      beeld: '👗', picto: 'lichaam/kleed.png', zin: 'Mijn kleedje is roze.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-kleedje-is-roze.png', zinsdelen: [{ tekst: 'Mijn kleedje', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'roze', rol: 'hoe' }] },
    { id: 'rok',          niveau: 'basis', categorie: 'kleren', tekst: 'de rok',          kort: 'rok',          beeld: '👗', picto: 'lichaam/rok.png', zin: 'Mama draagt een rok.', zinPicto: 'assets/zinsbeelden/lichaam/mama-draagt-een-rok.png', zinsdelen: [{ tekst: 'Mama', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'een rok', rol: 'wat' }] },
    { id: 'tshirt',       niveau: 'basis', categorie: 'kleren', tekst: 'het t-shirt',     kort: 't-shirt',      beeld: '👕', picto: 'lichaam/tshirt.png', zin: 'Mijn t-shirt is wit.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-tshirt-is-wit.png', zinsdelen: [{ tekst: 'Mijn t-shirt', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'wit', rol: 'hoe' }] },
    { id: 'sjaal',        niveau: 'basis', categorie: 'kleren', tekst: 'de sjaal',        kort: 'sjaal',        beeld: '🧣', picto: 'lichaam/sjaal.png', zin: 'Ik knoop mijn sjaal vast.', zinPicto: 'assets/zinsbeelden/lichaam/ik-knoop-mijn-sjaal-vast.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'knoop', rol: 'doet' }, { tekst: 'mijn sjaal', rol: 'wat' }, { tekst: 'vast', rol: 'doet' }] },
    { id: 'handschoenen', niveau: 'basis', categorie: 'kleren', tekst: 'de handschoenen', kort: 'handschoenen', beeld: '🧤', picto: 'lichaam/handschoenen.png', zin: 'Ik draag rode handschoenen.', zinPicto: 'assets/zinsbeelden/lichaam/het-sneeuwt-ik-draag-handschoenen.png', zinsdelen: [{ tekst: 'Ik', rol: 'wie' }, { tekst: 'draag', rol: 'doet' }, { tekst: 'rode handschoenen', rol: 'wat' }] },
    { id: 'laarzen',      niveau: 'basis', categorie: 'kleren', tekst: 'de laarzen',      kort: 'laarzen',      beeld: '👢', picto: 'lichaam/laarzen.png', zin: 'Mijn laarzen zijn nat.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-laarzen-zijn-nat-van-de-regen.png', zinsdelen: [{ tekst: 'Mijn laarzen', rol: 'wie' }, { tekst: 'zijn', rol: 'doet' }, { tekst: 'nat', rol: 'hoe' }] },
    { id: 'pyjama',       niveau: 'basis', categorie: 'kleren', tekst: 'de pyjama',       kort: 'pyjama',       beeld: '🛌', picto: 'lichaam/pyjama.png', zin: 'Dit is mijn pyjama.', zinPicto: 'assets/zinsbeelden/lichaam/dit-is-mijn-pyjama.png', zinsdelen: [{ tekst: 'Dit', rol: 'wie' }, { tekst: 'is', rol: 'doet' }, { tekst: 'mijn pyjama', rol: 'wat' }] },
    { id: 'bril',         niveau: 'basis', categorie: 'kleren', tekst: 'de bril',         kort: 'bril',         beeld: '👓', picto: 'lichaam/bril.png', zin: 'Mijn opa draagt een bril.', zinPicto: 'assets/zinsbeelden/lichaam/mijn-opa-draagt-een-bril.png', zinsdelen: [{ tekst: 'Mijn opa', rol: 'wie' }, { tekst: 'draagt', rol: 'doet' }, { tekst: 'een bril', rol: 'wat' }] },
  ]
};
