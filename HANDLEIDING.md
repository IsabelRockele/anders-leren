# 📘 Handleiding — Anders Leren

Een tool voor anderstalige nieuwkomers, gebouwd door Juf Zisa.

---

## 🗂️ Wat zit er in dit pakket?

```
anders-leren/
├── index.html              ← Kind-app (login + leeromgeving)
├── leerkracht.html         ← Jouw paneel (codes, QR, overzicht)
├── style.css               ← Styling voor alles
├── firebase-config.js      ← ⚠️ HIER moet je je eigen Firebase-config invullen
├── firestore-rules.txt     ← Security rules (kopiëren naar Firebase Console)
├── auth.js                 ← Code-login systeem
├── voortgang.js            ← Voortgangsopslag
├── audio.js                ← Spraakuitvoer
├── app.js                  ← Hoofdlogica kind-app
├── leerkracht.js           ← Logica leerkracht-paneel
├── pdf-engine.js           ← Werkbladen genereren
├── themas/                 ← 6 woordenthema's + 4 zinsthema's
└── picto/                  ← Lege map — hier kan je later eigen Canva-illustraties zetten
```

---

## 🚀 Setup in 6 stappen

### Stap 1 — Maak een nieuw Firebase-project

1. Ga naar https://console.firebase.google.com
2. Klik **"Project toevoegen"** → noem het bv. `anders-leren-jufzisa`
3. Google Analytics is **niet** nodig — uitzetten mag.

### Stap 2 — Activeer Firestore

1. In het menu links: **Build → Firestore Database**
2. Klik **"Database aanmaken"**
3. Kies **"Start in productiemodus"** (we plakken straks zelf de rules)
4. Locatie: `eur3 (europe-west)` — voor België ideaal
5. Klik **"Maken"**

### Stap 3 — Plak de security rules

1. In Firestore: tabblad **"Regels"**
2. Open `firestore-rules.txt` uit dit pakket
3. Kopieer de inhoud van het `rules_version = '2';` blok
4. Plak in het Firebase-paneel, klik **"Publiceren"**

### Stap 4 — Maak een Web-app aan

1. Op de Firebase-projectpagina (homepage): klik het **`</>`** icoontje (Web-app toevoegen)
2. Geef een nickname zoals `anders-leren-web`
3. **Niet** "Firebase Hosting" aanvinken (we gebruiken GitHub Pages)
4. Klik **"App registreren"**
5. Je krijgt nu een config-blok te zien dat eruitziet als:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "anders-leren-jufzisa.firebaseapp.com",
  projectId: "anders-leren-jufzisa",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Stap 5 — Kopieer de config in `firebase-config.js`

Open `firebase-config.js` en vervang elke `VERVANG_MET_...` regel met de waarde die Firebase je gaf:

```javascript
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",                                    // ← van Firebase
  authDomain: "anders-leren-jufzisa.firebaseapp.com",     // ← van Firebase
  projectId: "anders-leren-jufzisa",                      // ← van Firebase
  storageBucket: "anders-leren-jufzisa.appspot.com",      // ← van Firebase
  messagingSenderId: "1234567890",                        // ← van Firebase
  appId: "1:123:web:abc..."                               // ← van Firebase
};
```

### Stap 6 — Deploy via GitHub Pages

Net zoals bij je andere tools:
1. VS Code openen, deze map naar je repo slepen (bv. een nieuwe repo `anders-leren`)
2. GitHub Desktop → commit → push
3. In de GitHub-repo: **Settings → Pages → Deploy from branch (main)**
4. Live URL: `https://jufzisa.github.io/anders-leren/`

---

## 👩‍🏫 Eerste gebruik

1. Ga naar `https://jufzisa.github.io/anders-leren/leerkracht.html`
2. Klik **"Code genereren"** + voer een naam in (bv. "Mohammed") → **"Toevoegen"**
3. Klik **"📱 QR"** bij die leerling om de QR-code te zien
4. Print de QR mee naar huis OF geef de code mondeling/op een briefje
5. Het kind tikt de code in op `https://jufzisa.github.io/anders-leren/`

