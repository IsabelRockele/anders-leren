// =================================================================
//  rapport-engine.js — Genereert PDF-rapport per leerling
//
//  Twee soorten:
//    - kort (1 pagina): samenvatting + laatste resultaat + notitie
//    - uitgebreid (2-3 p): alle taken uit geschiedenis + spreektoetsen +
//      vrij oefenen + per-woord-voortgang
//
//  Gebruikt:
//    - jsPDF (zelfde als werkbladen)
//    - Schoolinstellingen uit Voortgang.haalSchoolinstellingenOp()
//    - Kind-data uit lkKinderen (huidige taak + geschiedenis + spreektoetsen)
// =================================================================

window.RapportEngine = (function() {

  const PB = 210; // A4 breedte mm
  const PH = 297; // A4 hoogte mm
  const M  = 18;  // marge
  const IB = PB - 2 * M;

  // Kleuren
  const K_HOOFDTITEL = '#2D2A32';
  const K_SUBTITEL = '#5D4037';
  const K_PRIMAIR = '#FF8C42';   // Juf Zisa-oranje
  const K_GRIJS = '#888888';
  const K_LICHTGRIJS = '#E5DFD0';
  const K_GROEN = '#4CAF50';
  const K_GEEL = '#FFB74D';
  const K_ROOD = '#E57373';

  // -------- Helpers ---------
  function vandaagFmt() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function datumFmt(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function statusBadge(status) {
    if (status === 'voltooid') return { tekst: 'Voltooid', kleur: K_GROEN, emoji: '✓' };
    if (status === 'moeilijk' || status === 'haperde') return { tekst: 'Moeilijk', kleur: K_GEEL, emoji: '!' };
    return { tekst: 'Bezig', kleur: '#1565C0', emoji: '~' };
  }

  // Volledige naam uit kind-object: "Voornaam Achternaam", val terug op naam
  function _volledigeNaam(kind) {
    if (!kind) return 'Leerling';
    const v = (kind.voornaam || '').trim();
    const a = (kind.achternaam || '').trim();
    if (v || a) return [v, a].filter(Boolean).join(' ');
    return (kind.naam || '').trim() || 'Leerling';
  }

  // Klas-tekst voor de PDF (lege string als geen klas ingevuld)
  function _klasTekst(kind) {
    if (!kind) return '';
    return (kind.klas || '').trim();
  }

  // Helpers: spreektoets perWoord-waarde kan oud (string) of nieuw (object) zijn
  function _oordeel(waarde) {
    if (!waarde) return null;
    if (typeof waarde === 'string') return waarde;
    if (typeof waarde === 'object' && waarde.oordeel) return waarde.oordeel;
    return null;
  }

  function _notitie(waarde) {
    if (!waarde) return '';
    if (typeof waarde === 'object' && waarde.notitie) return waarde.notitie;
    return '';
  }

  // Header op elke pagina (school-info bovenaan)
  function tekenHeader(doc, school, kindnaam, kindcode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(K_HOOFDTITEL);

    // Schoolnaam links bovenaan
    if (school && school.schoolnaam) {
      doc.text(school.schoolnaam, M, M);
    }
    // Klas + leerkracht onder schoolnaam
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(K_GRIJS);
    let yLijn2 = M + 5;
    const klasLk = [school && school.klas, school && school.leerkrachtnaam].filter(Boolean).join(' · ');
    if (klasLk) {
      doc.text(klasLk, M, yLijn2);
    }

    // Datum rechts bovenaan
    doc.setFontSize(9);
    doc.setTextColor(K_GRIJS);
    doc.text(vandaagFmt(), PB - M, M, { align: 'right' });

    // Lijn onder header
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.5);
    doc.line(M, M + 10, PB - M, M + 10);

    return M + 16; // Y-positie waar inhoud mag beginnen
  }

  // Footer met logo + paginanummer
  function tekenFooter(doc, school, paginaNr, totaal) {
    // Footer-zone: vergroot zodat logo goed leesbaar is.
    // Inhoud-cutoff staat op PH - 30 (zie page-break checks),
    // dus footer mag van PH - 28 tot PH - 8.
    const yFoot = PH - 28;        // bovenkant footer-zone (+ 6mm hoger dan voorheen)
    const yLijn = yFoot;          // scheidingslijn
    const footerHoogte = 20;      // ruimte voor logo + paginanummer (was 14)

    // Lijn boven footer
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.3);
    doc.line(M, yLijn, PB - M, yLijn);

    // Logo links (als beschikbaar) — schaal met behoud van aspect-ratio
    if (school && school.logoDataUrl) {
      try {
        const maxH = 18; // mm hoog (was 12 — 50% groter)
        const maxW = 55; // mm breed (was 45)
        let logoW = school.logoBreedte || 0;
        let logoH = school.logoHoogte || 0;

        // Fallback: als afmetingen niet bekend zijn, probeer via jsPDF zelf
        if ((!logoW || !logoH) && doc.getImageProperties) {
          try {
            const props = doc.getImageProperties(school.logoDataUrl);
            logoW = props.width;
            logoH = props.height;
          } catch (e) { /* getImageProperties faalde */ }
        }

        // Tweede fallback: als nog steeds onbekend, gebruik vierkante 1×1
        if (!logoW || !logoH) {
          logoW = 1; logoH = 1;
        }

        // Bereken eindafmeting met aspect-ratio
        const ratio = Math.min(maxW / logoW, maxH / logoH);
        const eindW = logoW * ratio;
        const eindH = logoH * ratio;

        // Detecteer formaat (PNG vs JPEG) op basis van data-URL prefix
        const formaat = school.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';

        // Verticaal centreren binnen footer-zone
        const yLogo = yFoot + (footerHoogte - eindH) / 2 + 1;

        doc.addImage(school.logoDataUrl, formaat, M, yLogo, eindW, eindH, undefined, 'FAST');
      } catch (e) {
        console.warn('Logo tekenen in PDF mislukt:', e);
      }
    }

    // Paginanummer rechts — verticaal gecentreerd in footer-zone
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(K_GRIJS);
    doc.text(`Pagina ${paginaNr}${totaal ? ' / ' + totaal : ''}`, PB - M, yFoot + footerHoogte / 2 + 2, { align: 'right' });
  }

  // Naam + code blok bovenaan inhoud (na header)
  function tekenLeerlingTitel(doc, kindnaam, kindcode, y, klas) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text(kindnaam || 'Leerling', M, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(K_GRIJS);
    const codeRegel = klas ? `Code: ${kindcode}  ·  klas ${klas}` : `Code: ${kindcode}`;
    doc.text(codeRegel, M, y + 12);

    return y + 20;
  }

  // Sectiekop (bv. "Taak: Klas & schoolspullen")
  function tekenSectiekop(doc, tekst, y, accent) {
    accent = accent || K_PRIMAIR;
    // Achtergrond-strookje
    doc.setFillColor(accent);
    doc.rect(M, y, 4, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text(tekst, M + 8, y + 6);
    return y + 12;
  }

  // Kleinere subkop
  function tekenSubkop(doc, tekst, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(K_SUBTITEL);
    doc.text(tekst, M, y + 4);
    return y + 8;
  }

  // ----- Symbolen via lijntekening (geen emoji-afhankelijkheid) -----

  // Vinkje ✓ — twee lijnen
  function tekenVinkje(doc, xCenter, yCenter, grootte, kleur) {
    grootte = grootte || 6;
    kleur = kleur || '#2E7D32';
    doc.setDrawColor(kleur);
    doc.setLineWidth(grootte * 0.18);
    doc.setLineCap('round');
    doc.setLineJoin('round');
    // Korte schuine lijn naar links-onder
    doc.line(
      xCenter - grootte * 0.45, yCenter,
      xCenter - grootte * 0.10, yCenter + grootte * 0.30
    );
    // Lange schuine lijn naar rechts-boven
    doc.line(
      xCenter - grootte * 0.10, yCenter + grootte * 0.30,
      xCenter + grootte * 0.50, yCenter - grootte * 0.35
    );
  }

  // Kruisje ✗ — twee diagonale lijnen
  function tekenKruisje(doc, xCenter, yCenter, grootte, kleur) {
    grootte = grootte || 6;
    kleur = kleur || '#C62828';
    doc.setDrawColor(kleur);
    doc.setLineWidth(grootte * 0.18);
    doc.setLineCap('round');
    const r = grootte * 0.40;
    doc.line(xCenter - r, yCenter - r, xCenter + r, yCenter + r);
    doc.line(xCenter + r, yCenter - r, xCenter - r, yCenter + r);
  }

  // Vraagteken-icoon (voor 'aarzelt' bij spreektoets) — cirkel + ?-vorm
  function tekenVraagteken(doc, xCenter, yCenter, grootte, kleur) {
    grootte = grootte || 6;
    kleur = kleur || '#E65100';
    doc.setDrawColor(kleur);
    doc.setTextColor(kleur);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(grootte * 2.2);
    // Het ? teken bestaat in helvetica → werkt zonder problemen
    doc.text('?', xCenter, yCenter + grootte * 0.30, { align: 'center' });
  }

  // Tekst met automatische lijnafbreking
  function tekenParagraaf(doc, tekst, y, opts) {
    opts = opts || {};
    const fontSize = opts.fontSize || 10;
    const font = opts.font || 'normal';
    const kleur = opts.kleur || K_HOOFDTITEL;
    const breedte = opts.breedte || IB;

    doc.setFont('helvetica', font);
    doc.setFontSize(fontSize);
    doc.setTextColor(kleur);
    const lijnen = doc.splitTextToSize(tekst, breedte);
    doc.text(lijnen, M, y + fontSize * 0.35);
    return y + lijnen.length * fontSize * 0.5 + 1;
  }

  // Tabelrij voor toets-resultaat
  function tekenResultaatTabel(doc, taak, thema, y) {
    if (!thema || !taak) return y;
    const verrijkt = thema._verrijkt ? thema : (window.lkVerrijkThema ? window.lkVerrijkThema(thema) : thema);

    // Aantal juist berekenen
    const aantalW = (taak.woordIds || []).length;
    const fout = (taak.foutWoordenLaatsteToets || []);
    const juist = aantalW - fout.length;
    const pct = aantalW > 0 ? Math.round(juist / aantalW * 100) : 0;

    // Resultaat-strook
    doc.setFillColor('#FFF8E1');
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, IB, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text(`Toets: ${juist} / ${aantalW} juist (${pct}%)`, M + 4, y + 6);

    if (fout.length > 0) {
      // Foute woorden eronder
      const foutTekst = fout.map(id => {
        const it = verrijkt.items ? verrijkt.items.find(x => x.id === id) : null;
        return it ? it.tekst : id;
      }).join(', ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(K_SUBTITEL);
      const lijn = doc.splitTextToSize('Foute woorden: ' + foutTekst, IB - 8);
      doc.text(lijn, M + 4, y + 11);
    }
    return y + 16;
  }

  // Voortgang per woord — bolletjes
  function tekenWoordVoortgang(doc, taak, thema, y) {
    if (!taak || !taak.perWoord || !thema) return y;
    const verrijkt = thema._verrijkt ? thema : (window.lkVerrijkThema ? window.lkVerrijkThema(thema) : thema);
    const items = verrijkt.items || [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(K_SUBTITEL);
    doc.text('Voortgang per woord (luisteren):', M, y + 4);
    y += 8;

    // Per woord: woord + 3 bolletjes
    const kolBreedte = (IB - 10) / 2; // 2 kolommen
    let kolom = 0;
    let kolY = y;
    const woordIds = taak.woordIds || [];
    woordIds.forEach((id, idx) => {
      const x = M + (kolom * (kolBreedte + 10));
      const item = items.find(it => it.id === id);
      const woordTekst = item ? item.tekst : id;
      const data = taak.perWoord[id] || {};
      const score = data.luisteren_juist || 0;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(K_HOOFDTITEL);
      doc.text(woordTekst, x + 2, kolY + 4);

      // Bolletjes
      const bolY = kolY + 2;
      let bolX = x + kolBreedte - 18;
      for (let i = 0; i < 3; i++) {
        if (i < score) {
          doc.setFillColor(K_GROEN);
        } else {
          doc.setFillColor('#FFFFFF');
        }
        doc.setDrawColor('#888888');
        doc.setLineWidth(0.3);
        doc.circle(bolX, bolY + 1, 1.4, 'FD');
        bolX += 4;
      }

      kolom++;
      if (kolom >= 2) { kolom = 0; kolY += 5.5; }
    });

    if (kolom !== 0) kolY += 5.5;
    return kolY + 2;
  }

  // ----- Hoofdfunctie: rapport genereren -----
  // opts = { type: 'kort'|'uitgebreid', notitie: string }
  async function genereer(kind, opts) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-bibliotheek niet geladen.');
    }
    opts = opts || {};
    const type = opts.type || 'kort';
    const notitie = opts.notitie || '';
    const watGingGoed = opts.watGingGoed || '';
    const groeikansen = opts.groeikansen || '';
    const tipsThuis = opts.tipsThuis || '';

    // Schoolinstellingen ophalen
    let school = null;
    try {
      school = await window.Voortgang.haalSchoolinstellingenOp();
    } catch (e) { school = null; }

    // Geschiedenis ophalen + huidige taak
    let geschiedenis = [];
    try {
      geschiedenis = await window.Voortgang.haalTaakgeschiedenisOpVoorKind(kind.code) || [];
    } catch (e) { geschiedenis = []; }

    // Spreektoetsen ophalen
    let spreektoetsen = [];
    try {
      spreektoetsen = await window.Voortgang.haalSpreektoetsenOpVoorKind(kind.code) || [];
    } catch (e) { spreektoetsen = []; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // ===== Pagina 1 =====
    let y = tekenHeader(doc, school, kind.naam, kind.code);
    y = tekenLeerlingTitel(doc, _volledigeNaam(kind), kind.code, y, _klasTekst(kind));

    // === HUIDIGE / LAATSTE TAAK ===
    if (kind.taak && kind.taak.themaId) {
      const taak = kind.taak;
      const thema = window.ALLE_THEMAS_LK
        ? window.ALLE_THEMAS_LK.find(t => t.id === taak.themaId)
        : null;
      const themaNaam = thema ? thema.naam : taak.themaId;

      y = tekenSectiekop(doc, `Huidige taak — ${themaNaam}`, y, K_PRIMAIR);

      // Status-regel
      const sb = statusBadge(taak.status);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(sb.kleur);
      doc.text(`Status: ${sb.tekst}`, M, y + 4);
      y += 7;

      // Vaardigheden + zinscontext
      const vaardigIcoon = { 'luisteren': 'Luisteren', 'lezen': 'Lezen', 'schrijven': 'Schrijven' };
      const vlist = (taak.vaardigheden || []).map(v => vaardigIcoon[v] || v).join(' · ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(K_SUBTITEL);
      doc.text(`Vaardigheden: ${vlist || 'luisteren'}`, M, y + 3);
      y += 6;

      // Toets-resultaat
      if (taak.foutWoordenLaatsteToets !== undefined) {
        y = tekenResultaatTabel(doc, taak, thema, y + 1);
      }

      // Voortgang per woord (alleen in uitgebreid)
      if (type === 'uitgebreid') {
        y = tekenWoordVoortgang(doc, taak, thema, y + 2);
      }
      y += 4;
    } else {
      y = tekenSectiekop(doc, 'Huidige taak', y, K_PRIMAIR);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(K_GRIJS);
      doc.text('Geen actieve taak.', M, y + 4);
      y += 8;
    }

    // === SPREEKTOETSEN — samenvattend ===
    if (spreektoetsen.length > 0) {
      if (y > PH - 50) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
      }
      y = tekenSectiekop(doc, 'Mondeling spreken', y, '#1565C0');

      // Globale tellers over alle toetsen
      let totV = 0, totA = 0, totN = 0;
      let aantalToetsen = spreektoetsen.length;
      const themasGeoefend = new Set();
      spreektoetsen.forEach(st => {
        themasGeoefend.add(st.themaId);
        Object.values(st.perWoord || {}).forEach(r => {
          if (_oordeel(r) === 'vlot') totV++;
          else if (_oordeel(r) === 'aarzelt') totA++;
          else if (_oordeel(r) === 'niet') totN++;
        });
      });
      const totaalBeoord = totV + totA + totN;
      const pctVlot = totaalBeoord > 0 ? Math.round(totV / totaalBeoord * 100) : 0;

      // Globale samenvatting
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(K_HOOFDTITEL);
      const sn = aantalToetsen === 1
        ? `Er werd 1 spreektoets afgenomen`
        : `Er werden ${aantalToetsen} spreektoetsen afgenomen`;
      const themasN = themasGeoefend.size;
      const themaTxt = themasN === 1 ? '1 thema' : `${themasN} thema's`;
      doc.text(`${sn} verspreid over ${themaTxt}.`, M, y + 4);
      y += 7;
      doc.text(`In totaal werden ${totaalBeoord} woordbeoordelingen genoteerd: ${totV} vlot, ${totA} aarzelt, ${totN} niet.`, M, y + 4);
      y += 7;

      // Trend: vergelijk laatste toets met eerste (alleen als er minstens 2 zijn)
      if (aantalToetsen >= 2) {
        const sorted = [...spreektoetsen].sort((a, b) => (a.datum || 0) - (b.datum || 0));
        const eerste = sorted[0];
        const laatste = sorted[sorted.length - 1];
        function pctVlotVan(toets) {
          let v = 0, t = 0;
          Object.values(toets.perWoord || {}).forEach(r => {
            t++;
            if (_oordeel(r) === 'vlot') v++;
          });
          return t > 0 ? Math.round(v / t * 100) : 0;
        }
        const eerstePct = pctVlotVan(eerste);
        const laatstePct = pctVlotVan(laatste);
        const verschil = laatstePct - eerstePct;
        let trendTekst = '';
        if (verschil >= 10) trendTekst = `Vooruitgang zichtbaar: van ${eerstePct}% vlot bij de eerste toets naar ${laatstePct}% bij de laatste.`;
        else if (verschil <= -10) trendTekst = `De laatste toets ging moeilijker (${laatstePct}% vlot) dan de eerste (${eerstePct}%). We blijven oefenen.`;
        else trendTekst = `Stabiele resultaten: ${eerstePct}% bij eerste toets, ${laatstePct}% bij laatste.`;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(K_SUBTITEL);
        const lijn = doc.splitTextToSize(trendTekst, IB - 4);
        doc.text(lijn, M + 2, y + 3);
        y += lijn.length * 4 + 3;
      }

      // Mini-tabel: laatste toetsen overzicht
      if (type === 'uitgebreid') {
        if (y > PH - 30) {
          doc.addPage();
          y = tekenHeader(doc, school, kind.naam, kind.code);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(K_SUBTITEL);
        doc.text('Toetsen-overzicht:', M, y + 4);
        y += 6;

        const sorted = [...spreektoetsen].sort((a, b) => (b.datum || 0) - (a.datum || 0));
        sorted.slice(0, 8).forEach(st => {
          if (y > PH - 32) {
            doc.addPage();
            y = tekenHeader(doc, school, kind.naam, kind.code);
          }
          let v = 0, a = 0, n = 0;
          Object.values(st.perWoord || {}).forEach(r => {
            if (_oordeel(r) === 'vlot') v++;
            else if (_oordeel(r) === 'aarzelt') a++;
            else if (_oordeel(r) === 'niet') n++;
          });
          const thema = window.ALLE_THEMAS_LK
            ? window.ALLE_THEMAS_LK.find(t => t.id === st.themaId)
            : null;
          const themaNaam = thema ? thema.naam : (st.themaId || '');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(K_HOOFDTITEL);
          doc.text(`${datumFmt(st.datum)} — ${themaNaam}: ${v} vlot · ${a} aarzelt · ${n} niet`, M + 2, y + 3);
          y += 4.5;
        });
        y += 2;
      }
    }

    // === GESCHIEDENIS (alleen in uitgebreid) ===
    if (type === 'uitgebreid' && geschiedenis.length > 0) {
      if (y > PH - 50) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
      }
      y = tekenSectiekop(doc, 'Eerdere taken', y, '#9E9E9E');

      // Meest recente eerst
      const sorted = [...geschiedenis].sort((a, b) => (b.voltooidOp || 0) - (a.voltooidOp || 0));
      sorted.forEach(arch => {
        if (y > PH - 35) {
          doc.addPage();
          y = tekenHeader(doc, school, kind.naam, kind.code);
        }
        const thema = window.ALLE_THEMAS_LK
          ? window.ALLE_THEMAS_LK.find(t => t.id === arch.themaId)
          : null;
        const themaNaam = thema ? thema.naam : (arch.themaId || '');
        const sb = statusBadge(arch.status);
        const aantalW = (arch.woordIds || []).length;
        const fout = arch.foutWoordenLaatsteToets || [];
        const juist = aantalW - fout.length;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(K_HOOFDTITEL);
        doc.text(`${datumFmt(arch.voltooidOp)} — ${themaNaam}`, M, y + 4);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(sb.kleur);
        doc.text(`${sb.tekst} · ${juist}/${aantalW} juist`, M + 2, y + 3);
        y += 5;

        if (fout.length > 0 && thema) {
          const verrijkt = window.lkVerrijkThema ? window.lkVerrijkThema(thema) : thema;
          const namen = fout.map(id => {
            const it = (verrijkt.items || []).find(x => x.id === id);
            return it ? it.tekst : id;
          });
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(K_SUBTITEL);
          const lijn = doc.splitTextToSize('Fout: ' + namen.join(', '), IB - 6);
          doc.text(lijn, M + 4, y + 3);
          y += lijn.length * 3.5 + 1;
        }
        y += 3;
      });
    }

    // === VRIJ OEFENEN ===
    if (y > PH - 35) {
      doc.addPage();
      y = tekenHeader(doc, school, kind.naam, kind.code);
    }
    y = tekenSectiekop(doc, 'Vrij oefenen', y, '#9C27B0');

    if (Array.isArray(kind.thema_actief)) {
      if (kind.thema_actief.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(K_GRIJS);
        doc.text('Geen actieve thema\'s.', M, y + 4);
        y += 6;
      } else {
        const namen = kind.thema_actief.map(id => {
          const t = window.ALLE_THEMAS_LK ? window.ALLE_THEMAS_LK.find(x => x.id === id) : null;
          return t ? t.naam : id;
        });
        y = tekenParagraaf(doc, 'Actieve thema\'s: ' + namen.join(', '), y, { fontSize: 10 });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(K_GRIJS);
      doc.text('Alle thema\'s open (standaard).', M, y + 4);
      y += 6;
    }

    // Algemene voortgang
    if (window.lkBerekenVoortgangVoorKind || window.berekenVoortgangVoorKind) {
      const fn = window.berekenVoortgangVoorKind || window.lkBerekenVoortgangVoorKind;
      try {
        const { gekend, totaal } = fn(kind);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(K_HOOFDTITEL);
        doc.text(`Algemene voortgang: ${gekend} van ${totaal} woorden gekend`, M, y + 4);
        y += 7;
      } catch (e) { /* ignore */ }
    }

    // === FEEDBACK — drie velden: goed / groei / tips ===
    function _tekenFeedbackBlok(titel, kleur, tekst) {
      if (!tekst || !tekst.trim()) return;
      if (y > PH - 30) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
      }
      y = tekenSectiekop(doc, titel, y, kleur);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(K_HOOFDTITEL);
      const lijnen = doc.splitTextToSize(tekst, IB - 4);
      doc.text(lijnen, M + 2, y + 4);
      y += lijnen.length * 4.8 + 4;
    }

    _tekenFeedbackBlok('Wat ging goed', K_GROEN, watGingGoed);
    _tekenFeedbackBlok('Groeikansen', '#1565C0', groeikansen);
    _tekenFeedbackBlok('Tips voor thuis', '#9C27B0', tipsThuis);

    // === NOTITIE VAN DE LEERKRACHT ===
    if (notitie && notitie.trim()) {
      if (y > PH - 35) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
      }
      y = tekenSectiekop(doc, 'Bericht voor de ouders', y, K_PRIMAIR);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(K_HOOFDTITEL);
      const lijnen = doc.splitTextToSize(notitie, IB - 4);
      doc.text(lijnen, M + 2, y + 4);
      y += lijnen.length * 5;
    }

    // Footer op alle pagina's
    const totaalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totaalPag; i++) {
      doc.setPage(i);
      tekenFooter(doc, school, i, totaalPag);
    }

    // Download
    const veiligeNaam = (_volledigeNaam(kind) || kind.code).replace(/[^a-zA-Z0-9-]/g, '_');
    const datum = vandaagFmt().replace(/\//g, '-');
    doc.save(`rapport-${veiligeNaam}-${datum}.pdf`);
  }

  // ===================================================================
  //  SPREEKTOETS-PDF — kindvriendelijk raster met beelden
  //  5 woorden per rij. Per cel:
  //    - Beeldje van het woord
  //    - Achtergrond groen (vlot), oranje (aarzelt) of rood (niet)
  //    - Symbool: ✓, ?, ✗
  //    - Woordtekst onderaan
  //    - Notitie (cursief, kleiner) als die er is
  // ===================================================================
  async function spreektoetsPdf(kind, toets) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-bibliotheek niet geladen.');
    }
    if (!toets || !toets.themaId) {
      throw new Error('Geen geldige toets gegeven.');
    }

    let school = null;
    try {
      school = await window.Voortgang.haalSchoolinstellingenOp();
    } catch (e) { school = null; }

    const thema = window.ALLE_THEMAS_LK
      ? window.ALLE_THEMAS_LK.find(t => t.id === toets.themaId)
      : null;
    const verrijkt = thema && window.lkVerrijkThema ? window.lkVerrijkThema(thema) : thema;

    // Prefetch beelden
    if (window.PDFEngine && window.PDFEngine.prefetchPictos && verrijkt && verrijkt.items) {
      try {
        const woordIds = Object.keys(toets.perWoord || {});
        const items = verrijkt.items.filter(it => woordIds.indexOf(it.id) !== -1);
        await window.PDFEngine.prefetchPictos(items);
      } catch (e) { console.warn('Prefetch beelden mislukt:', e); }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    let y = tekenHeader(doc, school, kind.naam, kind.code);

    // Titel
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text('Spreektoets', M, y + 5);
    y += 10;

    // Sub: leerling + (klas) + thema + datum
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(K_SUBTITEL);
    const themaNaam = thema ? thema.naam : (toets.themaId || '');
    const naamLeerling = _volledigeNaam(kind);
    const klas = _klasTekst(kind);
    const naamMetKlas = klas ? `${naamLeerling}  ·  klas ${klas}` : naamLeerling;
    doc.text(`${naamMetKlas}  ·  ${themaNaam}  ·  ${datumFmt(toets.datum)}`, M, y + 4);
    y += 9;

    // Score-strook bovenaan
    let aV = 0, aA = 0, aN = 0;
    Object.values(toets.perWoord || {}).forEach(r => {
      const o = _oordeel(r);
      if (o === 'vlot') aV++;
      else if (o === 'aarzelt') aA++;
      else if (o === 'niet') aN++;
    });
    const totaal = aV + aA + aN;
    const pctVlot = totaal > 0 ? Math.round(aV / totaal * 100) : 0;

    doc.setFillColor('#FFF8E1');
    doc.setDrawColor(K_GEEL);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, IB, 16, 3, 3, 'FD');

    // Linkerblok: titel
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text('Mondeling', M + 6, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(K_SUBTITEL);
    doc.text(`${totaal} woord${totaal === 1 ? '' : 'en'} beoordeeld`, M + 6, y + 12);

    // Rechterblok: drie tellers naast elkaar
    const xT = PB - M - 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    // Vlot teller
    doc.setTextColor(K_GROEN);
    doc.text(`${aV}`, xT - 30, y + 9, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('vlot', xT - 30, y + 13, { align: 'right' });
    // Aarzelt teller
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor('#E65100');
    doc.text(`${aA}`, xT - 15, y + 9, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('aarzelt', xT - 15, y + 13, { align: 'right' });
    // Niet teller
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(K_ROOD);
    doc.text(`${aN}`, xT, y + 9, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('niet', xT, y + 13, { align: 'right' });

    y += 22;

    // Raster — 5 cellen per rij
    const KOLS = 5;
    const RIJ_GAP = 4;
    const KOL_GAP = 4;
    const celBreedte = (IB - (KOLS - 1) * KOL_GAP) / KOLS;
    // Cel-hoogte hangt af van of er een notitie is. Uniform: 44mm zodat
    // een notitie van 1-2 lijnen er onderin past. Lange notities worden
    // afgeknipt — daarvoor staat de notitie vooral als geheugensteun.
    const celHoogte = 44;

    if (verrijkt && verrijkt.items) {
      // Items in volgorde: eerst vlot, dan aarzelt, dan niet (geeft visuele groepering)
      // Maar logischer voor een toetsenmap: thema-volgorde aanhouden zodat juf herkent
      // Kies: themavolgorde van de items in verrijkt
      const beoordeeldeIds = Object.keys(toets.perWoord || {});
      const itemsInVolgorde = verrijkt.items.filter(it => beoordeeldeIds.indexOf(it.id) !== -1);

      let kolIdx = 0;

      itemsInVolgorde.forEach(item => {
        const waarde = toets.perWoord[item.id];
        const oordeel = _oordeel(waarde);
        if (!oordeel) return;
        const notitie = _notitie(waarde);

        // Page break check
        if (y + celHoogte > PH - 32) {
          doc.addPage();
          y = tekenHeader(doc, school, kind.naam, kind.code);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(K_GRIJS);
          doc.text(`Spreektoets — ${themaNaam} (vervolg)`, M, y + 3);
          y += 7;
          kolIdx = 0;
        }

        const x = M + kolIdx * (celBreedte + KOL_GAP);

        // Bepaal kleuren per oordeel
        let bgKleur, randKleur, symKleur;
        if (oordeel === 'vlot') {
          bgKleur = '#E8F5E9'; randKleur = K_GROEN; symKleur = K_GROEN;
        } else if (oordeel === 'aarzelt') {
          bgKleur = '#FFF3E0'; randKleur = '#FB8C00'; symKleur = '#E65100';
        } else { // niet
          bgKleur = '#FFEBEE'; randKleur = K_ROOD; symKleur = K_ROOD;
        }

        // Cel-achtergrond
        doc.setFillColor(bgKleur);
        doc.setDrawColor(randKleur);
        doc.setLineWidth(0.6);
        doc.roundedRect(x, y, celBreedte, celHoogte, 2.5, 2.5, 'FD');

        // Beeld bovenaan
        const beeldGrootte = 16;
        const beeldX = x + celBreedte / 2;
        const beeldY = y + 3 + beeldGrootte / 2;
        if (window.PDFEngine && window.PDFEngine.plaatsItemBeeld) {
          try {
            window.PDFEngine.plaatsItemBeeld(doc, item, beeldX, beeldY, beeldGrootte);
          } catch (e) { /* geen beeld */ }
        }

        // Symbool onder het beeld
        const symY = y + 23;
        if (oordeel === 'vlot') {
          tekenVinkje(doc, beeldX, symY, 5, symKleur);
        } else if (oordeel === 'aarzelt') {
          tekenVraagteken(doc, beeldX, symY, 5, symKleur);
        } else {
          tekenKruisje(doc, beeldX, symY, 5, symKleur);
        }

        // Woord
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(K_HOOFDTITEL);
        const woordLijnen = doc.splitTextToSize(item.tekst, celBreedte - 4);
        doc.text(woordLijnen, beeldX, y + 31, { align: 'center' });

        // Notitie eronder (cursief, klein) als aanwezig
        if (notitie) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(K_SUBTITEL);
          // Beperk tot 2 lijnen om binnen de cel te blijven
          const notLijnen = doc.splitTextToSize('"' + notitie + '"', celBreedte - 4);
          const tonen = notLijnen.slice(0, 2);
          if (notLijnen.length > 2) {
            tonen[1] = tonen[1].slice(0, -3) + '..."';
          }
          doc.text(tonen, beeldX, y + 36, { align: 'center' });
        }

        kolIdx++;
        if (kolIdx >= KOLS) {
          kolIdx = 0;
          y += celHoogte + RIJ_GAP;
        }
      });
      if (kolIdx !== 0) {
        y += celHoogte + RIJ_GAP;
      }
    }

    // Algemene notitie — in eigen kader (geen kleur-vulling, duidelijke rand)
    if (toets.notitie && toets.notitie.trim()) {
      // Padding binnen kader: 5mm rond
      const paddingX = 6;
      const paddingY = 6;
      const lijnenSchatting = doc.splitTextToSize(toets.notitie, IB - 2 * paddingX);
      const blokHoogte = paddingY + 6 + lijnenSchatting.length * 5 + paddingY; // titel(6) + tekst + padding

      // Extra witruimte zodat het niet tegen onderste rij woorden plakt
      y += 14;

      // Page break check
      if (y + blokHoogte > PH - 32) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
        y += 4;
      }

      // Kader (geen vulling, donkere rand voor zichtbaarheid)
      doc.setDrawColor('#5D4037'); // K_SUBTITEL — donkerbruin, goed zichtbaar
      doc.setLineWidth(0.5);
      doc.roundedRect(M, y, IB, blokHoogte, 3, 3, 'S');

      // Titel binnen kader
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#5D4037');
      doc.text('Algemene notitie', M + paddingX, y + paddingY + 4);

      // Tekst eronder
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(K_HOOFDTITEL);
      doc.text(lijnenSchatting, M + paddingX, y + paddingY + 11);

      y += blokHoogte;
    }

    // Footer op alle pagina's
    const totaalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totaalPag; i++) {
      doc.setPage(i);
      tekenFooter(doc, school, i, totaalPag);
    }

    const veiligeNaam = (_volledigeNaam(kind) || kind.code).replace(/[^a-zA-Z0-9-]/g, '_');
    const datum = datumFmt(toets.datum).replace(/\//g, '-');
    const themaSlug = (thema && thema.id) ? thema.id : 'thema';
    doc.save(`spreektoets-${veiligeNaam}-${themaSlug}-${datum}.pdf`);
  }

  // ===================================================================
  //  SPREEKTOETS-AFNAMEBLAD — blanco werkblad voor met pen in te vullen
  //  Layout: nr · klein beeldje · woord · ☐ vlot ☐ aarz. ☐ niet · lijntjes
  // ===================================================================
  async function spreektoetsAfnameblad(kind, thema, items) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-bibliotheek niet geladen.');
    }
    if (!items || items.length === 0) {
      throw new Error('Geen woorden in dit thema.');
    }

    let school = null;
    try {
      school = await window.Voortgang.haalSchoolinstellingenOp();
    } catch (e) { school = null; }

    // Prefetch beelden voor de woorden
    if (window.PDFEngine && window.PDFEngine.prefetchPictos) {
      try {
        await window.PDFEngine.prefetchPictos(items);
      } catch (e) { console.warn('Prefetch beelden mislukt:', e); }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Header standaard
    let y = tekenHeader(doc, school, kind.naam, kind.code);

    // Titel
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text('Spreektoets — afnameblad', M, y + 4);
    y += 9;

    // Subtitel met thema
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(K_SUBTITEL);
    const themaNaam = thema && thema.naam ? thema.naam : (thema && thema.id) || '';
    doc.text(`Thema: ${themaNaam}  ·  ${items.length} woord${items.length === 1 ? '' : 'en'}`, M, y + 4);
    y += 8;

    // Strook met velden voor naam + datum (handmatig in te vullen)
    doc.setFillColor('#FAFAF5');
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, IB, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(K_SUBTITEL);
    doc.text('Naam:', M + 4, y + 5);
    // lijn voor naam
    doc.setDrawColor('#888888');
    doc.setLineWidth(0.3);
    doc.line(M + 18, y + 5.5, M + 90, y + 5.5);
    doc.text('Datum:', M + 100, y + 5);
    doc.line(M + 116, y + 5.5, M + 160, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(K_GRIJS);
    doc.text(`Code: ${kind.code || '—'}`, M + 4, y + 10);
    y += 16;

    // Tabel-header
    // Kolommen: nr (8mm) · beeld (12mm) · woord (40mm) · checkboxes (28mm) · notitielijntjes (rest)
    const xNr = M;
    const xBeeld = M + 8;
    const xWoord = M + 22;
    const xChk = M + 70;
    const xNot = M + 102;
    const wNot = (PB - M) - xNot;

    function tekenTabelKop(yKop) {
      doc.setFillColor('#F0E6D2');
      doc.setDrawColor(K_LICHTGRIJS);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, yKop, IB, 7, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(K_SUBTITEL);
      doc.text('#', xNr + 2, yKop + 4.5);
      doc.text('Beeld', xBeeld + 1, yKop + 4.5);
      doc.text('Woord', xWoord + 1, yKop + 4.5);
      doc.text('Vlot   Aarz.   Niet', xChk + 1, yKop + 4.5);
      doc.text('Wat zei het kind?', xNot + 1, yKop + 4.5);
      return yKop + 9;
    }

    y = tekenTabelKop(y);

    // Bepaal rij-hoogte: zo hoog dat beeldje er in past + ruimte voor lijntjes
    const RH = 16; // mm per rij
    const beeldH = 11; // hoogte van beeldje
    const beeldW = 11;

    items.forEach((it, idx) => {
      // Nieuwe pagina indien geen plaats meer
      if (y + RH > PH - 22) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
        // Op vervolgpagina: titel klein + tabelkop opnieuw
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(K_GRIJS);
        doc.text(`Spreektoets — afnameblad — ${themaNaam} (vervolg)`, M, y + 3);
        y += 6;
        y = tekenTabelKop(y);
      }

      const yRij = y;

      // Lichte achtergrond afwisselend
      if (idx % 2 === 0) {
        doc.setFillColor('#FBFBF6');
        doc.rect(M, yRij - 1, IB, RH, 'F');
      }

      // Nummer
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(K_SUBTITEL);
      doc.text(String(idx + 1), xNr + 2, yRij + 6);

      // Beeldje — gebruik plaatsItemBeeld voor PNG én emoji-fallback
      if (window.PDFEngine && window.PDFEngine.plaatsItemBeeld) {
        try {
          // Plaats vierkant beeld van 10mm midden in de beeld-cel
          window.PDFEngine.plaatsItemBeeld(doc, it, xBeeld + 6, yRij + 7, 10);
        } catch (e) {
          // val terug: niets
        }
      }

      // Woord
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(K_HOOFDTITEL);
      const woordLijnen = doc.splitTextToSize(it.tekst, xChk - xWoord - 3);
      doc.text(woordLijnen, xWoord + 1, yRij + 6);

      // Checkboxes ☐ ☐ ☐
      doc.setDrawColor(K_HOOFDTITEL);
      doc.setLineWidth(0.4);
      const cbY = yRij + 4;
      const cbSize = 4;
      // Vlot
      doc.rect(xChk + 2, cbY, cbSize, cbSize);
      // Aarzelt
      doc.rect(xChk + 12, cbY, cbSize, cbSize);
      // Niet
      doc.rect(xChk + 22, cbY, cbSize, cbSize);

      // Notitielijntjes (twee dunne lijntjes)
      doc.setDrawColor('#BBBBBB');
      doc.setLineWidth(0.2);
      doc.line(xNot, yRij + 5, xNot + wNot - 2, yRij + 5);
      doc.line(xNot, yRij + 11, xNot + wNot - 2, yRij + 11);

      // Rij-onderlijn
      doc.setDrawColor(K_LICHTGRIJS);
      doc.setLineWidth(0.2);
      doc.line(M, yRij + RH - 1, PB - M, yRij + RH - 1);

      y += RH;
    });

    // Algemene opmerkingen-blok onderaan
    if (y + 35 < PH - 20) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(K_SUBTITEL);
      doc.text('Algemene opmerkingen:', M, y);
      y += 4;
      // 4 lijntjes om te schrijven
      doc.setDrawColor('#BBBBBB');
      doc.setLineWidth(0.2);
      for (let i = 0; i < 4; i++) {
        y += 6;
        doc.line(M, y, PB - M, y);
      }
    }

    // Footer op alle pagina's
    const totaalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totaalPag; i++) {
      doc.setPage(i);
      tekenFooter(doc, school, i, totaalPag);
    }

    const veiligeNaam = (_volledigeNaam(kind) || kind.code).replace(/[^a-zA-Z0-9-]/g, '_');
    const themaSlug = (thema && thema.id) ? thema.id : 'thema';
    doc.save(`afnameblad-${veiligeNaam}-${themaSlug}.pdf`);
  }


  // ===================================================================
  //  LUISTERTOETS-PDF — kindvriendelijk raster met beelden
  //  5 woorden per rij, 25 per pagina. Per cel:
  //    - Beeldje van het woord
  //    - Achtergrond groen of rood
  //    - Groot symbool ✓ (juist) of ✗ (fout) onder het beeld
  //    - Woordtekst onderaan
  // ===================================================================
  async function taakPdf(kind, taak) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-bibliotheek niet geladen.');
    }
    if (!taak || !taak.themaId) {
      throw new Error('Geen geldige taak gegeven.');
    }

    let school = null;
    try {
      school = await window.Voortgang.haalSchoolinstellingenOp();
    } catch (e) { school = null; }

    const thema = window.ALLE_THEMAS_LK
      ? window.ALLE_THEMAS_LK.find(t => t.id === taak.themaId)
      : null;
    const verrijkt = thema && window.lkVerrijkThema ? window.lkVerrijkThema(thema) : thema;

    // Prefetch beelden
    if (window.PDFEngine && window.PDFEngine.prefetchPictos && verrijkt && verrijkt.items) {
      try {
        const wIds = Array.isArray(taak.woordIds) ? taak.woordIds : [];
        const items = verrijkt.items.filter(it => wIds.indexOf(it.id) !== -1);
        await window.PDFEngine.prefetchPictos(items);
      } catch (e) { console.warn('Prefetch beelden mislukt:', e); }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Bepaal welke toetsen er afgenomen zijn. Nieuwe taken hebben toetsResultaten,
    // oudere alleen foutWoordenLaatsteToets (interpreteren als luistertoets).
    // Voor elke vaardigheid kunnen er 1 of 2 pogingen zijn (herkansing).
    const allevaardigheden = ['luisteren', 'lezen', 'schrijven'];
    const labels = {
      luisteren: 'Luistertoets',
      lezen:     'Leestoets',
      schrijven: 'Schrijftoets'
    };
    // Lijst van te renderen secties: { vaardigheid, foutIds, pogingNr, totaalPogingen }
    const teRenderen = [];
    if (taak.toetsResultaten) {
      allevaardigheden.forEach(v => {
        const r = taak.toetsResultaten[v];
        if (!r || !r.afgenomen) return;
        // Als er een pogingen-array is, render elke poging als aparte sectie
        if (Array.isArray(r.pogingen) && r.pogingen.length > 0) {
          r.pogingen.forEach((p, idx) => {
            teRenderen.push({
              vaardigheid: v,
              foutIds: Array.isArray(p.foutIds) ? p.foutIds : [],
              pct: typeof p.pct === 'number' ? p.pct : null,
              pogingNr: idx + 1,
              totaalPogingen: r.pogingen.length
            });
          });
        } else {
          // Geen pogingen-array (oude data) → val terug op foutIds van het object zelf
          teRenderen.push({
            vaardigheid: v,
            foutIds: Array.isArray(r.foutIds) ? r.foutIds : [],
            pct: null,
            pogingNr: 1,
            totaalPogingen: 1
          });
        }
      });
    }
    if (teRenderen.length === 0) {
      // Backwards-compat: gebruik foutWoordenLaatsteToets als luistertoets
      const fout = Array.isArray(taak.foutWoordenLaatsteToets) ? taak.foutWoordenLaatsteToets : [];
      const isVoltooid = taak.status === 'voltooid';
      const isMoeilijk = (taak.status === 'moeilijk' || taak.status === 'haperde');
      if (isVoltooid || isMoeilijk || fout.length > 0) {
        teRenderen.push({
          vaardigheid: 'luisteren',
          foutIds: fout,
          pct: null,
          pogingNr: 1,
          totaalPogingen: 1
        });
      }
    }
    // Aliasen voor backwards-compat met de oude variabele-naam in render-code
    const afgenomenToetsen = teRenderen;

    // Header op pagina 1
    let y = tekenHeader(doc, school, kind.naam, kind.code);

    // Hoofdtitel
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(K_HOOFDTITEL);
    const hoofdtitel = afgenomenToetsen.length > 1 ? 'Toetsen' : (afgenomenToetsen.length === 1 ? labels[afgenomenToetsen[0].vaardigheid] : 'Toets');
    doc.text(hoofdtitel, M, y + 5);
    y += 10;

    // Sub: leerling + (klas) + thema + datum
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(K_SUBTITEL);
    const themaNaam = thema ? thema.naam : (taak.themaId || '');
    const datumTaak = taak.voltooidOp || taak.gestart || Date.now();
    const naamLeerling = _volledigeNaam(kind);
    const klas = _klasTekst(kind);
    const naamMetKlas = klas ? `${naamLeerling}  ·  klas ${klas}` : naamLeerling;
    doc.text(`${naamMetKlas}  ·  ${themaNaam}  ·  ${datumFmt(datumTaak)}`, M, y + 4);
    y += 9;

    // Helper: render één vaardigheid-sectie. Geeft de nieuwe y-waarde terug.
    function renderVaardigheidSectie(toets, yStart) {
      const woordIds = Array.isArray(taak.woordIds) ? taak.woordIds : [];
      const fouteIds = Array.isArray(toets.foutIds) ? toets.foutIds : [];
      const aantalW = woordIds.length;
      const aantalFout = fouteIds.length;
      const aantalJuist = aantalW - aantalFout;
      const pctJuist = aantalW > 0 ? Math.round(aantalJuist / aantalW * 100) : 0;

      // Page break als sectie-kop niet meer past
      if (yStart + 28 > PH - 32) {
        doc.addPage();
        yStart = tekenHeader(doc, school, kind.naam, kind.code);
      }

      // Sectie-titel — bij meerdere pogingen toon "1ste poging" / "Herkansing"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(K_HOOFDTITEL);
      let titel = labels[toets.vaardigheid] || 'Toets';
      if (toets.totaalPogingen && toets.totaalPogingen > 1) {
        const suffix = (toets.pogingNr === 1) ? '1ste poging' : 'Herkansing';
        titel = `${titel} — ${suffix}`;
      }
      doc.text(titel, M, yStart + 5);
      yStart += 8;

      // Score-strook
      const stKleur = pctJuist === 100 ? '#E8F5E9' : (pctJuist >= 80 ? '#FFF8E1' : '#FFEBEE');
      const stRand  = pctJuist === 100 ? K_GROEN : (pctJuist >= 80 ? K_GEEL : K_ROOD);
      doc.setFillColor(stKleur);
      doc.setDrawColor(stRand);
      doc.setLineWidth(0.5);
      doc.roundedRect(M, yStart, IB, 14, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(K_SUBTITEL);
      doc.text('Resultaat', M + 6, yStart + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(K_HOOFDTITEL);
      doc.text(`${aantalJuist} / ${aantalW}`, PB - M - 6, yStart + 8, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(K_SUBTITEL);
      doc.text(`${pctJuist}%`, PB - M - 6, yStart + 12, { align: 'right' });
      yStart += 18;

      // Raster: 5 cellen per rij
      const KOLS = 5;
      const RIJ_GAP = 4;
      const KOL_GAP = 4;
      const celBreedte = (IB - (KOLS - 1) * KOL_GAP) / KOLS;
      const celHoogte = 38;

      if (verrijkt && verrijkt.items) {
        let kolIdx = 0;
        for (let i = 0; i < woordIds.length; i++) {
          const id = woordIds[i];
          const item = verrijkt.items.find(it => it.id === id);
          if (!item) continue;

          // Page break
          if (yStart + celHoogte > PH - 32) {
            doc.addPage();
            yStart = tekenHeader(doc, school, kind.naam, kind.code);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(K_GRIJS);
            doc.text(`${labels[toets.vaardigheid]} — ${themaNaam} (vervolg)`, M, yStart + 3);
            yStart += 7;
            kolIdx = 0;
          }

          const x = M + kolIdx * (celBreedte + KOL_GAP);
          const isFout = (fouteIds.indexOf(id) !== -1);
          const isJuist = !isFout;

          let bgKleur, randKleur;
          if (isJuist) { bgKleur = '#E8F5E9'; randKleur = K_GROEN; }
          else { bgKleur = '#FFEBEE'; randKleur = K_ROOD; }

          doc.setFillColor(bgKleur);
          doc.setDrawColor(randKleur);
          doc.setLineWidth(0.6);
          doc.roundedRect(x, yStart, celBreedte, celHoogte, 2.5, 2.5, 'FD');

          // Beeld
          const beeldGrootte = 18;
          const beeldX = x + celBreedte / 2;
          const beeldY = yStart + 3 + beeldGrootte / 2;
          if (window.PDFEngine && window.PDFEngine.plaatsItemBeeld) {
            try {
              window.PDFEngine.plaatsItemBeeld(doc, item, beeldX, beeldY, beeldGrootte);
            } catch (e) { /* geen beeld */ }
          }

          // Symbool
          const symY = yStart + 24;
          if (isJuist) tekenVinkje(doc, beeldX, symY, 6, K_GROEN);
          else tekenKruisje(doc, beeldX, symY, 6, K_ROOD);

          // Woord
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(K_HOOFDTITEL);
          const woordLijnen = doc.splitTextToSize(item.tekst, celBreedte - 4);
          doc.text(woordLijnen, beeldX, yStart + celHoogte - 3, { align: 'center' });

          kolIdx++;
          if (kolIdx >= KOLS) {
            kolIdx = 0;
            yStart += celHoogte + RIJ_GAP;
          }
        }
        if (kolIdx !== 0) {
          yStart += celHoogte + RIJ_GAP;
        }
      }

      return yStart + 6; // extra ruimte tussen vaardigheden
    }

    // Render elke afgenomen vaardigheid
    if (afgenomenToetsen.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(K_GRIJS);
      doc.text('Nog geen toetsen afgenomen.', M, y + 8);
    } else {
      afgenomenToetsen.forEach(toets => {
        y = renderVaardigheidSectie(toets, y);
      });
    }

    // Footer op alle pagina's
    const totaalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totaalPag; i++) {
      doc.setPage(i);
      tekenFooter(doc, school, i, totaalPag);
    }

    const veiligeNaam = (_volledigeNaam(kind) || kind.code).replace(/[^a-zA-Z0-9-]/g, '_');
    const datumStr = datumFmt(datumTaak).replace(/\//g, '-');
    const themaSlug = (thema && thema.id) ? thema.id : 'thema';
    const naamPrefix = afgenomenToetsen.length > 1 ? 'toetsen' : 'luistertoets';
    doc.save(`${naamPrefix}-${veiligeNaam}-${themaSlug}-${datumStr}.pdf`);
  }



  // =================================================================
  //  rapportPdf — periode-rapport met sterren + feedback
  // =================================================================
  //
  // 2 pagina's A4 verticaal:
  //   - Pagina 1: overzicht met sterren per vaardigheid (5 rijen)
  //   - Pagina 2: feedback in 3 categorieën + handtekening-zone
  //
  // Argumenten:
  //   kind     — kind-object uit lkKinderen
  //   rapport  — { sterren, toetsdata, feedback, ... } zoals in /rapporten/
  //   periode  — periode-object { id, naam, startDatum, eindDatum }

  // Teken één 5-puntige ster met fill+stroke. Centerpunt (cx, cy), buitenstraal r.
  function _tekenSter(doc, cx, cy, r, kleurFill, kleurStroke) {
    // 10 punten: afwisselend buitenpunt (r) en binnenpunt (r * 0.5)
    // Start bovenaan (-90°), draai met de klok mee.
    const punten = [];
    const innerR = r * 0.5;
    for (let i = 0; i < 10; i++) {
      const hoek = -Math.PI / 2 + (i * Math.PI / 5);
      const straal = (i % 2 === 0) ? r : innerR;
      punten.push([cx + straal * Math.cos(hoek), cy + straal * Math.sin(hoek)]);
    }
    // Bouw lijnen-array voor doc.lines: relatieve verplaatsingen vanaf 1e punt
    const lijnen = [];
    for (let i = 1; i < punten.length; i++) {
      lijnen.push([punten[i][0] - punten[i - 1][0], punten[i][1] - punten[i - 1][1]]);
    }
    // Sluit terug naar startpunt
    lijnen.push([punten[0][0] - punten[9][0], punten[0][1] - punten[9][1]]);

    if (kleurFill) doc.setFillColor(kleurFill);
    if (kleurStroke) {
      doc.setDrawColor(kleurStroke);
      doc.setLineWidth(0.25);
    }
    const stijl = (kleurFill && kleurStroke) ? 'FD' : (kleurFill ? 'F' : 'S');
    doc.lines(lijnen, punten[0][0], punten[0][1], [1, 1], stijl, true);
  }

  // Teken een rij van 4 sterren naast elkaar; aantalGevuld = 0..4 (of null = geen)
  function _tekenSterRij(doc, x, y, aantalGevuld) {
    const rGroot = 2.6;        // buitenstraal in mm
    const tussen = 6.5;        // afstand tussen middelpunten
    for (let i = 0; i < 4; i++) {
      const cx = x + rGroot + (i * tussen);
      const cy = y;
      if (aantalGevuld !== null && aantalGevuld !== undefined && i < aantalGevuld) {
        _tekenSter(doc, cx, cy, rGroot, '#FFC107', '#E6A700');
      } else {
        _tekenSter(doc, cx, cy, rGroot, '#E0E0E0', '#C0C0C0');
      }
    }
    return x + (4 * tussen) + 1; // x-positie waar volgende inhoud kan beginnen
  }

  // Format periode-datums kort
  function _periodeDatumsFmt(periode) {
    if (!periode) return '';
    const startStr = datumFmt(periode.startDatum);
    const eindStr = datumFmt(periode.eindDatum);
    return `${startStr} – ${eindStr}`;
  }

  // ===== Pictogrammen voor feedback-categorieën =====
  // Alle pictogrammen gebruiken (cx, cy) als middelpunt en grootte = halve hoogte/breedte.

  // Grote ster (✨ Wat gaat goed) — hergebruikt _tekenSter
  function _tekenIconSter(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    _tekenSter(doc, cx, cy, grootte, kleur, donker);
  }

  // Kiemplantje (🌱 Groeipunten): gebogen stengel met 2 blaadjes.
  // Stijl: vector-look, lijntekening met kleine vulling.
  function _tekenIconKiem(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    doc.setDrawColor(donker);
    doc.setFillColor(kleur);
    doc.setLineWidth(0.5);

    // Stengel: kromme lijn van onder naar boven
    const yBodem = cy + grootte;
    const yTop = cy - grootte * 0.3;
    // Bezier-curve voor stengel
    doc.lines(
      [[grootte * 0.15, -grootte * 0.5, -grootte * 0.05, -grootte * 0.9, 0, -grootte * 1.3]],
      cx, yBodem, [1, 1], 'S'
    );

    // Linker blaadje (ovaal)
    const xL = cx - grootte * 0.35;
    const yL = cy + grootte * 0.1;
    doc.ellipse(xL, yL, grootte * 0.45, grootte * 0.22, 'FD');

    // Rechter blaadje (iets hoger, ovaal)
    const xR = cx + grootte * 0.35;
    const yR = cy - grootte * 0.25;
    doc.ellipse(xR, yR, grootte * 0.45, grootte * 0.22, 'FD');

    // Klein bovendeel: punt van de stengel
    doc.setFillColor(donker);
    doc.circle(cx, yTop, grootte * 0.1, 'F');
  }

  // Target/doel (💪 Werkhouding): drie concentrische cirkels + pijltje in het midden
  function _tekenIconTarget(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    const lichtgrijs = '#FFFFFF';

    // Buitenste cirkel
    doc.setDrawColor(donker);
    doc.setFillColor(kleur);
    doc.setLineWidth(0.6);
    doc.circle(cx, cy, grootte, 'FD');

    // Middelste cirkel (wit)
    doc.setFillColor(lichtgrijs);
    doc.circle(cx, cy, grootte * 0.65, 'F');

    // Binnenste cirkel (kleur weer)
    doc.setFillColor(kleur);
    doc.circle(cx, cy, grootte * 0.32, 'F');

    // Bullseye (donkerder middelpunt)
    doc.setFillColor(donker);
    doc.circle(cx, cy, grootte * 0.12, 'F');
  }

  // ===== Vaardigheids-iconen voor de sterren-rij in pagina 1 =====
  // Allemaal getekend in (cx, cy) met grootte = halve breedte. Stijl: lijntekening,
  // gevuld waar het visueel helpt. Kleur = primair.

  // 👂 Luisteren — stilist oor: ovaal + binnenste curve
  function _tekenIconLuisteren(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    doc.setDrawColor(donker);
    doc.setFillColor(kleur);
    doc.setLineWidth(0.4);
    // Buitenste oor-vorm = ellips (iets hoger dan breed, lichtjes gekanteld via 2 ovalen)
    doc.ellipse(cx, cy, grootte * 0.7, grootte * 0.95, 'FD');
    // Binnenste lichte vlek
    doc.setFillColor('#FFFFFF');
    doc.ellipse(cx + grootte * 0.15, cy + grootte * 0.1, grootte * 0.3, grootte * 0.5, 'F');
    // Klein donker bolletje (gehoorgang)
    doc.setFillColor(donker);
    doc.circle(cx + grootte * 0.2, cy + grootte * 0.15, grootte * 0.15, 'F');
  }

  // 👁️ Lezen / Kijken — open boek (twee rechthoekjes met "rug" in het midden)
  function _tekenIconLezen(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    const w = grootte * 1.4;
    const h = grootte * 1.0;
    const x = cx - w / 2;
    const y = cy - h / 2;
    doc.setFillColor(kleur);
    doc.setDrawColor(donker);
    doc.setLineWidth(0.4);
    // Linker pagina
    doc.rect(x, y, w / 2 - 0.3, h, 'FD');
    // Rechter pagina
    doc.rect(x + w / 2 + 0.3, y, w / 2 - 0.3, h, 'FD');
    // Tekstlijntjes (witte streepjes op pagina's)
    doc.setDrawColor('#FFFFFF');
    doc.setLineWidth(0.3);
    const lijnY1 = y + h * 0.3;
    const lijnY2 = y + h * 0.55;
    const lijnY3 = y + h * 0.78;
    [lijnY1, lijnY2, lijnY3].forEach(ly => {
      doc.line(x + 0.6, ly, x + w / 2 - 0.6, ly);
      doc.line(x + w / 2 + 0.9, ly, x + w - 0.6, ly);
    });
  }

  // ✍️ Schrijven — potlood (diagonale rechthoek + driehoek-punt)
  function _tekenIconSchrijven(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    const lengte = grootte * 1.6;
    const dikte = grootte * 0.45;

    // Potlood-lichaam: diagonale rechthoek (van linksboven naar rechtsonder)
    // Hoek 45°. Centerpunt = cx, cy.
    const hoek = -Math.PI / 4; // 45° rechtsomhoog
    const cos = Math.cos(hoek);
    const sin = Math.sin(hoek);

    // 4 hoekpunten van de rechthoek (lokaal: lengte horiz, dikte vert)
    const punten = [
      [-lengte / 2, -dikte / 2],
      [ lengte / 2, -dikte / 2],
      [ lengte / 2,  dikte / 2],
      [-lengte / 2,  dikte / 2]
    ].map(([px, py]) => [cx + px * cos - py * sin, cy + px * sin + py * cos]);

    // Bouw lijnen-array
    const lijnen = [];
    for (let i = 1; i < 4; i++) {
      lijnen.push([punten[i][0] - punten[i - 1][0], punten[i][1] - punten[i - 1][1]]);
    }
    lijnen.push([punten[0][0] - punten[3][0], punten[0][1] - punten[3][1]]);

    doc.setFillColor(kleur);
    doc.setDrawColor(donker);
    doc.setLineWidth(0.4);
    doc.lines(lijnen, punten[0][0], punten[0][1], [1, 1], 'FD', true);

    // Donker uiteinde (gum/wisser): kleinere rechthoek bovenaan-links
    const uiteindeStart = [
      cx + (-lengte / 2) * cos - (-dikte / 2) * sin,
      cy + (-lengte / 2) * sin + (-dikte / 2) * cos
    ];
    const uiteindeLengte = lengte * 0.2;
    const uPunten = [
      [-lengte / 2, -dikte / 2],
      [-lengte / 2 + uiteindeLengte, -dikte / 2],
      [-lengte / 2 + uiteindeLengte,  dikte / 2],
      [-lengte / 2,  dikte / 2]
    ].map(([px, py]) => [cx + px * cos - py * sin, cy + px * sin + py * cos]);
    const uLijnen = [];
    for (let i = 1; i < 4; i++) {
      uLijnen.push([uPunten[i][0] - uPunten[i - 1][0], uPunten[i][1] - uPunten[i - 1][1]]);
    }
    uLijnen.push([uPunten[0][0] - uPunten[3][0], uPunten[0][1] - uPunten[3][1]]);
    doc.setFillColor(donker);
    doc.lines(uLijnen, uPunten[0][0], uPunten[0][1], [1, 1], 'F', true);

    // Punt: driehoek aan rechter-uiteinde
    const puntTop = [cx + (lengte / 2 + dikte * 0.6) * cos, cy + (lengte / 2 + dikte * 0.6) * sin];
    const puntL = [cx + (lengte / 2) * cos - (-dikte / 2) * sin, cy + (lengte / 2) * sin + (-dikte / 2) * cos];
    const puntR = [cx + (lengte / 2) * cos - (dikte / 2) * sin,  cy + (lengte / 2) * sin + (dikte / 2) * cos];
    doc.setFillColor('#222222');
    doc.lines(
      [[puntL[0] - puntTop[0], puntL[1] - puntTop[1]],
       [puntR[0] - puntL[0],   puntR[1] - puntL[1]],
       [puntTop[0] - puntR[0], puntTop[1] - puntR[1]]],
      puntTop[0], puntTop[1], [1, 1], 'F', true
    );
  }

  // 🗣️ Spreken — tekst-ballon (afgeronde rechthoek + driehoekje als 'staartje')
  function _tekenIconSpreken(doc, cx, cy, grootte, kleur) {
    const donker = _kleurDonkerder(kleur);
    const w = grootte * 1.6;
    const h = grootte * 1.1;
    const x = cx - w / 2;
    const y = cy - h / 2 - grootte * 0.15;

    doc.setFillColor(kleur);
    doc.setDrawColor(donker);
    doc.setLineWidth(0.4);

    // Hoofdvorm: afgeronde rechthoek
    doc.roundedRect(x, y, w, h, grootte * 0.3, grootte * 0.3, 'FD');

    // Staartje onderaan-links (driehoek)
    const stX = x + w * 0.25;
    const stY = y + h;
    const stPunten = [
      [stX, stY - 0.2],
      [stX + grootte * 0.4, stY - 0.2],
      [stX + grootte * 0.1, stY + grootte * 0.5]
    ];
    doc.lines(
      [[stPunten[1][0] - stPunten[0][0], stPunten[1][1] - stPunten[0][1]],
       [stPunten[2][0] - stPunten[1][0], stPunten[2][1] - stPunten[1][1]],
       [stPunten[0][0] - stPunten[2][0], stPunten[0][1] - stPunten[2][1]]],
      stPunten[0][0], stPunten[0][1], [1, 1], 'F', true
    );

    // Drie puntjes binnenin (witte cirkeltjes)
    doc.setFillColor('#FFFFFF');
    const dotR = grootte * 0.13;
    doc.circle(cx - grootte * 0.4, cy - grootte * 0.1, dotR, 'F');
    doc.circle(cx, cy - grootte * 0.1, dotR, 'F');
    doc.circle(cx + grootte * 0.4, cy - grootte * 0.1, dotR, 'F');
  }

  // Werkhouding — hergebruikt het target-icoon (al gedefinieerd hierboven)
  // Geen apart symbool nodig.

  // Hex-kleur iets donkerder maken (voor randen)
  function _kleurDonkerder(hex) {
    if (!hex || hex.length < 7) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const factor = 0.7;
    const nr = Math.max(0, Math.round(r * factor));
    const ng = Math.max(0, Math.round(g * factor));
    const nb = Math.max(0, Math.round(b * factor));
    return '#' + nr.toString(16).padStart(2, '0') + ng.toString(16).padStart(2, '0') + nb.toString(16).padStart(2, '0');
  }

  // Hex-kleur lichter maken (voor kaart-achtergrond)
  function _kleurLichter(hex, factor) {
    if (!hex || hex.length < 7) return hex;
    factor = factor || 0.92; // 0 = origineel, 1 = wit
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.round(r + (255 - r) * factor);
    const ng = Math.round(g + (255 - g) * factor);
    const nb = Math.round(b + (255 - b) * factor);
    return '#' + nr.toString(16).padStart(2, '0') + ng.toString(16).padStart(2, '0') + nb.toString(16).padStart(2, '0');
  }

  // Teken één feedback-kaart met pictogram + titel + bullet-zinnen.
  // Returnt nieuwe y-positie net onder de kaart.
  function _tekenFeedbackKaart(doc, x, y, breedte, titel, kleur, zinnen, picto) {
    const padding = 6;          // binnenruimte van de kaart
    const titelHoogte = 10;     // ruimte voor titel-regel
    const lijnHoogte = 5.4;     // regelhoogte voor bullet-tekst (11pt)
    const tussenZinnen = 2;     // extra ruimte tussen bullets
    const naTitelGap = 4;       // ruimte tussen titel en eerste bullet

    // Eerst zinnen voorbereiden om totale hoogte te berekenen
    const tekstX = x + padding + 5;       // bullet+tekst-x (na linker rand + padding)
    const beschBreedte = breedte - padding * 2 - 5; // ruimte voor de tekst zelf
    const voorbereid = zinnen.map(zin => doc.splitTextToSize(zin, beschBreedte));

    let inhoudHoogte = titelHoogte + naTitelGap;
    voorbereid.forEach(regels => {
      inhoudHoogte += (regels.length * lijnHoogte) + tussenZinnen;
    });
    inhoudHoogte += padding; // beneden-padding

    const totaleHoogte = padding + inhoudHoogte;
    const lichtBg = _kleurLichter(kleur, 0.93);
    const donker = _kleurDonkerder(kleur);

    // Kaart-achtergrond (afgeronde rechthoek, lichte tint)
    doc.setFillColor(lichtBg);
    doc.setDrawColor(kleur);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, breedte, totaleHoogte, 2.5, 2.5, 'FD');

    // Linker accent-rand (dikke kleur-balk)
    doc.setFillColor(kleur);
    doc.rect(x, y, 2.2, totaleHoogte, 'F');

    // Pictogram links bovenaan in de kaart
    const picX = x + padding + 4;
    const picY = y + padding + 3;
    if (picto === 'ster') {
      _tekenIconSter(doc, picX, picY, 3.2, kleur);
    } else if (picto === 'kiem') {
      _tekenIconKiem(doc, picX, picY, 3.2, kleur);
    } else if (picto === 'target') {
      _tekenIconTarget(doc, picX, picY, 3.0, kleur);
    }

    // Titel naast pictogram
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(donker);
    doc.text(titel, x + padding + 11, y + padding + 5);

    // Bullets onder titel
    let yB = y + padding + titelHoogte + naTitelGap;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    voorbereid.forEach(regels => {
      // Gekleurde bullet (cirkeltje)
      doc.setFillColor(kleur);
      doc.circle(x + padding + 2.5, yB - 1.4, 0.9, 'F');

      // Tekst
      doc.setTextColor(K_HOOFDTITEL);
      doc.text(regels, tekstX, yB);
      yB += (regels.length * lijnHoogte) + tussenZinnen;
    });

    return y + totaleHoogte;
  }

  async function rapportPdf(kind, rapport, periode) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-bibliotheek niet geladen.');
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Schoolinfo
    let school = null;
    try {
      school = await window.Voortgang.haalSchoolinstellingenOp();
    } catch (e) { school = null; }

    const sterren = rapport.sterren || {};
    const toetsdata = rapport.toetsdata || {};
    const feedback = rapport.feedback || {};

    // Bepaal titel-tekst: bij voorkeur "Rapportperiode N" + "Schooljaar YYYY-YYYY"
    // Fallback: gebruik gewoon de periode-naam.
    let titelGroot = '';
    let titelKlein = '';
    if (periode && periode.nummer) {
      titelGroot = `Rapportperiode ${periode.nummer}`;
      if (periode.schooljaar) {
        titelKlein = `Schooljaar ${periode.schooljaar}`;
      }
    } else if (periode && periode.naam) {
      titelGroot = periode.naam;
      if (periode.schooljaar) {
        titelKlein = `Schooljaar ${periode.schooljaar}`;
      }
    } else {
      titelGroot = 'Rapport';
    }

    // ==================================================
    // PAGINA 1 — Overzicht met sterren
    // ==================================================
    let y = tekenHeader(doc, school, kind.naam, kind.code);

    // ===== Titel-kader (gecentreerd, subtiele rand) =====
    y += 2;
    const kaderHoogte = titelKlein ? 22 : 16;
    const kaderBreedte = 110;
    const kaderX = (PB - kaderBreedte) / 2;

    // Lichte achtergrond + dunne rand (gebruik primair als accent)
    doc.setFillColor('#FFFAF2');     // zachte crème-tint
    doc.setDrawColor(K_PRIMAIR);
    doc.setLineWidth(0.4);
    doc.roundedRect(kaderX, y, kaderBreedte, kaderHoogte, 2.5, 2.5, 'FD');

    // Grote titel
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(K_PRIMAIR);
    const yTitelGroot = titelKlein ? y + 9 : y + 10;
    doc.text(titelGroot, PB / 2, yTitelGroot, { align: 'center' });

    // Klein subtitel onder grote titel
    if (titelKlein) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(K_GRIJS);
      doc.text(titelKlein, PB / 2, y + 17, { align: 'center' });
    }

    y += kaderHoogte + 8;

    // ===== Naam (links) + klas (rechts) op één regel =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text(_volledigeNaam(kind), M, y + 4);

    const klasTekst = _klasTekst(kind);
    if (klasTekst) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(K_SUBTITEL);
      doc.text(klasTekst, PB - M, y + 4, { align: 'right' });
    }
    y += 7;

    // Scheidingslijn
    y += 3;
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.5);
    doc.line(M, y, PB - M, y);
    y += 8;

    // Sectiekop "Vaardigheden"
    y = tekenSectiekop(doc, 'Vaardigheden', y, K_PRIMAIR);
    y += 4;

    // Sterren-rijen — 5 vaardigheden met vector-icoon
    const vaardigheden = [
      { sl: 'luisteren',   naam: 'Luisteren',   icoon: 'luisteren'   },
      { sl: 'lezen',       naam: 'Lezen',       icoon: 'lezen'       },
      { sl: 'schrijven',   naam: 'Schrijven',   icoon: 'schrijven'   },
      { sl: 'spreken',     naam: 'Spreken',     icoon: 'spreken'     },
      { sl: 'werkhouding', naam: 'Werkhouding', icoon: 'target'      }
    ];

    vaardigheden.forEach(v => {
      const aantal = sterren[v.sl];
      const td = toetsdata[v.sl] || {};
      const heeftData = (td.aantal && td.aantal > 0);

      // Vaardigheids-icoon links (vector — werkt betrouwbaar in jsPDF)
      const icoonX = M + 3.5;
      const icoonY = y + 4;
      const icoonGrootte = 2.8;
      if (v.icoon === 'luisteren') _tekenIconLuisteren(doc, icoonX, icoonY, icoonGrootte, K_PRIMAIR);
      else if (v.icoon === 'lezen') _tekenIconLezen(doc, icoonX, icoonY, icoonGrootte, K_PRIMAIR);
      else if (v.icoon === 'schrijven') _tekenIconSchrijven(doc, icoonX, icoonY, icoonGrootte, K_PRIMAIR);
      else if (v.icoon === 'spreken') _tekenIconSpreken(doc, icoonX, icoonY, icoonGrootte, K_PRIMAIR);
      else if (v.icoon === 'target') _tekenIconTarget(doc, icoonX, icoonY, icoonGrootte, K_PRIMAIR);

      // Naam — bold, 12pt, na het icoon
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(K_HOOFDTITEL);
      doc.text(v.naam, M + 10, y + 4);

      // Sterren in het midden, x rond 90mm
      const sterX = M + 55;
      if (aantal !== null && aantal !== undefined) {
        _tekenSterRij(doc, sterX, y + 2.5, aantal);
      } else {
        // Geen sterren → cursief grijs label
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(K_GRIJS);
        doc.text('Nog niet getest tijdens deze rapportperiode', sterX, y + 4);
      }

      // Percentage rechts (alleen als data beschikbaar)
      if (aantal !== null && aantal !== undefined && heeftData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(K_HOOFDTITEL);
        doc.text(`${td.pct}%`, PB - M, y + 4, { align: 'right' });
      }

      // Sub-regel: "X toetsen in deze periode"
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(K_GRIJS);
      let sub = '';
      if (v.sl === 'werkhouding') {
        sub = 'Beoordeling door de leerkracht';
      } else if (heeftData) {
        const lbl = v.sl === 'spreken' ? 'spreektoets' : 'toets';
        sub = `${td.aantal} ${lbl}${td.aantal === 1 ? '' : (v.sl === 'spreken' ? 'en' : 'en')} in deze periode`;
      } else {
        sub = '';
      }
      if (sub) {
        doc.text(sub, M + 10, y + 9);
      }

      y += 13;
    });

    // Voetnoot onderaan p.1
    y += 6;
    doc.setDrawColor(K_LICHTGRIJS);
    doc.setLineWidth(0.3);
    doc.line(M, y, PB - M, y);
    y += 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(K_GRIJS);
    const voetnoot = 'Geen sterren betekent: nog niet getest tijdens deze rapportperiode. Voor details per toets kan je bij de juf de afzonderlijke toets-PDF\'s opvragen.';
    const voetSplit = doc.splitTextToSize(voetnoot, IB);
    doc.text(voetSplit, M, y + 4);

    // ==================================================
    // PAGINA 2 — Feedback
    // ==================================================
    doc.addPage();
    y = tekenHeader(doc, school, kind.naam, kind.code);

    // Subtitel: "Naam — Rapportperiode N" (kleiner dan p.1)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(K_HOOFDTITEL);
    doc.text(`${_volledigeNaam(kind)} — ${titelGroot}`, M, y + 4);
    y += 12;

    // 3 feedback-categorieën — elk een gekleurde kaart met pictogram
    const categorieen = [
      { sleutel: 'watGaatGoed', titel: 'Wat gaat goed', kleur: K_GROEN, picto: 'ster' },
      { sleutel: 'groeipunten', titel: 'Groeipunten', kleur: K_GEEL, picto: 'kiem' },
      { sleutel: 'werkhouding', titel: 'Werkhouding & zelfstandigheid', kleur: K_PRIMAIR, picto: 'target' }
    ];

    categorieen.forEach(cat => {
      const zinnen = Array.isArray(feedback[cat.sleutel]) ? feedback[cat.sleutel] : [];
      if (zinnen.length === 0) return; // sla lege categorie over

      // Schat hoogte: titel + (gemiddeld 1,5 regel per zin × 5,4mm) + padding
      // Gebruikt voor page-break check (we willen geen kaart die afkapt)
      let geschatteHoogte = 22; // basis (titel + padding)
      zinnen.forEach(z => {
        const regels = doc.splitTextToSize(z, IB - 17);
        geschatteHoogte += regels.length * 5.4 + 2;
      });

      // Page-break als kaart niet meer past op huidige pagina (boven handtekening-zone)
      if (y + geschatteHoogte > PH - 60) {
        doc.addPage();
        y = tekenHeader(doc, school, kind.naam, kind.code);
        y += 4;
      }

      y = _tekenFeedbackKaart(doc, M, y, IB, cat.titel, cat.kleur, zinnen, cat.picto);
      y += 6; // ruimte tussen kaarten
    });

    // Geen enkele categorie ingevuld?
    if (categorieen.every(c => !Array.isArray(feedback[c.sleutel]) || feedback[c.sleutel].length === 0)) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(K_GRIJS);
      doc.text('Geen feedback ingevuld voor deze rapportperiode.', M, y + 4);
      y += 10;
    }

    // ==================================================
    // Handtekening-zone onderaan pagina 2 (of huidige pagina)
    // ==================================================
    const yHand = PH - 50; // ~22mm boven de footer (footer start op PH - 28)
    if (y < yHand) {
      // Scheidingslijn
      doc.setDrawColor(K_LICHTGRIJS);
      doc.setLineWidth(0.3);
      doc.line(M, yHand - 8, PB - M, yHand - 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(K_HOOFDTITEL);
      doc.text('Handtekening leerkracht', M, yHand);
      doc.text('Handtekening ouder', M + IB / 2 + 5, yHand);

      // Lijnen voor handtekening
      doc.setDrawColor(K_GRIJS);
      doc.setLineWidth(0.4);
      doc.line(M, yHand + 12, M + (IB / 2) - 8, yHand + 12);
      doc.line(M + IB / 2 + 5, yHand + 12, PB - M, yHand + 12);
    }

    // Footer op alle pagina's
    const totaalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totaalPag; i++) {
      doc.setPage(i);
      tekenFooter(doc, school, i, totaalPag);
    }

    // Bestandsnaam
    const veiligeNaam = (_volledigeNaam(kind) || kind.code).replace(/[^a-zA-Z0-9-]/g, '_');
    const periodeSlug = (periode && periode.id) ? periode.id : 'periode';
    doc.save(`rapport-${veiligeNaam}-${periodeSlug}.pdf`);
  }

  return { genereer, spreektoetsPdf, spreektoetsAfnameblad, taakPdf, rapportPdf };
})();
