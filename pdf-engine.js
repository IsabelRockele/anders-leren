// =================================================================
//  pdf-engine.js — Werkbladen genereren met jsPDF
//  Met picto-instructies bovenaan elke oefening voor zelfstandig
//  werken door anderstalige nieuwkomers.
// =================================================================

window.PDFEngine = (function() {

  const PB = 210; // pagina breedte mm
  const PH = 297; // pagina hoogte mm
  const M  = 15;  // marge
  const IB = PB - 2 * M; // inhoudsbreedte

  // ---------------------------------------------------------------
  //  Hulpfuncties
  // ---------------------------------------------------------------
  function schud(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(_rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Seeded random — zorgt dat werkblad en oplossing identiek zijn
  let _rngState = 0;
  function _rng() {
    // Eenvoudige LCG (Linear Congruential Generator)
    _rngState = (_rngState * 1664525 + 1013904223) % 4294967296;
    return _rngState / 4294967296;
  }
  function _resetRng(seed) {
    _rngState = seed >>> 0;
  }

  // Groene kleur voor oplossingen
  const KLEUR_OPL_R = 6;
  const KLEUR_OPL_G = 167;
  const KLEUR_OPL_B = 125;

  // ---------------------------------------------------------------
  //  EMOJI → CANVAS → IMAGE DATA URL
  //  jsPDF kan emoji's niet renderen; we tekenen ze op een canvas
  //  en plaatsen ze als image in de PDF.
  // ---------------------------------------------------------------
  const _emojiCache = {};

  function emojiNaarImage(emoji, pixels) {
    pixels = pixels || 96;
    const cacheKey = emoji + '@' + pixels;
    if (_emojiCache[cacheKey]) return _emojiCache[cacheKey];

    const canvas = document.createElement('canvas');
    canvas.width = pixels;
    canvas.height = pixels;
    const ctx = canvas.getContext('2d');

    // Hoge resolutie — schaalt mooier in PDF op A4
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Stack van emoji-fonts; browser gebruikt eerste beschikbare
    ctx.font = (pixels * 0.85) + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(emoji, pixels / 2, pixels / 2);

    const dataUrl = canvas.toDataURL('image/png');
    _emojiCache[cacheKey] = dataUrl;
    return dataUrl;
  }

  // Plaatst een emoji op de PDF op (x, y) met grootte in mm.
  // x, y is het MIDDEN van de emoji.
  function plaatsEmoji(doc, emoji, xMm, yMm, grootteMm) {
    if (!emoji) return;
    grootteMm = grootteMm || 12;
    try {
      const dataUrl = emojiNaarImage(emoji, 128);
      doc.addImage(
        dataUrl,
        'PNG',
        xMm - grootteMm / 2,
        yMm - grootteMm / 2,
        grootteMm,
        grootteMm
      );
    } catch (e) {
      console.warn('Kon emoji niet renderen:', emoji, e);
    }
  }

  // ---------------------------------------------------------------
  //  PICTO (PNG) → DATA URL — met emoji-fallback
  //  PNG's worden eerst getest. Bij ontbrekend bestand of laadfout
  //  blijft picto-cache leeg en valt plaatsItemBeeld terug op emoji.
  // ---------------------------------------------------------------
  const _pictoCache = {}; // pad → dataURL (string) of null = niet beschikbaar
  const _losseAfbeeldingCache = {};

  function _losseAfbeeldingLaden(bron) {
    return new Promise(resolve => {
      if (bron in _losseAfbeeldingCache) return resolve(_losseAfbeeldingCache[bron]);
      const img = new Image();
      img.onload = () => {
        try {
          const maxBreedte = 1600;
          const schaal = img.width > maxBreedte ? maxBreedte / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * schaal);
          canvas.height = Math.round(img.height * schaal);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          _losseAfbeeldingCache[bron] = canvas.toDataURL('image/jpeg', 0.9);
        } catch (e) { _losseAfbeeldingCache[bron] = null; }
        resolve(_losseAfbeeldingCache[bron]);
      };
      img.onerror = () => { _losseAfbeeldingCache[bron] = null; resolve(null); };
      img.src = bron;
    });
  }

  function _pictoLaden(bron) {
    return new Promise(resolve => {
      if (bron in _pictoCache) {
        resolve(_pictoCache[bron]);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Vierkant canvas op originele resolutie (max 256 voor pdf-grootte)
          const maxDim = Math.max(img.width, img.height);
          const schaal = maxDim > 256 ? 256 / maxDim : 1;
          canvas.width = Math.round(img.width * schaal);
          canvas.height = Math.round(img.height * schaal);
          const ctx = canvas.getContext('2d');
          // Witte achtergrond (anders krijg je transparante artefacten in PDF)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          _pictoCache[bron] = canvas.toDataURL('image/png');
        } catch (e) {
          console.warn('Picto canvas-fout voor', bron, e);
          _pictoCache[bron] = null;
        }
        resolve(_pictoCache[bron]);
      };
      img.onerror = () => {
        _pictoCache[bron] = null;
        resolve(null);
      };
      // Thema-picto's staan onder picto/. Volledige projectpaden (zoals
      // assets/zinsbeelden/...) gebruiken we rechtstreeks.
      img.src = (bron.startsWith('http') || bron.startsWith('assets/') || bron.startsWith('data:')) ? bron : ('picto/' + bron);
    });
  }

  // Pre-fetch alle pictos/foto's voor een lijst items.
  async function prefetchPictos(items) {
    const bronnen = new Set();
    items.forEach(it => {
      if (!it) return;
      if (it.zinPicto) bronnen.add(it.zinPicto);
      if (it.foto) bronnen.add(it.foto);
      else if (it.picto) bronnen.add(it.picto);
    });
    await Promise.all([...bronnen].map(b => _pictoLaden(b)));
  }

  // Plaatst het beeld van een item op de PDF.
  // Gebruikt foto-URL/PNG als die in de cache zit, anders fallback naar emoji.
  // x, y is het MIDDEN.
  function plaatsItemBeeld(doc, item, xMm, yMm, grootteMm) {
    if (!item) return;
    grootteMm = grootteMm || 12;
    // Foto- of picto-bron beschikbaar?
    const bron = item.foto || item.picto;
    if (bron && _pictoCache[bron]) {
      try {
        doc.addImage(
          _pictoCache[bron],
          'PNG',
          xMm - grootteMm / 2,
          yMm - grootteMm / 2,
          grootteMm,
          grootteMm
        );
        return;
      } catch (e) {
        console.warn('Picto plaatsen mislukt:', bron, e);
      }
    }
    // Fallback: emoji
    if (item.beeld) plaatsEmoji(doc, item.beeld, xMm, yMm, grootteMm);
  }

  function tekenKop(doc, thema, oefenTitel) {
    // Brand-strook bovenaan
    doc.setFillColor(255, 248, 238);
    doc.rect(0, 0, PB, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(232, 159, 15);
    doc.text('JUF ZISA · ANDERS LEREN', M, 10);

    // Thema-emoji als image, gevolgd door naam als tekst
    doc.setFontSize(17);
    doc.setTextColor(45, 42, 50);
    plaatsEmoji(doc, thema.emoji, M + 6, 18, 10);
    // Bij multi-thema kan naam lang zijn — kort af indien nodig
    let weergaveNaam = thema.naam;
    if (weergaveNaam.length > 35) weergaveNaam = weergaveNaam.substring(0, 32) + '...';
    doc.text(weergaveNaam, M + 14, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(oefenTitel, PB - M, 20, { align: 'right' });

    // Naam-veld
    doc.setDrawColor(220, 210, 190);
    doc.setLineWidth(0.3);
    doc.line(M, 28, PB - M, 28);

    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('Naam:', M, 40);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(M + 22, 40, M + 90, 40);
    doc.text('Datum:', M + 100, 40);
    doc.line(M + 124, 40, PB - M, 40);

    return 50;
  }

  /**
   * Tekent een rij met picto-instructies bovenaan een oefening.
   * picto's: array zoals ['👁️', '✏️'] = "kijk → schrijf"
   * uitleg (optioneel): korte zin in helder lettertype rechts naast de pictogrammen
   * Returns y-positie waar inhoud kan beginnen.
   */
  function tekenPictoInstructie(doc, y, pictos, uitleg) {
    const startX = M;

    // Bereken eerst hoeveel plaats de uitleg werkelijk nodig heeft. Lange
    // opdrachten worden over meerdere regels verdeeld en blijven zo in het kader.
    const voorlopigPictoX = startX + 32 + pictos.length * 16;
    const tekstX = voorlopigPictoX + 4;
    const tekstBreedte = Math.max(30, PB - M - tekstX - 4);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const uitlegRegels = uitleg ? doc.splitTextToSize(uitleg, tekstBreedte) : [];
    const hoogte = Math.max(16, 8 + uitlegRegels.length * 5);

    // Achtergrond zacht oranje
    doc.setFillColor(255, 244, 224);
    doc.setDrawColor(255, 182, 39);
    doc.setLineWidth(0.4);
    doc.roundedRect(startX, y, IB, hoogte, 3, 3, 'FD');

    // "Wat doe je?" label links
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text('WAT DOE JE?', startX + 4, y + 6);

    // Picto's met pijltjes (als images!)
    const pictoY = y + hoogte / 2;
    let pictoX = startX + 32;
    const pictoSpacing = 16;

    pictos.forEach((p, i) => {
      plaatsEmoji(doc, p, pictoX, pictoY, 9);
      if (i < pictos.length - 1) {
        // Pijltje na deze picto (gewone tekst, geen emoji)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 180, 140);
        doc.text('>', pictoX + 7, pictoY + 1);
      }
      pictoX += pictoSpacing;
    });

    // Uitlegtekst rechts naast de pictogrammen — vetgedrukt en in donkergrijs zodat
    // het kind het meteen ziet
    if (uitleg) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      // Start na de laatste picto + wat lucht
      const regelHoogte = 5;
      const tekstY = y + (hoogte - uitlegRegels.length * regelHoogte) / 2 + 4;
      doc.text(uitlegRegels, tekstX, tekstY, { lineHeightFactor: 1.12 });
      doc.setFont('helvetica', 'normal');
    }

    return y + hoogte + 6;
  }

  function tekenVoet(doc) {
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text('jufzisa.be · Taalgroei', PB / 2, PH - 8, { align: 'center' });
  }

  // ---------------------------------------------------------------
  //  OEFENING 1: Koppel beeld en woord
  //  Picto: 👁️ → 🔗 (kijk en verbind)
  // ---------------------------------------------------------------
  function tekenKoppel(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: koppel' : 'Oefening: koppel');
    y = tekenPictoInstructie(doc, y, ['👁️', '🔗']);

    const items = schud(thema.items).slice(0, 6);
    const links = schud(items);
    const rechts = schud(items);

    const kB = IB * 0.38;
    const xL = M;
    const xR = M + IB - kB;
    const rH = 28;

    items.forEach((_, i) => {
      const yR = y + i * rH;

      // Beeld links
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.5);
      doc.roundedRect(xL, yR, kB, 22, 3, 3, 'FD');
      plaatsItemBeeld(doc, links[i], xL + kB / 2, yR + 11, 16);

      // Verbindingspunten
      doc.setFillColor(45, 42, 50);
      doc.circle(xL + kB + 2, yR + 11, 1, 'F');

      // Woord rechts
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.roundedRect(xR, yR, kB, 22, 3, 3, 'FD');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(rechts[i].tekst, xR + kB / 2, yR + 14, { align: 'center' });
      doc.setFont('helvetica', 'normal');

      doc.setFillColor(45, 42, 50);
      doc.circle(xR - 2, yR + 11, 1, 'F');
    });

    // OPLOSSING: trek groene lijnen tussen juiste paren
    if (opgelost) {
      doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
      doc.setLineWidth(0.7);
      items.forEach((_, i) => {
        const yLinks = y + i * rH + 11;
        // Vind de positie van het juiste woord rechts
        const linksItem = links[i];
        const rechtsIdx = rechts.findIndex(r => r.id === linksItem.id);
        if (rechtsIdx !== -1) {
          const yRechts = y + rechtsIdx * rH + 11;
          doc.line(xL + kB + 2, yLinks, xR - 2, yRechts);
        }
      });
    }

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 2: Schrijf na
  //  Picto: 👁️ → ✏️ (kijk en schrijf)
  // ---------------------------------------------------------------
  function tekenOverschrijf(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: schrijf na' : 'Oefening: schrijf na');
    y = tekenPictoInstructie(doc, y, ['👁️', '✏️']);

    const items = schud(thema.items).slice(0, 8);
    const kB = IB / 2 - 5;
    const rH = 30;

    items.forEach((w, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = M + kol * (kB + 10);
      const yR = y + rij * rH;

      // Beeld
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, yR, 18, 18, 2, 2, 'FD');
      plaatsItemBeeld(doc, w, x + 9, yR + 9, 13);

      // Voorbeeldwoord lichtgrijs
      doc.setFontSize(13);
      doc.setTextColor(180, 180, 180);
      doc.setFont('helvetica', 'bold');
      doc.text(w.tekst, x + 22, yR + 8);
      doc.setFont('helvetica', 'normal');

      // Schrijflijn
      const lY = yR + 18;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(x + 22, lY - 5, x + kB, lY - 5);
      doc.setDrawColor(45, 42, 50);
      doc.setLineWidth(0.5);
      doc.line(x + 22, lY, x + kB, lY);

      // OPLOSSING: woord groen op de schrijflijn
      if (opgelost) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.text(w.tekst, x + 22, lY - 1);
        doc.setFont('helvetica', 'normal');
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 3: Welke letter mist?
  //  Picto: 👁️ → 🔤 → ✏️ (kijk, schik letters, schrijf)
  // Helper: alleen items die geschikt zijn voor letter-puzzel (één woord, geen zin)
  function alleenWoordItems(items) {
    return items.filter(it => {
      // Survival-thema items hebben 'soort' attribuut
      if (it.soort && it.soort !== 'woord') return false;
      // Pak de korte vorm
      const tekst = (it.kort || it.tekst).replace(/^(de |het |een )/i, '').trim();
      // Geen spaties = één woord
      if (tekst.includes(' ')) return false;
      // Niet te lang
      if (tekst.length > 12) return false;
      return true;
    });
  }

  // ---------------------------------------------------------------
  function tekenLetterMist(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: maak het woord' : 'Oefening: maak het woord');
    y = tekenPictoInstructie(doc, y, ['👁️', '🔤', '✏️']);

    const geschikt = alleenWoordItems(thema.items);
    if (geschikt.length < 2) {
      // Geen geschikte items in dit thema
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('Deze oefening werkt alleen met losse woorden (niet met zinnen).', M, y + 10);
      tekenVoet(doc);
      return;
    }
    const items = schud(geschikt).slice(0, 5);
    const rH = 38;

    items.forEach((w, i) => {
      const yR = y + i * rH;
      const wK = w.kort || w.tekst;

      // Strip lidwoord uit het te puzzelen woord
      const zuiver = wK.replace(/^(de |het |een )/i, '')
                       .replace(/[^a-zA-Zàáâäèéêëìíîïòóôöùúûü]/g, ''); // alleen letters
      const lidwoord = (wK.match(/^(de |het |een )/i) || [''])[0].trim();

      // Beeld-vakje links
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, yR, 22, 22, 3, 3, 'FD');
      plaatsItemBeeld(doc, w, M + 11, yR + 11, 16);

      // Letters door elkaar — markeer ÉÉN specifieke positie als startletter
      // (niet alle letters die gelijk zijn aan de eerste — dat veroorzaakte dubbele markeringen bij "eten")
      const letters = zuiver.split('');
      // Geef elke letter een uniek id zodat we de eerste-letter-positie kunnen volgen
      const lettersMetId = letters.map((l, idx) => ({ letter: l, isStart: idx === 0, id: idx }));
      const allesGeschud = schud(lettersMetId);

      // Teken de letterhokjes
      const letterStartX = M + 28;
      const letterB = 8;
      const letterGap = 1;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      allesGeschud.forEach((item, idx) => {
        const lx = letterStartX + idx * (letterB + letterGap);
        const isEerste = item.isStart;

        if (isEerste) {
          doc.setFillColor(255, 220, 160);
          doc.setDrawColor(232, 159, 15);
        } else {
          doc.setFillColor(248, 245, 240);
          doc.setDrawColor(200, 190, 175);
        }
        doc.setLineWidth(0.3);
        doc.roundedRect(lx, yR + 2, letterB, letterB + 2, 1.5, 1.5, 'FD');
        doc.setTextColor(45, 42, 50);
        doc.text(item.letter, lx + letterB / 2, yR + 9, { align: 'center' });
      });
      doc.setFont('helvetica', 'normal');

      // Schrijflijn ONDER de letters — voldoende ruimte tussen
      // Letters eindigen op yR + 14 (= 2 + 8 + 2 + 2 marge). Schrijflijnen op yR + 22 en yR + 27.
      const lijnStartX = letterStartX;
      const lijnEindX = M + IB - 5;
      const hulpY = yR + 22;
      const basisY = yR + 27;

      // Lidwoord lichtgrijs aan begin van de schrijflijn
      let schrijfStartX = lijnStartX;
      if (lidwoord) {
        doc.setFontSize(11);
        doc.setTextColor(160, 160, 160);
        doc.text(lidwoord, schrijfStartX, basisY - 1);
        schrijfStartX += lidwoord.length * 2.5 + 4;
      }

      // Dubbele schrijflijn — beide dun
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(schrijfStartX, hulpY, lijnEindX, hulpY);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(schrijfStartX, basisY, lijnEindX, basisY);

      // OPLOSSING: woord groen op de schrijflijn
      if (opgelost) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.text(zuiver, schrijfStartX, basisY - 1);
        doc.setFont('helvetica', 'normal');
      }

      // Scheidingslijn tussen rijen
      if (i < items.length - 1) {
        doc.setDrawColor(240, 232, 215);
        doc.setLineWidth(0.2);
        doc.line(M, yR + 31, PB - M, yR + 31);
      }
    });

    // Tip onderaan voor leerkracht
    const yEind = y + items.length * rH + 5;
    if (yEind < PH - 25) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('Tip: De startletter is oranje gemarkeerd om het kind op weg te helpen.',
               M, yEind);
    }

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 4: Omcirkel het juiste woord
  //  Picto: 👁️ → ⭕ (kijk en omcirkel)
  // ---------------------------------------------------------------
  function tekenOmcirkel(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: kruis aan' : 'Oefening: kruis aan');
    y = tekenPictoInstructie(doc, y, ['👁️', '✗'], 'Kijk naar het beeld. Kruis het juiste woord aan.');

    const items = schud(thema.items).slice(0, 6);
    const rH = 30;

    items.forEach((w, i) => {
      const yR = y + i * rH;

      // Beeld
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, yR, 22, 22, 3, 3, 'FD');
      plaatsItemBeeld(doc, w, M + 11, yR + 11, 17);

      // 3 woorden naast elkaar
      const afl = thema.items.filter(x => x.id !== w.id);
      const opt = schud([w, ...schud(afl).slice(0, 2)]);

      const startX = M + 30;
      const beschikbaar = IB - 30;
      const oB = beschikbaar / 3;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      opt.forEach((o, idx) => {
        const xCenter = startX + idx * oB + oB / 2;

        doc.setTextColor(45, 42, 50);
        doc.text(o.tekst, xCenter, yR + 14, { align: 'center' });

        // Aanvinkhokje onder het woord
        const vakGrootte = 5;
        const vakX = xCenter - vakGrootte / 2;
        const vakY = yR + 18;
        doc.setDrawColor(45, 42, 50);
        doc.setLineWidth(0.4);
        doc.rect(vakX, vakY, vakGrootte, vakGrootte);

        // OPLOSSING: kruisje in het juiste vakje + groen kader rond hokje
        if (opgelost && o.id === w.id) {
          // Groene rand om vakje
          doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
          doc.setLineWidth(0.8);
          doc.rect(vakX, vakY, vakGrootte, vakGrootte);
          // Kruisje in het vakje
          doc.setLineWidth(0.6);
          doc.line(vakX + 0.8, vakY + 0.8, vakX + vakGrootte - 0.8, vakY + vakGrootte - 0.8);
          doc.line(vakX + vakGrootte - 0.8, vakY + 0.8, vakX + 0.8, vakY + vakGrootte - 0.8);
        }
      });
      doc.setFont('helvetica', 'normal');

      if (i < items.length - 1) {
        doc.setDrawColor(240, 232, 215);
        doc.setLineWidth(0.2);
        doc.line(M, yR + 27, PB - M, yR + 27);
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 5: Kleur volgens code
  //  Picto: 👁️ → 🎨 (kijk en kleur)
  //  Werkt vooral goed bij thema cijfers/kleuren
  // ---------------------------------------------------------------
  function tekenKleurCode(doc, thema) {
    let y = tekenKop(doc, thema, 'Oefening: kleur');
    y = tekenPictoInstructie(doc, y, ['👁️', '🎨']);

    // Top: legenda met woord = kleur (uit het thema, alleen kleur-woorden indien aanwezig)
    const items = schud(thema.items).slice(0, 8);

    // Eerst legenda
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 42, 50);
    doc.text('Lees het woord. Kleur het beeld in de juiste kleur.', M, y);
    y += 8;

    // Grid van beelden, elk met een woord eronder dat aangeeft hoe te kleuren
    // Voor algemene thema's: maak de oefening zo dat het kind de naam onder het beeld kleurt
    const kB = IB / 2 - 5;
    const rH = 38;

    items.slice(0, 6).forEach((w, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = M + kol * (kB + 10);
      const yR = y + rij * rH;

      // Beeld in vierkant (kind kleurt in)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, yR, 26, 26, 3, 3, 'FD');
      plaatsItemBeeld(doc, w, x + 13, yR + 13, 18);

      // Woord ernaast
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(w.tekst, x + 30, yR + 12);
      doc.setFont('helvetica', 'normal');

      // Kleurkader om in te kleuren
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.3);
      doc.roundedRect(x + 30, yR + 15, kB - 32, 10, 2, 2);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text('kleur hier', x + 32, yR + 21);
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 6: Beeld + zelf schrijven (geen woord zichtbaar)
  //  Picto: 👁️ → ✏️ — kind ziet beeld, schrijft woord vrij op lijn
  // ---------------------------------------------------------------
  function tekenZelfSchrijven(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: schrijf zelf' : 'Oefening: schrijf zelf');
    y = tekenPictoInstructie(doc, y, ['👁️', '✏️']);

    const items = schud(thema.items).slice(0, 8);
    const kB = IB / 2 - 5;
    const rH = 30;

    items.forEach((w, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = M + kol * (kB + 10);
      const yR = y + rij * rH;

      // Beeld
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, yR, 20, 20, 2, 2, 'FD');
      plaatsItemBeeld(doc, w, x + 10, yR + 10, 15);

      // Lege schrijflijn — geen voorbeeldwoord!
      const lY = yR + 18;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(x + 24, lY - 5, x + kB, lY - 5);
      doc.setDrawColor(45, 42, 50);
      doc.setLineWidth(0.5);
      doc.line(x + 24, lY, x + kB, lY);

      // OPLOSSING: woord groen op de schrijflijn
      if (opgelost) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.text(w.tekst, x + 24, lY - 1);
        doc.setFont('helvetica', 'normal');
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 7: Beeld + woord-keuze + overschrijven
  //  Picto: 👁️ → ⭕ → ✏️ — kies juist + schrijf
  // ---------------------------------------------------------------
  function tekenKiesEnSchrijf(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: kies en schrijf' : 'Oefening: kies en schrijf');
    y = tekenPictoInstructie(doc, y, ['👁️', '✗', '✏️']);

    const items = schud(thema.items).slice(0, 4);
    const rH = 50;

    items.forEach((w, i) => {
      const yR = y + i * rH;

      // Beeld links
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, yR, 24, 24, 3, 3, 'FD');
      plaatsItemBeeld(doc, w, M + 12, yR + 12, 18);

      // 3 keuzes ONDER ELKAAR — met aankruis-vakjes
      const afl = thema.items.filter(x => x.id !== w.id);
      const opt = schud([w, ...schud(afl).slice(0, 2)]);

      const keuzeStartX = M + 30;
      doc.setFontSize(11);
      doc.setTextColor(45, 42, 50);
      opt.forEach((o, idx) => {
        const cy = yR + 4 + idx * 5;
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.5);
        doc.rect(keuzeStartX - 1.8, cy - 1.8, 3.6, 3.6);

        // OPLOSSING: groen kruisje in juiste vakje
        if (opgelost && o.id === w.id) {
          doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
          doc.setLineWidth(0.8);
          doc.line(keuzeStartX - 1.8, cy - 1.8, keuzeStartX + 1.8, cy + 1.8);
          doc.line(keuzeStartX + 1.8, cy - 1.8, keuzeStartX - 1.8, cy + 1.8);
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(45, 42, 50);
        doc.text(o.tekst, keuzeStartX + 5, cy + 1.5);
      });

      // Eén schrijflijn onder de afbeelding/keuzes
      const lijnY = yR + 38;
      const hulpY = lijnY - 5;
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(M, hulpY, M + IB, hulpY);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(M, lijnY, M + IB, lijnY);

      // OPLOSSING: woord groen op de schrijflijn
      if (opgelost) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.text(w.tekst, M, lijnY - 1);
        doc.setFont('helvetica', 'normal');
      }

      // Scheidingslijn
      if (i < items.length - 1) {
        doc.setDrawColor(240, 232, 215);
        doc.setLineWidth(0.2);
        doc.line(M, yR + 45, PB - M, yR + 45);
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 8: Knipoefening
  //  Pagina 1: dozen met woorden om beelden in te plakken
  //  Pagina 2: afzonderlijk knipblad met de beelden
  //  Picto: ✂️ → ⭕ → 📋 (knip → zoek → plak)
  // ---------------------------------------------------------------
  function tekenKnipoefening(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: knip en plak' : 'Oefening: knip en plak');
    y = tekenPictoInstructie(doc, y, opgelost ? ['👁️','✅'] : ['✂️', '🔗', '📋'], opgelost ? 'Bekijk waar elk beeld hoort.' : 'Knip de beelden op het aparte knipblad uit. Plak ze bij het juiste woord.');

    const items = schud(thema.items).slice(0, 6);
    const beeldenGeschud = schud(items);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text(opgelost ? 'DE JUISTE OPLOSSING' : 'PLAK BIJ HET JUISTE WOORD', M, y);
    y += 5;

    const dozenPerRij = 2;
    const doosBreed = (IB - 10) / dozenPerRij;
    // Het plakvak en het kaartje op het knipblad hebben exact dezelfde maat.
    // 32 mm is groot genoeg voor jonge kinderen om veilig uit te knippen.
    const plakGrootte = 32;
    const doosHoog = 36;

    items.forEach((w, i) => {
      const kol = i % dozenPerRij;
      const rij = Math.floor(i / dozenPerRij);
      const x = M + kol * (doosBreed + 10);
      const yR = y + rij * (doosHoog + 5);

      // Plakvak
      doc.setFillColor(255, 250, 240);
      doc.setDrawColor(220, 180, 100);
      doc.setLineWidth(0.4);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.roundedRect(x, yR, plakGrootte, plakGrootte, 2, 2, 'FD');
      doc.setLineDashPattern([], 0);

      if (opgelost) {
        // OPLOSSING: beeld groen omkaderd in het plakvak
        plaatsItemBeeld(doc, w, x + plakGrootte / 2, yR + plakGrootte / 2, 24);
        doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.setLineWidth(0.6);
        doc.roundedRect(x, yR, plakGrootte, plakGrootte, 2, 2);
      } else {
        // Klein "plak hier"-teken in vak
        doc.setFontSize(7);
        doc.setTextColor(220, 180, 100);
        doc.text('plak hier', x + plakGrootte / 2, yR + plakGrootte / 2 + 1, { align: 'center' });
      }

      // Woord ernaast
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(w.tekst, x + plakGrootte + 4, yR + doosHoog / 2);
      doc.setFont('helvetica', 'normal');
    });

    tekenVoet(doc);

    // Het materiaal dat werkelijk uitgeknipt wordt, staat altijd op een
    // afzonderlijke pagina. De opdrachtpagina blijft daardoor intact.
    if (!opgelost) {
      doc.addPage();
      y = tekenKop(doc, thema, 'Knipblad: beelden');
      y = tekenPictoInstructie(doc, y, ['✂️'], 'Knip de beelden uit langs de stippellijnen. Ga daarna terug naar het maakblad.');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(232, 159, 15);
      doc.text('KNIP DE BEELDEN UIT', M, y);
      y += 7;

      const beeldGrootte = plakGrootte;
      const beeldGap = 10;
      const beeldenPerRij = 3;
      const totaleBreedte = beeldenPerRij * beeldGrootte + (beeldenPerRij - 1) * beeldGap;
      const beeldenStartX = (PB - totaleBreedte) / 2;
      beeldenGeschud.forEach((w, i) => {
        const kol=i%beeldenPerRij, rij=Math.floor(i/beeldenPerRij);
        const x=beeldenStartX+kol*(beeldGrootte+beeldGap), yy=y+rij*(beeldGrootte+beeldGap);
        doc.setFillColor(255,255,255);doc.setDrawColor(130,130,130);doc.setLineWidth(.4);
        doc.setLineDashPattern([1.5,1],0);doc.roundedRect(x,yy,beeldGrootte,beeldGrootte,2,2,'FD');doc.setLineDashPattern([],0);
        plaatsItemBeeld(doc,w,x+beeldGrootte/2,yy+beeldGrootte/2,24);
      });
      tekenVoet(doc);
    }
  }

  // ---------------------------------------------------------------
  //  OEFENING 9: Kleur-koppel
  //  Woord en bijhorend beeld krijgen dezelfde kleur
  //  Picto: 👁️ → 🎨 (kijk en kleur)
  // ---------------------------------------------------------------
  function tekenKleurKoppel(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: kleur dezelfde paren' : 'Oefening: kleur dezelfde paren');
    y = tekenPictoInstructie(doc, y, ['👁️', '🎨']);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text(opgelost
      ? 'De cijfers tonen welke paren bij elkaar horen.'
      : 'Kleur het beeld en het juiste woord in dezelfde kleur.', M, y);
    doc.setFont('helvetica', 'normal');
    y += 6;

    const items = schud(thema.items).slice(0, 6);
    const beelden = items;
    const woorden = schud(items);

    const kolomBreedte = IB / 2 - 5;
    const rH = 28;

    items.forEach((_, i) => {
      const yR = y + i * rH;

      // Beeld links
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.6);
      doc.circle(M + 12, yR + 11, 11, 'FD');
      plaatsItemBeeld(doc, beelden[i], M + 12, yR + 11, 14);

      // Woord rechts
      const xR = M + IB - kolomBreedte;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.6);
      doc.roundedRect(xR, yR, kolomBreedte, 22, 11, 11, 'FD');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(woorden[i].tekst, xR + kolomBreedte / 2, yR + 14, { align: 'center' });
      doc.setFont('helvetica', 'normal');

      // OPLOSSING: cijfer bij beeld én juiste woord
      if (opgelost) {
        const beeldItem = beelden[i];
        const woordIdx = woorden.findIndex(w => w.id === beeldItem.id);
        const paarNr = i + 1;

        // Cijfer links VAN het beeld op middenhoogte
        doc.setFillColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.circle(M - 4, yR + 11, 3.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(String(paarNr), M - 4, yR + 12.5, { align: 'center' });

        if (woordIdx !== -1) {
          const yWoord = y + woordIdx * rH;
          // Cijfer rechts NAAST het woordvak op middenhoogte
          doc.setFillColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
          doc.circle(xR + kolomBreedte + 4, yWoord + 11, 3.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(String(paarNr), xR + kolomBreedte + 4, yWoord + 12.5, { align: 'center' });
        }
        doc.setFont('helvetica', 'normal');
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 10: Woordzoeker
  //  Letterraster met woorden verstopt + beelden onderaan als hint
  //  Picto: 👁️ → 🔍 (kijk en zoek)
  // ---------------------------------------------------------------
  function tekenWoordzoeker(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: woordzoeker' : 'Oefening: woordzoeker');
    y = tekenPictoInstructie(doc, y, ['👁️', '🔍']);

    // Filter: alleen losse woorden, niet te kort/lang, geen zinnen
    const kandidaten = alleenWoordItems(thema.items).filter(it => {
      const w = (it.kort || it.tekst).replace(/^(de |het |een )/i, '').replace(/[^a-zA-Zàáâäèéêëìíîïòóôöùúûü]/g, '');
      return w.length >= 3 && w.length <= 9;
    });

    if (kandidaten.length < 4) {
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('Deze oefening werkt alleen met thema\'s die genoeg losse woorden bevatten (3-9 letters).', M, y + 10);
      tekenVoet(doc);
      return;
    }

    const aantalWoorden = Math.min(8, kandidaten.length);
    const items = schud(kandidaten).slice(0, aantalWoorden);

    // Bouw raster
    const rasterGrootte = 12;
    const raster = Array.from({length: rasterGrootte}, () =>
      Array.from({length: rasterGrootte}, () => '')
    );

    // Probeer woorden te plaatsen (alleen horizontaal en verticaal voor eenvoud)
    const geplaatst = [];
    items.forEach(item => {
      const woord = (item.kort || item.tekst).replace(/^(de |het |een )/i, '').toUpperCase().replace(/[^A-Z]/g, '');
      let pogingen = 50;
      while (pogingen-- > 0) {
        const horizontaal = _rng() < 0.5;
        const r = Math.floor(_rng() * rasterGrootte);
        const k = Math.floor(_rng() * rasterGrootte);

        if (horizontaal) {
          if (k + woord.length > rasterGrootte) continue;
          let kanPlaatsen = true;
          for (let i = 0; i < woord.length; i++) {
            const cel = raster[r][k + i];
            if (cel !== '' && cel !== woord[i]) { kanPlaatsen = false; break; }
          }
          if (kanPlaatsen) {
            for (let i = 0; i < woord.length; i++) raster[r][k + i] = woord[i];
            geplaatst.push({ item, woord, startR: r, startK: k, horizontaal: true });
            break;
          }
        } else {
          if (r + woord.length > rasterGrootte) continue;
          let kanPlaatsen = true;
          for (let i = 0; i < woord.length; i++) {
            const cel = raster[r + i][k];
            if (cel !== '' && cel !== woord[i]) { kanPlaatsen = false; break; }
          }
          if (kanPlaatsen) {
            for (let i = 0; i < woord.length; i++) raster[r + i][k] = woord[i];
            geplaatst.push({ item, woord, startR: r, startK: k, horizontaal: false });
            break;
          }
        }
      }
    });

    // Vul lege cellen met willekeurige letters
    for (let r = 0; r < rasterGrootte; r++) {
      for (let k = 0; k < rasterGrootte; k++) {
        if (raster[r][k] === '') {
          raster[r][k] = String.fromCharCode(65 + Math.floor(_rng() * 26));
        }
      }
    }

    // Teken raster
    const celGrootte = 9;
    const rasterBreedte = rasterGrootte * celGrootte;
    const rasterStartX = (PB - rasterBreedte) / 2;
    const rasterStartY = y;

    doc.setDrawColor(220, 210, 190);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 252, 245);
    doc.rect(rasterStartX, rasterStartY, rasterBreedte, rasterGrootte * celGrootte, 'FD');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 42, 50);
    for (let r = 0; r < rasterGrootte; r++) {
      for (let k = 0; k < rasterGrootte; k++) {
        const cx = rasterStartX + k * celGrootte + celGrootte / 2;
        const cy = rasterStartY + r * celGrootte + celGrootte / 2 + 1.5;
        doc.text(raster[r][k], cx, cy, { align: 'center' });
        // Lichte celdoorlijning
        doc.setDrawColor(240, 232, 215);
        doc.setLineWidth(0.1);
        doc.rect(rasterStartX + k * celGrootte, rasterStartY + r * celGrootte, celGrootte, celGrootte);
      }
    }
    doc.setFont('helvetica', 'normal');

    // OPLOSSING: groene ovaal rond elk gevonden woord
    if (opgelost) {
      doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
      doc.setLineWidth(1.0);
      geplaatst.forEach(g => {
        const x1 = rasterStartX + g.startK * celGrootte + 1;
        const y1 = rasterStartY + g.startR * celGrootte + 1;
        let breedte, hoogte;
        if (g.horizontaal) {
          breedte = g.woord.length * celGrootte - 2;
          hoogte = celGrootte - 2;
        } else {
          breedte = celGrootte - 2;
          hoogte = g.woord.length * celGrootte - 2;
        }
        doc.roundedRect(x1, y1, breedte, hoogte, 3, 3);
      });
    }

    // Beelden onder als hint van wat er te zoeken is
    const ySonderRaster = rasterStartY + rasterBreedte + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text('ZOEK DEZE WOORDEN:', M, ySonderRaster);

    const beeldenY = ySonderRaster + 4;
    const beeldGr = 14;
    const beeldGap = 5;
    const totalB = geplaatst.length * (beeldGr + beeldGap) - beeldGap;
    const beeldStartX = (PB - totalB) / 2;

    geplaatst.forEach((g, i) => {
      const x = beeldStartX + i * (beeldGr + beeldGap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, beeldenY, beeldGr, beeldGr, 2, 2, 'FD');
      plaatsItemBeeld(doc, g.item, x + beeldGr / 2, beeldenY + beeldGr / 2, beeldGr - 2);
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 11: Woordkaartjes (flashcards)
  //  Voorkant: beeld. Achterkant: woord. Voor dubbelzijdig printen.
  //  Picto: 🃏
  // ---------------------------------------------------------------
  function tekenWoordkaartjes(doc, thema, opgelost) {
    // Woordkaartjes hebben geen "opgelost" — voor- en achterkant tonen al het juiste woord
    const items = thema.items.slice(0, 8);

    // -- Voorkant pagina --
    let y = tekenKop(doc, thema, 'Woordkaartjes — voorkant (beelden)');
    y = tekenPictoInstructie(doc, y, ['✂️', '🃏']);

    const kaartBreed = (IB - 10) / 2;
    const kaartHoog = 50;
    const ry = 5;

    items.forEach((w, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = M + kol * (kaartBreed + 10);
      const yR = y + rij * (kaartHoog + ry);

      // Knipkader (stippellijn)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 1.5], 0);
      doc.roundedRect(x, yR, kaartBreed, kaartHoog, 4, 4, 'FD');
      doc.setLineDashPattern([], 0);

      // Beeld groot in midden
      plaatsItemBeeld(doc, w, x + kaartBreed / 2, yR + kaartHoog / 2, 30);
    });

    tekenVoet(doc);

    // -- Achterkant pagina --
    doc.addPage();
    y = tekenKop(doc, thema, 'Woordkaartjes — achterkant (woorden)');
    y = tekenPictoInstructie(doc, y, ['📖']);

    items.forEach((w, i) => {
      // Spiegel kolom-volgorde voor dubbelzijdig printen
      // (kol 0 voorkant = kol 1 achterkant)
      const origKol = i % 2;
      const kol = 1 - origKol; // omdraaien
      const rij = Math.floor(i / 2);
      const x = M + kol * (kaartBreed + 10);
      const yR = y + rij * (kaartHoog + ry);

      doc.setFillColor(255, 252, 245);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([2, 1.5], 0);
      doc.roundedRect(x, yR, kaartBreed, kaartHoog, 4, 4, 'FD');
      doc.setLineDashPattern([], 0);

      // Woord groot in midden
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(w.tekst, x + kaartBreed / 2, yR + kaartHoog / 2 + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OPLOSSINGSSLEUTEL — overzicht van alle woorden + beelden per thema
  //  Voor de leerkracht om naast werkbladen te leggen tijdens correctie
  // ---------------------------------------------------------------
  function tekenOplossingssleutel(doc, thema) {
    let y = tekenKop(doc, thema, 'Oplossingssleutel');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Voor de leerkracht — alle woorden van dit thema met beeld en geschreven vorm.', M, y);
    doc.setFont('helvetica', 'normal');
    y += 8;

    const items = thema.items;
    const kolommen = 2;
    const itemH = 14;
    const kolBreed = (IB - 8) / kolommen;

    items.forEach((w, i) => {
      const kol = i % kolommen;
      const rij = Math.floor(i / kolommen);
      const x = M + kol * (kolBreed + 8);
      const yR = y + rij * itemH;

      // Pagina-eind check
      if (yR + itemH > PH - 15) {
        doc.addPage();
        tekenKop(doc, thema, 'Oplossingssleutel (vervolg)');
        // herstart op vaste y na header
        // (eenvoudige aanpak — kan in zeldzame gevallen leiden tot dubbele rij, maar voor nu OK)
      }

      // Beeld-vakje
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yR, 12, 12, 2, 2, 'FD');
      plaatsItemBeeld(doc, w, x + 6, yR + 6, 9);

      // Tekst ernaast
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(w.tekst, x + 16, yR + 8);

      // Niveau-label klein lichtgrijs
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      const nivLabel = { basis: 'B', uitbreiding: 'U', verdieping: 'V' }[w.niveau] || '';
      if (nivLabel) doc.text(nivLabel, x + kolBreed - 3, yR + 8, { align: 'right' });
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  // ---------------------------------------------------------------
  //  OEFENING 11: Categoriseren
  //  Eén oefening met drie varianten gestuurd door het niveau:
  //   - basis        → "Welk hoort er niet bij?" (oneven eruit)
  //   - uitbreiding  → "Sorteer in 2 groepen"
  //   - verdieping   → "Sorteer in 3+ groepen"
  //
  //  De engine kiest zelf welke categorieën spelen op basis van wat
  //  beschikbaar is in thema.items (categorieën met genoeg woorden).
  // ---------------------------------------------------------------

  // Helper: groepeer items per categorie. Items zonder categorie → '_geen'.
  function _itemsPerCategorie(items) {
    const map = {};
    items.forEach(it => {
      const c = it.categorie || '_geen';
      if (!map[c]) map[c] = [];
      map[c].push(it);
    });
    return map;
  }

  // Helper: vind categorieën met minstens N items, gesorteerd op aantal (groot→klein)
  function _bruikbareCategorieen(items, minItems) {
    const perCat = _itemsPerCategorie(items);
    const lijst = [];
    Object.keys(perCat).forEach(cat => {
      if (cat === '_geen') return; // sla items zonder categorie over
      if (perCat[cat].length >= minItems) {
        lijst.push({ categorie: cat, items: perCat[cat] });
      }
    });
    lijst.sort((a, b) => b.items.length - a.items.length);
    return lijst;
  }

  // Helper: emoji + label voor categorie (mirror van CATEGORIE_LABELS in leerkracht.js)
  const PDF_CATEGORIE_LABELS = {
    // Klas
    voorwerpen:  { label: 'voorwerpen',  emoji: '📦' },
    werkwoorden: { label: 'werkwoorden', emoji: '🏃' },
    personen:    { label: 'personen',    emoji: '👤' },
    plaatsen:    { label: 'plaatsen',    emoji: '📍' },
    situaties:   { label: 'situaties',   emoji: '🤫' },
    // Lichaam & kleding
    lichaam:     { label: 'lichaam',     emoji: '👤' },
    kleren:      { label: 'kleren',      emoji: '👕' },
    // Eten & drinken
    eten:        { label: 'eten',        emoji: '🥪' },
    drinken:     { label: 'drinken',     emoji: '🥛' },
    bestek:      { label: 'bestek',      emoji: '🍽️' },
    // Familie & gevoelens
    familie:     { label: 'familie',     emoji: '👨‍👩‍👧' },
    gevoelens:   { label: 'gevoelens',   emoji: '😊' },
    // Dieren & natuur
    dieren:      { label: 'dieren',      emoji: '🐶' },
    natuur:      { label: 'natuur',      emoji: '🌳' },
    weer:        { label: 'weer',        emoji: '☀️' },
    // Cijfers
    getallen:    { label: 'getallen',    emoji: '🔢' },
    hoeveelheid: { label: 'hoeveelheid', emoji: '➕' },
    // Thuis
    kamers:      { label: 'kamers',      emoji: '🏠' },
    meubels:     { label: 'meubels',     emoji: '🛏️' },
    keukenspullen: { label: 'keukenspullen', emoji: '🍳' },
    // Wat doe ik?
    'op-school':      { label: 'op school', emoji: '📚' },
    thuis:            { label: 'thuis',     emoji: '🏠' },
    'sociale-acties': { label: 'samen',     emoji: '🤝' }
  };
  function _catLabel(cat, thema) {
    // 1. Eerst kijken naar thema-eigen labels (bv. mix-thema met thema-IDs als cat)
    if (thema && thema._categorieLabels && thema._categorieLabels[cat]) {
      return thema._categorieLabels[cat];
    }
    // 2. Standaard PDF_CATEGORIE_LABELS lookup
    return PDF_CATEGORIE_LABELS[cat] || { label: cat, emoji: '•' };
  }

  // ---------------------------------------------------------------
  //  Variant A: BASIS — "Welk hoort er niet bij?"
  //  6 rijen × 4 beelden. Per rij: 3 uit één categorie + 1 oneven.
  // ---------------------------------------------------------------
  function tekenCategoriseerBasis(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: welk hoort er niet bij?' : 'Oefening: welk hoort er niet bij?');
    y = tekenPictoInstructie(doc, y, ['👁️', '✗'], 'Kijk naar de vier beelden. Kruis aan wat er niet bij hoort.');

    // Categorieën die minstens 3 items hebben → kunnen "3 uit dezelfde + 1 anders" leveren
    const bruikbaar = _bruikbareCategorieen(thema.items, 3);

    // Fallback: als er geen 2 categorieën met minstens 3 items zijn, kunnen we deze oefening niet tekenen
    if (bruikbaar.length < 2) {
      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text('Deze oefening werkt alleen bij thema\'s met genoeg woorden in minstens 2 categorieën.', M, y + 10);
      tekenVoet(doc);
      return;
    }

    // Bouw 5 rijen
    const aantalRijen = 5;
    const rijen = [];
    for (let i = 0; i < aantalRijen; i++) {
      // Kies een hoofdcategorie (cycle door bruikbare → variatie)
      const hoofd = bruikbaar[i % bruikbaar.length];
      // Kies 3 woorden uit hoofdcategorie
      const drie = schud(hoofd.items).slice(0, 3);
      // Kies 1 woord uit een andere categorie
      const anderen = bruikbaar.filter(b => b.categorie !== hoofd.categorie);
      const anderCat = anderen[Math.floor(_rng() * anderen.length)];
      const oneven = schud(anderCat.items).slice(0, 1)[0];
      // Plaats oneven op willekeurige positie (0-3) tussen de drie
      const posOneven = Math.floor(_rng() * 4);
      const vier = [...drie];
      vier.splice(posOneven, 0, oneven);
      // (vier heeft nu 5 elementen door splice; truncate naar 4)
      vier.length = 4;
      // Borgcheck: oneven echt aanwezig?
      if (vier.indexOf(oneven) === -1) vier[3] = oneven;
      rijen.push({ vier, oneven });
    }

    // Layout: 6 rijen × 4 vakjes naast elkaar
    // Layout: 5 rijen × 4 vakjes naast elkaar
    // rH = 40 geeft 11.5mm lucht tussen aankruisvakje en volgend beeld
    // (beeld 22mm + vakje-offset 1.5 + vakje 5 = 28.5mm → 11.5mm marge tussen rijen)
    // 5 rijen × 40 = 200mm — past comfortabel binnen pagina-budget (17mm marge)
    const rH = 40;
    const beeldGr = 22;
    const totaleBreedte = 4 * beeldGr + 3 * 8; // 4 beelden + 3 gaps
    const startX = (PB - totaleBreedte) / 2;

    rijen.forEach((rij, i) => {
      const yR = y + i * rH;
      rij.vier.forEach((item, j) => {
        const x = startX + j * (beeldGr + 8);
        // Vakje voor beeld
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 210, 190);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, yR, beeldGr, beeldGr, 3, 3, 'FD');
        plaatsItemBeeld(doc, item, x + beeldGr / 2, yR + beeldGr / 2, beeldGr - 4);

        // Aankruisvak onder beeld
        const vakGr = 5;
        const vakX = x + beeldGr / 2 - vakGr / 2;
        const vakY = yR + beeldGr + 1.5;
        doc.setDrawColor(45, 42, 50);
        doc.setLineWidth(0.4);
        doc.rect(vakX, vakY, vakGr, vakGr);

        // OPLOSSING: kruisje + groen kader bij oneven
        if (opgelost && item === rij.oneven) {
          doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
          doc.setLineWidth(0.8);
          doc.rect(vakX, vakY, vakGr, vakGr);
          doc.setLineWidth(0.6);
          doc.line(vakX + 0.8, vakY + 0.8, vakX + vakGr - 0.8, vakY + vakGr - 0.8);
          doc.line(vakX + vakGr - 0.8, vakY + 0.8, vakX + 0.8, vakY + vakGr - 0.8);
        }
      });

      // Lichte scheidingslijn tussen rijen
      if (i < rijen.length - 1) {
        doc.setDrawColor(240, 232, 215);
        doc.setLineWidth(0.2);
        doc.line(M, yR + rH - 2, PB - M, yR + rH - 2);
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  Variant B: UITBREIDING — "Sorteer in 2 groepen" met kleurcode
  //  Bovenaan: 2 kolom-koppen, elk met een gekleurd vak (kleur cycleert per werkblad)
  //  Daaronder: woorden met een wit cirkeltje. Kind kleurt elk cirkeltje
  //  in de kleur van de juiste groep.
  // ---------------------------------------------------------------
  function tekenCategoriseerUitbreiding(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: kleur per groep' : 'Oefening: kleur per groep');
    y = tekenPictoInstructie(doc, y, ['👁️', '🎨'], 'Kijk naar de groepen. Kleur elk woord met de kleur van de juiste groep.');
    return _tekenSorteerKleur(doc, thema, opgelost, y, 2);
  }

  // ---------------------------------------------------------------
  //  Variant C: VERDIEPING — "Schrijf in juiste kolom"
  //  Bovenaan: woordvoorraad in een kader.
  //  Daaronder: 3+ kolommen met kop + lege schrijflijntjes.
  // ---------------------------------------------------------------
  function tekenCategoriseerVerdieping(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: schrijf in juiste kolom' : 'Oefening: schrijf in juiste kolom');
    y = tekenPictoInstructie(doc, y, ['👁️', '✏️'], 'Kijk naar de woorden. Schrijf elk woord bij de juiste groep.');
    return _tekenSorteerSchrijven(doc, thema, opgelost, y, 3);
  }

  // Kleurpalet voor uitbreiding — pastel/krijtkleuren goed onderscheidbaar voor kinderen
  // Kind kleurt met potlood/stift; de PDF toont op de oplossing de juiste kleur.
  const _SORTEER_KLEUREN = [
    { naam: 'blauw',  rgb: [76, 145, 215] },
    { naam: 'geel',   rgb: [240, 195, 70] },
    { naam: 'groen',  rgb: [120, 185, 95] },
    { naam: 'rood',   rgb: [220, 100, 95] },
    { naam: 'paars',  rgb: [165, 130, 200] },
    { naam: 'oranje', rgb: [240, 145, 65] }
  ];

  // Gemeenschappelijke setup: kies categorieën + bouw woordenlijst + check minimum
  // Returns: { gekozen, alle } of null bij onvoldoende data (en tekent fallback-melding)
  function _sorteerSetup(doc, thema, y, gewensteAantalGroepen, perGroep) {
    const bruikbaar = _bruikbareCategorieen(thema.items, 2);
    if (bruikbaar.length < gewensteAantalGroepen) {
      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      const minTekst = gewensteAantalGroepen === 2
        ? 'minstens 2 categorieën'
        : 'minstens 3 categorieën';
      doc.text('Deze oefening werkt alleen bij thema\'s met ' + minTekst + ' (elk met 2+ woorden).', M, y + 10);
      tekenVoet(doc);
      return null;
    }
    const maxGroepen = gewensteAantalGroepen === 2 ? 2 : Math.min(4, bruikbaar.length);
    const gekozen = bruikbaar.slice(0, maxGroepen);
    const alle = [];
    gekozen.forEach(g => {
      const stuk = schud(g.items).slice(0, perGroep);
      stuk.forEach(item => alle.push({ item, categorie: g.categorie }));
    });
    return { gekozen, alle };
  }

  // ---------------------------------------------------------------
  //  Renderer voor UITBREIDING — kleurcode per groep
  // ---------------------------------------------------------------
  function _tekenSorteerKleur(doc, thema, opgelost, y, gewensteAantalGroepen) {
    const setup = _sorteerSetup(doc, thema, y, gewensteAantalGroepen, 3);
    if (!setup) return;
    const { gekozen, alle } = setup;

    // Cycle door kleuren — eerste categorie krijgt eerste kleur, enz.
    // Schud de kleuren-volgorde zodat het per werkblad anders is (gebruikt _rng → seed)
    const kleurenGeschud = schud(_SORTEER_KLEUREN);
    const kleurMap = {};
    gekozen.forEach((g, i) => {
      kleurMap[g.categorie] = kleurenGeschud[i % kleurenGeschud.length];
    });

    // ============== LEGENDE BOVENAAN ==============
    // Per categorie: gekleurd vak + categorie-naam + kleurnaam
    const aantalKol = gekozen.length;
    const kolGap = 6;
    const kolBreed = (IB - (aantalKol - 1) * kolGap) / aantalKol;
    const legHoog = 18;

    gekozen.forEach((g, i) => {
      const x = M + i * (kolBreed + kolGap);
      const lab = _catLabel(g.categorie, thema);
      const kl = kleurMap[g.categorie];

      // Categorie-vak met lichte achtergrond
      doc.setFillColor(255, 252, 246);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, kolBreed, legHoog, 3, 3, 'FD');

      // Emoji + categorie-naam links
      plaatsEmoji(doc, lab.emoji, x + 8, y + legHoog / 2, 9);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(lab.label, x + 16, y + legHoog / 2 + 1.5);
      doc.setFont('helvetica', 'normal');

      // Gekleurd staal rechts + kleurnaam
      const staalGr = 8;
      const staalX = x + kolBreed - staalGr - 22;
      const staalY = y + (legHoog - staalGr) / 2;
      doc.setFillColor(kl.rgb[0], kl.rgb[1], kl.rgb[2]);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.roundedRect(staalX, staalY, staalGr, staalGr, 1.5, 1.5, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(kl.naam, staalX + staalGr + 3, y + legHoog / 2 + 1);
    });

    const woordenStartY = y + legHoog + 10;

    // ============== WOORDEN ==============
    // Woorden geschud — 2 kolommen, met klein cirkeltje om te kleuren
    const geschud = schud(alle);
    const wH = 16;
    const wBreed = 80;
    const wGap = 6;
    const totaalRijBr = 2 * wBreed + wGap;
    const startWX = (PB - totaalRijBr) / 2;

    geschud.forEach((entry, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = startWX + kol * (wBreed + wGap);
      const yW = woordenStartY + rij * (wH + 4);

      // Vak met woord
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, yW, wBreed, wH, 3, 3, 'FD');

      // Beeld links
      plaatsItemBeeld(doc, entry.item, x + 8, yW + wH / 2, 11);

      // Tekst
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(entry.item.tekst, x + 17, yW + wH / 2 + 1.5);
      doc.setFont('helvetica', 'normal');

      // Kleur-cirkel rechts in vak — leeg om te kleuren
      const cirkelR = 3;
      const cirkelX = x + wBreed - cirkelR - 4;
      const cirkelY = yW + wH / 2;

      if (opgelost) {
        // OPLOSSING: cirkel ingekleurd in juiste kleur
        const kl = kleurMap[entry.categorie];
        if (kl) {
          doc.setFillColor(kl.rgb[0], kl.rgb[1], kl.rgb[2]);
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.4);
          doc.circle(cirkelX, cirkelY, cirkelR, 'FD');
        }
      } else {
        // OEFENING: leeg cirkeltje om te kleuren
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(160, 160, 160);
        doc.setLineWidth(0.4);
        doc.circle(cirkelX, cirkelY, cirkelR, 'FD');
      }
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  Renderer voor VERDIEPING — woordvoorraad + schrijflijntjes
  // ---------------------------------------------------------------
  function _tekenSorteerSchrijven(doc, thema, opgelost, y, gewensteAantalGroepen) {
    // Verdieping: bij minder woorden per groep om plaats te laten voor schrijfruimte
    const setup = _sorteerSetup(doc, thema, y, gewensteAantalGroepen, 3);
    if (!setup) return;
    const { gekozen, alle } = setup;

    // ============== WOORDVOORRAAD BOVENAAN ==============
    const woordenGeschud = schud(alle);

    // Vaste kaartjes in een ordelijk raster. Zo botsen lange zinnen niet meer
    // tegen het volgende beeld en zijn alle afbeeldingen even groot.
    const voorraadKolommen = 3;
    const kaartGapX = 3;
    const kaartGapY = 2.5;
    const kaartW = (IB - 8 - (voorraadKolommen - 1) * kaartGapX) / voorraadKolommen;
    const kaartH = 13;
    const beeldGr = 9;
    const aantalRijen = Math.ceil(woordenGeschud.length / voorraadKolommen);
    const voorraadHoog = Math.max(24, 10 + aantalRijen * kaartH + Math.max(0, aantalRijen - 1) * kaartGapY + 5);

    doc.setFillColor(255, 252, 246);
    doc.setDrawColor(220, 180, 100);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([1.5, 1], 0);
    doc.roundedRect(M, y, IB, voorraadHoog, 3, 3, 'FD');
    doc.setLineDashPattern([], 0);

    // Label "WOORDEN" linksboven
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text('WOORDEN', M + 4, y + 5);

    // Woorden tekenen: één beeld en één tekstblok per kaartje.
    woordenGeschud.forEach((entry, i) => {
      const kol = i % voorraadKolommen;
      const rij = Math.floor(i / voorraadKolommen);
      const x = M + 4 + kol * (kaartW + kaartGapX);
      const yKaart = y + 9 + rij * (kaartH + kaartGapY);
      doc.setFillColor(255,255,255);
      doc.setDrawColor(228,218,198);
      doc.setLineWidth(.35);
      doc.roundedRect(x,yKaart,kaartW,kaartH,2,2,'FD');
      plaatsItemBeeld(doc,entry.item,x+6,yKaart+kaartH/2,beeldGr);
      let fs=10.5;
      doc.setFont('helvetica','bold');
      while(fs>7.5){doc.setFontSize(fs);if(doc.getTextWidth(entry.item.tekst)<=kaartW-16)break;fs-=.5;}
      doc.setTextColor(45,42,50);
      doc.text(entry.item.tekst,x+12,yKaart+kaartH/2+1.5);
    });
    doc.setFont('helvetica', 'normal');

    const kolStartY = y + voorraadHoog + 8;

    // ============== KOLOMMEN MET SCHRIJFLIJNTJES ==============
    // Layout-regels:
    //   2 cat → 2 naast elkaar (1 rij)
    //   3 cat → 3 naast elkaar (1 rij)
    //   4+ cat → 2 kolommen per rij, dus 4 cats = 2×2 grid met dubbele kolombreedte
    const aantalCat = gekozen.length;
    const kolGap = 4;
    const rijGap = 6;
    const kolPerRij = (aantalCat >= 4) ? 2 : aantalCat;
    const kolBreed = (IB - (kolPerRij - 1) * kolGap) / kolPerRij;
    const kopHoog = 16;

    // Aantal schrijflijntjes per kolom — gebaseerd op aantal woorden in die categorie in 'alle'
    // Bij 2-rij layout (4+ cats): max 3 lijntjes per kolom om binnen pagina te blijven
    // Bij 1-rij layout: max 4 lijntjes per kolom
    const maxLijnenInRij = (kolPerRij === 2 && aantalCat >= 4) ? 3 : 4;
    const lijnenPerKol = {};
    gekozen.forEach(g => {
      const aantal = alle.filter(a => a.categorie === g.categorie).length;
      lijnenPerKol[g.categorie] = Math.min(maxLijnenInRij, aantal);
    });

    // Bepaal de hoogte van één rij (kop + ruimte + lijnen + lucht onderaan)
    const lijnGap = 12;
    const ruimteKopNaarLijn = 12; // meer lucht tussen kop en eerste schrijflijn
    const rijHoog = kopHoog + ruimteKopNaarLijn + maxLijnenInRij * lijnGap + 6;

    gekozen.forEach((g, i) => {
      const kolIdx = i % kolPerRij;
      const rijIdx = Math.floor(i / kolPerRij);
      const x = M + kolIdx * (kolBreed + kolGap);
      const yKop = kolStartY + rijIdx * (rijHoog + rijGap);
      const lab = _catLabel(g.categorie, thema);

      // Kop-vak
      doc.setFillColor(255, 244, 224);
      doc.setDrawColor(255, 182, 39);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, yKop, kolBreed, kopHoog, 3, 3, 'FD');
      plaatsEmoji(doc, lab.emoji, x + 8, yKop + kopHoog / 2, 9);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(lab.label, x + 16, yKop + kopHoog / 2 + 1.5);
      doc.setFont('helvetica', 'normal');

      // Schrijflijntjes onder de kop — kleinere padding zodat lijnen langer zijn
      const lijnenStart = yKop + kopHoog + ruimteKopNaarLijn;
      const lijnPadding = 2;
      const lijnX1 = x + lijnPadding;
      const lijnX2 = x + kolBreed - lijnPadding;
      const aantalLijnen = lijnenPerKol[g.categorie];

      for (let j = 0; j < aantalLijnen; j++) {
        const lijnY = lijnenStart + j * lijnGap;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(lijnX1, lijnY, lijnX2, lijnY);
      }

      // OPLOSSING: woorden uit deze categorie groen op de lijntjes
      if (opgelost) {
        const woordenInGroep = alle.filter(a => a.categorie === g.categorie);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        woordenInGroep.slice(0, aantalLijnen).forEach((entry, j) => {
          const lijnY = lijnenStart + j * lijnGap;
          doc.text(entry.item.tekst, lijnX1 + 1, lijnY - 1);
        });
        doc.setFont('helvetica', 'normal');
      }
    });

    tekenVoet(doc);
  }

  // Niveau-bepaling per categoriseer-variant gebeurt nu via aparte oefen-keys
  // (categoriseerBasis / categoriseerUitbreiding / categoriseerVerdieping).
  // De ctx-parameter wordt niet meer gebruikt voor categoriseer, maar blijft
  // beschikbaar voor toekomstige uitbreidingen.

  // ---------------------------------------------------------------
  //  VERTELPLAAT: nummers bij woorden zoeken
  // ---------------------------------------------------------------
  function tekenVertelplaatNummers(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: nummers op de vertelplaat' : 'Oefening: nummers op de vertelplaat');
    y = tekenPictoInstructie(doc, y, ['👁️', '🔢', '✏️'], 'Zoek elk woord. Schrijf het nummer in het juiste rondje.');

    const standaardPosities = {
      juf:[37,28], bord:[50,20], klok:[70,13], deur:[80,23], kapstok:[92,22],
      boekentas:[89,42], boek:[17,58], potlood:[37,88], schrift:[53,61],
      schaar:[55,88], lijm:[62,88], vuilbak:[90,80]
    };
    const plaatConfig=thema.vertelplaat;
    const posities=plaatConfig&&Array.isArray(plaatConfig.hotspots)
      ? Object.fromEntries(plaatConfig.hotspots.filter(h=>!h.zin).map(h=>{
          let id=h.itemId||String(h.id||'').replace(/^vp-/,'');
          if(id==='vingers')id='vinger';
          return [id,[h.x,h.y]];
        }))
      : standaardPosities;
    const plaatPad=plaatConfig&&plaatConfig.beeld?plaatConfig.beeld:'vertelplaten/in-de-klas.png';
    const werkbladItems=plaatConfig&&Array.isArray(plaatConfig.werkbladItems)?plaatConfig.werkbladItems:null;
    const bruikbaar = thema.items.filter(it => posities[it.id]&&(!werkbladItems||werkbladItems.includes(it.id))).slice(0, 12);
    if (bruikbaar.length < 4 || !_losseAfbeeldingCache[plaatPad]) {
      doc.setFontSize(11); doc.setTextColor(100,100,100);
      doc.text('Voor deze oefening zijn nog niet genoeg woorden aan de vertelplaat gekoppeld.', M, y + 12);
      tekenVoet(doc); return;
    }
    const genummerd = schud(bruikbaar).map((item, i) => ({ item, nummer:i + 1 }));
    const nummerPerId = Object.fromEntries(genummerd.map(x => [x.item.id, x.nummer]));
    const plaatX=M, plaatY=y+3, plaatW=IB, plaatH=120;
    doc.addImage(_losseAfbeeldingCache[plaatPad], 'PNG', plaatX, plaatY, plaatW, plaatH);

    bruikbaar.forEach(item => {
      const [px,py] = posities[item.id];
      const doelX=plaatX + plaatW * px / 100, doelY=plaatY + plaatH * py / 100;
      // Zet het invulrondje naast het voorwerp en wijs het met een lijntje aan.
      // Zo blijft het eigenlijke beeld zichtbaar en weet het kind toch exact
      // bij welke plaats het rondje hoort.
      const dx = px > 76 ? -8 : 8;
      const dy = py < 20 ? 7 : -7;
      const cx=Math.max(plaatX+5,Math.min(plaatX+plaatW-5,doelX+dx));
      const cy=Math.max(plaatY+5,Math.min(plaatY+plaatH-5,doelY+dy));
      doc.setDrawColor(25,116,98); doc.setLineWidth(.65);
      doc.line(doelX,doelY,cx,cy);
      doc.setFillColor(255,255,255); doc.setDrawColor(25,116,98); doc.setLineWidth(1);
      doc.circle(cx,cy,4.2,'FD');
      if (opgelost) {
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(KLEUR_OPL_R,KLEUR_OPL_G,KLEUR_OPL_B);
        doc.text(String(nummerPerId[item.id]),cx,cy+1.4,{align:'center'});
      }
    });

    y=plaatY+plaatH+8;
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(45,42,50);
    genummerd.forEach((entry,i) => {
      const col=i%3, rij=Math.floor(i/3), x=M+col*60, yy=y+rij*8;
      doc.text(`${entry.nummer}. ${entry.item.tekst}`,x,yy);
    });
    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  FAMILIEBOOM: relaties begrijpen vanuit "ik"
  // ---------------------------------------------------------------
  function tekenFamilieboom(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: wie is wie in de familie?' : 'Oefening: wie is wie in de familie?');
    y = tekenPictoInstructie(doc, y, ['👁️', '🌳', '✏️'], 'Volg de lijnen. Schrijf het juiste familiewoord onder elke persoon.');
    const vind = id => (thema.items || []).find(it => it.id === id) || {id,tekst:'de '+id,picto:'familie/'+id+'.png'};
    const targetIds = ['broer','zus','nonkel','tante','neef','nicht'];
    const pos = {
      opa:[88,77], oma:[122,77],
      papa:[48,130], mama:[76,130], nonkel:[136,130], tante:[164,130],
      broer:[33,193], zus:[58,193], ik:[83,193], neef:[139,193], nicht:[166,193]
    };

    // Familielijnen eerst, zodat de kaarten er rustig bovenop liggen.
    doc.setDrawColor(33,116,95); doc.setLineWidth(1.4);
    doc.line(105,91,105,105); doc.line(62,105,150,105); doc.line(62,105,62,116); doc.line(150,105,150,116);
    doc.line(62,144,62,158); doc.line(33,158,83,158); doc.line(33,158,33,179); doc.line(58,158,58,179); doc.line(83,158,83,179);
    doc.line(150,144,150,158); doc.line(139,158,166,158); doc.line(139,158,139,179); doc.line(166,158,166,179);

    const kaart = (id, label, vast) => {
      const p = pos[id], x = p[0], yy = p[1], w = 22, h = 30;
      doc.setFillColor(id === 'ik' ? 255 : 255, id === 'ik' ? 248 : 255, id === 'ik' ? 214 : 255);
      doc.setDrawColor(id === 'ik' ? 242 : 218, id === 'ik' ? 186 : 225, id === 'ik' ? 46 : 220);
      doc.setLineWidth(.7); doc.roundedRect(x-w/2,yy-h/2,w,h,2.5,2.5,'FD');
      if (id === 'ik') plaatsEmoji(doc,'🙋',x,yy-3,14);
      else plaatsItemBeeld(doc,vind(id),x,yy-3,15);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      if (vast || opgelost) {
        doc.setTextColor(opgelost && !vast ? KLEUR_OPL_R : 45, opgelost && !vast ? KLEUR_OPL_G : 42, opgelost && !vast ? KLEUR_OPL_B : 50);
        doc.text(label,x,yy+12,{align:'center'});
      } else {
        doc.setDrawColor(130,130,130); doc.setLineWidth(.35); doc.line(x-8,yy+11,x+8,yy+11);
      }
    };
    kaart('opa','opa',true); kaart('oma','oma',true);
    kaart('papa','papa',true); kaart('mama','mama',true);
    kaart('nonkel','nonkel',false); kaart('tante','tante',false);
    kaart('broer','broer',false); kaart('zus','zus',false); kaart('ik','ik',true);
    kaart('neef','neef',false); kaart('nicht','nicht',false);

    doc.setFillColor(255,249,232); doc.setDrawColor(229,173,50); doc.setLineWidth(.6);
    doc.roundedRect(M,220,IB,36,3,3,'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(80,70,50);
    doc.text('WOORDEN',M+5,228);
    const woorden = schud(targetIds.map(id => (vind(id) || {tekst:'de '+id}).tekst));
    woorden.forEach((woord,i)=>{
      const col=i%3,rij=Math.floor(i/3),x=M+8+col*58,yy=238+rij*10;
      doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(45,42,50); doc.text('• '+woord,x,yy);
    });
    tekenVoet(doc);
  }

  function _zinVoorKnipitem(item) {
    // Een knipzin bevat geen aanspreking zoals "Juf," of "Hallo,". Bij echte
    // zinsitems is `tekst` de korte, bruikbare kernzin; `zin` is vaak alleen een
    // langere voorbeeldzin voor spreken.
    return (item.knipZin || (item.soort && item.soort.indexOf('zin') === 0 ? item.tekst : '') || item.zin || '').trim();
  }

  const _KLAS_ZINSKNIP = [
    {id:'zk-neemt-boekentas',zin:'De jongen neemt zijn boekentas.',zinPicto:'assets/zinsbeelden/de-jongen-neemt-zijn-boekentas.png',zinsdelen:[{tekst:'De jongen',rol:'wie'},{tekst:'neemt',rol:'doet'},{tekst:'zijn boekentas',rol:'wat'}]},
    {id:'zk-leest-boek',zin:'De jongen leest een boek.',zinPicto:'assets/zinsbeelden/de-jongen-leest-een-boek.png',zinsdelen:[{tekst:'De jongen',rol:'wie'},{tekst:'leest',rol:'doet'},{tekst:'een boek',rol:'wat'}]},
    {id:'zk-hand-op',zin:'Het meisje steekt haar hand op.',zinPicto:'assets/zinsbeelden/het-meisje-steekt-haar-hand-op.png',zinsdelen:[{tekst:'Het meisje',rol:'wie'},{tekst:'steekt',rol:'doet'},{tekst:'haar hand op',rol:'wat'}]},
    {id:'zk-juf-bord',zin:'De juf schrijft op het bord.',zinPicto:'assets/zinsbeelden/de-juf-schrijft-op-het-bord.png',zinsdelen:[{tekst:'De juf',rol:'wie'},{tekst:'schrijft',rol:'doet'},{tekst:'op het bord',rol:'waar'}]}
  ];

  function _zinsknipKandidaten(thema) {
    if (thema && thema.visueleOefening === 'vertelplaat-klas') return _KLAS_ZINSKNIP.slice();
    // Gebruik nooit meer automatisch een los woordpictogram voor een volledige
    // zin. Andere thema's komen pas in aanmerking zodra ze een zinPicto hebben.
    return (thema.items || []).map(it => (
      thema && thema.type === 'zinnen' && it.tekst ? {...it, knipZin: it.knipZin || it.tekst} : it
    )).filter(it => {
      if (!it.zinPicto || !_zinVoorKnipitem(it)) return false;
      // In een gemengd startthema horen losse woorden (hallo, mama, sorry ...)
      // niet thuis in een oefening waarin kinderen een volledige zin bouwen.
      if (thema && thema.type === 'gemengd' && !(it.soort || '').startsWith('zin')) return false;
      // Vraagzinnen hebben een andere woordvolgorde en krijgen later een eigen
      // vraagzinoefening; hier oefenen we heldere mededelende basiszinnen.
      return !_zinVoorKnipitem(it).includes('?');
    });
  }

  function _plaatsZinsbeeld(doc,item,x,y,grootte){
    plaatsItemBeeld(doc,{...item,picto:item.zinPicto,foto:null},x,y,grootte);
  }

  function _tekstInKnipvak(doc, tekst, x, y, w, h, kleur) {
    let grootte=11; doc.setFont('helvetica','bold');
    while(grootte>7){doc.setFontSize(grootte);if(doc.getTextWidth(tekst)<=w-4)break;grootte-=0.5;}
    doc.setTextColor(...kleur); doc.text(tekst,x+w/2,y+h/2+1.4,{align:'center'});
  }

  const _ZIS_KLEUREN = {
    wie:     { vul:[224,189,24],  rand:[172,143,8],  tekst:[52,44,0] },
    doet:    { vul:[226,68,68],   rand:[177,43,43],  tekst:[255,255,255] },
    waar:    { vul:[131,82,197],  rand:[96,54,155],  tekst:[255,255,255] },
    wanneer: { vul:[233,130,32],  rand:[188,91,12],  tekst:[255,255,255] },
    wat:     { vul:[128,81,57],   rand:[91,54,36],   tekst:[255,255,255] },
    hoe:     { vul:[51,153,76],   rand:[31,111,49],  tekst:[255,255,255] }
  };

  function _schoonZinswoord(woord) {
    return String(woord || '').replace(/[.!?,;:]+$/g,'');
  }

  // Maakt zinsdelen zoals Zien is Snappen ze gebruikt: "De juf" blijft één
  // geel kaartje, "op het bord" één paars kaartje, enzovoort.
  function _zinsdelenVoorKnipitem(item) {
    if (Array.isArray(item.zinsdelen) && item.zinsdelen.length) return item.zinsdelen;
    const woorden=_zinVoorKnipitem(item).split(/\s+/).map(_schoonZinswoord).filter(Boolean);
    if(!woorden.length)return [];
    const laag=woorden.map(w=>w.toLowerCase());
    const werkwoorden=new Set(['ben','bent','is','zijn','heb','heeft','hebben','heet','heten','snap','snapt','begrijp','begrijpt','weet','weten','mis','mist','voel','voelt','trap','trapt','ga','gaat','gaan','draag','draagt','dragen','zit','zitten','hang','hangt','hangen','drink','drinkt','drinken','eet','eten','speel','speelt','spelen','werk','werkt','werken','schrijf','schrijft','schrijven','lees','leest','lezen','kijk','kijkt','kijken','luister','luistert','luisteren','reken','rekent','rekenen','kleur','kleurt','kleuren','knip','knipt','knippen','plak','plakt','plakken','teken','tekent','tekenen','help','helpt','helpen','leg','legt','leggen','rinkelt','gom','gooit','gooi','markeer','schilder','schildert','schilderen','sta','staat','staan','kan','kunnen','mag','mogen','moet','nemen','neemt']);
    const voorzetsels=new Set(['in','op','aan','naar','uit','met','bij','onder','boven','naast','achter','voor','tussen','tegen','van']);
    const tijdwoorden=new Set(['nu','vandaag','morgen','gisteren','maandag','dinsdag','woensdag','donderdag','vrijdag','pauze','uur']);
    const hoewoorden=new Set(['samen','stil','goed','snel','traag','scherp','rood','blauw','geel','groen','klaar','moe','bang','ziek','blij','boos','verdrietig','sterk','groot','klein','warm','koud','nat','droog','bruin','wit','roze']);
    let ww=laag.findIndex(w=>werkwoorden.has(w));
    if(ww<0)ww=Math.min(1,woorden.length-1);
    const delen=[];
    if(ww>0)delen.push({tekst:woorden.slice(0,ww).join(' '),rol:tijdwoorden.has(laag[0])?'wanneer':voorzetsels.has(laag[0])?'waar':'wie'});
    let wwEinde=ww+1;
    if(['kan','kunnen','mag','mogen','moet'].includes(laag[ww])&&werkwoorden.has(laag[ww+1]))wwEinde++;
    delen.push({tekst:woorden.slice(ww,wwEinde).join(' '),rol:'doet'});
    if(wwEinde<woorden.length){
      const rest=woorden.slice(wwEinde),restLaag=laag.slice(wwEinde);
      let rol='wat';
      if(voorzetsels.has(restLaag[0]))rol=tijdwoorden.has(restLaag[1])?'wanneer':'waar';
      else if(tijdwoorden.has(restLaag[0]))rol='wanneer';
      else if(restLaag.every(w=>hoewoorden.has(w)||w==='en'))rol='hoe';
      delen.push({tekst:rest.join(' '),rol});
    }
    return delen.filter(d=>d.tekst);
  }

  // Twee bladen: beelden met maatvaste plakvakken + losse woordkaartjes.
  function tekenZinnenKnippen(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: bouw de zinnen' : 'Oefening: bouw de zinnen');
    y = tekenPictoInstructie(doc, y, ['👁️','✂️','🔗'], 'Knip de woorden uit. Bouw bij elk beeld de goede zin.');
    const kandidaten = schud(_zinsknipKandidaten(thema).filter(it => {
      const n=_zinVoorKnipitem(it).split(/\s+/).filter(Boolean).length;
      return n>=2;
    })).slice(0,4);
    if(kandidaten.length<2){
      doc.setFontSize(11);doc.setTextColor(100,100,100);doc.text('Kies een thema met minstens twee korte zinnen.',M,y+12);tekenVoet(doc);return;
    }
    const boxW=32, boxH=13, gap=2, beeld=28, rijH=48;
    kandidaten.forEach((item,i)=>{
      const ry=y+3+i*rijH;
      _plaatsZinsbeeld(doc,item,M+beeld/2,ry+beeld/2,beeld-3);
      const tokens=_zinsdelenVoorKnipitem(item);
      const startX=M+beeld+7;
      tokens.forEach((deel,j)=>{
        const x=startX+j*(boxW+gap);
        const kleur=_ZIS_KLEUREN[deel.rol]||_ZIS_KLEUREN.wat;
        doc.setFillColor(...kleur.vul.map(v=>Math.round(v+(255-v)*.82)));doc.setDrawColor(...kleur.rand);doc.setLineWidth(.55);
        doc.setLineDashPattern([1.5,1],0);doc.roundedRect(x,ry+7,boxW,boxH,2,2,'FD');doc.setLineDashPattern([],0);
        if(opgelost)_tekstInKnipvak(doc,deel.tekst,x,ry+7,boxW,boxH,kleur.rand);
      });
      doc.setDrawColor(225,220,210);doc.line(M,ry+rijH-5,PB-M,ry+rijH-5);
    });
    tekenVoet(doc);
    if(opgelost)return;

    doc.addPage();
    y=tekenKop(doc,thema,'Knipblad: woorden voor de zinnen');
    y=tekenPictoInstructie(doc,y,['✂️','📋'],'Knip elk gekleurd zinsdeel uit langs de stippellijn.');
    const alleTokens=schud(kandidaten.flatMap(item=>_zinsdelenVoorKnipitem(item)));
    const cols=5, startX=M+4, startY=y+10;
    alleTokens.forEach((deel,i)=>{
      const col=i%cols,rij=Math.floor(i/cols),x=startX+col*(boxW+3),yy=startY+rij*(boxH+5);
      const kleur=_ZIS_KLEUREN[deel.rol]||_ZIS_KLEUREN.wat;
      doc.setFillColor(...kleur.vul);doc.setDrawColor(...kleur.rand);doc.setLineWidth(.5);
      doc.setLineDashPattern([1.5,1],0);doc.roundedRect(x,yy,boxW,boxH,1.5,1.5,'FD');doc.setLineDashPattern([],0);
      _tekstInKnipvak(doc,deel.tekst,x,yy,boxW,boxH,kleur.tekst);
    });
    tekenVoet(doc);
  }

  //  HOOFDFUNCTIE
  //  themaConfigs: array van { thema, oefeningen[], niveau }
  //  opties.verdeling: 'mengen' (alle items door elkaar — alleen zinvol als alle thema's dezelfde oefeningen hebben)
  //                    of 'per-thema' (default — elk thema apart)
  // ---------------------------------------------------------------
  const OEFENING_FUNCTIES = {
    koppel: tekenKoppel,
    overschrijf: tekenOverschrijf,
    letter: tekenLetterMist,
    omcirkel: tekenOmcirkel,
    zelfschrijven: tekenZelfSchrijven,
    kiesschrijf: tekenKiesEnSchrijf,
    knip: tekenKnipoefening,
    vertelplaatNummers: tekenVertelplaatNummers,
    familieboom: tekenFamilieboom,
    zinnenKnippen: tekenZinnenKnippen,
    kleurkoppel: tekenKleurKoppel,
    woordzoeker: tekenWoordzoeker,
    kaartjes: tekenWoordkaartjes,
    categoriseerBasis: tekenCategoriseerBasis,
    categoriseerUitbreiding: tekenCategoriseerUitbreiding,
    categoriseerVerdieping: tekenCategoriseerVerdieping
  };

  function maakWerkblad(themaConfigs, opties) {
    return _genereerPDF(themaConfigs, opties, false);
  }

  function maakOplossingssleutel(themaConfigs, opties) {
    return _genereerPDF(themaConfigs, opties || {}, true);
  }

  // Filter items van een thema op categorieën uit de werkblad-config.
  // Lege of ontbrekende categorieën-lijst = alle items.
  function _filterOpCategorieen(items, categorieen) {
    if (!categorieen || categorieen.length === 0) return items;
    return items.filter(it => !it.categorie || categorieen.includes(it.categorie));
  }

  async function _genereerPDF(themaConfigs, opties, opgelost) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Backwards-compat
    if (!Array.isArray(themaConfigs)) {
      const oudThema = themaConfigs;
      const oudOpties = opties || {};
      const oefAangevinkt = [];
      Object.keys(OEFENING_FUNCTIES).forEach(k => {
        if (oudOpties[k]) oefAangevinkt.push(k);
      });
      themaConfigs = [{ thema: oudThema, oefeningen: oefAangevinkt, niveau: oudOpties.niveau || 'vrij' }];
      opties = { verdeling: 'per-thema' };
    }

    if (themaConfigs.length === 0) return;

    // Toepassen van categorieën-filter PER thema-config:
    // We klonen het thema-object met een gefilterde items-lijst
    // zodat de teken-functies (die schud(thema.items) doen) automatisch correct zijn.
    themaConfigs = themaConfigs.map(tc => {
      const gefilterd = _filterOpCategorieen(tc.thema.items, tc.categorieen);
      // Niets veranderd? Origineel hergebruiken (geen onnodige clone)
      if (gefilterd.length === tc.thema.items.length) return tc;
      return {
        ...tc,
        thema: { ...tc.thema, items: gefilterd, _origineelThemaId: tc.thema.id }
      };
    });

    // Pre-fetch alle pictos die voorkomen in de te-tekenen items
    const allItems = [];
    themaConfigs.forEach(tc => tc.thema.items.forEach(it => allItems.push(it)));
    themaConfigs.forEach(tc => {
      if (tc.oefeningen.includes('zinnenKnippen')) _zinsknipKandidaten(tc.thema).forEach(it => allItems.push(it));
      if (tc.oefeningen.includes('familieboom')) {
        ['opa','oma','papa','mama','broer','zus','nonkel','tante','neef','nicht'].forEach(id => {
          allItems.push((tc.thema.items || []).find(it => it.id === id) || {id,picto:'familie/'+id+'.png'});
        });
      }
    });
    try {
      await prefetchPictos(allItems);
    } catch (e) {
      console.warn('Prefetch pictos faalde — ga verder met emoji-fallback', e);
    }
    for (const tc of themaConfigs.filter(tc => tc.oefeningen.includes('vertelplaatNummers'))) {
      await _losseAfbeeldingLaden(tc.thema.vertelplaat&&tc.thema.vertelplaat.beeld?tc.thema.vertelplaat.beeld:'vertelplaten/in-de-klas.png');
    }

    // Bepaal of we per thema of gemengd werken
    const isMengen = (opties.verdeling === 'mengen') && themaConfigs.length > 1;

    // Seed: combinatie van thema-ids + huidige tijd, of vast voor oplossing
    // Belangrijk: gebruik dezelfde seed bij werkblad én oplossing zodat ze identiek zijn
    // We slaan de seed op per generatie. Eerste keer (werkblad) -> nieuwe seed. Bij oplossing wordt dezelfde seed hergebruikt.
    const themaSleutel = themaConfigs.map(tc => tc.thema.id).join('-');
    if (!opgelost) {
      _laatsteSeed[themaSleutel] = Math.floor(Math.random() * 2147483647);
    }
    const seed = _laatsteSeed[themaSleutel] || 12345;

    let eerste = true;
    const add = () => { if (!eerste) doc.addPage(); eerste = false; };
    const vol = ['koppel','overschrijf','letter','omcirkel','zelfschrijven','kiesschrijf','knip','vertelplaatNummers','familieboom','zinnenKnippen','kleurkoppel','woordzoeker','kaartjes','categoriseerBasis','categoriseerUitbreiding','categoriseerVerdieping'];

    if (isMengen) {
      const allItems = [];
      themaConfigs.forEach(tc => {
        tc.thema.items.forEach(it => allItems.push(it));
      });
      const themaNaam = themaConfigs.map(tc => tc.thema.naam).join(' + ');
      const themaEmoji = themaConfigs[0].thema.emoji;
      const gemengd = {
        id: 'gemengd',
        naam: themaNaam,
        emoji: themaEmoji,
        items: allItems
      };
      let gemeenschappelijk = new Set(themaConfigs[0].oefeningen);
      themaConfigs.slice(1).forEach(tc => {
        gemeenschappelijk = new Set([...gemeenschappelijk].filter(x => tc.oefeningen.includes(x)));
      });
      let oefIdx = 0;
      vol.filter(k => gemeenschappelijk.has(k)).forEach(k => {
        add();
        // Reset RNG met deterministische seed per oefening
        _resetRng(seed + oefIdx * 1000);
        OEFENING_FUNCTIES[k](doc, gemengd, opgelost);
        oefIdx++;
      });
    } else {
      let oefIdx = 0;
      themaConfigs.forEach((tc, themaIdx) => {
        vol.filter(k => tc.oefeningen.includes(k)).forEach(k => {
          add();
          _resetRng(seed + oefIdx * 1000 + themaIdx * 100000);
          OEFENING_FUNCTIES[k](doc, tc.thema, opgelost);
          oefIdx++;
        });
      });
    }

    const themaIds = themaConfigs.map(tc => tc.thema.id).join('-');
    const bestandsnaam = opgelost
      ? `oplossing-${themaIds}-jufzisa.pdf`
      : `werkblad-${themaIds}-jufzisa.pdf`;
    doc.save(bestandsnaam);
  }

  // Bewaar laatste gebruikte seed per thema-combinatie
  const _laatsteSeed = {};

  return { maakWerkblad, maakOplossingssleutel, prefetchPictos, plaatsItemBeeld };
})();