---

## ⭐ Sterrensysteem

| Sterren | Wanneer |
|---------|---------|
| ☆☆☆ | Nog niet getest |
| ⭐☆☆ | 1 keer juist beantwoord |
| ⭐⭐☆ | 3 keer juist op rij |
| ⭐⭐⭐ | 5 keer juist op rij = **gekend** |

Het kind ziet sterren in de "Lees"-modus en een procent in "Mijn voortgang".
Jij ziet alle details in het leerkracht-paneel onder "Wie kan wat?".

---

## 🎨 Pictogrammen later vervangen

De map `picto/` is nu leeg. In de werkbladen worden voorlopig emoji's gebruikt als pictogrammen. Wanneer je in Canva eigen pictogrammen tekent (bv. een kindvriendelijke versie van 👁️ "kijken"), kan je deze later inbouwen door:

- PNG's exporteren met transparante achtergrond (256x256px)
- Bestandsnaam = wat ze voorstellen, bv. `picto-kijken.png`, `picto-schrijven.png`
- In `pdf-engine.js`: vervang in functie `tekenPictoInstructie` de `doc.text(p, ...)` regel door `doc.addImage('picto/picto-kijken.png', ...)`

Geef me een seintje wanneer je de PNG's klaar hebt, dan bouw ik de switch in.

---

## 🔒 Privacy

- Geen e-mails, geen wachtwoorden, geen persoonlijke data
- Codes zijn anoniem — alleen jij weet welk kind welke code heeft
- Namen worden alleen in jouw paneel getoond, niet in de cloud-data van het kind
- Voortgangsdata: alleen welk woord juist/fout is

---

## 🛠️ Bekende limieten (zoals altijd bij jsPDF)

- Emoji's in PDF's worden niet altijd correct weergegeven door jsPDF (zelfde caveat als bij je andere tools). De meeste browsers tonen ze als kleurloze symbolen of vraagtekens. Wanneer je later eigen Canva-pictogrammen toevoegt, lost dit zich vanzelf op.
- Web Speech API (audio) werkt het best in Chrome/Edge op desktop en mobiel. Op iPad Safari werkt het, maar de stem klinkt iets anders.

---

## 🦓 Slim leren — autonome modus (v2)

Op het startscherm staat een grote oranje knop **"Begin!"** Daar hoeft het kind niets te kiezen — de tool beslist zelf wat het volgende woord is. Onder de motorkap zit een spaced-repetition-systeem dat met 6 prioriteiten werkt:

1. **Herhaling** — woord dat fout ging na een eerdere ster
2. **Verder leren** — gezien maar nog niet gekend
3. **Nieuw** — nog nooit gezien
4. **Oefenen (1 ster)** — eens correct gehad
5. **Bijna gekend (2 sterren)** — 3x op rij correct
6. **Opfrissen** — gekend, maar al >7 dagen niet gezien

Per item zijn er twee fases:
- **Kennismaken** (nieuwe woorden): kind ziet het beeld, hoort het woord en de zin, klikt "Ik snap het!"
- **Oefenen** (gekende/herhaal-woorden): meerkeuzevraag met 4 opties

Elke 5 juiste antwoorden op rij = een feestje (🎉🌟⭐🏆 op basis van streak-grootte).

## 📊 Niveau-structuur (v2)

Elk thema heeft 3 niveaus:
- **🌱 Basis** — eerste woorden die echt nodig zijn
- **🌿 Uitbreiding** — meer detail
- **🌳 Verdieping** — geavanceerd

Bij werkbladen kan je per niveau kiezen, of "alles door elkaar" voor herhalingsoefeningen.

## 💡 Volgende stappen (later)

- Eigen Canva-pictogrammen invoegen ipv emoji
- Meer thema's: seizoenen, weer, sport, vervoer
- Ouder-track: aparte ingang met thuis-zinnen voor ouders
- Schrijfoefeningen met letters tekenen op tablet
- Eventueel: koppeling met Klasbord PRO (zelfde leerkracht inloggen)

Veel succes! 🦓
— Claude
