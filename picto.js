// =================================================================
//  picto.js — PNG-illustraties met emoji-fallback
//
//  Gebruik in plaats van rechtstreeks item.beeld in HTML te plaatsen.
//
//  Picto.html(item, opties)
//    → string met <img> wanneer item.picto bestaat,
//      anders <span> met de emoji uit item.beeld.
//      Als de PNG niet kan laden, switcht hij automatisch naar de emoji.
//
//  Opties:
//    klasse:  extra CSS-klasse voor de wrapper-span
//    grootte: getal in px (gebruikt voor beide: img-hoogte én emoji-font-size)
//    alt:     alternatieve tekst (default item.kort of item.tekst)
//
//  De image-tag krijgt een onerror die het <img> vervangt door een
//  <span> met de emoji — zo werkt de fallback zonder JS-state, en je
//  ziet meteen wanneer een PNG ontbreekt (handig tijdens uitbouw).
// =================================================================

window.Picto = (function() {

  // Cache welke pictos al getest zijn — voorkomt dat we 30 keer hetzelfde
  // ontbrekende bestand opvragen tijdens één sessie.
  const _bestaatCache = new Map(); // pad → boolean | Promise<boolean>

  // Test eenmalig of een PNG bestaat (voor PDF-rendering, niet voor HTML).
  function bestaat(pad) {
    if (_bestaatCache.has(pad)) return Promise.resolve(_bestaatCache.get(pad));
    const p = new Promise(resolve => {
      const img = new Image();
      img.onload = () => { _bestaatCache.set(pad, true); resolve(true); };
      img.onerror = () => { _bestaatCache.set(pad, false); resolve(false); };
      img.src = 'picto/' + pad;
    });
    _bestaatCache.set(pad, p);
    return p;
  }

  // Globale fallback-handler. Wordt door <img onerror="Picto.fallback(this)"> aangeroepen
  // wanneer de PNG niet kan laden. Vervangt het <img>-element door een <span> met de emoji.
  function fallback(imgEl) {
    if (!imgEl) return;
    const emoji = imgEl.dataset.emoji || '';
    const klasse = imgEl.dataset.fallbackKlasse || 'picto-emoji';
    const grootte = imgEl.dataset.fallbackGrootte;
    const span = document.createElement('span');
    span.className = klasse;
    if (grootte) {
      span.style.fontSize = grootte + 'px';
      span.style.lineHeight = '1';
    }
    span.textContent = emoji;
    if (imgEl.parentNode) imgEl.parentNode.replaceChild(span, imgEl);
  }

  // Helper: HTML-attribute escapen
  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Genereer HTML voor een item — img met fallback naar emoji.
  // Volgorde:
  //   1. item.foto (URL, bv. uit Firebase Storage) → directe afbeelding
  //   2. item.picto (relatief pad, bv. 'klas/juf.png') → uit basispakket
  //   3. item.beeld (emoji) → fallback
  function html(item, opties) {
    opties = opties || {};
    const klasse = opties.klasse || '';
    const grootte = opties.grootte || null;
    const alt = opties.alt || item.kort || item.tekst || '';

    // Geen foto, geen picto? Direct een emoji-span teruggeven.
    if (!item.foto && !item.picto) {
      const styleAttr = grootte ? ` style="font-size:${grootte}px;line-height:1"` : '';
      return `<span class="picto-emoji ${klasse}"${styleAttr}>${_esc(item.beeld || '')}</span>`;
    }

    // Bron bepalen: foto wint van picto
    const src = item.foto ? _esc(item.foto) : ('picto/' + _esc(item.picto));

    // Wel foto/picto-veld → img-tag. Bij fout zwemt onerror naar Picto.fallback,
    // die alle nodige data uit data-* attributen leest.
    const fallbackKlasse = ('picto-emoji ' + klasse).trim();
    const styleAttr = grootte ? ` style="height:${grootte}px;width:auto"` : '';
    const grootteAttr = grootte ? ` data-fallback-grootte="${grootte}"` : '';

    return `<img src="${src}" alt="${_esc(alt)}" class="picto-img ${klasse}"${styleAttr}` +
      ` data-emoji="${_esc(item.beeld || '')}" data-fallback-klasse="${_esc(fallbackKlasse)}"${grootteAttr}` +
      ` onerror="Picto.fallback(this)">`;
  }

  // Voor plekken waar een DOM-element nodig is in plaats van string.
  function element(item, opties) {
    const wrap = document.createElement('span');
    wrap.innerHTML = html(item, opties);
    return wrap.firstChild;
  }

  return { html, element, bestaat, fallback };

})();
