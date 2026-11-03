const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const inputPath=path.resolve(__dirname,'../release/Toma_Popescu_JOUER.html');
const outputPath=path.resolve(process.argv[2]||'/tmp/toma-combined-standalone.png');
const inputStat=fs.statSync(inputPath);
const outputStat=fs.existsSync(outputPath)?fs.statSync(outputPath):null;
if(path.extname(outputPath).toLowerCase()!=='.png'||outputPath===inputPath||
 (outputStat&&outputStat.dev===inputStat.dev&&outputStat.ino===inputStat.ino)) {
 console.error('Refusing unsafe screenshot output: choose a separate .png file, never the standalone HTML.');
 process.exit(1);
}
const {createCanvas,Image}=require('@napi-rs/canvas');
const html=fs.readFileSync(path.join(__dirname,'../release/Toma_Popescu_JOUER.html'),'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);assert(!/<script[^>]+src=/.test(html));assert(!/import\s*\{/.test(code));
code=code.replace('modules["./app.js"]={};','globalThis.__qa={get game(){return game},renderer,frame,updateHud,pause,resume,persistRun,resumeSaved,get screen(){return screen}};modules["./app.js"]={};');
const elements=new Map();
function el(tag='div',id='') {const c=tag==='canvas'?createCanvas(390,844):{};const cls=new Set();Object.assign(c,{id,tagName:tag,textContent:'',children:[],dataset:{},style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},classList:{add(...v){v.forEach(x=>cls.add(x))},remove(...v){v.forEach(x=>cls.delete(x))},toggle(x,b){if(b===undefined)b=!cls.has(x);b?cls.add(x):cls.delete(x);return b},contains(x){return cls.has(x)}},setAttribute(k,v){this[k]=v},addEventListener(){},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},getBoundingClientRect(){return {width:390,height:844,left:0,top:0}},closest(){return null}});return c;}
for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(m[2],el(m[1],m[2]));
const document={hidden:false,getElementById(id){assert(elements.has(id),`missing element ${id}`);return elements.get(id)},createElement:el,querySelectorAll(){return []},querySelector(){return el()},addEventListener(){}};
const storage=new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,sound:false})]]);let lock=Promise.resolve();
const sandbox={console,document,Image,OffscreenCanvas:class{constructor(w,h){return createCanvas(w,h)}},crypto:require('crypto').webcrypto,navigator:{locks:{request(_name,fn){const result=lock.then(fn);lock=result.catch(()=>{});return result;}}},window:{addEventListener(){},confirm(){return true}},ResizeObserver:class{observe(){}},localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},matchMedia(){return{matches:false}},performance,Date,Math,URL,Uint8Array,Float32Array,HTMLInputElement:class{},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval};
sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{const q=sandbox.__qa;assert(q);await q.renderer.ready;assert(q.renderer.hero.image,'embedded hero image decoded');for(const k of ['girl','enemy','orangutan','rival_goat','rival_rooster','travestia','travestia_dash'])assert(q.renderer.actors.available(k),`embedded ${k}`);
 await elements.get('play').onclick();assert.equal(q.game.s.mode,'playing');q.frame(performance.now()+50);const g=q.game;for(const key in g.timers)g.timers[key]=100000;g.nextEvent=100000;g.s.enemies=[];
 let site;for(let x=-3;x<4;x++)for(let y=-3;y<4;y++){const p=g.world.chunk(x,y).find(p=>p.type==='discovery');if(p)site=p;}
 assert(site);g.s.x=site.x;g.s.y=site.y;g.update(.02);q.updateHud(true);assert.equal(g.s.discovery.count,1);assert.equal(elements.get('discovery-name').textContent,site.name);assert(!elements.get('discovery-status').classList.contains('hidden'));assert(elements.get('discovery-time').textContent.endsWith(' s'));
 const before=JSON.stringify(g.s);q.renderer.render(g,10);assert.equal(JSON.stringify(g.s),before);q.pause();const frozen=JSON.stringify(g.s);g.update(.25);assert.equal(JSON.stringify(g.s),frozen);assert((await q.persistRun()).ok);const saved=JSON.parse(storage.get('toma-popescu-run-v1'));assert(saved.run.snapshot.game.discoveryCooldowns.length);await q.resumeSaved();assert.equal(q.screen,'pause-screen');assert.equal(q.game.s.discovery.active.kind,g.s.discovery.active.kind);assert.equal(q.game.discoveryContact,g.discoveryContact);assert.deepEqual([...q.game.discoveryCooldowns],[...g.discoveryCooldowns]);q.resume();assert.equal(q.game.s.mode,'playing');
 const live=q.game;const boss=live.spawnEnemy('travestia',live.s.x+60,live.s.y);assert(boss);live.updateEnemies(.01);assert.equal(boss.phase,'tail_windup');assert((await q.persistRun()).ok);await q.resumeSaved();assert.equal(q.game.s.enemies.find(e=>e.type==='travestia').tailTime,boss.tailTime);q.resume();q.renderer.render(q.game,10);
 let dash=q.game.s.enemies.find(e=>e.type==='travestia');Object.assign(dash,{phase:'chase',tailTime:0,tailReplyPending:false,cooldown:0,tailAttackCount:1});q.game.world.collides=()=>false;q.game.updateEnemies(.01);
 for(const phase of ['tail_dash_windup','tail_dash','tail_dash_recover']){let steps=0;while(dash.phase!==phase&&steps++<1000)q.game.updateEnemies(.01);assert.equal(dash.phase,phase);const state=JSON.stringify(dash);assert((await q.persistRun()).ok);await q.resumeSaved();dash=q.game.s.enemies.find(e=>e.type==='travestia');assert.equal(JSON.stringify(dash),state);q.resume();q.game.world.collides=()=>false;}q.renderer.render(q.game,10);
 fs.writeFileSync(outputPath,elements.get('world').toBuffer('image/png'));console.log(JSON.stringify({syntax:'pass',boot:'pass',embeddedImages:'pass',start:'pass',discoveryActivation:'pass',hudNameAndCountdown:'pass',renderReadOnly:'pass',pauseResume:'pass',saveResumeDiscoveryState:'pass',bossArtAndWarningRecovery:'pass',tailDashAllPhasesSaveResume:'pass',actualBrowser:false,physicalTouch:false}));})().catch(e=>{console.error(e);process.exitCode=1});
