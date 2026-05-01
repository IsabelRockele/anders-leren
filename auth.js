// =================================================================
//  auth.js — Code-login systeem
//
//  Werking:
//  - Leerkracht maakt codes aan in leerkracht.html (vb. ZEBRA-4829).
//  - Kind tikt code in op startscherm → wordt onthouden in localStorage.
//  - Voortgang wordt opgeslagen in Firestore onder document /kinderen/{code}.
//  - Geen e-mail, geen wachtwoord, geen persoonlijke data → AVG-vriendelijk.
// =================================================================

window.Auth = (function() {
  const SLEUTEL_CODE = 'andersleren_code';
  const SLEUTEL_NAAM = 'andersleren_naam';
  let huidigeCode = null;
  let huidigeNaam = null;

  // ------------------- Code valideren -------------------
  function geldigeCode(code) {
    if (!code) return false;
    const opgeschoond = code.trim().toUpperCase();
    // Format: ZEBRA-1234 of 4-12 alfanumeriek
    return /^[A-Z0-9]{2,8}-?[A-Z0-9]{2,8}$/.test(opgeschoond) ||
           /^[A-Z0-9]{4,12}$/.test(opgeschoond);
  }

  function normaliseer(code) {
    return code.trim().toUpperCase();
  }

  // ------------------- Login / logout -------------------
  async function login(code) {
    if (!geldigeCode(code)) {
      throw new Error('De code is niet juist. Vraag het aan je juf.');
    }
    const codeNorm = normaliseer(code);

    if (window.FIREBASE_INGESTELD) {
      // Controleer of code bestaat in Firestore
      const bestaat = await Voortgang.codeBestaat(codeNorm);
      if (!bestaat) {
        throw new Error('Deze code bestaat niet. Vraag het aan je juf.');
      }
      const data = await Voortgang.haalNaamOp(codeNorm);
      huidigeNaam = data?.naam || '';
    } else {
      huidigeNaam = '';
    }

    huidigeCode = codeNorm;
    localStorage.setItem(SLEUTEL_CODE, codeNorm);
    if (huidigeNaam) localStorage.setItem(SLEUTEL_NAAM, huidigeNaam);
  }

  function logout() {
    huidigeCode = null;
    huidigeNaam = null;
    localStorage.removeItem(SLEUTEL_CODE);
    localStorage.removeItem(SLEUTEL_NAAM);
  }

  function ingelogd() {
    return huidigeCode !== null;
  }

  function getCode() {
    return huidigeCode;
  }

  function getNaam() {
    return huidigeNaam || '';
  }

  // ------------------- Auto-login bij start -------------------
  // Probeer bestaande code uit localStorage of URL te gebruiken
  async function probeerAutoLogin() {
    // 1. Eerst kijken of er een code in de URL staat (?code=ZEBRA-4829)
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    if (urlCode && geldigeCode(urlCode)) {
      try {
        await login(urlCode);
        // URL opschonen zodat code niet zichtbaar blijft
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } catch (e) {
        console.warn('Auto-login via URL mislukt:', e.message);
      }
    }

    // 2. Anders kijken of er een code in localStorage zit
    const opgeslagenCode = localStorage.getItem(SLEUTEL_CODE);
    if (opgeslagenCode && geldigeCode(opgeslagenCode)) {
      try {
        await login(opgeslagenCode);
        return true;
      } catch (e) {
        // Code in localStorage werkt niet meer (bv. verwijderd door juf)
        logout();
      }
    }

    return false;
  }

  return {
    geldigeCode,
    normaliseer,
    login,
    logout,
    ingelogd,
    getCode,
    getNaam,
    probeerAutoLogin
  };
})();
