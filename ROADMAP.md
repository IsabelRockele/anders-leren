# 🗺️ Roadmap — Anders Leren

Overzicht van alles wat besproken is en in welke volgorde we het bouwen. Per item: wat het is, waarom het nuttig is, en eventuele technische notities.

---

## ✅ Klaar

- **Drie survival-thema's** (Klas, Speelplaats, Heen en terug) met inhoud
- **Splitsing Cijfers / Kleuren / Vormen** in aparte thema's
- **Nieuw startscherm** met "Begin hier"-zone bovenaan en andere thema's onderaan
- **Robuuste thema-loader** die crash voorkomt als een bestand ontbreekt
- **Vlaams als voorkeurstaal** in de stem-engine (audio.js)
- **Vier-stappen-flow per thema** (stap 3) — Leer / Speel / Slim leren / Toon wat je kan
- **Slim Leren = luister-en-herken** (stap 4) — audio-naar-beeld met hint-knop
- **Vier speltypes** (stap 5): Klikspel, Memory met luidspreker, Verbinden met slepen+klikken, Snelheid (30 sec timer)

---

## 🚧 In opbouw — volgorde van uitwerking

### Stap 3 — Vier-stappen-flow per thema (NU AAN DE BEURT)
Elk thema krijgt 4 duidelijke stappen in één detailpagina:
1. 👀 Leer de woorden — bestaande Kijk & luister
2. 🎮 Speel met de woorden — komt in stap 5 (binnenkort-badge nu)
3. 🦓 Slim leren — luister-en-herken (komt in stap 4)
4. ⭐ Toon wat je kan — bestaande Toets

Werkblad blijft als losse knop onderaan, voor de juf.

### Stap 4 — Slim Leren = luister-en-herken
Geen tekst-naar-tekst meer maar audio-naar-beeld:
- Kind hoort het woord uitgesproken
- Kiest uit 4 beelden (geen tekst)
- "Hoor opnieuw"-knop altijd zichtbaar
- "Hint"-knop toont woord even tekstueel als het te moeilijk is

### Stap 5 — "Speel met de woorden" ✅ KLAAR
Vier speltypes voor afwisseling:
- ✅ Klikspel (kind klikt het juiste woord onder een beeld)
- ✅ Memory (woord-beeld paren, met luidspreker op woord-kaart)
- ✅ Verbinden (drag & drop lijntjes trekken + fallback klik-klik)
- ✅ Snelheid (30 seconden, hoeveel kan je halen?)

**Mogelijke uitbreiding later (in volgende sessie):**
- 🧩 Beeld-puzzel — beeld in 4 stukjes, sleep terug
- ⌨️ Luister-en-typ — kind typt eerste letter van woord
- 🎈 Ballonnen — woorden stijgen op, klik juiste voor hij weg is

### Stap 6 — Spaced repetition over thema's heen
Bij oefenen, slim leren en toets worden 20% van de items uit eerder afgeronde thema's bijgemengd. Voorrang voor woorden die nog niet stevig zitten. Voorkomt dat oude woorden vergeten geraken.

### Stap 7 — Zinnen-tab herstructureren
Onderscheid tussen:
- 💬 **Wat ik zelf zeg** (productieve zinnen — "Mag ik naar het toilet?")
- 👂 **Wat ik hoor** (receptieve zinnen — "Ga zitten, kinderen")

Twee aparte secties met eigen oefenvormen.

### Stap 8 — Hulpkaartjes (vaste sjablonen)
Printbare A5-kaartjes met 6 woorden + pictogrammen:
- Rekentaal (+ − = > <) — eerste sjabloon
- Klastaal (basis-instructies)
- Hulpvragen
- Cijfers 1-20

PDF, Vlaamse standaarden, klaar om uit te knippen en op de bank te plakken.

### Stap 9 — Hulpkaartjes (persoonlijk)
Leerkracht-paneel: knop "Maak hulpkaartje voor Mohammed" → automatisch op basis van moeilijke woorden van dat specifieke kind. Leerkracht kan selecteren/deselecteren voor het printen.

### Stap 10 — Leerkracht-instellingen (lokaal)
- Stem-keuze (Vlaams / Nederlands / automatisch) met "Hoor demo"-knop
- Standaardwoorden verbergen ("lat" verbergen voor Nederlandse leerkracht)
- Eigen woorden toevoegen ("lineaal" met emoji-keuze)
- Eigen zinnen toevoegen ("Hang je jas aan de kapstok" voor jouw klasritueel)

Alles opgeslagen in localStorage van het leerkracht-paneel — geen accounts nodig nog.

### Stap 11 — Leerkracht-accounts
Firebase Authentication met:
- Google login (snel, geen paswoord nodig)
- Email + paswoord (voor wie geen Google heeft)
- Vergeten-paswoord-flow

Bij eerste login wordt bestaande localStorage-data automatisch naar het account gemigreerd. Elke leerkracht apart (architectuur A); school-accounts kunnen later komen als scholen erom vragen.

---

## 💭 Ideeën voor later (na stap 11)

### Foto-upload voor eigen pictogrammen
Leerkracht uploadt eigen foto's voor woorden:
- Foto van *het* rekenboek dat de klas effectief gebruikt
- Foto van *de* speelplaats van de school
- Maakt de tool écht herkenbaar voor het kind

**Technische notities:**
- Cloud opslag (Firebase Storage) of lokaal (IndexedDB)?
- Hangt af van welke account-architectuur we gebruiken
- Per kind / per leerkracht / per school?
- Vraag: vervangen of toevoegen naast standaard?

