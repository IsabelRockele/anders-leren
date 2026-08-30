// Taalgroei: flexibele groepen, deelnameperiodes en individuele evaluaties.
window.Taalgroei = (function () {
  const LOKALE_SLEUTEL = 'taalgroei_groepen_v1';
  let groepen = [], db = null, bewerkId = null;
  const veilig = waarde => String(waarde == null ? '' : waarde).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const uuid = () => 'tg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);

  function huidigSchooljaar() {
    if (typeof lkActiefSchooljaarId === 'string' && lkActiefSchooljaarId) return lkActiefSchooljaarId;
    const nu = new Date(), begin = nu.getMonth() < 8 ? nu.getFullYear()-1 : nu.getFullYear();
    return `${begin}-${begin+1}`;
  }
  const kinderen = () => Array.isArray(lkKinderen) ? lkKinderen : [];
  const naamVan = code => { const k=kinderen().find(x=>x.code===code); return k ? lkVolledigeNaam(k) : code; };
  const klasVan = code => { const k=kinderen().find(x=>x.code===code); return k&&k.klas ? k.klas : 'Geen klas'; };
  const labelTraject = t => ({voorinstructie:'Voorinstructie',remediëring:'Taalremediëring',taalheldklas:'Taalheldklas',anders:'Andere taalondersteuning'})[t] || 'Taalondersteuning';
  const labelStatus = s => ({piloot:'Piloot',actief:'Actief',afgesloten:'Afgesloten'})[s] || 'Piloot';

  async function laad() {
    try {
      if (window.FIREBASE_INGESTELD && window.firebase) {
        db=window.firebase.firestore();
        const doc=await Promise.race([
          db.collection('instellingen').doc('taalondersteuning').get(),
          new Promise((_,mislukt)=>setTimeout(()=>mislukt(new Error('laden duurt te lang')),3000))
        ]);
        if (doc.exists && Array.isArray(doc.data().groepen)) groepen=doc.data().groepen;
      } else groepen=JSON.parse(localStorage.getItem(LOKALE_SLEUTEL)||'[]');
    } catch(e) {
      console.warn('[Taalgroei] centrale opslag niet bereikbaar; lokale kopie gebruikt.',e);
      db=null;
      groepen=JSON.parse(localStorage.getItem(LOKALE_SLEUTEL)||'[]');
    }
  }
  async function bewaar() {
    localStorage.setItem(LOKALE_SLEUTEL,JSON.stringify(groepen));
    if (db) await db.collection('instellingen').doc('taalondersteuning').set({groepen,bijgewerkt:window.firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  }

  function deelnemersHtml(g) {
    const codes=Array.isArray(g.deelnemerCodes)?g.deelnemerCodes:[];
    return codes.length ? codes.map(c=>`<span class="tg-kindchip">${veilig(naamVan(c))} · ${veilig(klasVan(c))}</span>`).join('') : '<span class="tg-leeg">Nog geen leerlingen geselecteerd</span>';
  }
  function render() {
    const lijst=document.getElementById('tg-groepen'); if(!lijst)return;
    const zichtbaar=groepen.filter(g=>!g.schooljaar||g.schooljaar===huidigSchooljaar());
    if(!zichtbaar.length){lijst.innerHTML='<p class="tg-leeg">Nog geen taalondersteuningsgroep in dit schooljaar. Maak hierboven jullie eerste pilootgroep.</p>';return;}
    lijst.innerHTML=zichtbaar.map(g=>`<article class="tg-groepkaart ${veilig(g.status||'piloot')}"><div class="tg-groepkop"><div><h3>${veilig(g.naam)}</h3><div class="tg-meta">${veilig(labelTraject(g.traject))} · ${veilig(g.begeleider||'Begeleider nog niet ingevuld')}</div><div class="tg-meta">${veilig(g.startDatum||'geen startdatum')} ${g.eindDatum?'– '+veilig(g.eindDatum):''}</div></div><span class="tg-badge">${veilig(labelStatus(g.status))}</span></div>${g.doel?`<div class="tg-doel"><strong>Focus:</strong> ${veilig(g.doel)}</div>`:''}<div class="tg-deelnemers">${deelnemersHtml(g)}</div><div class="tg-acties"><button class="lk-knop-mini" onclick="Taalgroei.openDeelnemers('${g.id}')">👥 Leerlingen kiezen</button><button class="lk-knop-mini" onclick="Taalgroei.openEvaluaties('${g.id}')">📝 Evalueren</button><button class="lk-knop-mini" onclick="Taalgroei.bewerk('${g.id}')">✏️ Groep aanpassen</button></div><div id="tg-detail-${g.id}"></div></article>`).join('');
  }
  function wisForm(){bewerkId=null;document.getElementById('tg-form-titel').textContent='➕ Nieuwe taalondersteuningsgroep';['naam','begeleider','einde','doel'].forEach(x=>document.getElementById('tg-'+x).value='');document.getElementById('tg-traject').value='remediëring';document.getElementById('tg-status').value='piloot';document.getElementById('tg-start').value=new Date().toISOString().slice(0,10);document.getElementById('tg-annuleer').style.display='none';}
  async function slaGroepOp(){const naam=document.getElementById('tg-naam').value.trim();if(!naam)return alert('Geef de groep eerst een duidelijke naam.');const oud=groepen.find(g=>g.id===bewerkId);const g={id:bewerkId||uuid(),naam,schooljaar:huidigSchooljaar(),traject:document.getElementById('tg-traject').value,status:document.getElementById('tg-status').value,begeleider:document.getElementById('tg-begeleider').value.trim(),startDatum:document.getElementById('tg-start').value,eindDatum:document.getElementById('tg-einde').value,doel:document.getElementById('tg-doel').value.trim(),deelnemerCodes:oud&&Array.isArray(oud.deelnemerCodes)?oud.deelnemerCodes:[],leerlingData:oud&&oud.leerlingData?oud.leerlingData:{},gemaakt:oud&&oud.gemaakt?oud.gemaakt:Date.now(),bijgewerkt:Date.now()};groepen=bewerkId?groepen.map(x=>x.id===bewerkId?g:x):groepen.concat(g);await bewaar();wisForm();render();}
  function bewerk(id){const g=groepen.find(x=>x.id===id);if(!g)return;bewerkId=id;document.getElementById('tg-form-titel').textContent='✏️ Taalondersteuningsgroep aanpassen';['naam','begeleider','doel'].forEach(x=>document.getElementById('tg-'+x).value=g[x]||'');document.getElementById('tg-traject').value=g.traject||'remediëring';document.getElementById('tg-status').value=g.status||'piloot';document.getElementById('tg-start').value=g.startDatum||'';document.getElementById('tg-einde').value=g.eindDatum||'';document.getElementById('tg-annuleer').style.display='';document.getElementById('tg-form-titel').scrollIntoView({behavior:'smooth'});}

  function openDeelnemers(id){const g=groepen.find(x=>x.id===id),vak=document.getElementById('tg-detail-'+id);if(!g||!vak)return;const perKlas={};kinderen().forEach(k=>{const klas=k.klas||'Geen klas';(perKlas[klas]||(perKlas[klas]=[])).push(k);});const gekozen=new Set(g.deelnemerCodes||[]);vak.innerHTML=`<div class="tg-evaluatie"><h4>Leerlingen uit alle klassen</h4>${Object.keys(perKlas).sort().map(klas=>`<section class="tg-selectie-klas"><h4>${veilig(klas)}</h4><div class="tg-selectie-lijst">${perKlas[klas].map(k=>`<label class="tg-selectie-kind"><input type="checkbox" data-tg-kind="${veilig(k.code)}" ${gekozen.has(k.code)?'checked':''}><span>${veilig(lkVolledigeNaam(k))}</span></label>`).join('')}</div></section>`).join('')}<div class="tg-acties"><button class="lk-knop-mini" onclick="Taalgroei.bewaarDeelnemers('${id}')">💾 Deelname bewaren</button><button class="lk-knop-mini" onclick="Taalgroei.sluitDetail('${id}')">Sluiten</button></div></div>`;}
  async function bewaarDeelnemers(id){const g=groepen.find(x=>x.id===id),vak=document.getElementById('tg-detail-'+id);if(!g||!vak)return;g.deelnemerCodes=[...vak.querySelectorAll('[data-tg-kind]:checked')].map(e=>e.dataset.tgKind);g.leerlingData=g.leerlingData||{};g.deelnemerCodes.forEach(c=>{if(!g.leerlingData[c])g.leerlingData[c]={startDatum:g.startDatum||'',traject:g.traject,evaluaties:[]};});g.bijgewerkt=Date.now();await bewaar();render();}

  function openEvaluaties(id){const g=groepen.find(x=>x.id===id),vak=document.getElementById('tg-detail-'+id);if(!g||!vak)return;const codes=g.deelnemerCodes||[];if(!codes.length){vak.innerHTML='<div class="tg-evaluatie tg-leeg">Selecteer eerst leerlingen voor deze groep.</div>';return;}vak.innerHTML=`<div class="tg-evaluatie"><h4>Individuele evaluatie</h4><label><strong>Leerling</strong><select id="tg-eval-kind" onchange="Taalgroei.renderEvaluatieForm('${id}')">${codes.map(c=>`<option value="${veilig(c)}">${veilig(naamVan(c))} · ${veilig(klasVan(c))}</option>`).join('')}</select></label><div id="tg-eval-form"></div></div>`;renderEvaluatieForm(id);}
  function renderEvaluatieForm(id){const g=groepen.find(x=>x.id===id),codeEl=document.getElementById('tg-eval-kind'),form=document.getElementById('tg-eval-form');if(!g||!codeEl||!form)return;const code=codeEl.value,data=(g.leerlingData&&g.leerlingData[code])||{evaluaties:[]},opties='<option value="start">Start</option><option value="groeit">Groeit</option><option value="voldoende">Voldoende</option><option value="sterk">Sterk</option>';form.innerHTML=`<div class="tg-evaluatie-raster"><label>Evaluatiedatum<input id="tg-eval-datum" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Luisteren en begrijpen<select id="tg-eval-luisteren">${opties}</select></label><label>Actieve woordenschat<select id="tg-eval-woorden">${opties}</select></label><label>Mondelinge zinsbouw<select id="tg-eval-zinnen">${opties}</select></label><label>Spreekdurf<select id="tg-eval-spreekdurf">${opties}</select></label><label>Instructietaal<select id="tg-eval-instructie">${opties}</select></label><label class="tg-breed">Dit lukt al<textarea id="tg-eval-sterk"></textarea></label><label class="tg-breed">Volgende stap<textarea id="tg-eval-volgende"></textarea></label><label class="tg-breed">Voorstel voor rapport of oudercontact<textarea id="tg-eval-rapport"></textarea></label></div><div class="tg-acties" style="margin-top:10px"><button class="lk-knop-mini" onclick="Taalgroei.bewaarEvaluatie('${id}','${veilig(code)}')">💾 Evaluatie bewaren</button><button class="lk-knop-mini" onclick="Taalgroei.sluitDetail('${id}')">Sluiten</button></div><div class="tg-evaluatie-lijst">${(data.evaluaties||[]).slice().reverse().map(e=>`<div class="tg-evaluatie-item"><strong>${veilig(e.datum)}</strong> · woordenschat ${veilig(e.woordenschat)} · zinsbouw ${veilig(e.zinsbouw)}<br>${veilig(e.sterk||'')}${e.volgende?`<br><strong>Volgende stap:</strong> ${veilig(e.volgende)}`:''}${e.rapporttekst?`<br><strong>Rapport/oudercontact:</strong> ${veilig(e.rapporttekst)}`:''}</div>`).join('')}</div>`;}
  async function bewaarEvaluatie(id,code){const g=groepen.find(x=>x.id===id);if(!g)return;g.leerlingData=g.leerlingData||{};const d=g.leerlingData[code]||{startDatum:g.startDatum||'',traject:g.traject,evaluaties:[]};d.evaluaties=Array.isArray(d.evaluaties)?d.evaluaties:[];d.evaluaties.push({id:uuid(),datum:document.getElementById('tg-eval-datum').value,luisteren:document.getElementById('tg-eval-luisteren').value,woordenschat:document.getElementById('tg-eval-woorden').value,zinsbouw:document.getElementById('tg-eval-zinnen').value,spreekdurf:document.getElementById('tg-eval-spreekdurf').value,instructietaal:document.getElementById('tg-eval-instructie').value,sterk:document.getElementById('tg-eval-sterk').value.trim(),volgende:document.getElementById('tg-eval-volgende').value.trim(),rapporttekst:document.getElementById('tg-eval-rapport').value.trim(),gemaakt:Date.now()});g.leerlingData[code]=d;g.bijgewerkt=Date.now();await bewaar();renderEvaluatieForm(id);}
  function sluitDetail(id){const vak=document.getElementById('tg-detail-'+id);if(vak)vak.innerHTML='';}
  async function open(){await laad();const sj=document.getElementById('tg-schooljaar');if(sj)sj.textContent=huidigSchooljaar();if(!document.getElementById('tg-start').value)wisForm();render();}
  document.addEventListener('DOMContentLoaded',()=>{
    const knop=document.querySelector('.lk-tab[data-tab="taalgroei"]');
    if(knop) knop.addEventListener('click',()=>open());
  });
  return {open,render,slaGroepOp,wisForm,bewerk,openDeelnemers,bewaarDeelnemers,openEvaluaties,renderEvaluatieForm,bewaarEvaluatie,sluitDetail};
})();
