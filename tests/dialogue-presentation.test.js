import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {renderEncounterPresentation,encounterPresentation,encounterPortraitFrame} from '../dist/dialogue-presentation.js';

function dom(){
 const nodes=new Map();
 for(const id of ['dialogue','encounter-header','encounter-visual','encounter-portrait','encounter-framed-portrait','encounter-framed-image','encounter-nameplate','encounter-name','encounter-subtitle','encounter-description','encounter-art-status','dialogue-text','speaker','next-dialogue','dialogue-progress']){
  const attrs=new Map(),classes=new Set();
  nodes.set(id,{id,textContent:'',scrollTop:0,hidden:false,complete:false,naturalWidth:0,
   classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains:x=>classes.has(x),toggle(x,on){on??=!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},
   setAttribute(k,v){attrs.set(k,String(v));},getAttribute:k=>attrs.has(k)?attrs.get(k):null,removeAttribute(k){attrs.delete(k);},
   set src(value){this.source=value;},get src(){return this.source;}});
 }
 nodes.get('dialogue').setAttribute('aria-label','Dialogue');
 // SVG nodes intentionally do not reflect .hidden into attributes, like real SVGElement.
 nodes.get('encounter-framed-portrait').setAttribute('hidden','');
 nodes.get('speaker').textContent='TOMA POPESCU';nodes.get('next-dialogue').textContent='SUITE ›';
 return {getElementById:id=>nodes.get(id),nodes};
}
const context=actorType=>({actorType,sceneId:actorType==='companion'?'companion:invocation':actorType==='charles'?'charles:0':`boss:${actorType}`,companionRank:actorType==='companion'?1:null});
const line={who:'TOMA',text:'Une réplique de Toma.'};
for(const [actorType,name]of [['charles','CHARLES'],['pelican','PÉLI ZODIAQUE'],['travestia','TRAVESTIA'],['companion','BLONDE IA']]){
 test(`${actorType}: approved scene keeps context but shows Toma on his reply`,()=>{
  const document=dom(),game=Object.freeze({state:Object.freeze({mode:'dialogue'}),dialoguePresentation:()=>context(actorType)}),before=JSON.stringify(game);
  assert.equal(renderEncounterPresentation({game,line,index:1,total:5,document}),true);
  assert.equal(document.nodes.get('encounter-name').textContent,'TOMA POPESCU');
  assert.equal(document.nodes.get('encounter-portrait').src,'assets/dialogue-toma.png');
  assert.equal(document.nodes.get('speaker').textContent,'TOMA POPESCU');
  assert.match(document.nodes.get('encounter-description').textContent,/Scène en pause/);
  assert.match(document.nodes.get('encounter-description').textContent,/Toma Popescu répond/);
  assert.equal(document.nodes.get('next-dialogue').textContent,'CONTINUER ›');
  assert.equal(document.nodes.get('dialogue-progress').textContent,'2 / 5');
  assert.equal(document.nodes.get('dialogue').getAttribute('role'),'dialog');
  assert.equal(document.nodes.get('encounter-portrait').getAttribute('alt'),'');
  assert.equal(document.nodes.get('encounter-portrait').getAttribute('aria-hidden'),'true');
  assert.equal(JSON.stringify(game),before);
 });
}
test('all five companion ranks select their own approved appearance, never another rank',()=>{
 for(let rank=1;rank<=5;rank++){
  const model=encounterPresentation({context:{...context('companion'),companionRank:rank},line:{who:'BLONDE IA',text:'Réplique'}});
  assert.equal(model.rank,rank);assert.match(model.subtitle,new RegExp(`NIVEAU ${rank}$`));
  assert.deepEqual(model.portraits,rank===1?['assets/dialogue-companion-1.png','assets/companion-portrait-1.png']:[`assets/companion-portrait-${rank}.png`]);
 }
});
test('only closing a dialogue resets the speaker presentation; scene metadata never substitutes its actor',()=>{
 assert.equal(encounterPresentation({context:context('charles'),line:null}),null);
 for(const c of [null,{actorType:'companion',sceneId:null},{actorType:'gorilla',sceneId:'boss:gorilla'},{actorType:'charles',sceneId:'boss:pelican'}]){
  const model=encounterPresentation({context:c,line});assert.equal(model.speakerType,'toma');assert.equal(model.sceneName,null);
 }
});
test('failed portrait falls back safely and stale callbacks cannot resurrect old portraits',()=>{
 const document=dom(),portrait=document.nodes.get('encounter-portrait'),root=document.nodes.get('dialogue');
 renderEncounterPresentation({context:context('companion'),line:{who:'BLONDE IA',text:'Réplique'},document});
 assert.equal(document.nodes.get('encounter-framed-portrait').getAttribute('hidden'),'');
 const staleLoad=portrait.onload;portrait.onerror();
 assert.equal(portrait.src,'assets/companion-portrait-1.png');portrait.onerror();
 assert.ok(root.classList.contains('encounter-no-art'));assert.equal(portrait.hidden,true);assert.equal(document.nodes.get('encounter-framed-portrait').getAttribute('hidden'),'');
 staleLoad();assert.equal(portrait.hidden,true);
 renderEncounterPresentation({context:context('pelican'),line:{who:'PÉLI ZODIAQUE',text:'Réplique'},document});
 portrait.naturalWidth=400;portrait.onload();assert.equal(portrait.hidden,false);
 const oldLoad=portrait.onload;renderEncounterPresentation({context:null,line:null,document});oldLoad();
 assert.equal(root.classList.contains('encounter-dialogue'),false);assert.equal(portrait.hidden,true);assert.equal(document.nodes.get('encounter-framed-portrait').getAttribute('hidden'),'');
});
test('reset restores exact generic semantics and leaves text, focus and existing controls alone',()=>{
 const document=dom(),root=document.nodes.get('dialogue'),next=document.nodes.get('next-dialogue');
 let actions=0;next.onclick=()=>actions++;document.activeElement=next;
 renderEncounterPresentation({context:context('charles'),line,document});
 next.textContent='SUITE ›';document.nodes.get('dialogue-text').textContent='Texte régulier';
 renderEncounterPresentation({context:null,line:null,document});
 assert.equal(root.getAttribute('role'),null);assert.equal(root.getAttribute('aria-modal'),null);assert.equal(root.getAttribute('aria-label'),'Dialogue');
 assert.equal(next.textContent,'SUITE ›');assert.equal(document.nodes.get('dialogue-text').textContent,'Texte régulier');
 assert.equal(document.activeElement,next);next.onclick();assert.equal(actions,1);
});
test('long line resets only the scroll cursor, with progress bounded to valid positions',()=>{
 const document=dom(),text=document.nodes.get('dialogue-text');text.scrollTop=300;
 renderEncounterPresentation({context:context('travestia'),line:{who:'TRAVESTIA',text:'Longue réplique '.repeat(400)},index:90,total:2,document});
 assert.equal(text.scrollTop,0);assert.equal(document.nodes.get('dialogue-progress').textContent,'2 / 2');
 assert.equal(text.getAttribute('tabindex'),'0');
});
test('missing optional image DOM cannot block gameplay or mutate the current scene',()=>{
 const document=dom();document.nodes.delete('encounter-portrait');
 assert.doesNotThrow(()=>renderEncounterPresentation({context:context('charles'),line,document}));
 assert.equal(renderEncounterPresentation({context:context('charles'),line,document:undefined}),false);
});
test('CSS isolates the new view, keeps actual Canvas background and guards short/safe-area layouts',()=>{
 const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
 const variant=css.slice(css.indexOf('/* Approved paused encounter presentation.'));
 assert.ok(variant.length>1000);assert.match(variant,/\.encounter-dialogue\{[^}]*background:transparent/s);
 for(const marker of ['env(safe-area-inset-left','env(safe-area-inset-right','var(--safe-top)','var(--safe-bottom)','max-height:620px','max-height:440px','min-height:44px','overflow-y:auto','touch-action:pan-y','prefers-reduced-motion'])assert.ok(variant.includes(marker),marker);
 assert.doesNotMatch(variant,/url\(|backdrop-filter:blur|\.banter\s*\{/);
 assert.match(variant,/\.encounter-dialogue \.dialogue-art[^}]*display:none/s);
 assert.match(variant,/\.encounter-dialogue #dialogue-text[^}]*min-height:0/s);
});
test('existing companion portraits and level atlas retain fixed approved SHA-256 hashes',()=>{
 const expected={
  'companion-portrait-1.png':'9d87f121c42b89a86c46a0bb0f21db00d61ccb2df8810622d98cbc835289c5da',
  'companion-portrait-2.png':'be0b543820aca9f2e0968159e3819f6c65846164113de1540d585151cbc61605',
  'companion-portrait-3.png':'c52c74a1b32142e91b13e73ee76bdb9609897a959d3cbd74ccbe83019e991c71',
  'companion-portrait-4.png':'c712f5a3d516d4cd56492b94d35763d2eedf90c8cf69e7e0e481362966f3e754',
  'companion-portrait-5.png':'2f483d8b7d7c506778d94e05f967a8ffd2eb7aca0834e6ea5e41c60aa73a0a57',
  'companion-levels-whole.png':'0c555ef01472de438dc2999c523533ed170cd80155951aff59e3f5bf13e61917'
 };
 for(const [name,hash]of Object.entries(expected))assert.equal(createHash('sha256').update(readFileSync(new URL(`../dist/assets/${name}`,import.meta.url))).digest('hex'),hash,name);
});
test('SVG frames normalize transparent margins without editing the approved assets',()=>{
 for(const actor of ['charles','pelican','travestia','companion']){
  const current={who:{charles:'CHARLES',pelican:'PÉLI ZODIAQUE',travestia:'TRAVESTIA',companion:'BLONDE IA'}[actor],text:'Réplique'},document=dom(),model=encounterPresentation({line:current,context:context(actor)});
  renderEncounterPresentation({line:current,context:context(actor),document});document.nodes.get('encounter-portrait').onload();
  const framed=document.nodes.get('encounter-framed-portrait'),image=document.nodes.get('encounter-framed-image'),frame=encounterPortraitFrame(model.portraits[0]);
  assert.equal(framed.hidden,false);assert.equal(framed.getAttribute('hidden'),null);assert.equal(framed.getAttribute('viewBox'),frame.viewBox.join(' '));assert.equal(image.getAttribute('href'),model.portraits[0]);
  assert.ok(frame.viewBox[3]>frame.viewBox[2]);
 }
});

test('speaker change hides the previous face while loading and rejects late callbacks',()=>{
 const document=dom(),portrait=document.nodes.get('encounter-portrait'),framed=document.nodes.get('encounter-framed-portrait');
 renderEncounterPresentation({line:{who:'PÉLI ZODIAQUE',text:'Boss'},context:context('pelican'),document});portrait.onload();assert.equal(framed.hidden,false);const bossLoad=portrait.onload,bossError=portrait.onerror;
 renderEncounterPresentation({line,context:context('pelican'),index:1,total:2,document});assert.equal(framed.hidden,true);assert.equal(portrait.hidden,true);assert.equal(portrait.src,'assets/dialogue-toma.png');
 bossLoad();bossError();assert.equal(framed.hidden,true);assert.equal(portrait.src,'assets/dialogue-toma.png');
 portrait.onerror();assert.equal(document.nodes.get('encounter-art-status').textContent,'Portrait indisponible');assert.equal(framed.hidden,true);
 renderEncounterPresentation({line:{who:'SYSTÈME',text:'Message'},context:context('pelican'),document});assert.equal(framed.hidden,true);assert.equal(document.nodes.get('encounter-framed-image').getAttribute('href'),null);assert.equal(document.nodes.get('encounter-name').textContent,'SYSTÈME');
});
