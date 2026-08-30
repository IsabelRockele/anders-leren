// =================================================================
//  Thema: Eten & drinken (woorden) — herwerkt, Vlaamse context
//  Alles op niveau 'basis'. Categorieën:
//    groenten, fruit, drank, snoepgoed, broodbeleg, andere, optafel
// =================================================================
window.THEMA_WOORDEN_ETEN = {
  id: 'w-eten',
  type: 'woorden',
  naam: 'Eten & drinken',
  emoji: '🍎',
  kleur: '#06A77D',
  niveaus: ['basis'],
  categorieen: ['groenten', 'fruit', 'drank', 'snoepgoed', 'broodbeleg', 'andere', 'optafel'],
  items: [
    // ========== GROENTEN ==========
    { id: 'wortel',     niveau: 'basis', categorie: 'groenten', tekst: 'de wortel',     kort: 'wortel',     beeld: '🥕', zin: 'Een konijn eet wortels.' },
    { id: 'sla',        niveau: 'basis', categorie: 'groenten', tekst: 'de sla',        kort: 'sla',        beeld: '🥬', picto: 'eten/sla.png', zin: 'Ik eet sla bij mijn boterham.' },
    { id: 'bloemkool',  niveau: 'basis', categorie: 'groenten', tekst: 'de bloemkool',  kort: 'bloemkool',  beeld: '🥦', picto: 'eten/bloemkool.png', zin: 'De bloemkool is wit.' },
    { id: 'witloof',    niveau: 'basis', categorie: 'groenten', tekst: 'het witloof',   kort: 'witloof',    beeld: '🥬', picto: 'eten/witloof.png',    zin: 'Witloof met hesp en kaas is lekker.' },
    { id: 'komkommer',  niveau: 'basis', categorie: 'groenten', tekst: 'de komkommer',  kort: 'komkommer',  beeld: '🥒', picto: 'eten/komkommer.png', zin: 'De komkommer is groen en lang.' },
    { id: 'paprika',    niveau: 'basis', categorie: 'groenten', tekst: 'de paprika',    kort: 'paprika',    beeld: '🫑', zin: 'Een paprika kan rood of groen zijn.' },
    { id: 'aardappel',  niveau: 'basis', categorie: 'groenten', tekst: 'de aardappel',  kort: 'aardappel',  beeld: '🥔', zin: 'Ik eet aardappelen met saus.' },
    { id: 'erwten',     niveau: 'basis', categorie: 'groenten', tekst: 'de erwten',     kort: 'erwten',     beeld: '🟢', picto: 'eten/erwten.png', zin: 'Erwten zijn klein en groen.' },
    { id: 'spruiten',   niveau: 'basis', categorie: 'groenten', tekst: 'de spruiten',   kort: 'spruiten',   beeld: '🥬', picto: 'eten/spruiten.png', zin: 'In de winter eten wij spruiten.' },
    { id: 'prei',       niveau: 'basis', categorie: 'groenten', tekst: 'de prei',       kort: 'prei',       beeld: '🥬', picto: 'eten/prei.png', zin: 'Mama maakt soep met prei.' },
    { id: 'ui',         niveau: 'basis', categorie: 'groenten', tekst: 'de ui',         kort: 'ui',         beeld: '🧅', zpicto: 'eten/ui.png', in: 'Van een ui moet ik wenen.' },
    { id: 'tomaat',     niveau: 'basis', categorie: 'groenten', tekst: 'de tomaat',     kort: 'tomaat',     beeld: '🍅', zin: 'De tomaat is rood.' },

    // ========== FRUIT ==========
    { id: 'appel',      niveau: 'basis', categorie: 'fruit', tekst: 'de appel',       kort: 'appel',      beeld: '🍎', zin: 'Ik eet een appel.' },
    { id: 'peer',       niveau: 'basis', categorie: 'fruit', tekst: 'de peer',        kort: 'peer',       beeld: '🍐', zin: 'De peer is zoet.' },
    { id: 'aardbei',    niveau: 'basis', categorie: 'fruit', tekst: 'de aardbei',     kort: 'aardbei',    beeld: '🍓', zin: 'Aardbeien zijn zoet en rood.' },
    { id: 'kiwi',       niveau: 'basis', categorie: 'fruit', tekst: 'de kiwi',        kort: 'kiwi',       beeld: '🥝', zin: 'Een kiwi is groen vanbinnen.' },
    { id: 'sinaasappel',niveau: 'basis', categorie: 'fruit', tekst: 'de sinaasappel', kort: 'sinaasappel',beeld: '🍊', picto: 'eten/sinaasappel.png', zin: 'De sinaasappel is oranje.' },
    { id: 'banaan',     niveau: 'basis', categorie: 'fruit', tekst: 'de banaan',      kort: 'banaan',     beeld: '🍌', zin: 'De banaan is geel.' },
    { id: 'druiven',    niveau: 'basis', categorie: 'fruit', tekst: 'de druiven',     kort: 'druiven',    beeld: '🍇', zin: 'Druiven groeien aan een tak.' },
    { id: 'ananas',     niveau: 'basis', categorie: 'fruit', tekst: 'de ananas',      kort: 'ananas',     beeld: '🍍', picto: 'eten/ananas.png',zin: 'Een ananas heeft een kroon.' },
    { id: 'bessen',     niveau: 'basis', categorie: 'fruit', tekst: 'de bessen',      kort: 'bessen',     beeld: '🫐', zin: 'Bessen zijn klein en rond.' },
    { id: 'kersen',     niveau: 'basis', categorie: 'fruit', tekst: 'de kersen',      kort: 'kersen',     beeld: '🍒', zin: 'Kersen zijn rood en zoet.' },
    { id: 'mango',      niveau: 'basis', categorie: 'fruit', tekst: 'de mango',       kort: 'mango',      beeld: '🥭', zin: 'Een mango is geel en zacht.' },

    // ========== DRANK ==========
    { id: 'water',      niveau: 'basis', categorie: 'drank', tekst: 'het water',      kort: 'water',      beeld: '💧', zin: 'Ik drink water.' },
    { id: 'melk',       niveau: 'basis', categorie: 'drank', tekst: 'de melk',        kort: 'melk',       beeld: '🥛', zin: 'Ik drink melk.' },
    { id: 'koffie',     niveau: 'basis', categorie: 'drank', tekst: 'de koffie',      kort: 'koffie',     beeld: '☕', zin: 'Papa drinkt koffie.' },
    { id: 'thee',       niveau: 'basis', categorie: 'drank', tekst: 'de thee',        kort: 'thee',       beeld: '🍵', zin: 'Mama drinkt thee.' },
    { id: 'chocomelk',  niveau: 'basis', categorie: 'drank', tekst: 'de chocomelk',   kort: 'chocomelk',  beeld: '🥛', zin: 'Chocomelk is bruin en zoet.' },
    { id: 'fruitsap',   niveau: 'basis', categorie: 'drank', tekst: 'het fruitsap',   kort: 'fruitsap',   beeld: '🧃', zin: 'Ik drink een glas fruitsap.' },

    // ========== SNOEPGOED ==========
    { id: 'snoep',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'het snoep',     kort: 'snoep',     beeld: '🍬', zin: 'Te veel snoep is niet gezond.' },
    { id: 'koek',       niveau: 'basis', categorie: 'snoepgoed', tekst: 'de koek',       kort: 'koek',      beeld: '🍪', zin: 'Ik eet een koek.' },
    { id: 'chocolade',  niveau: 'basis', categorie: 'snoepgoed', tekst: 'de chocolade',  kort: 'chocolade', beeld: '🍫', zin: 'Chocolade smelt in je mond.' },
    { id: 'ijs',        niveau: 'basis', categorie: 'snoepgoed', tekst: 'het ijs',       kort: 'ijs',       beeld: '🍦', zin: 'Het ijs is koud en zoet.' },
    { id: 'taart',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'de taart',      kort: 'taart',     beeld: '🎂', zin: 'Op mijn verjaardag eet ik taart.' },
    { id: 'wafel',      niveau: 'basis', categorie: 'snoepgoed', tekst: 'de wafel',      kort: 'wafel',     beeld: '🧇', zin: 'Een warme wafel is heerlijk.' },

    // ========== BROODBELEG ==========
    { id: 'kaas',       niveau: 'basis', categorie: 'broodbeleg', tekst: 'de kaas',     kort: 'kaas',    beeld: '🧀', zin: 'Ik hou van kaas op mijn boterham.' },
    { id: 'choco',      niveau: 'basis', categorie: 'broodbeleg', tekst: 'de choco',    kort: 'choco',   beeld: '🍫', zin: 'Ik smeer choco op mijn boterham.' },
    { id: 'hesp',       niveau: 'basis', categorie: 'broodbeleg', tekst: 'de hesp',     kort: 'hesp',    beeld: '🥓', zin: 'Een boterham met hesp en kaas.' },
    { id: 'salami',     niveau: 'basis', categorie: 'broodbeleg', tekst: 'de salami',   kort: 'salami',  beeld: '🍕', zin: 'Salami is een soort worst.' },
    { id: 'boter',      niveau: 'basis', categorie: 'broodbeleg', tekst: 'de boter',    kort: 'boter',   beeld: '🧈', zin: 'Eerst smeer ik boter op mijn brood.' },

    // ========== ANDERE ==========
    { id: 'vlees',      niveau: 'basis', categorie: 'andere', tekst: 'het vlees',  kort: 'vlees',  beeld: '🍖', zin: 'Het vlees is lekker.' },
    { id: 'friet',      niveau: 'basis', categorie: 'andere', tekst: 'de friet',   kort: 'friet',  beeld: '🍟', zin: 'Op zondag eten wij friet.' },
    { id: 'soep',       niveau: 'basis', categorie: 'andere', tekst: 'de soep',    kort: 'soep',   beeld: '🍲', zin: 'De soep is warm.' },
    { id: 'pasta',      niveau: 'basis', categorie: 'andere', tekst: 'de pasta',   kort: 'pasta',  beeld: '🍝', zin: 'Pasta is mijn lievelingseten.' },
    { id: 'rijst',      niveau: 'basis', categorie: 'andere', tekst: 'de rijst',   kort: 'rijst',  beeld: '🍚', zin: 'Ik eet rijst met groenten.' },
    { id: 'ei',         niveau: 'basis', categorie: 'andere', tekst: 'het ei',     kort: 'ei',     beeld: '🥚', zin: 'Ik eet een ei.' },
    { id: 'brood',      niveau: 'basis', categorie: 'andere', tekst: 'het brood',  kort: 'brood',  beeld: '🍞', zin: 'Ik eet brood met kaas.' },

    // ========== OP TAFEL ==========
    { id: 'lepel',      niveau: 'basis', categorie: 'optafel', tekst: 'de lepel', kort: 'lepel', beeld: '🥄', zin: 'Ik eet soep met een lepel.' },
    { id: 'vork',       niveau: 'basis', categorie: 'optafel', tekst: 'de vork',  kort: 'vork',  beeld: '🍴', zin: 'Ik prik met mijn vork.' },
    { id: 'mes',        niveau: 'basis', categorie: 'optafel', tekst: 'het mes',  kort: 'mes',   beeld: '🔪', zin: 'Het mes is scherp, voorzichtig!' },
    { id: 'bord',       niveau: 'basis', categorie: 'optafel', tekst: 'het bord', kort: 'bord',  beeld: '🍽️', zin: 'Mijn eten ligt op het bord.' },
    { id: 'glas',       niveau: 'basis', categorie: 'optafel', tekst: 'het glas', kort: 'glas',  beeld: '🥛', zin: 'Ik drink uit mijn glas.' },
    { id: 'tas',        niveau: 'basis', categorie: 'optafel', tekst: 'de tas',   kort: 'tas',   beeld: '☕', zin: 'Mama drinkt uit een tas koffie.' },
    { id: 'kom',        niveau: 'basis', categorie: 'optafel', tekst: 'de kom',   kort: 'kom',   beeld: '🥣', zin: "'s Morgens eet ik uit een kom." },
  ]
};

