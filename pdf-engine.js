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
   * Returns y-positie waar inhoud kan beginnen.
   */
  function tekenPictoInstructie(doc, y, pictos) {
    const hoogte = 16;
    const startX = M;

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

    return y + hoogte + 6;
  }

  function tekenVoet(doc) {
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text('jufzisa.be · Anders Leren', PB / 2, PH - 8, { align: 'center' });
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
      plaatsEmoji(doc, links[i].beeld, xL + kB / 2, yR + 11, 16);

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
      plaatsEmoji(doc, w.beeld, x + 9, yR + 9, 13);

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
      plaatsEmoji(doc, w.beeld, M + 11, yR + 11, 16);

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
    y = tekenPictoInstructie(doc, y, ['👁️', '✗']);

    const items = schud(thema.items).slice(0, 6);
    const rH = 30;

    items.forEach((w, i) => {
      const yR = y + i * rH;

      // Beeld
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, yR, 22, 22, 3, 3, 'FD');
      plaatsEmoji(doc, w.beeld, M + 11, yR + 11, 17);

      // 3 woorden naast elkaar
      const afl = thema.items.filter(x => x.id !== w.id);
      const opt = schud([w, ...schud(afl).slice(0, 2)]);

      const startX = M + 30;
      const beschikbaar = IB - 30;
      const oB = beschikbaar / 3;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      opt.forEach((o, idx) => {
        doc.setTextColor(45, 42, 50);
        doc.text(o.tekst, startX + idx * oB + oB / 2, yR + 14, { align: 'center' });

        // OPLOSSING: groene cirkel rond het juiste woord
        if (opgelost && o.id === w.id) {
          doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
          doc.setLineWidth(0.8);
          // Schat de woord-breedte ongeveer
          const woordBreed = Math.min(o.tekst.length * 2.5 + 4, oB - 4);
          doc.roundedRect(startX + idx * oB + oB / 2 - woordBreed / 2, yR + 9, woordBreed, 8, 4, 4);
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
      plaatsEmoji(doc, w.beeld, x + 13, yR + 13, 18);

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
      plaatsEmoji(doc, w.beeld, x + 10, yR + 10, 15);

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
      plaatsEmoji(doc, w.beeld, M + 12, yR + 12, 18);

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
  //  Boven: rij beelden om uit te knippen
  //  Onder: dozen met woorden om beelden in te plakken
  //  Picto: ✂️ → ⭕ → 📋 (knip → zoek → plak)
  // ---------------------------------------------------------------
  function tekenKnipoefening(doc, thema, opgelost) {
    let y = tekenKop(doc, thema, opgelost ? 'Oplossing: knip en plak' : 'Oefening: knip en plak');
    y = tekenPictoInstructie(doc, y, ['✂️', '🔗', '📋']);

    const items = schud(thema.items).slice(0, 6);
    const beeldenGeschud = schud(items);

    // Sectie 1: Beelden om uit te knippen (bovenste deel)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text('1. KNIP DE BEELDEN UIT', M, y);
    y += 5;

    const beeldGrootte = 22;
    const beeldGap = 6;
    const beeldenPerRij = 6;
    const totaleBreedte = beeldenPerRij * beeldGrootte + (beeldenPerRij - 1) * beeldGap;
    const beeldenStartX = (PB - totaleBreedte) / 2;

    beeldenGeschud.forEach((w, i) => {
      const x = beeldenStartX + i * (beeldGrootte + beeldGap);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.rect(x, y, beeldGrootte, beeldGrootte);
      doc.setLineDashPattern([], 0);

      plaatsEmoji(doc, w.beeld, x + beeldGrootte / 2, y + beeldGrootte / 2, beeldGrootte - 4);
    });

    y += beeldGrootte + 12;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(M, y, PB - M, y);
    doc.setLineDashPattern([], 0);

    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 159, 15);
    doc.text('2. PLAK BIJ HET JUISTE WOORD', M, y);
    y += 5;

    const dozenPerRij = 2;
    const doosBreed = (IB - 10) / dozenPerRij;
    const doosHoog = 30;

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
      doc.roundedRect(x, yR, 26, doosHoog - 4, 2, 2, 'FD');
      doc.setLineDashPattern([], 0);

      if (opgelost) {
        // OPLOSSING: beeld groen omkaderd in het plakvak
        plaatsEmoji(doc, w.beeld, x + 13, yR + (doosHoog - 4) / 2, 18);
        doc.setDrawColor(KLEUR_OPL_R, KLEUR_OPL_G, KLEUR_OPL_B);
        doc.setLineWidth(0.6);
        doc.roundedRect(x, yR, 26, doosHoog - 4, 2, 2);
      } else {
        // Klein "plak hier"-teken in vak
        doc.setFontSize(7);
        doc.setTextColor(220, 180, 100);
        doc.text('plak hier', x + 13, yR + (doosHoog - 4) / 2 + 1, { align: 'center' });
      }

      // Woord ernaast
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 50);
      doc.text(w.tekst, x + 30, yR + doosHoog / 2);
      doc.setFont('helvetica', 'normal');
    });

    tekenVoet(doc);
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
      plaatsEmoji(doc, beelden[i].beeld, M + 12, yR + 11, 14);

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
      plaatsEmoji(doc, g.item.beeld, x + beeldGr / 2, beeldenY + beeldGr / 2, beeldGr - 2);
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
      plaatsEmoji(doc, w.beeld, x + kaartBreed / 2, yR + kaartHoog / 2, 30);
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
      plaatsEmoji(doc, w.beeld, x + 6, yR + 6, 9);

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
    kleurkoppel: tekenKleurKoppel,
    woordzoeker: tekenWoordzoeker,
    kaartjes: tekenWoordkaartjes
  };

  function maakWerkblad(themaConfigs, opties) {
    return _genereerPDF(themaConfigs, opties, false);
  }

  function maakOplossingssleutel(themaConfigs, opties) {
    return _genereerPDF(themaConfigs, opties || {}, true);
  }

  function _genereerPDF(themaConfigs, opties, opgelost) {
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
    const vol = ['koppel','overschrijf','letter','omcirkel','zelfschrijven','kiesschrijf','knip','kleurkoppel','woordzoeker','kaartjes'];

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

  return { maakWerkblad, maakOplossingssleutel };
})();