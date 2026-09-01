// Klanken & lezen — auditief onderscheiden vóór er spelling aan gekoppeld wordt.
(() => {
  const specs = [
    ['a-kat','a','kort','a','midden','kat','dieren/kat.png'],['a-lam','a','kort','a','midden','lam','dieren/lam.png'],
    ['a-jas','a','kort','a','midden','jas','lichaam/jas.png'],['a-hand','a','kort','a','midden','hand','lichaam/hand.png'],['a-bad','a','kort','a','midden','bad','thuis/bad.png'],
    ['e-pen','e','kort','e','midden','pen','klas/pen.png'],['e-bed','e','kort','e','midden','bed','thuis/bed.png'],
    ['e-mes','e','kort','e','midden','mes','eten/mes.png'],['e-bel','e','kort','e','midden','bel','klas/bel.png'],['e-verf','e','kort','e','midden','verf','klas/verf.png'],
    ['i-vis','i','kort','i','midden','vis','dieren/vis.png'],['i-kip','i','kort','i','midden','kip','dieren/kip.png'],
    ['i-bril','i','kort','i','midden','bril','lichaam/bril.png'],['i-schrift','i','kort','i','midden','schrift','klas/schrift.png'],['i-wind','i','kort','i','midden','wind','dieren/wind.png'],
    ['o-bos','o','kort','o','midden','bos','dieren/bos.png'],['o-zon','o','kort','o','midden','zon','dieren/zon.png'],
    ['o-rok','o','kort','o','midden','rok','lichaam/rok.png'],['o-bord','o','kort','o','midden','bord','klas/bord.png'],['o-hond','o','kort','o','midden','hond','dieren/hond.png'],
    ['u-rug','u','kort','u','midden','rug','lichaam/rug.png'],['u-zus','u','kort','u','midden','zus','familie/zus.png'],
    ['u-muts','u','kort','u','midden','muts','lichaam/muts.png'],['u-juf','u','kort','u','midden','juf','klas/juf.png'],
    ['aa-raam','aa','lang','aa','midden','raam','thuis/raam.png'],['aa-schaap','aa','lang','aa','midden','schaap','dieren/schaap.png'],
    ['aa-paard','aa','lang','aa','midden','paard','dieren/paard.png'],['aa-kaas','aa','lang','aa','midden','kaas','eten/kaas.png'],['aa-taart','aa','lang','aa','midden','taart','eten/taart.png'],
    ['ee-zee','ee','lang','ee','eind','zee','dieren/zee.png'],['ee-peer','ee','lang','ee','midden','peer','eten/peer.png'],
    ['ee-been','ee','lang','ee','midden','been','lichaam/been.png'],['ee-kleed','ee','lang','ee','midden','kleed','lichaam/kleed.png'],['ee-vlees','ee','lang','ee','midden','vlees','eten/vlees.png'],
    ['oo-boom','oo','lang','oo','midden','boom','dieren/boom.png'],['oo-boos','oo','lang','oo','midden','boos','familie/boos.png'],
    ['oo-brood','oo','lang','oo','midden','brood','eten/brood.png'],['oo-school','oo','lang','oo','midden','school','klas/school.png'],['oo-hoofd','oo','lang','oo','midden','hoofd','lichaam/hoofd.png'],
    ['uu-muur','uu','lang','uu','midden','muur','klanken/muur.png'],['uu-vuur','uu','lang','uu','midden','vuur','klanken/vuur.png'],
    ['uu-uur','uu','lang','uu','begin','uur','klanken/uur.png'],['uu-buur','uu','lang','uu','midden','buur','klanken/buur.png'],['uu-schuur','uu','lang','uu','midden','schuur','klanken/schuur.png'],
    ['oe-koe','oe','tweeteken','oe','eind','koe','dieren/koe.png'],['oe-stoel','oe','tweeteken','oe','midden','stoel','klas/stoel.png'],
    ['oe-boek','oe','tweeteken','oe','midden','boek','klas/leesboek.png'],['oe-koek','oe','tweeteken','oe','midden','koek','klas/koek.png'],['oe-broek','oe','tweeteken','oe','midden','broek','lichaam/broek.png'],['oe-voet','oe','tweeteken','oe','midden','voet','lichaam/voet.png'],['oe-bloem','oe','tweeteken','oe','midden','bloem','dieren/bloem.png'],
    ['eu-deur','eu','tweeteken','eu','midden','deur','thuis/deur.png'],['eu-neus','eu','tweeteken','eu','midden','neus','lichaam/neus.png'],
    ['eu-veulen','eu','tweeteken','eu','midden','veulen','dieren/veulen.png'],['eu-keuken','eu','tweeteken','eu','midden','keuken','thuis/keuken.png'],['eu-kleur','eu','tweeteken','eu','midden','kleur','klas/kleurpotloden.png'],
    ['ui-muis','ui','tweeteken','ui','midden','muis','dieren/muis.png'],['ui-kruin','ui','tweeteken','ui','midden','kruin','dieren/kruin.png'],
    ['ui-ui','ui','tweeteken','ui','begin','ui','eten/ui.png'],['ui-buik','ui','tweeteken','ui','midden','buik','lichaam/buik.png'],['ui-trui','ui','tweeteken','ui','eind','trui','lichaam/trui.png'],['ui-fruit','ui','tweeteken','ui','eind','fruit','klas/fruit.png'],['ui-vuilbak','ui','tweeteken','ui','midden','vuilbak','klas/vuilbak.png'],
    ['ie-fiets','ie','tweeteken','ie','midden','fiets','klanken/fiets.png'],['ie-koffie','ie','tweeteken','ie','eind','koffie','eten/koffie.png'],
    ['ie-spiegel','ie','tweeteken','ie','midden','spiegel','thuis/spiegel.png'],['ie-friet','ie','tweeteken','ie','midden','friet','eten/friet.png'],['ie-verdrietig','ie','tweeteken','ie','midden','verdrietig','familie/verdrietig.png'],
    ['ei-geit','ei','tweeteken','ei','midden','geit','dieren/geit.png'],['ei-blij','ei','tweeteken','ij','eind','blij','familie/blij.png'],
    ['ei-ei','ei','tweeteken','ei','begin','ei','eten/ei.png'],['ei-rijst','ei','tweeteken','ij','midden','rijst','eten/rijst.png'],['ei-tijger','ei','tweeteken','ij','midden','tijger','dieren/tijger.png'],
    ['au-auto','au','tweeteken','au','begin','auto','klanken/auto.png'],['au-touw','au','tweeteken','ou','eind','touw','klanken/touw.png'],
    ['au-saus','au','tweeteken','au','midden','saus','klanken/saus.png'],['au-pauw','au','tweeteken','au','eind','pauw','klanken/pauw.png'],
    ['m-muis','m','medeklinker','m','begin','muis','dieren/muis.png'],['m-mama','m','medeklinker','m','begin','mama','familie/mama.png'],
    ['m-mes','m','medeklinker','m','begin','mes','eten/mes.png'],['m-muts','m','medeklinker','m','begin','muts','lichaam/muts.png'],['m-melk','m','medeklinker','m','begin','melk','eten/melk.png'],
    ['s-schaap','s','medeklinker','s','begin','schaap','dieren/schaap.png'],['s-stoel','s','medeklinker','s','begin','stoel','klas/stoel.png'],
    ['s-school','s','medeklinker','s','begin','school','klas/school.png'],['s-sneeuw','s','medeklinker','s','begin','sneeuw','dieren/sneeuw.png'],['s-soep','s','medeklinker','s','begin','soep','eten/soep.png'],
    ['v-vis','v','medeklinker','v','begin','vis','dieren/vis.png'],['v-varken','v','medeklinker','v','begin','varken','dieren/varken.png'],
    ['v-voet','v','medeklinker','v','begin','voet','lichaam/voet.png'],['v-vork','v','medeklinker','v','begin','vork','eten/vork.png'],['v-vlees','v','medeklinker','v','begin','vlees','eten/vlees.png'],
    ['l-leeuw','l','medeklinker','l','begin','leeuw','dieren/leeuw.png'],['l-lamp','l','medeklinker','l','begin','lamp','thuis/lamp.png'],
    ['l-lepel','l','medeklinker','l','begin','lepel','eten/lepel.png'],['l-lat','l','medeklinker','l','begin','lat','klas/lat.png'],['l-lijm','l','medeklinker','l','begin','lijm','klas/lijm.png'],
    ['r-regen','r','medeklinker','r','begin','regen','dieren/regen.png'],['r-rug','r','medeklinker','r','begin','rug','lichaam/rug.png'],
    ['r-raam','r','medeklinker','r','begin','raam','thuis/raam.png'],['r-rok','r','medeklinker','r','begin','rok','lichaam/rok.png'],['r-rijst','r','medeklinker','r','begin','rijst','eten/rijst.png'],
    ['b-boom','b','medeklinker','b','begin','boom','dieren/boom.png'],['b-boekentas','b','medeklinker','b','begin','boekentas','klas/boekentas.png'],
    ['b-bed','b','medeklinker','b','begin','bed','thuis/bed.png'],['b-bad','b','medeklinker','b','begin','bad','thuis/bad.png'],['b-brood','b','medeklinker','b','begin','brood','eten/brood.png'],
    ['k-kat','k','medeklinker','k','begin','kat','dieren/kat.png'],['k-kip','k','medeklinker','k','begin','kip','dieren/kip.png'],
    ['k-koe','k','medeklinker','k','begin','koe','dieren/koe.png'],['k-kaas','k','medeklinker','k','begin','kaas','eten/kaas.png'],['k-koek','k','medeklinker','k','begin','koek','klas/koek.png'],
    ['p-paard','p','medeklinker','p','begin','paard','dieren/paard.png'],['p-pen','p','medeklinker','p','begin','pen','klas/pen.png'],
    ['p-peer','p','medeklinker','p','begin','peer','eten/peer.png'],['p-potlood','p','medeklinker','p','begin','potlood','klas/potlood.png'],['p-papa','p','medeklinker','p','begin','papa','familie/papa.png']
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
