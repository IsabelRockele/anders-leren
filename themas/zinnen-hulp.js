// =================================================================
//  Thema: Hulp vragen / niet begrijpen (zinnen) — uitgebreid
// =================================================================
window.THEMA_ZINNEN_HULP = {
  id: 'z-hulp',
  type: 'zinnen',
  naam: 'Hulp vragen',
  emoji: '🙋',
  kleur: '#06A77D',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — meest cruciale hulpvragen ==========
    { id: 'h-help',      niveau: 'basis', tekst: 'Help mij.',                    kort: 'help mij',    beeld: '🆘', zin: 'Juf, help mij alsjeblieft.' },
    { id: 'h-snap-niet', niveau: 'basis', tekst: 'Ik snap het niet.',            kort: 'snap niet',   beeld: '🤔', zin: 'Sorry, ik snap het niet.' },
    { id: 'h-watis',     niveau: 'basis', tekst: 'Wat is dit?',                  kort: 'wat is',      beeld: '❓', zin: 'Juf, wat is dit?' },
    { id: 'h-niet-weet', niveau: 'basis', tekst: 'Ik weet het niet.',            kort: 'weet niet',   beeld: '🤷', zin: 'Sorry, ik weet het niet.' },
    { id: 'h-mag-vragen',niveau: 'basis', tekst: 'Mag ik iets vragen?',          kort: 'iets vragen', beeld: '🙋', zin: 'Juf, mag ik iets vragen?' },

    // ========== UITBREIDING — verduidelijking vragen ==========
    { id: 'h-toon',      niveau: 'uitbreiding', tekst: 'Wil je het tonen?',            kort: 'tonen',       beeld: '👉', zin: 'Juf, wil je het tonen?' },
    { id: 'h-traag',     niveau: 'uitbreiding', tekst: 'Wil je traag praten?',         kort: 'traag',       beeld: '🐢', zin: 'Juf, wil je traag praten?' },
    { id: 'h-herhaal',   niveau: 'uitbreiding', tekst: 'Wil je het herhalen?',         kort: 'herhalen',    beeld: '🔁', zin: 'Juf, wil je het herhalen?' },
    { id: 'h-watbet',    niveau: 'uitbreiding', tekst: 'Wat betekent dat?',            kort: 'betekent',    beeld: '💭', zin: 'Juf, wat betekent dat?' },
    { id: 'h-hoe-zeg',   niveau: 'uitbreiding', tekst: 'Hoe zeg je dat?',              kort: 'hoe zeggen',  beeld: '🗣️', zin: 'Juf, hoe zeg je dat in het Nederlands?' },
    { id: 'h-hoe-schr',  niveau: 'uitbreiding', tekst: 'Hoe schrijf je dat?',          kort: 'hoe schrijven',beeld: '✍️', zin: 'Juf, hoe schrijf je dat?' },
    { id: 'h-vergeten',  niveau: 'uitbreiding', tekst: 'Ik ben het vergeten.',         kort: 'vergeten',    beeld: '🤷', zin: 'Sorry juf, ik ben het vergeten.' },
    { id: 'h-tonen-mij', niveau: 'uitbreiding', tekst: 'Kan je het mij tonen?',        kort: 'tonen mij',   beeld: '👀', zin: 'Juf, kan je het mij tonen?' },

    // ========== UITBREIDING — meer specifiek ==========
    { id: 'h-leg-uit',   niveau: 'uitbreiding', tekst: 'Wil je het uitleggen?',       kort: 'uitleggen',   beeld: '💬', zin: 'Juf, wil je het uitleggen?' },
    { id: 'h-help-bij',  niveau: 'uitbreiding', tekst: 'Help mij bij ...',            kort: 'help bij',    beeld: '🤝', zin: 'Juf, help mij bij deze oefening.' },
    { id: 'h-doe-mee',   niveau: 'uitbreiding', tekst: 'Doe je het samen met mij?',   kort: 'samen',       beeld: '👯', zin: 'Juf, doe je het samen met mij?' },
    { id: 'h-mag-naast', niveau: 'uitbreiding', tekst: 'Mag ik naast jou zitten?',    kort: 'naast jou',   beeld: '🪑', zin: 'Juf, mag ik naast jou zitten?' },

    // ========== VERDIEPING — communicatie ==========
    { id: 'h-tolk',      niveau: 'verdieping', tekst: 'Mag ik mijn taal spreken?',    kort: 'mijn taal',   beeld: '🌍', zin: 'Juf, mag ik even mijn taal spreken?' },
    { id: 'h-vertaal',   niveau: 'verdieping', tekst: 'Wil je dit vertalen?',         kort: 'vertalen',    beeld: '🔄', zin: 'Juf, wil je dit vertalen?' },
    { id: 'h-mama-zegt', niveau: 'verdieping', tekst: 'Mama zegt dat ...',            kort: 'mama zegt',   beeld: '👩', zin: 'Mama zegt dat ik morgen ziek ben.' },
    { id: 'h-papa-komt', niveau: 'verdieping', tekst: 'Papa komt mij halen.',         kort: 'papa komt',   beeld: '👨', zin: 'Juf, papa komt mij halen om vier uur.' },
    { id: 'h-zien',      niveau: 'verdieping', tekst: 'Mag ik dat ook zien?',         kort: 'ook zien',    beeld: '👀', zin: 'Juf, mag ik dat ook zien?' },
    { id: 'h-wachten',   niveau: 'verdieping', tekst: 'Wil je even wachten?',         kort: 'even wachten',beeld: '⏳', zin: 'Juf, wil je even wachten?' },
    { id: 'h-niet-lukt', niveau: 'verdieping', tekst: 'Het lukt mij niet.',           kort: 'lukt niet',   beeld: '😣', zin: 'Juf, het lukt mij niet.' },
  ]
};
