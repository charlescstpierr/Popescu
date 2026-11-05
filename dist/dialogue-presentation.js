// Presentation only: the line selects its speaker; engine context retains the scene.
// Literal asset paths are also consumed by the standalone exporter.
const ENCOUNTER_ART={
 toma:{name:'TOMA POPESCU',spokenName:'Toma Popescu',subtitle:'',portrait:'assets/dialogue-toma.png'},
 charles:{name:'CHARLES',spokenName:'Charles l’Illuminé',subtitle:'L’ILLUMINÉ',portrait:'assets/dialogue-charles.png'},
 pelican:{name:'PÉLI ZODIAQUE',spokenName:'Péli Zodiaque',subtitle:'',portrait:'assets/dialogue-pelican.png'},
 travestia:{name:'TRAVESTIA',spokenName:'Travestia',subtitle:'',portrait:'assets/dialogue-travestia.png'},
 companion:{name:'BLONDE IA',spokenName:'Blonde IA',subtitle:'',portrait:'assets/dialogue-companion-1.png'}
};
const SPEAKERS={'TOMA':'toma','TOMA POPESCU':'toma','BLONDE IA':'companion','CHARLES':'charles','PÉLI ZODIAQUE':'pelican','TRAVESTIA':'travestia'};
const COMPANION_PORTRAITS=['assets/companion-portrait-1.png','assets/companion-portrait-2.png','assets/companion-portrait-3.png','assets/companion-portrait-4.png','assets/companion-portrait-5.png'];
// Crop only transparent margins through an SVG viewBox. Source PNGs stay unchanged.
// The lower silhouette edge sits behind the actual dialogue panel.
const PORTRAIT_FRAMES={
 toma:{width:1024,height:1536,viewBox:[0,25,1024,1511]},
 charles:{width:1104,height:1425,viewBox:[0,10,1104,1274]},
 pelican:{width:1024,height:1536,viewBox:[76,219,884,1020]},
 travestia:{width:1024,height:1536,viewBox:[33,219,965,1030]},
 companion:{width:1024,height:1536,viewBox:[52,159,936,1134]}
};
export function encounterPortraitFrame(source){const actor=Object.keys(ENCOUNTER_ART).find(key=>ENCOUNTER_ART[key].portrait===source);return PORTRAIT_FRAMES[actor]||{width:80,height:80,viewBox:[0,0,80,80]};}
const PRESENTATIONS=new WeakMap();
const ROOT_ATTRIBUTES=['role','aria-modal','aria-label','aria-labelledby','aria-describedby'];
const TEXT_ATTRIBUTES=['tabindex','role','aria-label'];
function approvedScene(context){
 if(!context)return false;
 const {actorType,sceneId}=context;
 return actorType==='charles'?/^charles:[0-3]$/.test(sceneId):actorType==='companion'?sceneId==='companion:invocation':
  (actorType==='pelican'||actorType==='travestia')&&sceneId===`boss:${actorType}`;
}
export function encounterPresentation({line,context}={}){
 if(!line)return null;
 // The encounter owns the save cursor and actor identity. Only the current
 // line owns the visible portrait, even when Toma answers a boss.
 const encounter=approvedScene(context)?ENCOUNTER_ART[context.actorType]:null;
 const who=line.who||'',speakerType=SPEAKERS[who]||null;
 const art=ENCOUNTER_ART[speakerType]||{name:who,spokenName:who,subtitle:'',portrait:null};
 const rank=speakerType==='companion'?Math.max(1,Math.min(5,Math.trunc(Number(context?.companionRank)||1))):null;
 const portraits=rank?(rank===1?[art.portrait,COMPANION_PORTRAITS[0]]:[COMPANION_PORTRAITS[rank-1]]):art.portrait?[art.portrait]:[];
 return {...art,actorType:context?.actorType??null,sceneId:context?.sceneId??null,speakerType,rank,portraits,speaker:art.spokenName,
  sceneName:encounter?.spokenName??null,sceneRank:encounter&&context?.actorType==='companion'?context.companionRank:null,
  reply:!!encounter&&speakerType==='toma',
  subtitle:rank?`NIVEAU ${rank}`:art.subtitle};
}
function saveAttributes(node,names){return names.map(name=>[name,node?.getAttribute?.(name)??null]);}
function restoreAttributes(node,saved){if(!node)return;for(const [name,value]of saved||[]){if(value===null){if(node.removeAttribute)node.removeAttribute(name);else delete node[name];}else node.setAttribute(name,value);}}
function hidden(node,value){if(!node)return;node.hidden=value;if(value)node.setAttribute?.('hidden','');else node.removeAttribute?.('hidden');}
function set(node,text){if(node)node.textContent=text;}
function reset(root,doc){
 const state=PRESENTATIONS.get(root);if(!state)return false;
 state.active=false;state.generation++;
 root.classList.remove('encounter-dialogue','encounter-reply','encounter-no-art','encounter-existing-portrait');
 restoreAttributes(root,state.attributes);restoreAttributes(doc.getElementById('dialogue-text'),state.textAttributes);
 for(const id of ['encounter-header','encounter-visual','encounter-nameplate','encounter-description'])hidden(doc.getElementById(id),true);
 hidden(doc.getElementById('encounter-framed-portrait'),true);
 const portrait=doc.getElementById('encounter-portrait');if(portrait){portrait.onload=null;portrait.onerror=null;hidden(portrait,true);}
 PRESENTATIONS.delete(root);return false;
}
function loadPortrait(root,portrait,status,state,model,doc){
 const framed=doc.getElementById('encounter-framed-portrait'),artImage=doc.getElementById('encounter-framed-image');
 if(!portrait){root.classList.add('encounter-no-art');set(status,'Portrait indisponible');return;}
 const key=`${model.speakerType||model.name}|${model.portraits.join('|')}`;if(state.assetKey===key)return;
 state.assetKey=key;state.generation++;const generation=state.generation;
 portrait.setAttribute('alt','');portrait.setAttribute('aria-hidden','true');
 if(!model.portraits.length){portrait.onload=null;portrait.onerror=null;portrait.removeAttribute?.('src');artImage?.removeAttribute?.('href');hidden(portrait,true);hidden(framed,true);root.classList.add('encounter-no-art');root.classList.remove('encounter-existing-portrait');set(status,model.name==='SYSTÈME'?'MESSAGE SYSTÈME':'Portrait indisponible');return;}
 const tryImage=index=>{
  if(!state.active||generation!==state.generation)return;
  const source=model.portraits[index];
  hidden(portrait,true);hidden(framed,true);root.classList.add('encounter-no-art');set(status,'');
  root.classList.toggle('encounter-existing-portrait',source!==ENCOUNTER_ART[model.speakerType]?.portrait);
  const current=()=>state.active&&generation===state.generation&&state.imageAttempt===index;
  state.imageAttempt=index;
  portrait.onload=()=>{if(!current())return;
   if(framed&&artImage){const frame=encounterPortraitFrame(source);framed.setAttribute('viewBox',frame.viewBox.join(' '));artImage.setAttribute('width',frame.width);artImage.setAttribute('height',frame.height);artImage.setAttribute('href',source);hidden(framed,false);}
   hidden(portrait,false);root.classList.remove('encounter-no-art');set(status,'');};
  portrait.onerror=()=>{if(!current())return;if(index+1<model.portraits.length)tryImage(index+1);else{hidden(portrait,true);hidden(framed,true);root.classList.add('encounter-no-art');set(status,'Portrait indisponible');state.imageAttempt=-1;}};
  portrait.src=source;
  if(portrait.complete&&portrait.naturalWidth>0)portrait.onload();
 };
 tryImage(0);
}
/** Update a dialogue with its current speaker, or clear the presentation on close.
 * All text remains real DOM text. Artwork is decorative: the accessible scene
 * description and the real speaker heading provide its context once.
 * Optional document injection supports native DOM adapters without a browser.
 */
