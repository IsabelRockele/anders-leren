// Thema Dieren & natuur: herkennen, begrijpen, aanwijzen en eenvoudige zinnen bouwen.
(() => {
  const specs = [
    ['koe','boerderijdieren','de koe','koe','🐮','De koe eet gras.',[['De koe','wie'],['eet','doet'],['gras','wat']]],
    ['paard','boerderijdieren','het paard','paard','🐴','Het paard loopt in de wei.',[['Het paard','wie'],['loopt','doet'],['in de wei','waar']]],
    ['geit','boerderijdieren','de geit','geit','🐐','De geit staat bij het hek.',[['De geit','wie'],['staat','doet'],['bij het hek','waar']]],
    ['schaap','boerderijdieren','het schaap','schaap','🐑','Het schaap heeft witte wol.',[['Het schaap','wie'],['heeft','doet'],['witte wol','wat']]],
    ['varken','boerderijdieren','het varken','varken','🐷','Het varken rolt in de modder.',[['Het varken','wie'],['rolt','doet'],['in de modder','waar']]],
    ['kip','boerderijdieren','de kip','kip','🐔','De kip pikt graan.',[['De kip','wie'],['pikt','doet'],['graan','wat']]],
    ['kat','huisdieren','de kat','kat','🐱','De kat zit op het deken.',[['De kat','wie'],['zit','doet'],['op het deken','waar']]],
    ['hond','huisdieren','de hond','hond','🐶','De hond zit naast de kat.',[['De hond','wie'],['zit','doet'],['naast de kat','waar']]],
    ['muis','huisdieren','de muis','muis','🐭','De muis is klein.',[['De muis','wie'],['is','doet'],['klein','hoe']]],
    ['konijn','huisdieren','het konijn','konijn','🐰','Het konijn springt op het gras.',[['Het konijn','wie'],['springt','doet'],['op het gras','waar']]],
    ['vogel','huisdieren','de vogel','vogel','🐦','De vogel zit op een tak.',[['De vogel','wie'],['zit','doet'],['op een tak','waar']]],
    ['vis','waterdieren','de vis','vis','🐟','De vis zwemt in de vijver.',[['De vis','wie'],['zwemt','doet'],['in de vijver','waar']]],
    ['eend','waterdieren','de eend','eend','🦆','De eend zwemt op het water.',[['De eend','wie'],['zwemt','doet'],['op het water','waar']]],
    ['kikker','waterdieren','de kikker','kikker','🐸','De kikker zit op een blad.',[['De kikker','wie'],['zit','doet'],['op een blad','waar']]],
    ['leeuw','dierentuindieren','de leeuw','leeuw','🦁','De leeuw ligt op de rots.',[['De leeuw','wie'],['ligt','doet'],['op de rots','waar']]],
    ['tijger','dierentuindieren','de tijger','tijger','🐯','De tijger heeft zwarte strepen.',[['De tijger','wie'],['heeft','doet'],['zwarte strepen','wat']]],
    ['olifant','dierentuindieren','de olifant','olifant','🐘','De olifant heeft een lange slurf.',[['De olifant','wie'],['heeft','doet'],['een lange slurf','wat']]],
    ['giraf','dierentuindieren','de giraf','giraf','🦒','De giraf heeft een lange nek.',[['De giraf','wie'],['heeft','doet'],['een lange nek','wat']]],
    ['aap','dierentuindieren','de aap','aap','🐵','De aap hangt aan een touw.',[['De aap','wie'],['hangt','doet'],['aan een touw','waar']]],
    ['boom','planten','de boom','boom','🌳','De boom staat in het park.',[['De boom','wie'],['staat','doet'],['in het park','waar']]],
    ['bloem','planten','de bloem','bloem','🌸','De bloem is roze.',[['De bloem','wie'],['is','doet'],['roze','hoe']]],
    ['gras','planten','het gras','gras','🌿','Het gras is groen.',[['Het gras','wie'],['is','doet'],['groen','hoe']]],
    ['struik','planten','de struik','struik','🌳','De struik groeit naast de boom.',[['De struik','wie'],['groeit','doet'],['naast de boom','waar']]],
    ['blad','planten','het blad','blad','🍃','Het blad valt van de boom.',[['Het blad','wie'],['valt','doet'],['van de boom','waar']]],
    ['tak','planten','de tak','tak','🌿','De vogel zit op de tak.',[['De vogel','wie'],['zit','doet'],['op de tak','waar']]],
    ['zon','weer','de zon','zon','☀️','De zon schijnt in de lucht.',[['De zon','wie'],['schijnt','doet'],['in de lucht','waar']]],
    ['regen','weer','de regen','regen','🌧️','De regen valt uit de wolk.',[['De regen','wie'],['valt','doet'],['uit de wolk','waar']]],
    ['wolk','weer','de wolk','wolk','☁️','De wolk hangt in de lucht.',[['De wolk','wie'],['hangt','doet'],['in de lucht','waar']]],
    ['sneeuw','weer','de sneeuw','sneeuw','❄️','De sneeuw is wit.',[['De sneeuw','wie'],['is','doet'],['wit','hoe']]],
    ['wind','weer','de wind','wind','💨','De wind blaast de bladeren weg.',[['De wind','wie'],['blaast weg','doet'],['de bladeren','wat']]],
    ['bos','natuur','het bos','bos','🌲','In het bos staan veel bomen.',[['Veel bomen','wie'],['staan','doet'],['in het bos','waar']]],
    ['rivier','natuur','de rivier','rivier','🏞️','De rivier stroomt door het bos.',[['De rivier','wie'],['stroomt','doet'],['door het bos','waar']]],
    ['berg','natuur','de berg','berg','⛰️','De berg is hoog.',[['De berg','wie'],['is','doet'],['hoog','hoe']]],
    ['zee','natuur','de zee','zee','🌊','De zee ligt achter de bergen.',[['De zee','wie'],['ligt','doet'],['achter de bergen','waar']]],
    ['park','natuur','het park','park','🏞️','Wij wandelen in het park.',[['Wij','wie'],['wandelen','doet'],['in het park','waar']]],
    ['kalf','jonge-dieren','het kalf','kalf','🐄','Het kalf drinkt melk.',[['Het kalf','wie'],['drinkt','doet'],['melk','wat']]],
    ['veulen','jonge-dieren','het veulen','veulen','🐴','Het veulen loopt bij het paard.',[['Het veulen','wie'],['loopt','doet'],['bij het paard','waar']]],
    ['geitje','jonge-dieren','het geitje','geitje','🐐','Het geitje staat bij de geit.',[['Het geitje','wie'],['staat','doet'],['bij de geit','waar']]],
    ['lam','jonge-dieren','het lam','lam','🐑','Het lam loopt bij het schaap.',[['Het lam','wie'],['loopt','doet'],['bij het schaap','waar']]],
    ['big','jonge-dieren','de big','big','🐷','De big loopt bij het varken.',[['De big','wie'],['loopt','doet'],['bij het varken','waar']]],
    ['kuiken','jonge-dieren','het kuiken','kuiken','🐤','Het kuiken komt uit een ei.',[['Het kuiken','wie'],['komt','doet'],['uit een ei','waar']]],
    ['puppy','jonge-dieren','de puppy','puppy','🐶','De puppy speelt bij de hond.',[['De puppy','wie'],['speelt','doet'],['bij de hond','waar']]],
    ['kitten','jonge-dieren','het kitten','kitten','🐱','Het kitten ligt bij de kat.',[['Het kitten','wie'],['ligt','doet'],['bij de kat','waar']]],
    ['wortels','boomdelen','de wortels','wortels','🌱','De wortels zitten onder de grond.',[['De wortels','wie'],['zitten','doet'],['onder de grond','waar']]],
    ['stam','boomdelen','de stam','stam','🌳','De stam draagt de takken.',[['De stam','wie'],['draagt','doet'],['de takken','wat']]],
    ['schors','boomdelen','de schors','schors','🟫','De schors beschermt de stam.',[['De schors','wie'],['beschermt','doet'],['de stam','wat']]],
    ['kruin','boomdelen','de kruin','kruin','🌳','De kruin bestaat uit takken en bladeren.',[['De kruin','wie'],['bestaat','doet'],['uit takken en bladeren','wat']]],
    ['paddenstoel','paddenstoeldelen','de paddenstoel','paddenstoel','🍄','De paddenstoel groeit in het bos.',[['De paddenstoel','wie'],['groeit','doet'],['in het bos','waar']]],
    ['hoed','paddenstoeldelen','de hoed','hoed','🍄','De hoed zit boven op de paddenstoel.',[['De hoed','wie'],['zit','doet'],['boven op de paddenstoel','waar']]],
    ['plaatjes','paddenstoeldelen','de plaatjes','plaatjes','🍄','De plaatjes zitten onder de hoed.',[['De plaatjes','wie'],['zitten','doet'],['onder de hoed','waar']]],
    ['steel','paddenstoeldelen','de steel','steel','🍄','De steel draagt de hoed.',[['De steel','wie'],['draagt','doet'],['de hoed','wat']]],
    ['zwamvlok','paddenstoeldelen','de zwamvlok','zwamvlok','🍄','De zwamvlok groeit onder de grond.',[['De zwamvlok','wie'],['groeit','doet'],['onder de grond','waar']]]
  ];
  const uitbreidingCats = new Set(['jonge-dieren','boomdelen','paddenstoeldelen']);
  const items = specs.map(([id,categorie,tekst,kort,beeld,zin,delen]) => ({
    id,niveau:uitbreidingCats.has(categorie)?'uitbreiding':'basis',categorie,tekst,kort,beeld,picto:`dieren/${id}.png`,zin,
    zinsdelen:delen.map(([tekst,rol])=>({tekst,rol}))
  }));
  window.THEMA_WOORDEN_DIEREN = {
    id:'w-dieren',type:'woorden',naam:'Dieren & natuur',emoji:'🐾',kleur:'#2A9D8F',
    niveaus:['basis','uitbreiding'],categorieen:['boerderijdieren','huisdieren','waterdieren','dierentuindieren','planten','weer','natuur','jonge-dieren','boomdelen','paddenstoeldelen'],
    leeronderdelen:[
      {id:'basis',naam:'Basiswoorden',icoon:'🐾',uitleg:'Dieren, planten, weer en landschappen.',categorieen:['boerderijdieren','huisdieren','waterdieren','dierentuindieren','planten','weer','natuur']},
      {id:'jongen',naam:'Dieren en hun jongen',icoon:'🐣',uitleg:'Leer welk jong bij welk dier hoort.',itemIds:['koe','kalf','paard','veulen','geit','geitje','schaap','lam','varken','big','kip','kuiken','hond','puppy','kat','kitten']},
      {id:'ei-buik',naam:'Uit een ei of uit de buik?',icoon:'🥚',uitleg:'Luister, kijk en sorteer de dieren.',itemIds:['kip','kuiken','vogel','eend','kikker','vis','koe','kalf','paard','veulen','schaap','lam','varken','big','hond','puppy','kat','kitten']},
      {id:'boom',naam:'Delen van een boom',icoon:'🌳',uitleg:'Wortels, stam, schors, tak, blad en kruin.',itemIds:['boom','wortels','stam','schors','tak','blad','kruin']},
      {id:'paddenstoel',naam:'Delen van een paddenstoel',icoon:'🍄',uitleg:'Hoed, plaatjes, steel en zwamvlok.',categorieen:['paddenstoeldelen']}
    ],
    dierJongParen:[['koe','kalf'],['paard','veulen'],['geit','geitje'],['schaap','lam'],['varken','big'],['kip','kuiken'],['hond','puppy'],['kat','kitten']],
    geboorteGroepen:{
      'uit-een-ei':['kip','kuiken','vogel','eend','kikker','vis'],
      'uit-de-buik':['koe','kalf','paard','veulen','geit','geitje','schaap','lam','varken','big','hond','puppy','kat','kitten']
    },
    onderdelenPlaten:{
      boom:{beeld:'assets/delen-boom.png',itemIds:['wortels','stam','schors','tak','blad','kruin'],hotspots:{wortels:[50,86],stam:[50,62],schors:[55,60],tak:[32,37],blad:[20,33],kruin:[50,24]}},
      paddenstoel:{beeld:'assets/delen-paddenstoel.png',itemIds:['hoed','plaatjes','steel','zwamvlok'],hotspots:{hoed:[50,20],plaatjes:[68,36],steel:[50,61],zwamvlok:[50,87]}}
    },
    visueleOefening:'vertelplaat-thema',
    vertelplaat:{
      titel:'Vertelplaat: dieren in de natuur',beeld:'vertelplaten/dieren-en-natuur.png',
      alt:'Een park met boerderijdieren, huisdieren, vijverdieren, dierentuindieren, planten en natuur',
      werkbladItems:['koe','paard','geit','schaap','varken','kip','hond','kat','konijn','vogel','vis','eend','kikker','leeuw','tijger','olifant','giraf','aap','boom','bloem','gras','zon','wolk','bos','rivier','berg','zee'],
      hotspots:[
        ['boom',7,22,'wat'],['vogel',18,21,'wie'],['zon',27,12,'wat'],['wolk',62,13,'wat'],['berg',38,31,'waar'],['bos',24,36,'waar'],['rivier',40,44,'waar'],['zee',60,36,'waar'],
        ['koe',17,56,'wie'],['paard',27,55,'wie'],['geit',29,67,'wie'],['schaap',36,58,'wie'],['varken',44,59,'wie'],['kip',38,71,'wie'],['hond',59,66,'wie'],['kat',65,67,'wie'],['konijn',69,77,'wie'],
        ['eend',88,73,'wie'],['kikker',82,84,'wie'],['vis',89,91,'wie'],['olifant',75,29,'wie'],['giraf',82,25,'wie'],['leeuw',89,34,'wie'],['tijger',95,38,'wie'],['aap',96,21,'wie'],['bloem',20,86,'wat'],['gras',54,82,'wat']
      ].map(([itemId,x,y,rol])=>{const item=items.find(it=>it.id===itemId);return {id:`vp-${itemId}`,itemId,woord:item.tekst,x,y,rol};}).concat([
        {id:'vp-zin-koe',zin:'De koe eet gras.',x:16,y:64,rol:'doet'},
        {id:'vp-zin-vogel',zin:'De vogel zit op een tak.',x:16,y:28,rol:'doet'},
        {id:'vp-zin-hond',zin:'De hond zit naast de kat.',x:62,y:72,rol:'doet'},
        {id:'vp-zin-eend',zin:'De eend zwemt op het water.',x:88,y:79,rol:'doet'},
        {id:'vp-zin-aap',zin:'De aap hangt aan een touw.',x:94,y:27,rol:'doet'}
      ]),
      bouwZinnen:[
        [['De koe','wie'],['eet','doet'],['gras','wat']],
        [['De vogel','wie'],['zit','doet'],['op een tak','waar']],
        [['De hond','wie'],['zit','doet'],['naast de kat','waar']],
        [['De eend','wie'],['zwemt','doet'],['op het water','waar']],
        [['De aap','wie'],['hangt','doet'],['aan een touw','waar']],
        [['De rivier','wie'],['stroomt','doet'],['door het bos','waar']]
      ].map(zin=>zin.map(([tekst,rol])=>({tekst,rol})))
    },items
  };
})();
