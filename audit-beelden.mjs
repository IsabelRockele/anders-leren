import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const project = import.meta.dirname;
const themaMap = path.join(project, 'themas');
globalThis.window = {};

for (const naam of fs.readdirSync(themaMap).filter(n => n.endsWith('.js')).sort()) {
  await import(pathToFileURL(path.join(themaMap, naam)).href + '?audit=' + Date.now());
}

const themaResultaten = [];
for (const thema of Object.values(globalThis.window)) {
  if (!thema || !Array.isArray(thema.items)) continue;
  const beeldGroepen = new Map();
  const items = thema.items.map(item => {
    const bron = item.foto || item.picto || '';
    const verwacht = bron ? path.join(project, bron.startsWith('assets/') ? bron : path.join('picto', bron)) : '';
    const zinsbron = item.zinPicto || '';
    const zinsbestand = zinsbron ? path.join(project, zinsbron) : '';
    const fallback = item.beeld || '';
    if (!beeldGroepen.has(fallback)) beeldGroepen.set(fallback, []);
    beeldGroepen.get(fallback).push(item.id);
    return {
      id:item.id, tekst:item.tekst, soort:item.soort || 'woord', afbeelding:bron || null,
      bestandBestaat:!!verwacht && fs.existsSync(verwacht), emojiFallback:fallback || null,
      zin:item.zin || null, zinsafbeelding:zinsbron || null,
      zinsbestandBestaat:!!zinsbestand && fs.existsSync(zinsbestand),
      aandacht:[!bron?'geen-png':null,bron&&!fs.existsSync(verwacht)?'bestand-ontbreekt':null,item.zin&&!zinsbron?'zin-zonder-zinsbeeld':null].filter(Boolean)
    };
  });
  themaResultaten.push({
    id:thema.id, naam:thema.naam, type:thema.type, aantal:items.length,
    png:items.filter(i=>i.bestandBestaat).length, zonderPng:items.filter(i=>!i.afbeelding).length,
    zinnen:items.filter(i=>i.zin).length, zinsbeelden:items.filter(i=>i.zinsbestandBestaat).length,
    dubbeleFallbacks:[...beeldGroepen.entries()].filter(([beeld,ids])=>beeld&&ids.length>1).map(([beeld,ids])=>({beeld,ids})),
    items
  });
}

const totaal=themaResultaten.reduce((s,t)=>({themas:s.themas+1,items:s.items+t.aantal,png:s.png+t.png,zonderPng:s.zonderPng+t.zonderPng,zinnen:s.zinnen+t.zinnen,zinsbeelden:s.zinsbeelden+t.zinsbeelden}),{themas:0,items:0,png:0,zonderPng:0,zinnen:0,zinsbeelden:0});
const rapport={
  gemaaktOp:new Date().toISOString(),
  betekenis:{'geen-png':'alleen emoji; nog geen gecontroleerde PNG','bestand-ontbreekt':'afbeeldingspad bestaat, maar bestand ontbreekt','zin-zonder-zinsbeeld':'woordbeeld wordt nog gebruikt in plaats van een volledige scène'},
  oefendekking:{woordbeeld:['woorden ontdekken','klikspel','memory','verbinden','snelheid beeld-woord','snelheid luister-beeld','taken','woordwerkbladen'],zinsbeeld:['zin begrijpen','spreken bij beeld','zinnen knippen en plakken','zinswerkbladen']},
  totaal,themas:themaResultaten
};
const uitvoer=path.join(project,'beeld-audit.json');
fs.writeFileSync(uitvoer,JSON.stringify(rapport,null,2)+'\n');
console.log(JSON.stringify(totaal));
console.log(uitvoer);
