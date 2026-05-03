// =================================================================
// rapportFeedback — Cloud Function voor AI-suggesties bij rapporten
// =================================================================
//
// V2: nu met puntenboek-opmerkingen + spreektoets-detail + reeds gekozen zinnen
//
// INSTRUCTIE: voeg deze snippet toe aan je bestaande
//   functions/vraagstukken/index.js (waar je Anthropic-key staat).
//
// Deploy met: firebase deploy --only functions:rapportFeedback
//
// Frontend roept aan via:
//   POST {
//     kindNaam, categorie, periode, periodeNummer,
//     toetsdata, foutWoorden,
//     puntenboekOpmerkingen, spreektoetsDetail, reedsGekozen
//   }
//   Antwoord: { zinnen: [3 strings] }
//
// MODEL: Claude Haiku 4.5 — goedkoop én snel.
//   Kost per klik: ~$0,001 (≈ €0,09 cent) door iets grotere prompt.
//   Voor 200 klikken/jaar: ongeveer €0,18 totaal.

const functions = require('firebase-functions');

// Native fetch in Node 18+ — voor oudere Node: const fetch = require('node-fetch');

// API-key — zelfde patroon als bestaande vraagstukken-functie.
// LET OP: zet hier je echte key.
const ANTHROPIC_API_KEY = 'sk-ant-...VERVANG_DOOR_JE_KEY...';

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 400;

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
      const periodeNummer = body.periodeNummer || null;
      const toetsdata = body.toetsdata || {};
      const foutWoorden = Array.isArray(body.foutWoorden) ? body.foutWoorden.slice(0, 8) : [];
      const puntenboekOpmerkingen = Array.isArray(body.puntenboekOpmerkingen)
        ? body.puntenboekOpmerkingen.slice(0, 6) : [];
      const spreektoetsDetail = body.spreektoetsDetail || null;
      const reedsGekozen = Array.isArray(body.reedsGekozen) ? body.reedsGekozen.slice(0, 8) : [];

      const prompt = bouwPrompt({
        kindNaam,
        categorie,
        periode,
        periodeNummer,
        toetsdata,
        foutWoorden,
        puntenboekOpmerkingen,
        spreektoetsDetail,
        reedsGekozen
      });

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

function bouwPrompt(ctx) {
  const {
    kindNaam, categorie, periode, periodeNummer,
    toetsdata, foutWoorden,
    puntenboekOpmerkingen, spreektoetsDetail, reedsGekozen
  } = ctx;

  const catLabels = {
    watGaatGoed: 'Wat gaat goed (positieve punten)',
    groeipunten: 'Groeipunten (waar het kind nog op kan oefenen)',
    werkhouding: 'Werkhouding & zelfstandigheid'
  };
  const catLabel = catLabels[categorie] || categorie;

  const lijnen = [];
  lijnen.push('Je bent een tweede-graad-leerkracht in een GO!-basisschool in Vlaanderen.');
  lijnen.push('Je geeft feedback aan een anderstalige nieuwkomer in het Nederlands.');
  lijnen.push('Toon: Vlaamse leerkracht-toon, warm en concreet ("Sara durft...", "Sara mag nog...").');
  lijnen.push('');
  lijnen.push(`Leerling: ${kindNaam}`);
  if (periode) {
    lijnen.push(`Rapportperiode: ${periode}${periodeNummer ? ' (nummer ' + periodeNummer + ')' : ''}`);
    if (periodeNummer === 1) lijnen.push('Dit is het eerste rapport van het schooljaar — verwacht beginnersniveau.');
  }
  lijnen.push('');

  // Toets-overzicht — alleen zinvol bij 'watGaatGoed' en 'groeipunten'
  if (categorie !== 'werkhouding') {
    lijnen.push('Toets-resultaten in deze periode:');
    ['luisteren', 'lezen', 'schrijven', 'spreken'].forEach(v => {
      const td = toetsdata[v];
      if (td && td.aantal > 0) {
        lijnen.push(`- ${capitalize(v)}: ${td.pct}% juist (${td.juist}/${td.totaal}, ${td.aantal} toets${td.aantal === 1 ? '' : 'en'})`);
      } else {
        lijnen.push(`- ${capitalize(v)}: nog niet getoetst in deze periode`);
      }
    });

    // Spreektoets-detail (woorden vlot/aarzelt/niet)
    if (spreektoetsDetail) {
      lijnen.push('');
      if (spreektoetsDetail.vlot && spreektoetsDetail.vlot.length > 0) {
        lijnen.push(`Spreken — vlot uitgesproken: ${spreektoetsDetail.vlot.join(', ')}`);
      }
      if (spreektoetsDetail.aarzelt && spreektoetsDetail.aarzelt.length > 0) {
        lijnen.push(`Spreken — aarzelend: ${spreektoetsDetail.aarzelt.join(', ')}`);
      }
      if (spreektoetsDetail.niet && spreektoetsDetail.niet.length > 0) {
        lijnen.push(`Spreken — nog niet juist: ${spreektoetsDetail.niet.join(', ')}`);
      }
    }

    if (foutWoorden && foutWoorden.length > 0) {
      lijnen.push(`Woorden waar het nog moeilijk gaat: ${foutWoorden.join(', ')}`);
    }
  }

  // Puntenboek-opmerkingen — werken voor ALLE categorieën, ook werkhouding
  if (puntenboekOpmerkingen && puntenboekOpmerkingen.length > 0) {
    lijnen.push('');
    lijnen.push('Eigen observaties van de juf bij toetsen (gekoppeld aan deze categorie):');
    puntenboekOpmerkingen.forEach(o => {
      const bron = o.toets ? ` (uit ${o.toets})` : '';
      lijnen.push(`- "${o.opmerking}"${bron}`);
    });
    lijnen.push('Bouw verder op deze observaties — ze zijn de meest specifieke informatie.');
  }

  // Reeds gekozen zinnen — vermijd herhaling
  if (reedsGekozen && reedsGekozen.length > 0) {
    lijnen.push('');
    lijnen.push('Zinnen die de juf al heeft gekozen voor deze categorie (geef ANDERE suggesties, geen herhaling):');
    reedsGekozen.forEach(z => lijnen.push(`- "${z}"`));
  }

  // Specifieke instructie voor werkhouding (geen toets-data om op te leunen)
  if (categorie === 'werkhouding' && (!puntenboekOpmerkingen || puntenboekOpmerkingen.length === 0)) {
    lijnen.push('');
    lijnen.push(`Geef 3 algemene voorbeeldzinnen over werkhouding en zelfstandigheid voor een 7-8 jarige nieuwkomer.`);
  } else {
    lijnen.push('');
    lijnen.push(`Schrijf 3 zinnen voor de categorie "${catLabel}".`);
  }

  // Algemene zin-eisen
  lijnen.push('');
  lijnen.push('Eisen per zin:');
  lijnen.push(`- Begint met "${kindNaam}" of verwijst direct naar ${kindNaam}`);
  lijnen.push('- Maximum 14 woorden');
  lijnen.push('- Concreet, niet algemeen');
  if (categorie === 'watGaatGoed') {
    lijnen.push('- Positief en aanmoedigend');
  } else if (categorie === 'groeipunten') {
    lijnen.push('- Constructief, zonder oordeel — formuleer als groeikans');
  } else {
    lijnen.push('- Respectvol — werkhouding is gevoelig');
  }

  lijnen.push('');
  lijnen.push('Antwoord ENKEL met de 3 zinnen, één per regel, zonder nummering of bullets.');

  return lijnen.join('\n');
}

function parseZinnen(tekst) {
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
