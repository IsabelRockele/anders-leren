# Picto-folder — woordenschat-illustraties

Hier komen de eigen 2D-vectorillustraties die de emoji's vervangen in de app
en in de werkbladen-PDF.

## Bestandsnaam-conventie

```
picto/<thema-id>/<item-id>.png
```

Voorbeeld:
- `picto/klas/juf.png`
- `picto/klas/boekentas.png`
- `picto/klas/kleurpotloden.png`

De `thema-id` en `item-id` staan in de thema-bestanden (`themas/woorden-klas.js`, ...).

## Stijl-richtlijnen

- **Vlakke 2D vectorillustratie**, geen 3D, geen schaduwen
- **Dikke zwarte omlijning** (≈ 4–6 px equivalent in 512×512)
- **Witte achtergrond** (volledig ondoorzichtig — anders krijg je rare randen
  in de PDF)
- **Vierkant formaat**, bij voorkeur 512×512 px
- **Kindvriendelijk**, vrolijke kleuren, herkenbaar voor anderstalige
  nieuwkomers

## Werking — fallback naar emoji

Het systeem werkt met een fallback: ontbreekt een PNG of laadt hij niet,
dan wordt automatisch de emoji uit het item-bestand getoond. Je hoeft
dus niet alle pictos in één keer te maken — voeg ze toe in je tempo
en het kind ziet ondertussen de emoji.

In de PDF werkt het op dezelfde manier: bestaande PNG's worden meegenomen,
ontbrekende pictos vallen terug op de emoji-rendering.

## Tijdens uitbouw — handig

Open de browser-console om te zien welke pictos ontbreken:

```
DevTools → Console: 404-fouten zijn ontbrekende PNG's.
```

## Voorbeeldprompt voor DALL-E (Nederlands)

> Maak een vlakke 2D-vectorillustratie van een [voorwerp] op een witte
> achtergrond. Dikke zwarte omlijning, vrolijke vlakke kleuren, geen
> schaduwen, geen 3D-effect. Kindvriendelijke stijl voor lesmateriaal,
> centraal gepositioneerd, vierkant formaat.
