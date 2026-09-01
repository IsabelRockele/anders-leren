// Leerlijn Klanken & lezen — eerst horen en uitluisteren, pas later spellen.
(() => {
  const specs = [
    ['muis','m','m','begin','muis','dieren/muis.png'],['mama','m','m','begin','mama','familie/mama.png'],
    ['schaap','s','s','begin','schaap','dieren/schaap.png'],['stoel','s','s','begin','stoel','klas/stoel.png'],
    ['vis','v','v','begin','vis','dieren/vis.png'],['varken','v','v','begin','varken','dieren/varken.png'],
    ['leeuw','l','l','begin','leeuw','dieren/leeuw.png'],['lamp','l','l','begin','lamp','thuis/lamp.png'],
    ['regen','r','r','begin','regen','dieren/regen.png'],['rug','r','r','begin','rug','lichaam/rug.png'],
    ['boom','b','b','begin','boom','dieren/boom.png'],['boekentas','b','b','begin','boekentas','klas/boekentas.png'],
    ['kat','k','k','begin','kat','dieren/kat.png'],['kip','k','k','begin','kip','dieren/kip.png'],
    ['paard','p','p','begin','paard','dieren/paard.png'],['pen','p','p','begin','pen','klas/pen.png'],
    ['geit','ei','ei','midden','geit','dieren/geit.png'],['ijs','ei','ij','begin','ijs','eten/ijs.png'],
    ['prei','ei','ei','eind','prei','eten/prei.png'],['blij','ei','ij','eind','blij','familie/blij.png'],
    ['auto','au','au','begin','auto','klanken/auto.png'],['saus','au','au','midden','saus','klanken/saus.png'],
    ['touw','au','ou','eind','touw','klanken/touw.png'],['pauw','au','au','eind','pauw','klanken/pauw.png']
  ];
  const items = specs.map(([id,klank,spelling,positie,tekst,picto]) => ({
    id:`kl-${id}`,niveau:'basis',categorie:`klank-${klank}`,tekst,kort:tekst,picto,beeld:'🔊',
    klank,spelling,positie,klankLabel:`/${klank}/`,
    klankAudio:({m:'mmm',s:'sss',v:'vvv',l:'lll',r:'rrr',b:'b',k:'k',p:'p',ei:'ei',au:'au'})[klank]
  }));
  const onderdeel=(klank,naam,uitleg)=>({id:`klank-${klank}`,naam,icoon:'👂',uitleg,categorieen:[`klank-${klank}`]});
  window.THEMA_KLANKEN_LEZEN={
    id:'klanken-lezen',type:'woorden',naam:'Klanken & lezen',emoji:'🔤',kleur:'#7B4BC4',niveaus:['basis'],
    categorieen:['klank-m','klank-s','klank-v','klank-l','klank-r','klank-b','klank-k','klank-p','klank-ei','klank-au'],
    leeronderdelen:[
      onderdeel('m','Klank /m/','Hoor de /m/ aan het begin.'),onderdeel('s','Klank /s/','Hoor de /s/ aan het begin.'),
      onderdeel('v','Klank /v/','Hoor de /v/ aan het begin.'),onderdeel('l','Klank /l/','Hoor de /l/ aan het begin.'),
      onderdeel('r','Klank /r/','Hoor de /r/ aan het begin.'),onderdeel('b','Klank /b/','Hoor de /b/ aan het begin.'),
      onderdeel('k','Klank /k/','Hoor de /k/ aan het begin.'),onderdeel('p','Klank /p/','Hoor de /p/ aan het begin.'),
      onderdeel('ei','Klank /ei/ — ei of ij','Bij luisteren zijn ei en ij één klankgroep.'),
      onderdeel('au','Klank /au/ — au of ou','Bij luisteren zijn au en ou één klankgroep.')
    ],
    klankLeerlijn:true,standaardOefenvormen:{luisteren:['klank-uitluisteren']},items
  };
})();
