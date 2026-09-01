// Thema: Leren en opdrachten — instructietaal voor 1ste en 2de leerjaar
(function(){
  const P='instructies/';
  const specs=[
    // Luisteren en reageren
    ['kijken','basis','luisteren','kijken','Kijk naar het bord.'],['luisteren','basis','luisteren','luisteren','Luister naar de opdracht.'],
    ['zeggen','basis','luisteren','zeggen','Zeg het antwoord.'],['aanwijzen','basis','luisteren','aanwijzen','Wijs de juiste afbeelding aan.'],
    ['kiezen','basis','luisteren','kiezen','Kies het juiste antwoord.'],
    // Op papier
    ['omcirkelen','basis','papier','omcirkelen','Omcirkel de appel.'],['onderstrepen','basis','papier','onderstrepen','Onderstreep het woord.'],
    ['doorstrepen','uitbreiding','papier','doorstrepen','Doorstreep wat fout is.'],['aankruisen','basis','papier','aankruisen','Kruis het juiste vakje aan.'],
    ['kleuren','basis','papier','kleuren','Kleur de cirkel rood.'],['tekenen','basis','papier','tekenen','Teken een huis.'],
    ['schrijven','basis','papier','schrijven','Schrijf het woord op de lijn.'],['invullen','uitbreiding','papier','invullen','Vul het ontbrekende woord in.'],
    ['verbinden','basis','papier','verbinden','Verbind het woord met de afbeelding.'],['uitknippen','uitbreiding','papier','uitknippen','Knip het kaartje uit.'],
    ['plakken','uitbreiding','papier','plakken','Plak het kaartje in het juiste vak.'],
    // Plaats en richting
    ['boven','basis','plaats','boven','De bal is boven de doos.'],['onder','basis','plaats','onder','De bal is onder de doos.'],
    ['naast','basis','plaats','naast','De bal ligt naast de doos.'],['tussen','basis','plaats','tussen','De bal ligt tussen de dozen.'],
    ['voor','uitbreiding','plaats','voor','Het kind staat voor de stoel.'],['achter','uitbreiding','plaats','achter','Het kind staat achter de stoel.'],
    ['links','uitbreiding','plaats','links','Kijk naar links.'],['rechts','uitbreiding','plaats','rechts','Kijk naar rechts.'],
    // Volgorde en vergelijken
    ['eerst','basis','volgorde','eerst','Doe dit eerst.'],['daarna','basis','volgorde','daarna','Doe dit daarna.'],
    ['laatste','basis','volgorde','als laatste','Doe dit als laatste.'],['sorteren','uitbreiding','volgorde','sorteren','Sorteer de voorwerpen in twee groepen.'],
    ['hetzelfde','uitbreiding','vergelijken','hetzelfde','Deze vormen zijn hetzelfde.'],['anders','uitbreiding','vergelijken','anders','Eén vorm is anders.'],
    ['meer','basis','vergelijken','meer','Hier zijn meer appels.'],['minder','basis','vergelijken','minder','Hier zijn minder appels.'],
    ['evenveel','uitbreiding','vergelijken','evenveel','In beide groepen zijn er evenveel.'],['rangschikken','uitbreiding','volgorde','rangschikken','Rangschik van klein naar groot.'],
    // Rekentaal
    ['plus','basis','rekentaal','plus','Plus betekent erbij.'],['min','basis','rekentaal','min','Min betekent eraf.'],
    ['samen','basis','rekentaal','samen','Hoeveel zijn er samen?'],['antwoord','basis','rekentaal','het antwoord','Schrijf het antwoord in het vak.'],
    ['groter-dan','uitbreiding','rekentaal','groter dan','Vijf is groter dan twee.'],['kleiner-dan','uitbreiding','rekentaal','kleiner dan','Twee is kleiner dan vijf.'],
    ['gelijk-aan','uitbreiding','rekentaal','is gelijk aan','Drie plus twee is gelijk aan vijf.'],['tellen','basis','rekentaal','tellen','Tel de schijfjes.'],
    ['som','uitbreiding','rekentaal','de som','Bereken de som.'],['verschil','uitbreiding','rekentaal','het verschil','Bereken het verschil.'],
    ['verdelen','verdieping','rekentaal','verdelen','Verdeel de sterren eerlijk.'],['groepjes-maken','verdieping','rekentaal','groepjes maken','Maak drie gelijke groepjes.']
  ];
  const beeldAlias={};
  const items=specs.map(([id,niveau,categorie,tekst,zin])=>({
    id,niveau,categorie,tekst,kort:tekst,beeld:'📘',picto:P+(beeldAlias[id]||id)+'.png',zin,
    zinsdelen:[{tekst:'Jij',rol:'wie'},{tekst:tekst,rol:'doet'}]
  }));
  window.THEMA_WOORDEN_INSTRUCTIES={
    id:'w-instructies',type:'woorden',naam:'Leren en opdrachten',emoji:'🧭',kleur:'#167D6B',
    niveaus:['basis','uitbreiding','verdieping'],categorieen:['luisteren','papier','plaats','volgorde','vergelijken','rekentaal'],
    leeronderdelen:[
      {id:'begrijpen',naam:'Kijk, luister en antwoord',icoon:'👂',uitleg:'Begrijp wat de leerkracht vraagt.',categorieen:['luisteren']},
      {id:'papier',naam:'Werken op papier',icoon:'✏️',uitleg:'Omcirkel, verbind, knip, plak en schrijf.',categorieen:['papier']},
      {id:'plaats',naam:'Plaats en richting',icoon:'🧭',uitleg:'Boven, onder, naast, tussen, links en rechts.',categorieen:['plaats']},
      {id:'volgorde',naam:'Volgorde en sorteren',icoon:'🔢',uitleg:'Eerst, daarna, als laatste en rangschikken.',categorieen:['volgorde']},
      {id:'rekenen',naam:'Rekentaal',icoon:'🧮',uitleg:'Plus, min, samen, meer, minder en verschil.',categorieen:['rekentaal','vergelijken']}
    ],
    instructieOpdrachten:[
      {id:'op-omcirkel',tekst:'Omcirkel de appel.',actie:'omcirkelen',doel:'appel'},
      {id:'op-onderstreep',tekst:'Onderstreep het woord boom.',actie:'onderstrepen',doel:'boom'},
      {id:'op-doorstreep',tekst:'Doorstreep de wolk.',actie:'doorstrepen',doel:'wolk'},
      {id:'op-kruis',tekst:'Kruis de ster aan.',actie:'aankruisen',doel:'ster'},
      {id:'op-kleur',tekst:'Kleur de cirkel rood.',actie:'kleuren',doel:'cirkel'},
      {id:'op-verbind',tekst:'Verbind de twee gelijke vormen.',actie:'verbinden',doel:'gelijk'}
    ],
    visueleOefening:'instructietaal',items
  };
})();
