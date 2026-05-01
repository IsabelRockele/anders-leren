// =================================================================
//  Thema: Tijd & dag (zinnen) — NIEUW
//  Klok, dagen, dagdelen — essentieel voor klasstructuur
// =================================================================
window.THEMA_ZINNEN_TIJD = {
  id: 'z-tijd',
  type: 'zinnen',
  naam: 'Tijd & dag',
  emoji: '🕐',
  kleur: '#3A86FF',
  niveaus: ['basis', 'uitbreiding', 'verdieping'],
  items: [
    // ========== BASIS — dagdelen ==========
    { id: 't-morgen',   niveau: 'basis', tekst: 'de ochtend',         kort: 'ochtend',    beeld: '🌅', zin: 'In de ochtend gaat de zon op.' },
    { id: 't-middag',   niveau: 'basis', tekst: 'de middag',          kort: 'middag',     beeld: '☀️', zin: "'s Middags eet ik een boterham." },
    { id: 't-avond',    niveau: 'basis', tekst: 'de avond',           kort: 'avond',      beeld: '🌆', zin: "'s Avonds slaap ik." },
    { id: 't-nacht',    niveau: 'basis', tekst: 'de nacht',           kort: 'nacht',      beeld: '🌙', zin: 'In de nacht slaap ik diep.' },
    { id: 't-vandaag',  niveau: 'basis', tekst: 'vandaag',            kort: 'vandaag',    beeld: '📅', zin: 'Vandaag is het maandag.' },
    { id: 't-morgen-d', niveau: 'basis', tekst: 'morgen',             kort: 'morgen',     beeld: '➡️', zin: 'Morgen ga ik naar oma.' },
    { id: 't-gisteren', niveau: 'basis', tekst: 'gisteren',           kort: 'gisteren',   beeld: '⬅️', zin: 'Gisteren regende het.' },

    // ========== UITBREIDING — dagen van de week ==========
    { id: 't-maandag',  niveau: 'uitbreiding', tekst: 'maandag',           kort: 'maandag',    beeld: '1️⃣', zin: 'Op maandag is er turnen.' },
    { id: 't-dinsdag',  niveau: 'uitbreiding', tekst: 'dinsdag',           kort: 'dinsdag',    beeld: '2️⃣', zin: 'Op dinsdag heb ik Frans.' },
    { id: 't-woensdag', niveau: 'uitbreiding', tekst: 'woensdag',          kort: 'woensdag',   beeld: '3️⃣', zin: "Op woensdag is er 's namiddags geen school." },
    { id: 't-donderdag',niveau: 'uitbreiding', tekst: 'donderdag',         kort: 'donderdag',  beeld: '4️⃣', zin: 'Op donderdag eten wij in de eetzaal.' },
    { id: 't-vrijdag',  niveau: 'uitbreiding', tekst: 'vrijdag',           kort: 'vrijdag',    beeld: '5️⃣', zin: 'Op vrijdag is het bijna weekend.' },
    { id: 't-zaterdag', niveau: 'uitbreiding', tekst: 'zaterdag',          kort: 'zaterdag',   beeld: '6️⃣', zin: 'Op zaterdag ga ik naar de markt.' },
    { id: 't-zondag',   niveau: 'uitbreiding', tekst: 'zondag',            kort: 'zondag',     beeld: '7️⃣', zin: 'Op zondag is iedereen thuis.' },

    // ========== UITBREIDING — vragen ==========
    { id: 't-hoe-laat', niveau: 'uitbreiding', tekst: 'Hoe laat is het?',         kort: 'hoe laat',     beeld: '🕐', zin: 'Juf, hoe laat is het?' },
    { id: 't-wanneer',  niveau: 'uitbreiding', tekst: 'Wanneer ...?',             kort: 'wanneer',      beeld: '⏰', zin: 'Juf, wanneer is de pauze?' },
    { id: 't-pauze',    niveau: 'uitbreiding', tekst: 'Wanneer is het pauze?',    kort: 'pauze',        beeld: '⏸️', zin: 'Juf, wanneer is het pauze?' },
    { id: 't-naar-huis',niveau: 'uitbreiding', tekst: 'Wanneer mogen wij naar huis?',kort: 'naar huis', beeld: '🏠', zin: 'Juf, wanneer mogen wij naar huis?' },

    // ========== VERDIEPING ==========
    { id: 't-week',     niveau: 'verdieping', tekst: 'de week',            kort: 'week',         beeld: '📅', zin: 'Een week heeft zeven dagen.' },
    { id: 't-weekend',  niveau: 'verdieping', tekst: 'het weekend',        kort: 'weekend',      beeld: '🎉', zin: 'In het weekend slaap ik uit.' },
    { id: 't-maand',    niveau: 'verdieping', tekst: 'de maand',           kort: 'maand',        beeld: '🗓️', zin: 'Volgende maand is mijn verjaardag.' },
    { id: 't-jaar',     niveau: 'verdieping', tekst: 'het jaar',           kort: 'jaar',         beeld: '📆', zin: 'Een jaar heeft twaalf maanden.' },
    { id: 't-uur',      niveau: 'verdieping', tekst: 'het uur',            kort: 'uur',          beeld: '🕐', zin: 'Het is acht uur.' },
    { id: 't-minuut',   niveau: 'verdieping', tekst: 'de minuut',          kort: 'minuut',       beeld: '⏱️', zin: 'Wacht een minuut.' },
    { id: 't-vroeg',    niveau: 'verdieping', tekst: 'vroeg',              kort: 'vroeg',        beeld: '🌅', zin: 'Ik sta vroeg op.' },
    { id: 't-laat',     niveau: 'verdieping', tekst: 'laat',               kort: 'laat',         beeld: '🌙', zin: 'Sorry juf, ik ben laat.' },
    { id: 't-nu',       niveau: 'verdieping', tekst: 'nu',                 kort: 'nu',           beeld: '⚡', zin: 'Wij beginnen nu.' },
    { id: 't-straks',   niveau: 'verdieping', tekst: 'straks',             kort: 'straks',       beeld: '⏭️', zin: 'Tot straks!' },
  ]
};
