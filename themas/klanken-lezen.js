// Klanken & lezen — auditief onderscheiden vóór er spelling aan gekoppeld wordt.
(() => {
  const specs = [
    ['a-kat','a','kort','a','midden','kat','dieren/kat.png'],['a-lam','a','kort','a','midden','lam','dieren/lam.png'],
    ['e-pen','e','kort','e','midden','pen','klas/pen.png'],['e-bed','e','kort','e','midden','bed','thuis/bed.png'],
    ['i-vis','i','kort','i','midden','vis','dieren/vis.png'],['i-kip','i','kort','i','midden','kip','dieren/kip.png'],
    ['o-bos','o','kort','o','midden','bos','dieren/bos.png'],['o-zon','o','kort','o','midden','zon','dieren/zon.png'],
    ['u-rug','u','kort','u','midden','rug','lichaam/rug.png'],['u-zus','u','kort','u','midden','zus','familie/zus.png'],
    ['aa-raam','aa','lang','aa','midden','raam','thuis/raam.png'],['aa-schaap','aa','lang','aa','midden','schaap','dieren/schaap.png'],
    ['ee-zee','ee','lang','ee','eind','zee','dieren/zee.png'],['ee-peer','ee','lang','ee','midden','peer','eten/peer.png'],
    ['oo-boom','oo','lang','oo','midden','boom','dieren/boom.png'],['oo-boos','oo','lang','oo','midden','boos','familie/boos.png'],
    ['uu-muur','uu','lang','uu','midden','muur','klanken/muur.png'],['uu-vuur','uu','lang','uu','midden','vuur','klanken/vuur.png'],
    ['oe-koe','oe','tweeteken','oe','eind','koe','dieren/koe.png'],['oe-stoel','oe','tweeteken','oe','midden','stoel','klas/stoel.png'],
    ['eu-deur','eu','tweeteken','eu','midden','deur','thuis/deur.png'],['eu-neus','eu','tweeteken','eu','midden','neus','lichaam/neus.png'],
    ['ui-muis','ui','tweeteken','ui','midden','muis','dieren/muis.png'],['ui-kruin','ui','tweeteken','ui','midden','kruin','dieren/kruin.png'],
    ['ie-fiets','ie','tweeteken','ie','midden','fiets','klanken/fiets.png'],['ie-koffie','ie','tweeteken','ie','eind','koffie','eten/koffie.png'],
    ['ei-geit','ei','tweeteken','ei','midden','geit','dieren/geit.png'],['ei-blij','ei','tweeteken','ij','eind','blij','familie/blij.png'],
    ['au-auto','au','tweeteken','au','begin','auto','klanken/auto.png'],['au-touw','au','tweeteken','ou','eind','touw','klanken/touw.png'],
    ['au-saus','au','tweeteken','au','midden','saus','klanken/saus.png'],['au-pauw','au','tweeteken','au','eind','pauw','klanken/pauw.png'],
    ['m-muis','m','medeklinker','m','begin','muis','dieren/muis.png'],['m-mama','m','medeklinker','m','begin','mama','familie/mama.png'],
    ['s-schaap','s','medeklinker','s','begin','schaap','dieren/schaap.png'],['s-stoel','s','medeklinker','s','begin','stoel','klas/stoel.png'],
    ['v-vis','v','medeklinker','v','begin','vis','dieren/vis.png'],['v-varken','v','medeklinker','v','begin','varken','dieren/varken.png'],
    ['l-leeuw','l','medeklinker','l','begin','leeuw','dieren/leeuw.png'],['l-lamp','l','medeklinker','l','begin','lamp','thuis/lamp.png'],
    ['r-regen','r','medeklinker','r','begin','regen','dieren/regen.png'],['r-rug','r','medeklinker','r','begin','rug','lichaam/rug.png'],
    ['b-boom','b','medeklinker','b','begin','boom','dieren/boom.png'],['b-boekentas','b','medeklinker','b','begin','boekentas','klas/boekentas.png'],
    ['k-kat','k','medeklinker','k','begin','kat','dieren/kat.png'],['k-kip','k','medeklinker','k','begin','kip','dieren/kip.png'],
    ['p-paard','p','medeklinker','p','begin','paard','dieren/paard.png'],['p-pen','p','medeklinker','p','begin','pen','klas/pen.png']
  ];
  const audio={a:'a',e:'e',i:'i',o:'o',u:'u',aa:'aa',ee:'ee',oo:'oo',uu:'uu',oe:'oe',eu:'eu',ui:'ui',ie:'ie',ei:'ei',au:'au',m:'mmm',s:'sss',v:'vvv',l:'lll',r:'rrr',b:'b',k:'k',p:'p'};
  const voorbeeld={a:'jas',e:'pet',i:'pit',o:'sok',u:'bus',aa:'maan',ee:'teen',oo:'roos',uu:'buur',oe:'boek',eu:'beuk',ui:'huis',ie:'dier',ei:'trein',au:'blauw',m:'maan',s:'sok',v:'vork',l:'lepel',r:'roos',b:'bus',k:'koe',p:'peer'};
  const items=specs.map(([id,klank,soort,spelling,positie,tekst,picto])=>({id:`kl-${id}`,niveau:'basis',categorie:`${soort}-${klank}`,tekst,kort:tekst,picto,beeld:'🔊',klank,klankSoort:soort,spelling,positie,klankLabel:`/${klank}/`,klankAudio:audio[klank],klankVoorbeeld:voorbeeld[klank]}));
  const onderdeel=(groep,klank,naam)=>({id:`${groep}-${klank}`,groep,naam,icoon:groep==='kort'?'🔸':groep==='lang'?'➖':groep==='tweeteken'?'🔗':'🔤',uitleg:`Luister naar de klank /${klank}/.`,categorieen:[`${groep}-${klank}`]});
  window.THEMA_KLANKEN_LEZEN={
    id:'klanken-lezen',type:'klanken',categorie:'klanken',naam:'Klanken & lezen',emoji:'🔤',kleur:'#7B4BC4',niveaus:['basis'],categorieen:[...new Set(items.map(it=>it.categorie))],
    leeronderdeelGroepen:[{id:'kort',naam:'Korte klanken',uitleg:'a, e, i, o en u'},{id:'lang',naam:'Lange klanken',uitleg:'aa, ee, oo en uu'},{id:'tweeteken',naam:'Tweetekenklanken',uitleg:'oe, eu, ui, ie, ei/ij en au/ou'},{id:'medeklinker',naam:'Medeklinkers',uitleg:'Klanken aan het begin van een woord'}],
    leeronderdelen:[...['a','e','i','o','u'].map(k=>onderdeel('kort',k,`Korte klank /${k}/`)),...['aa','ee','oo','uu'].map(k=>onderdeel('lang',k,`Lange klank /${k}/`)),...['oe','eu','ui','ie'].map(k=>onderdeel('tweeteken',k,`Tweetekenklank /${k}/`)),onderdeel('tweeteken','ei','Tweetekenklank /ei/ — ei of ij'),onderdeel('tweeteken','au','Tweetekenklank /au/ — au of ou'),...['m','s','v','l','r','b','k','p'].map(k=>onderdeel('medeklinker',k,`Medeklinker /${k}/`))],
    klankContrasten:{a:['aa'],aa:['a'],e:['ee'],ee:['e'],o:['oo'],oo:['o'],u:['uu'],uu:['u','oe'],oe:['uu'],ui:['eu'],eu:['ui'],i:['ie'],ie:['i']},
    klankLeerlijn:true,standaardOefenvormen:{luisteren:['klank-uitluisteren','klank-in-woord']},items
  };
})();
