// Thema Familie & gevoelens: herkennen, begrijpen, aanwijzen en korte zinnen bouwen.
(() => {
  const specs = [
    ['mama','familie','de mama','mama','👩','Dit is mijn mama.',[['Dit','wie'],['is','doet'],['mijn mama','wat']]],
    ['papa','familie','de papa','papa','👨','Dit is mijn papa.',[['Dit','wie'],['is','doet'],['mijn papa','wat']]],
    ['oma','familie','de oma','oma','👵','Mijn oma is lief.',[['Mijn oma','wie'],['is','doet'],['lief','hoe']]],
    ['opa','familie','de opa','opa','👴','Mijn opa vertelt een verhaal.',[['Mijn opa','wie'],['vertelt','doet'],['een verhaal','wat']]],
    ['broer','familie','de broer','broer','👦','Mijn broer speelt met mij.',[['Mijn broer','wie'],['speelt','doet'],['met mij','wat']]],
    ['zus','familie','de zus','zus','👧','Mijn zus lacht.',[['Mijn zus','wie'],['lacht','doet']]],
    ['tante','familie','de tante','tante','👩','Mijn tante komt op bezoek.',[['Mijn tante','wie'],['komt','doet'],['op bezoek','waar']]],
    ['nonkel','familie','de nonkel','nonkel','👨','Mijn nonkel zwaait.',[['Mijn nonkel','wie'],['zwaait','doet']]],
    ['neef','familie','de neef','neef','👦','Mijn neef speelt met mij.',[['Mijn neef','wie'],['speelt','doet'],['met mij','wat']]],
    ['nicht','familie','de nicht','nicht','👧','Mijn nicht komt spelen.',[['Mijn nicht','wie'],['komt spelen','doet']]],
    ['baby','familie','de baby','baby','👶','De baby lacht.',[['De baby','wie'],['lacht','doet']]],
    ['blij','gevoelens','blij','blij','😀','Ik ben blij.',[['Ik','wie'],['ben','doet'],['blij','hoe']]],
    ['bang','gevoelens','bang','bang','😨','Ik ben bang.',[['Ik','wie'],['ben','doet'],['bang','hoe']]],
    ['boos','gevoelens','boos','boos','😡','Ik ben boos.',[['Ik','wie'],['ben','doet'],['boos','hoe']]],
    ['verdrietig','gevoelens','verdrietig','verdrietig','😢','Ik ben verdrietig.',[['Ik','wie'],['ben','doet'],['verdrietig','hoe']]],
    ['verlegen','gevoelens','verlegen','verlegen','😳','Ik ben verlegen.',[['Ik','wie'],['ben','doet'],['verlegen','hoe']]],
    ['moe','gevoelens','moe','moe','😴','Ik ben moe.',[['Ik','wie'],['ben','doet'],['moe','hoe']]]
  ];
  const items = specs.map(([id,categorie,tekst,kort,beeld,zin,delen]) => ({
    id,niveau:'basis',categorie,tekst,kort,beeld,
    picto:`familie/${id}.png`, zinPicto:`picto/familie/${id}.png`, zin,
    zinsdelen:delen.map(([tekst,rol])=>({tekst,rol}))
  }));
  const visueleTweelingen = {
    broer:['neef'], neef:['broer'],
    zus:['nicht'], nicht:['zus']
  };
  items.forEach(item => {
    if (visueleTweelingen[item.id]) item.visueelVerwarrendMet = visueleTweelingen[item.id];
  });

  window.THEMA_WOORDEN_FAMILIE = {
    id:'w-familie',type:'woorden',naam:'Familie & gevoelens',emoji:'👨‍👩‍👧',kleur:'#9D4EDD',
    niveaus:['basis'],categorieen:['familie','gevoelens'],visueleOefening:'vertelplaat-thema',
    vertelplaat:{
      titel:'Vertelplaat: samen met de familie',beeld:'vertelplaten/familie-en-gevoelens.png',
      alt:'Een diverse familie samen in de woonkamer met kinderen die verschillende gevoelens tonen',
      werkbladItems:['mama','papa','oma','opa','baby','tante','nonkel','blij','bang','boos','verdrietig','moe'],
      hotspots:[
        {id:'vp-mama',itemId:'mama',woord:'de mama',x:8,y:25,rol:'wie'},
        {id:'vp-papa',itemId:'papa',woord:'de papa',x:21,y:25,rol:'wie'},
        {id:'vp-baby',itemId:'baby',woord:'de baby',x:13,y:29,rol:'wie'},
        {id:'vp-oma',itemId:'oma',woord:'de oma',x:35,y:35,rol:'wie'},
        {id:'vp-opa',itemId:'opa',woord:'de opa',x:45,y:35,rol:'wie'},
        {id:'vp-tante',itemId:'tante',woord:'de tante',x:65,y:23,rol:'wie'},
        {id:'vp-nonkel',itemId:'nonkel',woord:'de nonkel',x:77,y:23,rol:'wie'},
        {id:'vp-boos',itemId:'boos',woord:'boos',x:15,y:61,rol:'hoe'},
        {id:'vp-blij',itemId:'blij',woord:'blij',x:35,y:62,rol:'hoe'},
        {id:'vp-bang',itemId:'bang',woord:'bang',x:56,y:62,rol:'hoe'},
        {id:'vp-verdrietig',itemId:'verdrietig',woord:'verdrietig',x:68,y:63,rol:'hoe'},
        {id:'vp-verlegen',itemId:'verlegen',woord:'verlegen',x:80,y:63,rol:'hoe'},
        {id:'vp-moe',itemId:'moe',woord:'moe',x:92,y:72,rol:'hoe'},
        {id:'vp-zin-baby',zin:'De mama draagt de baby.',x:11,y:33,rol:'doet'},
        {id:'vp-zin-oma',zin:'De oma zit in de zetel.',x:38,y:42,rol:'doet'},
        {id:'vp-zin-blij',zin:'Het meisje is blij.',x:34,y:68,rol:'hoe'},
        {id:'vp-zin-bang',zin:'De jongen is bang.',x:56,y:69,rol:'hoe'},
        {id:'vp-zin-moe',zin:'De jongen is moe.',x:91,y:79,rol:'hoe'}
      ],
      bouwZinnen:[
        [['De mama','wie'],['draagt','doet'],['de baby','wat']],
        [['De oma','wie'],['zit','doet'],['in de zetel','waar']],
        [['Het meisje','wie'],['is','doet'],['blij','hoe']],
        [['De jongen','wie'],['is','doet'],['bang','hoe']],
        [['Het kind','wie'],['is','doet'],['verdrietig','hoe']],
        [['De jongen','wie'],['is','doet'],['moe','hoe']]
      ].map(zin=>zin.map(([tekst,rol])=>({tekst,rol})))
    },
    items
  };
})();
