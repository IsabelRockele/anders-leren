// =================================================================
// rapport-feedback — Cloud Function voor AI-suggesties bij rapporten
// =================================================================
//
// INSTRUCTIE: voeg deze snippet toe aan je bestaande
//   functions/vraagstukken/index.js (of waar je Anthropic-key staat).
//
// Deploy met: firebase deploy --only functions:rapportFeedback
//
// Frontend roept aan via:
//   POST { kindNaam, categorie, periode, toetsdata, foutWoorden }
//   Antwoord: { zinnen: [3 strings] }
//
// Hergebruikt dezelfde Anthropic API-key infrastructuur als vraagstukken.
//
// MODEL: Claude Haiku 4.5 — goedkoper én snel genoeg voor 3 korte zinnen.
//   Kost per klik: ~$0,0008 (≈ €0,07 cent).
//   Voor 200 klikken/jaar: ongeveer €0,14 totaal.

const functions = require('firebase-functions');
const fetch = require('node-fetch'); // of native fetch in Node 18+

// API-key — zelfde patroon als bestaande vraagstukken-functie
const ANTHROPIC_API_KEY = 'sk-ant-...VERVANG_DOOR_JE_KEY...'; // hier eigen key

const MODEL = 'claude-haiku-4-5'; // goedkoop en snel voor korte feedback-zinnen
const MAX_TOKENS = 300;

exports.rapportFeedback = functions
  .region('europe-west1') // pas aan naar jouw regio
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

    try {
      const body = req.body || {};
      const kindNaam = (body.kindNaam || 'het kind').toString().slice(0, 50);
      const categorie = body.categorie || 'watGaatGoed';
      const periode = (body.periode || '').toString().slice(0, 80);
      const toetsdata = body.toetsdata || {};
      const foutWoorden = Array.isArray(body.foutWoorden) ? body.foutWoorden.slice(0, 8) : [];

      const prompt = bouwPrompt(kindNaam, categorie, periode, toetsdata, foutWoorden);

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!resp.ok) {
        const errTekst = await resp.text();
        console.error('Anthropic API error:', resp.status, errTekst);
        res.status(502).json({ error: 'API error', detail: errTekst.slice(0, 200) });
        return;
      }

      const data = await resp.json();
      const tekst = (data.content && data.content[0] && data.content[0].text) || '';
      const zinnen = parseZinnen(tekst);

      res.status(200).json({ zinnen });
    } catch (e) {
      console.error('rapportFeedback faalde:', e);
      res.status(500).json({ error: e.message || 'onbekende fout' });
    }
  });

function bouwPrompt(naam, categorie, periode, toetsdata, foutWoorden) {
  const catLabels = {
    watGaatGoed: 'Wat gaat goed (positieve punten)',
    groeipunten: 'Groeipunten (waar het kind nog op kan oefenen)',
    werkhouding: 'Werkhouding & zelfstandigheid'
  };
  const catLabel = catLabels[categorie] || categorie;

  // Bouw toets-overzicht
  const lijnen = [];
  ['luisteren', 'lezen', 'schrijven', 'spreken'].forEach(v => {
    const td = toetsdata[v];
    if (td && td.aantal > 0) {
      lijnen.push(`- ${capitalize(v)}: ${td.pct}% juist (${td.juist}/${td.totaal} woorden, ${td.aantal} toetsen)`);
    } else {
      lijnen.push(`- ${capitalize(v)}: nog niet getoetst in deze periode`);
    }
  });

  // Speciale instructie voor werkhouding (geen toets-data)
  if (categorie === 'werkhouding') {
    return `Je bent een tweede-graad-leerkracht in een GO!-basisschool in Vlaanderen.
Je geeft feedback aan een anderstalige nieuwkomer in het Nederlands.

Leerling: ${naam}
${periode ? `Periode: ${periode}` : ''}

Geef 3 voorbeeldzinnen over werkhouding en zelfstandigheid voor een 7-8 jarige nieuwkomer.
Elke zin:
- Begint met "${naam}" of verwijst naar het kind
- Maximum 14 woorden
- Concreet en respectvol
- Mag positief of een groeipunt zijn

Antwoord enkel met de 3 zinnen, één per lijn, zonder nummering of bullets.`;
  }

  return `Je bent een tweede-graad-leerkracht in een GO!-basisschool in Vlaanderen.
Je geeft feedback aan een anderstalige nieuwkomer in het Nederlands.

Leerling: ${naam}
${periode ? `Periode: ${periode}` : ''}

Toets-resultaten in deze periode:
${lijnen.join('\n')}
${foutWoorden.length > 0 ? `\nWoorden waar het nog moeilijk gaat: ${foutWoorden.join(', ')}` : ''}

Schrijf 3 zinnen voor de categorie "${catLabel}".
Elke zin:
- Begint met "${naam}" of verwijst naar het kind
- Maximum 14 woorden
- Concreet, niet algemeen
- ${categorie === 'watGaatGoed' ? 'Positief en aanmoedigend' : 'Constructief en zonder oordeel'}

Antwoord enkel met de 3 zinnen, één per lijn, zonder nummering of bullets.`;
}

function parseZinnen(tekst) {
  // Splits op nieuwe lijnen, verwijder lege regels en bullet-/cijfer-prefixen
  return tekst.split('\n')
    .map(r => r.trim())
    .filter(r => r.length > 0)
    .map(r => r.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim())
    .filter(r => r.length > 5)
    .slice(0, 3);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
