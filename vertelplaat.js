// Vertelplaat in vier didactische stappen: ontdekken, luisteren, begrijpen, bouwen.
window.Vertelplaat=(function(){
  const rollen={wie:{label:'Wie?'},doet:{label:'Doet?'},waar:{label:'Waar?'},wanneer:{label:'Wanneer?'},wat:{label:'Wat?'},hoe:{label:'Hoe?'}};
  const standaardHotspots=[
    {id:'juf',woord:'de juf',x:37,y:28,rol:'wie'},{id:'bord',woord:'het bord',x:50,y:20,rol:'wat'},
    {id:'klok',woord:'de klok',x:70,y:13,rol:'wat'},{id:'deur',woord:'de deur',x:80,y:23,rol:'wat'},
    {id:'kapstok',woord:'de kapstok',x:92,y:22,rol:'wat'},{id:'boekentas',woord:'de boekentas',x:89,y:42,rol:'wat'},
    {id:'boek',woord:'het boek',x:17,y:58,rol:'wat'},{id:'potlood',woord:'het potlood',x:37,y:88,rol:'wat'},
    {id:'schrift',woord:'het schrift',x:53,y:61,rol:'wat'},{id:'schaar',woord:'de schaar',x:55,y:88,rol:'wat'},
    {id:'lijm',woord:'de lijm',x:62,y:88,rol:'wat'},{id:'vuilbak',woord:'de vuilbak',x:90,y:80,rol:'wat'},
    {id:'leest',woord:'lezen',x:11,y:48,rol:'doet',zin:'De jongen leest.'},
    {id:'neemt-boekentas',woord:'de boekentas nemen',x:84,y:40,rol:'doet',zin:'De jongen neemt zijn boekentas.'},
    {id:'hand',woord:'de hand opsteken',x:51,y:48,rol:'doet',zin:'Het meisje steekt haar hand op.'},
    {id:'samen',woord:'samenwerken',x:68,y:51,rol:'doet',zin:'De kinderen werken samen.'},
    {id:'schrijft',woord:'schrijven',x:42,y:25,rol:'doet',zin:'De juf schrijft op het bord.'}
  ];
  const standaardBouwZinnen=[
    [{tekst:'De jongen',rol:'wie'},{tekst:'leest',rol:'doet'},{tekst:'een boek',rol:'wat'}],
    [{tekst:'De jongen',rol:'wie'},{tekst:'neemt',rol:'doet'},{tekst:'zijn boekentas',rol:'wat'}],
    [{tekst:'Het meisje',rol:'wie'},{tekst:'steekt',rol:'doet'},{tekst:'haar hand op',rol:'wat'}],
    [{tekst:'De kinderen',rol:'wie'},{tekst:'werken',rol:'doet'},{tekst:'samen',rol:'hoe'}],
    [{tekst:'De juf',rol:'wie'},{tekst:'schrijft',rol:'doet'},{tekst:'op het bord',rol:'waar'}]
  ];
  const hulpzinnen=[
    {zin:'Mag ik naar het toilet?',situatie:'Als je naar het toilet moet.',beeld:'assets/hulpzinnen/mag-ik-naar-het-toilet.png'},
    {zin:'Mag ik drinken?',situatie:'Als je dorst hebt.',beeld:'assets/hulpzinnen/mag-ik-drinken.png'},
    {zin:'Ik heb een vraag.',situatie:'Als je iets wilt vragen.',beeld:'assets/hulpzinnen/ik-heb-een-vraag.png'},
    {zin:'Ik begrijp het niet.',situatie:'Als je iets niet begrijpt.',beeld:'assets/hulpzinnen/ik-begrijp-het-niet.png'},
    {zin:'Ik ben klaar.',situatie:'Als je werk af is.',beeld:'assets/hulpzinnen/ik-ben-klaar.png'}
  ];
  let hotspots=standaardHotspots,bouwZinnen=standaardBouwZinnen;
  let fase='ontdek',doel=null,zinIndex=0,gebouwd=[],bronThema=null,pogingen=0,antwoordVergrendeld=false;
  let oefenPool=[],fouteDoelen=new Set(),herhaalronde=false;
  const spreek=t=>{if(window.AudioEngine)AudioEngine.spreek(t,{snelheid:.86});};
  const schud=a=>a.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.x);

  function openVoorThema(thema){
    bronThema=thema;
    const plaat=thema&&thema.vertelplaat;
    hotspots=plaat&&Array.isArray(plaat.hotspots)&&plaat.hotspots.length?plaat.hotspots:standaardHotspots;
    bouwZinnen=plaat&&Array.isArray(plaat.bouwZinnen)&&plaat.bouwZinnen.length?plaat.bouwZinnen:standaardBouwZinnen;
    zinIndex=0;
    document.querySelectorAll('.scherm').forEach(s=>s.classList.remove('actief'));
    document.getElementById('scherm-vertelplaat').classList.add('actief');
    const alleenHulp=thema&&thema.visueleOefening==='hulpzinnen';
    document.getElementById('vp-scherm-titel').textContent=alleenHulp?'Zinnen die mij helpen':(plaat&&plaat.titel?plaat.titel:'Vertelplaat: in de klas');
    const plaatBeeld=document.querySelector('.vp-plaat');
    if(plaatBeeld){
      plaatBeeld.src=plaat&&plaat.beeld?plaat.beeld:'vertelplaten/in-de-klas.png';
      plaatBeeld.alt=plaat&&plaat.alt?plaat.alt:'Vertelplaat van een klas met leerlingen en een leerkracht';
    }
    document.querySelector('.vp-stappen').style.display=alleenHulp?'none':'';
    if(alleenHulp){
      document.querySelectorAll('.vp-stapvak, #vp-opdracht, .vp-plaat-wrap, #vp-gevonden, #vp-bouwvak').forEach(el=>el.style.display='none');
    }else{
      document.querySelector('.vp-plaat-wrap').style.display='block';
      document.querySelectorAll('.vp-stapvak').forEach(el=>el.style.display='');
      document.getElementById('vp-gevonden').style.display='none';
      document.getElementById('vp-opdracht').style.display='none';
      document.getElementById('vp-bouwvak').style.display='none';
    }
    document.querySelector('.vp-hulpsectie').style.display=alleenHulp?'block':'none';
    renderHulpzinnen();
    if(!alleenHulp)kiesFase('ontdek');
  }
  function sluit(){document.getElementById('scherm-vertelplaat').classList.remove('actief');if(bronThema&&typeof kiesThema==='function')kiesThema(bronThema);else document.getElementById('scherm-start').classList.add('actief');}
  function kiesFase(nieuw){fase=nieuw;document.getElementById('scherm-vertelplaat').classList.toggle('vp-bouw-actief',fase==='bouw');document.querySelectorAll('.vp-stapknop').forEach(b=>b.classList.toggle('actief',b.dataset.fase===fase));document.querySelectorAll('.vp-stapvak').forEach(v=>v.classList.remove('actief'));document.getElementById('vp-stap-'+fase).classList.add('actief');document.getElementById('vp-gevonden').style.display='none';document.getElementById('vp-opdracht').style.display=(fase==='zoekwoord'||fase==='zoekzin')?'grid':'none';document.getElementById('vp-bouwvak').style.display=fase==='bouw'?'block':'none';renderHotspots();if(fase==='zoekwoord'||fase==='zoekzin')startZoekronde();if(fase==='bouw')nieuweBouwzin(true);}
  function renderHotspots(gekozenHotspots){
    let zichtbaar=Array.isArray(gekozenHotspots)?gekozenHotspots:[];
    if(!zichtbaar.length){
      if(fase==='ontdek'||fase==='zoekwoord') zichtbaar=hotspots.filter(h=>!h.zin);
      else if(fase==='zoekzin') zichtbaar=hotspots.filter(h=>!!h.zin);
    }
    document.getElementById('vp-hotspots').innerHTML=zichtbaar.map(h=>`<button data-hotspot="${h.id}" class="vp-hotspot ${fase==='ontdek'?'vp-'+h.rol:'vp-zoekpunt'}" style="left:${h.x}%;top:${h.y}%" onclick="Vertelplaat.klikHotspot('${h.id}')" aria-label="Aanklikbare plaats op de vertelplaat"><span>${fase==='ontdek'?'+':'?'}</span></button>`).join('');
  }
  function zoekpuntenVoorDoel(){
    const alle=hotspots.filter(h=>fase==='zoekzin'?!!h.zin:!h.zin);
    if(!doel||alle.length<=6)return alle;
    const afstand=(a,b)=>Math.hypot((a.x-b.x)*1.15,a.y-b.y);
    const gekozen=[doel];
    // Vijf afleiders volstaan om het antwoord niet te verraden. Door telkens
    // minstens 13 procent afstand te bewaren, overlappen vraagtekens niet meer
    // rond bijvoorbeeld hoofd, gezicht en hand.
    schud(alle.filter(h=>h.id!==doel.id))
      .sort((a,b)=>afstand(b,doel)-afstand(a,doel))
      .forEach(h=>{if(gekozen.length<6&&gekozen.every(g=>afstand(h,g)>=13))gekozen.push(h);});
    // Bij een erg volle plaat kan de afstandsregel minder dan zes punten geven.
    // Vul dan aan met de verst verwijderde nog beschikbare plaats.
    if(gekozen.length<6){
      alle.filter(h=>!gekozen.some(g=>g.id===h.id))
        .sort((a,b)=>Math.min(...gekozen.map(g=>afstand(b,g)))-Math.min(...gekozen.map(g=>afstand(a,g))))
        .some(h=>{gekozen.push(h);return gekozen.length===6;});
    }
    return gekozen;
  }
  function klikHotspot(id){const h=hotspots.find(x=>x.id===id);if(!h)return;if(fase==='ontdek')toonWoord(h);else if(fase==='zoekwoord'||fase==='zoekzin')controleerPlaatKeuze(h);}
  function toonWoord(h){document.getElementById('vp-gevonden-woord').textContent=h.woord;const kaart=document.getElementById('vp-gevonden');kaart.className='vp-gevonden vp-rand-'+h.rol;kaart.style.display='flex';spreek(h.woord);}
  function hoorGevonden(){const woord=document.getElementById('vp-gevonden-woord').textContent;if(woord)spreek(woord);}
  function startZoekronde(){
    oefenPool=schud(hotspots.filter(h=>fase==='zoekzin'?!!h.zin:!h.zin));
    fouteDoelen=new Set();
    herhaalronde=false;
    volgendZoekdoel();
  }
  function volgendZoekdoel(){
    if(oefenPool.length===0){
      if(fouteDoelen.size>0){
        oefenPool=schud(hotspots.filter(h=>fouteDoelen.has(h.id)));
        fouteDoelen=new Set();
        herhaalronde=true;
      }else{
        toonRondeKlaar();
        return;
      }
    }
    doel=oefenPool.shift();
    // Toon een kleine, goed gespreide set. Zo blijft de plaat leesbaar op iPad,
    // terwijl er altijd voldoende afleiders zijn om het antwoord niet weg te geven.
    renderHotspots(zoekpuntenVoorDoel());
    const titel=herhaalronde?'Nog even oefenen':(fase==='zoekzin'?'Zoek wat bij deze zin past':'Zoek dit woord');
    const tekst=fase==='zoekzin'?doel.zin:doel.woord;
    zetOpdracht(titel,tekst);
    spreek(tekst);
  }
  function toonRondeKlaar(){
    doel=null;antwoordVergrendeld=true;
    document.getElementById('vp-hotspots').innerHTML='';
    const kaart=document.getElementById('vp-opdracht');
    kaart.classList.add('vp-ronde-klaar');
    kaart.querySelector('button').disabled=true;
    document.getElementById('vp-opdracht-titel').textContent='Alles gevonden!';
    document.getElementById('vp-opdracht-tekst').textContent='Knap gedaan.';
    document.getElementById('vp-opdracht-feedback').textContent='';
    spreek('Alles gevonden. Knap gedaan!');
  }
  function zetOpdracht(titel,tekst){pogingen=0;antwoordVergrendeld=false;document.querySelectorAll('.vp-hotspot').forEach(b=>{b.classList.remove('vp-juist','vp-hint','vp-fout');const teken=b.querySelector('span');if(teken)teken.textContent='?';});const kaart=document.getElementById('vp-opdracht');kaart.classList.remove('vp-nieuw','vp-ronde-klaar');kaart.querySelector('button').disabled=false;void kaart.offsetWidth;kaart.classList.add('vp-nieuw');document.getElementById('vp-opdracht-titel').textContent=titel;document.getElementById('vp-opdracht-tekst').textContent=tekst;document.getElementById('vp-opdracht-feedback').textContent='';}
  function hoorOpdracht(){if(doel)spreek(fase==='zoekzin'?doel.zin:doel.woord);}
  function controleerPlaatKeuze(h){if(antwoordVergrendeld)return;const fb=document.getElementById('vp-opdracht-feedback'),gekozen=document.querySelector(`[data-hotspot="${h.id}"]`),juist=document.querySelector(`[data-hotspot="${doel.id}"]`);if(h.id===doel.id){antwoordVergrendeld=true;gekozen.classList.add('vp-juist');gekozen.querySelector('span').textContent='✓';fb.textContent='Goed zo!';fb.className='vp-feedback goed';spreek('Goed zo!');setTimeout(volgendZoekdoel,1200);}else{pogingen++;fouteDoelen.add(doel.id);gekozen.classList.add('vp-fout');setTimeout(()=>gekozen.classList.remove('vp-fout'),500);if(pogingen===1){fb.textContent='Nog niet. Luister nog eens.';fb.className='vp-feedback probeer';hoorOpdracht();}else{fb.textContent='Kijk, hier knippert het juiste plaatsje.';fb.className='vp-feedback probeer';juist.classList.add('vp-hint');spreek('Kijk goed. Hier is het.');}}}

  function nieuweBouwzin(eerste){if(!eerste)zinIndex=(zinIndex+1)%bouwZinnen.length;gebouwd=[];const zin=bouwZinnen[zinIndex],doorElkaar=schud(zin.map((w,i)=>({...w,bron:i})));document.getElementById('vp-woordbank').innerHTML=doorElkaar.map(w=>`<button class="vp-woord vp-${w.rol}" draggable="true" ondragstart="Vertelplaat.sleepStart(event,${w.bron})" onclick="Vertelplaat.voegWoordToe(${w.bron})"><small>${rollen[w.rol].label}</small>${w.tekst}</button>`).join('');document.getElementById('vp-feedback').textContent='';renderZin();}
  function voegWoordToe(i){const w=bouwZinnen[zinIndex][i];if(!w||gebouwd.some(x=>x.bron===i))return;gebouwd.push({...w,bron:i});renderZin();}
  function sleepStart(e,i){e.dataTransfer.setData('text/plain',String(i));}
  function laatVallen(e){e.preventDefault();voegWoordToe(Number(e.dataTransfer.getData('text/plain')));}
  function verwijderWoord(i){gebouwd.splice(i,1);renderZin();}
  function renderZin(){const vak=document.getElementById('vp-zin');vak.innerHTML=gebouwd.length?gebouwd.map((w,i)=>`<button class="vp-woord vp-${w.rol}" onclick="Vertelplaat.verwijderWoord(${i})"><small>${rollen[w.rol].label}</small>${w.tekst}</button>`).join(''):'<span class="vp-zin-hulp">Sleep of klik de woorden in de goede volgorde.</span>';}
  function hoorGebouwdeZin(){if(gebouwd.length)spreek(gebouwd.map(w=>w.tekst).join(' ')+'.');}
  function controleer(){
    const juist=gebouwd.length===bouwZinnen[zinIndex].length&&gebouwd.map(x=>x.bron).join(',')===bouwZinnen[zinIndex].map((_,i)=>i).join(',');
    const fb=document.getElementById('vp-feedback');
    const feedback=juist?'Goed zo! De zin is goed gevormd.':'Nog niet. Probeer de woorden nog eens in een andere volgorde.';
    fb.textContent=feedback;
    fb.className='vp-feedback '+(juist?'goed':'probeer');
    spreek(feedback);
  }
  function renderHulpzinnen(){document.getElementById('vp-hulpzinnen').innerHTML=hulpzinnen.map((h,i)=>`<button class="vp-hulpkaart" onclick="Vertelplaat.hoorHulpzin(${i})"><img src="${h.beeld}" alt=""><span><strong>${h.zin}</strong><small>${h.situatie}</small></span><b>🔊</b></button>`).join('');}
  function hoorHulpzin(i){if(hulpzinnen[i])spreek(hulpzinnen[i].zin);}
  return {openVoorThema,sluit,kiesFase,klikHotspot,hoorGevonden,hoorOpdracht,nieuweBouwzin,voegWoordToe,sleepStart,laatVallen,verwijderWoord,hoorGebouwdeZin,controleer,hoorHulpzin};
})();
