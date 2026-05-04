// =================================================================
//  Thema: Hulp vragen / niet begrijpen (zinnen) — herwerkt
//  Alles op niveau 'basis'.
// =================================================================
window.THEMA_ZINNEN_HULP = {
  id: 'z-hulp',
  type: 'zinnen',
  naam: 'Hulp vragen',
  emoji: '🙋',
  kleur: '#06A77D',
  niveaus: ['basis'],
  items: [
    // ========== HULP VRAGEN ==========
    { id: 'h-help',      niveau: 'basis', tekst: 'Help mij.',                kort: 'help mij',      beeld: '🆘', zin: 'Juf, help mij alsjeblieft.' },
    { id: 'h-help-bij',  niveau: 'basis', tekst: 'Help mij bij ...',         kort: 'help bij',      beeld: '🤝', zin: 'Juf, help mij bij deze oefening.' },
    { id: 'h-mag-vragen',niveau: 'basis', tekst: 'Mag ik iets vragen?',      kort: 'iets vragen',   beeld: '🙋', zin: 'Juf, mag ik iets vragen?' },
    { id: 'h-doe-mee',   niveau: 'basis', tekst: 'Doe je het samen met mij?',kort: 'samen',         beeld: '👯', zin: 'Juf, doe je het samen met mij?' },
    { id: 'h-niet-lukt', niveau: 'basis', tekst: 'Het lukt mij niet.',       kort: 'lukt niet',     beeld: '😣', zin: 'Juf, het lukt mij niet.' },

    // ========== NIET BEGRIJPEN ==========
    { id: 'h-snap-niet', niveau: 'basis', tekst: 'Ik snap het niet.',        kort: 'snap niet',     beeld: '🤔', zin: 'Sorry, ik snap het niet.' },
    { id: 'h-niet-weet', niveau: 'basis', tekst: 'Ik weet het niet.',        kort: 'weet niet',     beeld: '🤷', zin: 'Sorry, ik weet het niet.' },
    { id: 'h-vergeten',  niveau: 'basis', tekst: 'Ik ben het vergeten.',     kort: 'vergeten',      beeld: '🤷', zin: 'Sorry juf, ik ben het vergeten.' },
    { id: 'h-watis',     niveau: 'basis', tekst: 'Wat is dit?',              kort: 'wat is',        beeld: '❓', zin: 'Juf, wat is dit?' },
    { id: 'h-watbet',    niveau: 'basis', tekst: 'Wat betekent dat?',        kort: 'betekent',      beeld: '💭', zin: 'Juf, wat betekent dat?' },

    // ========== VERDUIDELIJKING VRAGEN ==========
    { id: 'h-toon',      niveau: 'basis', tekst: 'Wil je het tonen?',        kort: 'tonen',         beeld: '👉', zin: 'Juf, wil je het tonen?' },
    { id: 'h-tonen-mij', niveau: 'basis', tekst: 'Kan je het mij tonen?',    kort: 'tonen mij',     beeld: '👀', zin: 'Juf, kan je het mij tonen?' },
    { id: 'h-leg-uit',   niveau: 'basis', tekst: 'Wil je het uitleggen?',    kort: 'uitleggen',     beeld: '💬', zin: 'Juf, wil je het uitleggen?' },
    { id: 'h-traag',     niveau: 'basis', tekst: 'Wil je traag praten?',     kort: 'traag',         beeld: '🐢', zin: 'Juf, wil je traag praten?' },
    { id: 'h-herhaal',   niveau: 'basis', tekst: 'Wil je het herhalen?',     kort: 'herhalen',      beeld: '🔁', zin: 'Juf, wil je het herhalen?' },
    { id: 'h-wachten',   niveau: 'basis', tekst: 'Wil je even wachten?',     kort: 'even wachten',  beeld: '⏳', zin: 'Juf, wil je even wachten?' },

    // ========== TAAL ==========
    { id: 'h-hoe-zeg',   niveau: 'basis', tekst: 'Hoe zeg je dat?',          kort: 'hoe zeggen',    beeld: '🗣️', zin: 'Juf, hoe zeg je dat in het Nederlands?' },
    { id: 'h-hoe-schr',  niveau: 'basis', tekst: 'Hoe schrijf je dat?',      kort: 'hoe schrijven', beeld: '✍️', zin: 'Juf, hoe schrijf je dat?' },
    { id: 'h-tolk',      niveau: 'basis', tekst: 'Mag ik mijn taal spreken?',kort: 'mijn taal',     beeld: '🌍', zin: 'Juf, mag ik even mijn taal spreken?' },
    { id: 'h-vertaal',   niveau: 'basis', tekst: 'Wil je dit vertalen?',     kort: 'vertalen',      beeld: '🔄', zin: 'Juf, wil je dit vertalen?' },

    // ========== THUIS — boodschap doorgeven ==========
    { id: 'h-mama-zegt', niveau: 'basis', tekst: 'Mama zegt dat ...',        kort: 'mama zegt',     beeld: '👩', zin: 'Mama zegt dat ik morgen ziek ben.' },
    { id: 'h-papa-komt', niveau: 'basis', tekst: 'Papa komt mij halen.',     kort: 'papa komt',     beeld: '👨', zin: 'Juf, papa komt mij halen om vier uur.' },

    // ========== KLEINE VRAGEN ==========
    { id: 'h-mag-naast', niveau: 'basis', tekst: 'Mag ik naast jou zitten?', kort: 'naast jou',     beeld: '🪑', zin: 'Juf, mag ik naast jou zitten?' },
    { id: 'h-zien',      niveau: 'basis', tekst: 'Mag ik dat ook zien?',     kort: 'ook zien',      beeld: '👀', zin: 'Juf, mag ik dat ook zien?' },
  ]
};
