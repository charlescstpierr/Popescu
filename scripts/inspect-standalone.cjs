const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const inputPath=path.resolve(process.argv[3]||path.join(__dirname,'../release/Toma_Popescu_JOUER.html'));
const outputPath=path.resolve(process.argv[2]||'/tmp/toma-combined-standalone.png');
const inputStat=fs.statSync(inputPath);
let outputStat=null;
try {outputStat=fs.lstatSync(outputPath);} catch(error) {if(error.code!=='ENOENT')throw error;}
if(path.extname(outputPath).toLowerCase()!=='.png'||outputPath===inputPath||
 (outputStat&&(outputStat.isSymbolicLink()||(outputStat.dev===inputStat.dev&&outputStat.ino===inputStat.ino)))) {
 console.error('Refusing unsafe screenshot output: choose a separate .png file, never the standalone HTML.');
 process.exit(1);
}
function writeScreenshotAtomic(bytes) {
 const tmp=fs.mkdtempSync(path.join(path.dirname(outputPath),'.toma-screenshot-'));
 try {
  const staged=path.join(tmp,'output.png');
  fs.writeFileSync(staged,bytes,{flag:'wx'});
  fs.renameSync(staged,outputPath);
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
}
const {createCanvas}=require('@napi-rs/canvas');
const {Image,checkImageSource,checkStaticImages}=require('./offline-qa.cjs').offlineImages(inputPath);
const html=fs.readFileSync(inputPath,'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);assert(!/<script[^>]+src=/.test(html));assert(!/import\s*\{/.test(code));
code=code.replace('modules["./app.js"]={};','globalThis.__qa={get game(){return game},captureRun,restoreRun,renderer,frame,updateHud,pause,resume,persistRun,resumeSaved,get screen(){return screen}};modules["./app.js"]={};');
const elements=new Map();
function el(tag='div',id='') {const c=tag==='canvas'?createCanvas(390,844):{};const cls=new Set();Object.assign(c,{id,tagName:tag,textContent:'',children:[],dataset:{},style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},classList:{add(...v){v.forEach(x=>cls.add(x))},remove(...v){v.forEach(x=>cls.delete(x))},toggle(x,b){if(b===undefined)b=!cls.has(x);b?cls.add(x):cls.delete(x);return b},contains(x){return cls.has(x)}},setAttribute(k,v){this[k]=v},addEventListener(){},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},getBoundingClientRect(){return {width:390,height:844,left:0,top:0}},closest(){return null}});return c;}
for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(m[2],el(m[1],m[2]));
const document={hidden:false,getElementById(id){assert(elements.has(id),`missing element ${id}`);return elements.get(id)},createElement:el,querySelectorAll(){return []},querySelector(){return el()},addEventListener(){}};
const storage=new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,sound:false})]]);let lock=Promise.resolve();
const sandbox={console,document,Image,OffscreenCanvas:class{constructor(w,h){return createCanvas(w,h)}},crypto:require('crypto').webcrypto,navigator:{locks:{request(_name,fn){const result=lock.then(fn);lock=result.catch(()=>{});return result;}}},window:{addEventListener(){},confirm(){return true}},ResizeObserver:class{observe(){}},localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},matchMedia(){return{matches:false}},performance,Date,Math,URL,Uint8Array,Float32Array,HTMLInputElement:class{},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval};
sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{await checkStaticImages(html);const q=sandbox.__qa;assert(q);await q.renderer.ready;assert(q.renderer.hero.image,'packaged hero image decoded');for(const k of ['girl','enemy','orangutan','rival_goat','rival_rooster','travestia','travestia_dash','pelican'])assert(q.renderer.actors.available(k),`packaged ${k}`);
 await elements.get('play').onclick();assert.equal(q.game.s.mode,'playing');q.frame(performance.now()+50);const g=q.game;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;g.s.enemies=[];
 let site;for(let x=-3;x<4;x++)for(let y=-3;y<4;y++){const p=g.world.chunk(x,y).find(p=>p.type==='discovery');if(p)site=p;}
 assert(site);g.s.x=site.x;g.s.y=site.y;g.update(.02);q.updateHud(true);assert.equal(g.s.discovery.count,1);assert.equal(elements.get('discovery-name').textContent,site.name);assert(!elements.get('discovery-status').classList.contains('hidden'));assert(elements.get('discovery-time').textContent.endsWith(' s'));
 const before=JSON.stringify(g.s);q.renderer.render(g,10);assert.equal(JSON.stringify(g.s),before);q.pause();const frozen=JSON.stringify(g.s);g.update(.25);assert.equal(JSON.stringify(g.s),frozen);assert((await q.persistRun()).ok);const saved=JSON.parse(storage.get('toma-popescu-run-v1'));assert(saved.run.snapshot.game.discoveryCooldowns.length);await q.resumeSaved();assert.equal(q.screen,'pause-screen');assert.equal(q.game.s.discovery.active.kind,g.s.discovery.active.kind);assert.equal(q.game.discoveryContact,g.discoveryContact);assert.deepEqual([...q.game.discoveryCooldowns],[...g.discoveryCooldowns]);q.resume();assert.equal(q.game.s.mode,'playing');
 const live=q.game;const boss=live.spawnEnemy('travestia',live.s.x+60,live.s.y);assert(boss);live.updateEnemies(.01);assert.equal(boss.phase,'tail_windup');assert((await q.persistRun()).ok);await q.resumeSaved();assert.equal(q.game.s.enemies.find(e=>e.type==='travestia').tailTime,boss.tailTime);q.resume();q.renderer.render(q.game,10);
 let dash=q.game.s.enemies.find(e=>e.type==='travestia');Object.assign(dash,{phase:'chase',tailTime:0,tailReplyPending:false,cooldown:0,tailAttackCount:1});q.game.world.collides=()=>false;q.game.updateEnemies(.01);
 for(const phase of ['tail_dash_windup','tail_dash','tail_dash_recover']){let steps=0;while(dash.phase!==phase&&steps++<1000)q.game.updateEnemies(.01);assert.equal(dash.phase,phase);const state=JSON.stringify(dash);assert((await q.persistRun()).ok);await q.resumeSaved();dash=q.game.s.enemies.find(e=>e.type==='travestia');assert.equal(JSON.stringify(dash),state);q.resume();q.game.world.collides=()=>false;}q.renderer.render(q.game,10);
 // Exercise the newly bundled boss through the real app's save and portrait paths.
 q.game.s.enemies=[];q.game.s.invulnerable=100;q.game.clearSpeech();q.game.s.elapsed=361;
 let peli=q.game.spawnEnemy('pelican',q.game.s.x+100,q.game.s.y);q.game.world.collides=()=>false;q.game.updateEnemies(.01);
 assert(q.game.openEncounterDialogue());assert.equal(q.screen,'dialogue');assert.equal(elements.get('encounter-name').textContent,'PÉLI ZODIAQUE');
 const modalLines=q.game.encounters.active.lines,modalState=JSON.stringify(q.game.s);q.game.update(.25);assert.equal(JSON.stringify(q.game.s),modalState);assert((await q.persistRun()).ok);
 elements.get('next-dialogue').onclick();assert.equal(q.game.encounters.active.index,1);assert.equal(elements.get('encounter-name').textContent,'PÉLI ZODIAQUE');
 elements.get('next-dialogue').onclick();assert.equal(q.game.s.mode,'playing');assert.equal(q.game.encounters.outcomes['boss:pelican'],'completed');
 // Repeated ambient banter still uses the compact portrait after the first scene.
 q.game.clearSpeech();q.game.bark('PÉLI ZODIAQUE',modalLines[0].text,true,{actorId:peli.id});
 assert.equal(elements.get('banter-name').textContent,'PÉLI ZODIAQUE');assert(!elements.get('banter-rival').classList.contains('hidden'));
 for(const [count,kind]of ['hug','zodiac','tarot'].entries()){
  Object.assign(peli,{phase:'chase',peliTime:0,cooldown:0,peliAttackCount:count});q.game.updateEnemies(.01);
  for(const phase of [`peli_${kind}_warning`,`peli_${kind}`,'peli_recover']){
   let steps=0;while((peli.phase!==phase||(phase==='peli_tarot'&&peli.peliTime>.8))&&steps++<1000)q.game.updateEnemies(.01);
   assert.equal(peli.phase,phase);const state=JSON.stringify(peli);assert((await q.persistRun()).ok);await q.resumeSaved();peli=q.game.s.enemies.find(e=>e.type==='pelican');assert.equal(JSON.stringify(peli),state);q.resume();q.game.world.collides=()=>false;
  }
 }
 q.renderer.render(q.game,361);
 // Verify the actual bundled director and browser save flow, not just ES imports.
 q.game.s.enemies=[];const selected=q.game.bossDirector.nextType;
 Object.assign(q.game.bossDirector,{remaining:5.01,warned:false,retryIn:0});q.game.update(.02);
 assert.equal(q.game.bossDirector.warned,true);assert.equal(q.game.bossDirector.remaining,5);
 const director=JSON.stringify(q.game.bossDirector);assert((await q.persistRun()).ok);await q.resumeSaved();
 assert.equal(JSON.stringify(q.game.bossDirector),director);q.game.update(.25);assert.equal(JSON.stringify(q.game.bossDirector),director);q.resume();
 for(let i=0;i<21;i++)q.game.update(.25);
 const major=q.game.s.enemies.filter(e=>['matriarch','travestia','pelican'].includes(e.type)&&!e.dead);
 assert.equal(major.length,1);assert.equal(major[0].type,selected);
 for(const other of ['matriarch','travestia','pelican'])assert.equal(q.game.spawnEnemy(other,900,0),null);
 assert((await q.persistRun()).ok);
 assert(q.renderer.charles.image,'packaged Charles atlas decoded');
 q.game.s.elapsed=1200;q.game.s.mode='victory';assert(q.game.startCharlesEpilogue());q.game.update(.02);assert((await q.persistRun()).ok);const charles=JSON.stringify(q.game.s.charles);await q.resumeSaved();assert.equal(JSON.stringify(q.game.s.charles),charles);q.resume();q.renderer.render(q.game,1200);assert(q.game.leaveCharlesEpilogue());assert.equal(q.game.s.mode,'victory');assert((await q.persistRun()).ok);
 // Verify all four new species from the bundled code, not imported modules.
 assert(q.renderer.actors.available('ego'),'packaged new beasts atlas decoded');
 const beasts=new q.game.constructor({seed:42});beasts.world.collides=()=>false;beasts.s.invulnerable=100;
 for(const type of ['ego_peacock','ego_toad','ego_rat','ego_chameleon']){
  beasts.s.enemies=[];const e=beasts.spawnEnemy(type,-90,0);assert(e);beasts.updateEnemies(.01);
  for(const phase of ['ego_warning','ego_active','ego_recover']){
   let steps=0;while(e.phase!==phase&&steps++<500)beasts.updateEnemies(.01);assert.equal(e.phase,phase,type+' reaches '+phase);
   const snapshot=q.captureRun(beasts),copy=q.restoreRun(snapshot);assert.equal(JSON.stringify(copy.s.enemies),JSON.stringify(beasts.s.enemies));
   const before=JSON.stringify(beasts.s);q.renderer.render(beasts,beasts.s.elapsed);assert.equal(JSON.stringify(beasts.s),before);
  }
 }
 q.renderer.render(q.game,1200);
 writeScreenshotAtomic(elements.get('world').toBuffer('image/png'));console.log(JSON.stringify({syntax:'pass',boot:'pass',packagedImages:'pass',staticImageSources:'pass',start:'pass',discoveryActivation:'pass',hudNameAndCountdown:'pass',renderReadOnly:'pass',pauseResume:'pass',saveResumeDiscoveryState:'pass',bossArtAndWarningRecovery:'pass',tailDashAllPhasesSaveResume:'pass',pelicanPausedSceneAndCompactPortrait:'pass',pelicanAllPhasesSaveResume:'pass',randomBossDirectorSaveAndArrival:'pass',charlesArtEpilogueSaveAndExit:'pass',fourBeastsPackagedPhasesSaveAndRender:'pass',actualBrowser:false,physicalTouch:false}));})().catch(e=>{console.error(e);process.exitCode=1});
