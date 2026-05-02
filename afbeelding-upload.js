// =================================================================
//  afbeelding-upload.js — Foto's comprimeren en uploaden
//
//  Werkflow:
//    1. Leerkracht kiest een foto (file input of camera)
//    2. We comprimeren in de browser tot max 600x600 px JPEG, kwaliteit 85
//       Dit brengt 3-5 MB foto's terug naar ~50-100 KB
//    3. Upload naar Firebase Storage onder pad woorden/{themaId}/{itemId}.jpg
//    4. Download-URL wordt opgeslagen in het woordenbeheer-document
//
//  Zonder compressie zou Firebase Storage snel duur worden:
//    100 woorden x 5 MB x 25 leerlingen die downloaden = 12.5 GB/maand
//  Met compressie:
//    100 woorden x 80 KB x 25 leerlingen = 200 MB/maand (binnen gratis tier)
// =================================================================

window.AfbeeldingUpload = (function() {

  const MAX_DIM = 600;        // pixels (langste zijde)
  const KWALITEIT = 0.85;     // JPEG-kwaliteit
  const MAX_BYTES = 800 * 1024; // 800 KB veiligheidslimiet na compressie

  // --------------------------------------------------------------
  //  Stap 1: File → HTMLImageElement
  // --------------------------------------------------------------
  function _bestandNaarImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Kon afbeelding niet lezen.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Kon bestand niet inlezen.'));
      reader.readAsDataURL(file);
    });
  }

  // --------------------------------------------------------------
  //  Stap 2: Image comprimeren naar canvas → Blob
  // --------------------------------------------------------------
  function _comprimeer(img) {
    return new Promise((resolve, reject) => {
      // Bereken nieuwe afmetingen — langste zijde max MAX_DIM
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_DIM) {
          height = Math.round(height * MAX_DIM / width);
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width = Math.round(width * MAX_DIM / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Witte achtergrond — voor PNG's met transparantie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compressie mislukt.'));
          if (blob.size > MAX_BYTES) {
            return reject(new Error(
              `Foto is na compressie nog ${(blob.size / 1024).toFixed(0)} KB. ` +
              `Probeer een andere foto.`
            ));
          }
          resolve(blob);
        },
        'image/jpeg',
        KWALITEIT
      );
    });
  }

  // --------------------------------------------------------------
  //  Stap 3: Blob uploaden naar Firebase Storage
  // --------------------------------------------------------------
  async function _uploadNaarStorage(blob, padInStorage) {
    if (!window.firebase || !window.firebase.storage) {
      throw new Error('Firebase Storage is niet geladen. Check leerkracht.html.');
    }
    const storage = window.firebase.storage();
    const ref = storage.ref().child(padInStorage);
    const snapshot = await ref.put(blob, { contentType: 'image/jpeg' });
    return await snapshot.ref.getDownloadURL();
  }

  // --------------------------------------------------------------
  //  Publieke functie: alles in één
  // --------------------------------------------------------------
  /**
   * @param {File} file        bestand van een <input type="file">
   * @param {string} themaId   bv. 'w-klas'
   * @param {string} itemId    bv. 'juf' of 'eigen-1234'
   * @returns {Promise<{url: string, grootte: number}>}
   */
  async function uploadFoto(file, themaId, itemId) {
    if (!file) throw new Error('Geen bestand gekozen.');
    if (!file.type.startsWith('image/')) {
      throw new Error('Dit is geen afbeelding. Kies een foto (jpg, png, ...).');
    }
    // 10 MB hard limit op origineel — anders is de compressie zwaar
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Foto is te groot (max 10 MB voor compressie).');
    }

    const img = await _bestandNaarImage(file);
    const blob = await _comprimeer(img);

    // Cache-busting: voeg timestamp toe zodat oude foto vervangen wordt
    // (Firebase Storage overschrijft op zelfde pad — URL blijft hetzelfde,
    //  maar browsers cachen oude versie. Daarom geven we steeds nieuw pad.)
    const tijd = Date.now();
    const veiligItemId = String(itemId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const pad = `woorden/${themaId}/${veiligItemId}-${tijd}.jpg`;

    const url = await _uploadNaarStorage(blob, pad);
    return { url, grootte: blob.size };
  }

  /**
   * Verwijder een foto uit Storage op basis van de URL.
   * Niet-kritiek: als het mislukt, gewoon doorgaan.
   */
  async function verwijderFoto(url) {
    if (!url || !url.startsWith('http')) return;
    if (!window.firebase || !window.firebase.storage) return;
    try {
      const ref = window.firebase.storage().refFromURL(url);
      await ref.delete();
    } catch (e) {
      console.warn('Foto verwijderen mislukt (negeerbaar):', e);
    }
  }

  return { uploadFoto, verwijderFoto };
})();