**Kostenanalyse (bij verkoop €60/leerkracht/jaar):**
- 50 foto's × 200KB = 10MB per leerkracht
- Firebase Storage: €0.003/leerkracht/jaar
- Firestore reads (kind opent foto's): ~€2.20/leerkracht/jaar
- Totaal: ~€2.20/leerkracht/jaar = 3.6% van verkoopprijs
- **Conclusie: ruim haalbaar binnen €60-prijspunt**

Pas zinvol nadat:
1. Pedagogische basis werkt (stappen 3-7)
2. Eigen-items-systeem in localStorage werkt (stap 10)
3. Accounts staan (stap 11) — anders kunnen foto's niet veilig gedeeld worden

### Kindrapport / opvolgingssysteem
PDF-rapport per kind dat leerkracht kan toevoegen aan eigen schoolrapport.
**Waarom dit commercieel sterk is:** transformeert tool van "oefenapp" naar "professioneel pedagogisch hulpmiddel". Bruikbaar in oudergesprekken, MDO-overleg, schoolinspectie.

**Inhoud per rapport:**
- Periode-overzicht (bv. januari-maart)
- Sterke punten met concrete voorbeelden ("Kent alle woorden uit Klas en Speelplaats")
- Aandachtspunten ("Heeft nog moeite met cijfers boven 5")
- Visueel: balkjes per thema, sterren, percentages
- Vrije tekst-veld voor leerkracht-observaties
- Optioneel: aanbevelingen voor thuis-oefening

**Technisch:**
- PDF via jsPDF (bestaande engine)
- Data komt uit voortgang.js + nieuwe leerkracht-notities veld
- Geen extra cloudkosten, alleen meer Firestore writes als notities opgeslagen worden

Past in **stap 12 (rapport)** — na pedagogische basis.

### Huistaken-systeem
Leerkracht zet "huistaken" klaar; kind doet ze thuis via QR-code.

**Pedagogische bedenking:** veel OKAN-scholen geven bewust geen huiswerk omdat thuiscontext niet altijd geschikt is. Doelgroep is kleiner dan het lijkt.

**Technische bedenking:** lijkt simpel maar is verraderlijk:
- Hoe weten we of kind het écht zelf deed (niet ouder)?
- Wat als kind geen WiFi thuis heeft?
- Privacy: gegevens van minderjarigen
- Voltooiing-tracking: wat is "klaar"?

**Light-versie eerst (stap 13):**
- Leerkracht plaatst weekmarkering "deze week: oefen Klas-thema"
- Kind ziet bij volgende login: "Juf vraagt: oefen Klas vandaag!"
- Geen tracking of verplichting
- Als dit te weinig is → zwaardere versie met tracking

Pas zinvol na rapport-feature (stap 12).

### Foutbericht / nieuwsbericht voor leerkrachten
Aankondigingen van Juf Zisa zichtbaar in leerkracht-paneel ("nieuw thema beschikbaar", "let op: morgen onderhoud"). Kan via een gedeelde Firestore-collectie.

### Schoolaccounts (architectuur C)
Hybride: school-account met leerkracht-sub-accounts. Eigen woorden en taalvariant zijn schoolniveau, maar leerkracht ziet alleen eigen leerlingen.

Pas bouwen als meerdere scholen vragen om gedeelde instellingen.

### Ouder-track
Aparte ingang voor ouders die mee Nederlands leren. Andere woordenschat (oudergesprekken, schoolafspraken, ophalen). Met QR-flow van kind-app naar ouder-app.

### Toetsresultaten exporteren
Leerkracht kan voortgangsrapport per kind als PDF afdrukken voor oudergesprek.

### Schrijfoefeningen op tablet
Letters tekenen met de vinger, met begeleiding. Vereist canvas-tekenen + letterherkenning.

### Koppeling met Klasbord PRO
Eén login voor alle Juf Zisa-tools. Vereist eerst dat beide tools accounts gebruiken.

### Meer thema's
- Seizoenen
- Weer
- Sport
- Vervoer
- Beroepen
- Gezondheid (dokter, ziekte)

### Volwaardig Rekentaal-thema
Niet alleen als hulpkaartje, maar ook digitaal te oefenen in de tool zelf. Met de juiste bewerkingsoefening erbij.

---

## 📌 Notities & beslissingen

### Pedagogiek
- **Eerst leren, dan herhalen** — niet meteen testen op nieuwe woorden
- **Volgorde binnen thema is vast, tussen thema's is vrij** — kind kan kiezen welk thema, maar binnen een thema moeten ze stap 1 doen voor stap 4
- **Variatie houdt motivatie** — daarom alle thema's altijd open, niet vergrendeld
- **Spaced repetition is cruciaal** — woorden moeten blijven terugkomen tot ze écht zitten

### Technisch
- **Firebase project**: `anders-leren-jufzisa` (Spark plan, gratis)
- **Hosting**: GitHub Pages op `isabelrockele.github.io/anders-leren`
- **Firestore-structuur kinderen**: `/kinderen/{code}` met voortgang per thema/item
- **localStorage voor instellingen** waar mogelijk, Firestore alleen voor wat gedeeld moet worden
- **Geen verloren werk-principe**: nieuwe features bouwen we bovenop wat staat, niet ipv

### Inhoud
- **Vlaams Nederlands als basis** — patatten, frieten, kleedje, drinkbus, brooddoos, lat, pennenzak
- **Nederlandse variant later** als iemand uit Nederland de tool koopt — via stap 10 (eigen items) of accounts
- **Inhoud verfijnen kan altijd** — bij intensief gebruik blijken sommige woorden/zinnen niet te passen, dan aanpassen we de bron

---

*Laatst bijgewerkt: tijdens stap 2 (nieuw startscherm voltooid). Volgende: stap 3 — vier-stappen-flow per thema.*
