// =================================================================
//  Thema: Tijd & dag (zinnen) — herwerkt
//  Klok, dagen, dagdelen — essentieel voor klasstructuur.
//  Alles op niveau 'basis'.
// =================================================================
window.THEMA_ZINNEN_TIJD = {
  id: 'z-tijd',
  type: 'zinnen',
  naam: 'Tijd & dag',
  emoji: '🕐',
  kleur: '#3A86FF',
  niveaus: ['basis'],
  items: [
    // ========== DAGDELEN ==========
    { id: 't-morgen',   niveau: 'basis', tekst: 'de ochtend',  kort: 'ochtend',  beeld: '🌅', zin: 'In de ochtend gaat de zon op.' },
    { id: 't-middag',   niveau: 'basis', tekst: 'de middag',   kort: 'middag',   beeld: '☀️', zin: "'s Middags eet ik een boterham." },
    { id: 't-avond',    niveau: 'basis', tekst: 'de avond',    kort: 'avond',    beeld: '🌆', zin: "'s Avonds slaap ik." },
    { id: 't-nacht',    niveau: 'basis', tekst: 'de nacht',    kort: 'nacht',    beeld: '🌙', zin: 'In de nacht slaap ik diep.' },

    // ========== VANDAAG / GISTEREN / MORGEN ==========
    { id: 't-vandaag',  niveau: 'basis', tekst: 'vandaag',     kort: 'vandaag',  beeld: '📅', zin: 'Vandaag is het maandag.' },
    { id: 't-morgen-d', niveau: 'basis', tekst: 'morgen',      kort: 'morgen',   beeld: '➡️', zin: 'Morgen ga ik naar oma.' },
    { id: 't-gisteren', niveau: 'basis', tekst: 'gisteren',    kort: 'gisteren', beeld: '⬅️', zin: 'Gisteren regende het.' },

    // ========== DAGEN VAN DE WEEK ==========
    { id: 't-maandag',  niveau: 'basis', tekst: 'maandag',     kort: 'maandag',    beeld: '1️⃣', zin: 'Op maandag is er turnen.' },
    { id: 't-dinsdag',  niveau: 'basis', tekst: 'dinsdag',     kort: 'dinsdag',    beeld: '2️⃣', zin: 'Op dinsdag heb ik Frans.' },
    { id: 't-woensdag', niveau: 'basis', tekst: 'woensdag',    kort: 'woensdag',   beeld: '3️⃣', zin: "Op woensdag is er 's namiddags geen school." },
    { id: 't-donderdag',niveau: 'basis', tekst: 'donderdag',   kort: 'donderdag',  beeld: '4️⃣', zin: 'Op donderdag eten wij in de eetzaal.' },
    { id: 't-vrijdag',  niveau: 'basis', tekst: 'vrijdag',     kort: 'vrijdag',    beeld: '5️⃣', zin: 'Op vrijdag is het bijna weekend.' },
    { id: 't-zaterdag', niveau: 'basis', tekst: 'zaterdag',    kort: 'zaterdag',   beeld: '6️⃣', zin: 'Op zaterdag ga ik naar de markt.' },
    { id: 't-zondag',   niveau: 'basis', tekst: 'zondag',      kort: 'zondag',     beeld: '7️⃣', zin: 'Op zondag is iedereen thuis.' },

    // ========== WEEK / MAAND / JAAR ==========
    { id: 't-week',     niveau: 'basis', tekst: 'de week',     kort: 'week',     beeld: '📅', zin: 'Een week heeft zeven dagen.' },
    { id: 't-weekend',  niveau: 'basis', tekst: 'het weekend', kort: 'weekend',  beeld: '🎉', zin: 'In het weekend slaap ik uit.' },
    { id: 't-maand',    niveau: 'basis', tekst: 'de maand',    kort: 'maand',    beeld: '🗓️', zin: 'Volgende maand is mijn verjaardag.' },
    { id: 't-jaar',     niveau: 'basis', tekst: 'het jaar',    kort: 'jaar',     beeld: '📆', zin: 'Een jaar heeft twaalf maanden.' },

    // ========== KLOK ==========
    { id: 't-uur',      niveau: 'basis', tekst: 'het uur',     kort: 'uur',      beeld: '🕐', zin: 'Het is acht uur.' },
    { id: 't-minuut',   niveau: 'basis', tekst: 'de minuut',   kort: 'minuut',   beeld: '⏱️', zin: 'Wacht een minuut.' },
    { id: 't-hoe-laat', niveau: 'basis', tekst: 'Hoe laat is het?',     kort: 'hoe laat',  beeld: '🕐', zin: 'Juf, hoe laat is het?' },

    // ========== TIJDSAANDUIDINGEN ==========
    { id: 't-vroeg',    niveau: 'basis', tekst: 'vroeg',       kort: 'vroeg',    beeld: '🌅', zin: 'Ik sta vroeg op.' },
    { id: 't-laat',     niveau: 'basis', tekst: 'laat',        kort: 'laat',     beeld: '🌙', zin: 'Sorry juf, ik ben laat.' },
    { id: 't-nu',       niveau: 'basis', tekst: 'nu',          kort: 'nu',       beeld: '⚡', zin: 'Wij beginnen nu.' },
    { id: 't-straks',   niveau: 'basis', tekst: 'straks',      kort: 'straks',   beeld: '⏭️', zin: 'Tot straks!' },

    // ========== VRAGEN OVER TIJD ==========
    { id: 't-wanneer',  niveau: 'basis', tekst: 'Wanneer ...?',                  kort: 'wanneer',   beeld: '⏰', zin: 'Juf, wanneer is de pauze?' },
    { id: 't-pauze',    niveau: 'basis', tekst: 'Wanneer is het pauze?',         kort: 'pauze',     beeld: '⏸️', zin: 'Juf, wanneer is het pauze?' },
    { id: 't-naar-huis',niveau: 'basis', tekst: 'Wanneer mogen wij naar huis?',  kort: 'naar huis', beeld: '🏠', zin: 'Juf, wanneer mogen wij naar huis?' },
  ]
};