// Volledige beeld- en zinslaag voor woordleren, spreken en Zien is Snappen.
// Elk woord heeft een eigen woordbeeld en een afzonderlijk, betekenisvol zinsbeeld.
(() => {
  const thema = window.THEMA_WOORDEN_ETEN;
  const W = 'wie', D = 'doet', A = 'wat', R = 'waar', T = 'wanneer', H = 'hoe';
  const data = {
    wortel: ['Een konijn eet een wortel.', [[W,'Een konijn'],[D,'eet'],[A,'een wortel']]],
    sla: ['Ik eet sla bij mijn boterham.', [[W,'Ik'],[D,'eet'],[A,'sla'],[R,'bij mijn boterham']]],
    bloemkool: ['De bloemkool is wit.', [[W,'De bloemkool'],[D,'is'],[H,'wit']]],
    witloof: ['Ik proef witloof met hesp en kaas.', [[W,'Ik'],[D,'proef'],[A,'witloof met hesp en kaas']]],
    komkommer: ['De komkommer is groen en lang.', [[W,'De komkommer'],[D,'is'],[H,'groen en lang']]],
    paprika: ['De jongen toont een rode paprika.', [[W,'De jongen'],[D,'toont'],[A,'een rode paprika']]],
    aardappel: ['Ik eet aardappelen met saus.', [[W,'Ik'],[D,'eet'],[A,'aardappelen met saus']]],
    erwten: ['De jongen eet groene erwten.', [[W,'De jongen'],[D,'eet'],[A,'groene erwten']]],
    spruiten: ['Wij eten spruiten aan tafel.', [[W,'Wij'],[D,'eten'],[A,'spruiten'],[R,'aan tafel']]],
    prei: ['Mama maakt soep met prei.', [[W,'Mama'],[D,'maakt'],[A,'soep met prei']]],
    ui: ['De jongen snijdt een ui.', [[W,'De jongen'],[D,'snijdt'],[A,'een ui']]],
    tomaat: ['Het meisje toont een rode tomaat.', [[W,'Het meisje'],[D,'toont'],[A,'een rode tomaat']]],
    appel: ['Ik eet een appel.', [[W,'Ik'],[D,'eet'],[A,'een appel']]],
    peer: ['Het meisje proeft een peer.', [[W,'Het meisje'],[D,'proeft'],[A,'een peer']]],
    aardbei: ['De aardbeien liggen in een kom.', [[W,'De aardbeien'],[D,'liggen'],[R,'in een kom']]],
    kiwi: ['De jongen bekijkt een kiwi.', [[W,'De jongen'],[D,'bekijkt'],[A,'een kiwi']]],
    sinaasappel: ['Het meisje houdt een sinaasappel vast.', [[W,'Het meisje'],[D,'houdt vast'],[A,'een sinaasappel']]],
    banaan: ['De jongen pelt een banaan.', [[W,'De jongen'],[D,'pelt'],[A,'een banaan']]],
    druiven: ['De druiven hangen aan een tak.', [[W,'De druiven'],[D,'hangen'],[R,'aan een tak']]],
    ananas: ['De ananas heeft een groene kroon.', [[W,'De ananas'],[D,'heeft'],[A,'een groene kroon']]],
    bessen: ['De bessen liggen in een kom.', [[W,'De bessen'],[D,'liggen'],[R,'in een kom']]],
    kersen: ['De kersen liggen in een kom.', [[W,'De kersen'],[D,'liggen'],[R,'in een kom']]],
    mango: ['Het meisje eet een mango.', [[W,'Het meisje'],[D,'eet'],[A,'een mango']]],
    water: ['De jongen drinkt water.', [[W,'De jongen'],[D,'drinkt'],[A,'water']]],
    melk: ['Het meisje drinkt melk.', [[W,'Het meisje'],[D,'drinkt'],[A,'melk']]],
    koffie: ['Papa drinkt koffie.', [[W,'Papa'],[D,'drinkt'],[A,'koffie']]],
    thee: ['Mama drinkt thee.', [[W,'Mama'],[D,'drinkt'],[A,'thee']]],
    chocomelk: ['De chocomelk staat in een glas.', [[W,'De chocomelk'],[D,'staat'],[R,'in een glas']]],
    fruitsap: ['De jongen drinkt fruitsap.', [[W,'De jongen'],[D,'drinkt'],[A,'fruitsap']]],
    snoep: ['Het meisje kiest één snoepje.', [[W,'Het meisje'],[D,'kiest'],[A,'één snoepje']]],
    koek: ['De jongen eet een koek.', [[W,'De jongen'],[D,'eet'],[A,'een koek']]],
    chocolade: ['De chocolade smelt in mijn hand.', [[W,'De chocolade'],[D,'smelt'],[R,'in mijn hand']]],
    ijs: ['Het meisje eet een ijsje.', [[W,'Het meisje'],[D,'eet'],[A,'een ijsje']]],
    taart: ['De jongen eet verjaardagstaart.', [[W,'De jongen'],[D,'eet'],[A,'verjaardagstaart']]],
    wafel: ['Het meisje eet een warme wafel.', [[W,'Het meisje'],[D,'eet'],[A,'een warme wafel']]],
    kaas: ['De jongen legt kaas op zijn boterham.', [[W,'De jongen'],[D,'legt'],[A,'kaas'],[R,'op zijn boterham']]],
    choco: ['De jongen smeert choco op zijn boterham.', [[W,'De jongen'],[D,'smeert'],[A,'choco'],[R,'op zijn boterham']]],
    hesp: ['De hesp en kaas liggen op de boterham.', [[W,'De hesp en kaas'],[D,'liggen'],[R,'op de boterham']]],
    salami: ['De salami ligt naast het brood.', [[W,'De salami'],[D,'ligt'],[R,'naast het brood']]],
    boter: ['Het meisje smeert boter op haar brood.', [[W,'Het meisje'],[D,'smeert'],[A,'boter'],[R,'op haar brood']]],
    vlees: ['Het vlees ligt op het bord.', [[W,'Het vlees'],[D,'ligt'],[R,'op het bord']]],
    friet: ['Wij eten friet aan tafel.', [[W,'Wij'],[D,'eten'],[A,'friet'],[R,'aan tafel']]],
    soep: ['De jongen eet warme soep.', [[W,'De jongen'],[D,'eet'],[A,'warme soep']]],
    pasta: ['Het meisje eet pasta.', [[W,'Het meisje'],[D,'eet'],[A,'pasta']]],
    rijst: ['De jongen eet rijst met groenten.', [[W,'De jongen'],[D,'eet'],[A,'rijst met groenten']]],
    ei: ['De jongen eet een ei.', [[W,'De jongen'],[D,'eet'],[A,'een ei']]],
    brood: ['Het meisje eet brood met kaas.', [[W,'Het meisje'],[D,'eet'],[A,'brood met kaas']]],
    lepel: ['De jongen eet soep met een lepel.', [[W,'De jongen'],[D,'eet'],[A,'soep'],[H,'met een lepel']]],
    vork: ['Het meisje prikt met een vork.', [[W,'Het meisje'],[D,'prikt'],[H,'met een vork']]],
    mes: ['Het mes ligt naast het brood.', [[W,'Het mes'],[D,'ligt'],[R,'naast het brood']]],
    bord: ['Het eten ligt op het bord.', [[W,'Het eten'],[D,'ligt'],[R,'op het bord']]],
    glas: ['De jongen drinkt uit een glas.', [[W,'De jongen'],[D,'drinkt'],[R,'uit een glas']]],
    tas: ['Mama drinkt koffie uit een tas.', [[W,'Mama'],[D,'drinkt'],[A,'koffie'],[R,'uit een tas']]],
    kom: ['Het meisje eet uit een kom.', [[W,'Het meisje'],[D,'eet'],[R,'uit een kom']]],
  };

  thema.items.forEach(item => {
    const [zin, delen] = data[item.id];
    item.picto = `eten/${item.id}.png`;
    item.zin = zin;
    item.zinPicto = `assets/zinsbeelden/eten/${item.id}.png`;
    item.zinsdelen = delen.map(([rol, tekst]) => ({ rol, tekst }));
  });

  thema.vertelplaat = {
    titel: 'In de eetzaal',
    beeld: 'vertelplaten/eten-en-drinken.png',
    alt: 'Kinderen eten en drinken in een schoolrestaurant met groenten, fruit, drank, brood en tafelgerei.',
    hotspots: [
      ['water',7,42], ['appel',25,40], ['choco',43,46], ['soep',55,45], ['pasta',76,48], ['banaan',95,50],
      ['sla',5,58], ['bloemkool',17,59], ['witloof',25,59], ['komkommer',31,62], ['wortel',10,69],
      ['paprika',30,67], ['aardappel',22,70], ['erwten',12,78], ['spruiten',23,78], ['peer',42,61],
      ['aardbei',49,61], ['kiwi',37,69], ['sinaasappel',46,68], ['druiven',56,66], ['ananas',66,60],
      ['bessen',50,75], ['kersen',59,75], ['mango',65,68], ['kaas',80,69], ['melk',43,82],
      ['koffie',52,82], ['thee',58,82], ['fruitsap',65,82], ['glas',74,82], ['boter',81,81],
      ['hesp',92,81], ['rijst',28,83], ['ei',24,93], ['friet',39,92], ['brood',56,93],
      ['lepel',69,92], ['vork',72,92], ['bord',80,92], ['kom',94,92]
    ].map(([woordId,x,y]) => {
      const item = thema.items.find(i => i.id === woordId);
      return { id: `vp-${woordId}`, woord: item?.tekst || woordId, x, y, rol: 'wat' };
    }),
    werkbladItems: ['wortel','bloemkool','komkommer','paprika','appel','aardbei','banaan','ananas','water','melk','soep','pasta','friet','brood','vork'],
    bouwZinnen: [
      [[W,'De jongen'],[D,'eet'],[A,'een appel']],
      [[W,'Het meisje'],[D,'drinkt'],[A,'water']],
      [[W,'Het meisje'],[D,'smeert'],[A,'choco'],[R,'op haar boterham']],
      [[W,'De jongen'],[D,'eet'],[A,'soep'],[H,'met een lepel']],
      [[W,'Het meisje'],[D,'eet'],[A,'pasta']],
      [[W,'De jongen'],[D,'pelt'],[A,'een banaan']]
    ].map(delen => delen.map(([rol, tekst]) => ({ rol, tekst })))
  };
})();