export function renderEncounterPresentation({game,line,context,index=0,total=1,document:doc=globalThis.document}={}){
 const root=doc?.getElementById('dialogue');if(!root)return false;
 const resolved=context===undefined?game?.dialoguePresentation?.(line):context;
 const model=encounterPresentation({line,context:resolved});if(!model)return reset(root,doc);
 let state=PRESENTATIONS.get(root);
 if(!state){state={active:true,generation:0,attributes:saveAttributes(root,ROOT_ATTRIBUTES),textAttributes:saveAttributes(doc.getElementById('dialogue-text'),TEXT_ATTRIBUTES)};PRESENTATIONS.set(root,state);}
 root.classList.add('encounter-dialogue');root.classList.toggle('encounter-reply',model.reply);
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','speaker');
 root.setAttribute('aria-describedby','encounter-description dialogue-text');
 if(root.removeAttribute)root.removeAttribute('aria-label');
 for(const id of ['encounter-header','encounter-visual','encounter-nameplate','encounter-description'])hidden(doc.getElementById(id),false);
 set(doc.getElementById('encounter-name'),model.name);set(doc.getElementById('encounter-subtitle'),model.subtitle);
 hidden(doc.getElementById('encounter-subtitle'),!model.subtitle);
 const count=Math.max(1,Math.trunc(Number(total)||1)),position=Math.max(1,Math.min(count,Math.trunc(Number(index)||0)+1));
 set(doc.getElementById('dialogue-progress'),`${position} / ${count}`);
 set(doc.getElementById('encounter-description'),`Scène en pause. ${model.sceneName?`Rencontre avec ${model.sceneName}${model.sceneRank?`, niveau ${model.sceneRank}`:''}. `:''}${model.rank&&!model.sceneRank?`Blonde IA, niveau ${model.rank}. `:''}${model.reply?'Toma Popescu répond. ':`Réplique de ${model.speaker}. `}Réplique ${position} sur ${count}.`);
 set(doc.getElementById('next-dialogue'),line.action||'CONTINUER ›');
 const text=doc.getElementById('dialogue-text');if(text){text.setAttribute('tabindex','0');text.setAttribute('role','region');text.setAttribute('aria-label',`Réplique de ${model.speaker}`);if(state.lineKey!==`${model.sceneId}|${position}|${line.text}`)text.scrollTop=0;}
 state.lineKey=`${model.sceneId}|${position}|${line.text}`;
 loadPortrait(root,doc.getElementById('encounter-portrait'),doc.getElementById('encounter-art-status'),state,model,doc);
 return true;
}
