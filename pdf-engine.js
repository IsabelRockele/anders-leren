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
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function tekenKop(doc, thema, oefenTitel) {
    // Brand-strook bovenaan
    doc.setFillColor(255, 248, 238);
    doc.rect(0, 0, PB, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(232, 159, 15);
    doc.text('JUF ZISA · ANDERS LEREN', M, 10);

    doc.setFontSize(17);
    doc.setTextColor(45, 42, 50);
    doc.text(`${thema.emoji}  ${thema.naam}`, M, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(oefenTitel, PB - M, 20, { align: 'right' });

    // Naam-veld
    doc.setDrawColor(220, 210, 190);
    doc.setLineWidth(0.3);
    doc.line(M, 28, PB - M, 28);

    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text('Naam:', M, 33);
    doc.setDrawColor(180, 180, 180);
    doc.line(M + 14, 33, M + 70, 33);
    doc.text('Datum:', M + 80, 33);
    doc.line(M + 95, 33, PB - M, 33);

    return 40;
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

    // Picto's met pijltjes
    const pictoY = y + 11;
    let pictoX = startX + 30;
    const pictoSpacing = 18;

    doc.setFontSize(13);
    doc.setTextColor(45, 42, 50);
    pictos.forEach((p, i) => {
      doc.text(p, pictoX, pictoY);
      if (i < pictos.length - 1) {
        // Pijltje na deze picto
        doc.setFontSize(10);
        doc.setTextColor(200, 180, 140);
        doc.text('→', pictoX + 8, pictoY - 1);
        doc.setFontSize(13);
        doc.setTextColor(45, 42, 50);
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
  function tekenKoppel(doc, thema) {
    let y = tekenKop(doc, thema, 'Oefening: koppel');
    y = tekenPictoInstructie(doc, y, ['👁️', '🔗']);

    const items = schud(thema.items).slice(0, 6);
    const links = schud(items);
    const rechts = schud(items);

    const kB = IB / 2 - 10;
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
      doc.setFontSize(20);
      doc.setTextColor(45, 42, 50);
      doc.text(links[i].beeld, xL + kB / 2, yR + 14, { align: 'center' });

      // Verbindingspunten
      doc.setFillColor(45, 42, 50);
      doc.circle(xL + kB + 2, yR + 11, 1, 'F');

      // Woord rechts
      doc.roundedRect(xR, yR, kB, 22, 3, 3, 'FD');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(rechts[i].tekst, xR + kB / 2, yR + 14, { align: 'center' });
      doc.setFont('helvetica', 'normal');

      doc.setFillColor(45, 42, 50);
      doc.circle(xR - 2, yR + 11, 1, 'F');
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 2: Schrijf na
  //  Picto: 👁️ → ✏️ (kijk en schrijf)
  // ---------------------------------------------------------------
  function tekenOverschrijf(doc, thema) {
    let y = tekenKop(doc, thema, 'Oefening: schrijf na');
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
      doc.setFontSize(14);
      doc.setTextColor(45, 42, 50);
      doc.text(w.beeld, x + 9, yR + 12, { align: 'center' });

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
    });

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 3: Welke letter mist?
  //  Picto: 👁️ → ✏️ (kijk en schrijf)
  // ---------------------------------------------------------------
  function tekenLetterMist(doc, thema) {
    let y = tekenKop(doc, thema, 'Oefening: vul aan');
    y = tekenPictoInstructie(doc, y, ['👁️', '✏️']);

    // Bij zinnen: enkel "kort" gebruiken (geen volledige zin)
    const items = schud(thema.items).slice(0, 6);
    const kB = IB / 2 - 5;
    const rH = 36;

    items.forEach((w, i) => {
      const kol = i % 2;
      const rij = Math.floor(i / 2);
      const x = M + kol * (kB + 10);
      const yR = y + rij * rH;

      const wK = w.kort || w.tekst;
      let geldig = [];
      for (let k = 1; k < wK.length - 1; k++) {
        if (wK[k] !== ' ' && /[a-zA-Zàáâäèéêëìíîïòóôöùúûü]/.test(wK[k])) {
          geldig.push(k);
        }
      }
      if (geldig.length === 0) geldig = [Math.floor(wK.length / 2)];
      const idx = geldig[Math.floor(Math.random() * geldig.length)];
      const ml = wK[idx];
      const wM = wK.substring(0, idx) + '_' + wK.substring(idx + 1);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, yR, kB, 28, 3, 3, 'FD');

      doc.setFontSize(20);
      doc.setTextColor(45, 42, 50);
      doc.text(w.beeld, x + 12, yR + 18, { align: 'center' });

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(wM, x + 26, yR + 17);
      doc.setFont('helvetica', 'normal');

      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`(${ml})`, x + kB - 2, yR + 25, { align: 'right' });
    });

    // Tip onderaan voor leerkracht
    const yEind = y + Math.ceil(items.length / 2) * rH + 5;
    if (yEind < PH - 25) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('💡 De ontbrekende letter staat klein rechts naast het woord (oplossingshintje).',
               M, yEind);
    }

    tekenVoet(doc);
  }

  // ---------------------------------------------------------------
  //  OEFENING 4: Omcirkel het juiste woord
  //  Picto: 👁️ → ⭕ (kijk en omcirkel)
  // ---------------------------------------------------------------
  function tekenOmcirkel(doc, thema) {
    let y = tekenKop(doc, thema, 'Oefening: omcirkel');
    y = tekenPictoInstructie(doc, y, ['👁️', '⭕']);

    const items = schud(thema.items).slice(0, 6);
    const rH = 30;

    items.forEach((w, i) => {
      const yR = y + i * rH;

      // Beeld
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.roundedRect(M, yR, 22, 22, 3, 3, 'FD');
      doc.setFontSize(20);
      doc.setTextColor(45, 42, 50);
      doc.text(w.beeld, M + 11, yR + 15, { align: 'center' });

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
      doc.setFontSize(18);
      doc.setTextColor(180, 180, 180); // licht zodat kind kan inkleuren
      doc.text(w.beeld, x + 13, yR + 17, { align: 'center' });

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
  //  HOOFDFUNCTIE
  // ---------------------------------------------------------------
  function maakWerkblad(thema, opties) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Filter items op niveau (indien gespecificeerd en niet 'alles')
    let gefilterdeItems = thema.items;
    if (opties.niveau && opties.niveau !== 'alles') {
      gefilterdeItems = thema.items.filter(it => it.niveau === opties.niveau);
      // Fallback: als er te weinig items zijn op dat niveau, neem alles
      if (gefilterdeItems.length < 6) gefilterdeItems = thema.items;
    }

    // Maak een tijdelijk thema-object met de gefilterde items
    const themaGefilterd = { ...thema, items: gefilterdeItems };

    let eerste = true;
    const add = () => { if (!eerste) doc.addPage(); eerste = false; };

    if (opties.koppel)      { add(); tekenKoppel(doc, themaGefilterd); }
    if (opties.overschrijf) { add(); tekenOverschrijf(doc, themaGefilterd); }
    if (opties.letter)      { add(); tekenLetterMist(doc, themaGefilterd); }
    if (opties.omcirkel)    { add(); tekenOmcirkel(doc, themaGefilterd); }
    if (opties.zoek)        { add(); tekenKleurCode(doc, themaGefilterd); }

    const niveauSuffix = opties.niveau && opties.niveau !== 'alles' ? `-${opties.niveau}` : '';
    const bestandsnaam = `werkblad-${thema.id}${niveauSuffix}-jufzisa.pdf`;
    doc.save(bestandsnaam);
  }

  return { maakWerkblad };
})();
