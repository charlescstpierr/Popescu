const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const inputPath=path.resolve(__dirname,'../release/Toma_Popescu_JOUER.html');
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
const {createCanvas,Image}=require('@napi-rs/canvas');
const html=fs.readFileSync(path.join(__dirname,'../release/Toma_Popescu_JOUER.html'),'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);assert(!/<script[^>]+src=/.test(html));assert(!/import\s*\{/.test(code));
code=code.replace('modules["./app.js"]={};','globalThis.__qa={get game(){return game},renderer,frame,renderUpgrades,updateHud,pause,resume,persistRun,resumeSaved,get screen(){return screen}};modules["./app.js"]={};');
const elements=new Map();
function el(tag='div',id='') {const c=tag==='canvas'?createCanvas(390,844):{};const cls=new Set();Object.assign(c,{id,tagName:tag,textContent:'',children:[],dataset:{},style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},classList:{add(...v){v.forEach(x=>cls.add(x))},remove(...v){v.forEach(x=>cls.delete(x))},toggle(x,b){if(b===undefined)b=!cls.has(x);b?cls.add(x):cls.delete(x);return b},contains(x){return cls.has(x)}},setAttribute(k,v){this[k]=v},addEventListener(){},append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x},getBoundingClientRect(){return {width:390,height:844,left:0,top:0}},closest(){return null}});return c;}
for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(m[2],el(m[1],m[2]));
const document={hidden:false,getElementById(id){assert(elements.has(id),`missing element ${id}`);return elements.get(id)},createElement:el,querySelectorAll(){return []},querySelector(){return el()},addEventListener(){}};
const storage=new Map([['toma-popescu-v1',JSON.stringify({introSeen:true,sound:false})]]);let lock=Promise.resolve();
const sandbox={console,document,Image,OffscreenCanvas:class{constructor(w,h){return createCanvas(w,h)}},crypto:require('crypto').webcrypto,navigator:{locks:{request(_name,fn){const result=lock.then(fn);lock=result.catch(()=>{});return result;}}},window:{addEventListener(){},confirm(){return true}},ResizeObserver:class{observe(){}},localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},matchMedia(){return{matches:false}},performance,Date,Math,URL,Uint8Array,Float32Array,HTMLInputElement:class{},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval};
sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{const q=sandbox.__qa;await q.renderer.ready;assert(q.renderer.companion.image,'existing atlas remains embedded');await elements.get('play').onclick();const g=q.game;for(const key in g.timers)g.timers[key]=99999;g.nextEvent=99999;g.s.enemies=[];
 const names=['Coupé fantôme','Pare-chocs VIP','Version large','Retour du voiturier','Convoi présidentiel'];
 for(let rank=1;rank<=5;rank++){
  g.s.vehicles=[];g.s.mode='upgrade';g.s.options=[{id:'car',name:'Lamborghini imaginaire',icon:'car',max:5}];q.renderUpgrades(g.s.options);const card=elements.get('upgrade-options').children[0];assert(card.children[1].children[0].textContent.includes(names[rank-1]));assert(card.children[1].children[1].textContent.length>20);
  assert(g.chooseUpgrade('car'));g.timers.car=0;g.weapons(0);assert.equal(g.s.vehicles.length,rank===5?2:1);assert.equal(g.s.vehicles[0].carRank,rank);g.updateVehicles(.1);q.renderer.render(g,rank);const before=JSON.stringify(g.s);q.renderer.render(g,rank);assert.equal(JSON.stringify(g.s),before);
 }
 q.pause();const cars=JSON.stringify(g.s.vehicles);assert((await q.persistRun()).ok);await q.resumeSaved();assert.equal(JSON.stringify(q.game.s.vehicles),cars);q.resume();q.game.updateVehicles(.8);q.renderer.render(q.game,7);writeScreenshotAtomic(elements.get('world').toBuffer('image/png'));
 console.log(JSON.stringify({embeddedNewModules:'pass',fiveRankChoiceCards:'pass',fiveGameplayRanks:'pass',twoCarLimit:'pass',renderReadOnly:'pass',saveResumeDelayedEscort:'pass',existingCompanionAtlas:'pass',actualBrowser:false,physicalTouch:false}));
})().catch(error=>{console.error(error);process.exitCode=1});
