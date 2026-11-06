import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectHero} from './inspect-hero.mjs';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
globalThis.Image=Image;
const {Game}=await import('../dist/engine.js');
const {Renderer}=await import('../dist/renderer.js');
const {computeHeroPose,solveHeroAim,HERO_GAIT_STEP}=await import('../dist/hero-pose.js');
const {HERO_FRAMES}=await import('../dist/hero-frames.js');
const output=process.argv[2]||'/tmp/toma-graphics-qa';mkdirSync(output,{recursive:true});
const game=new Game({seed:42});const s=game.state;s.elapsed=92;s.walkDistance=HERO_GAIT_STEP*2.1;s.walkMoving=true;s.companion=true;s.girl={x:-44,y:24,hp:70,maxhp:70,down:0};s.faceX=1;s.faceY=0;s.moveX=.7;s.moveY=.4;s.shield=20;s.upg={muscle:2,girlfriend:1,followers:1};
const placements=[['normal',-107,-210],['sprinter',74,-270],['gas',115,-99],['tank',-118,84],['jealous',126,163],['explosive',-47,222],['matriarch',94,300],['orangutan',22,-129],['rival_goat',-94,-84],['rival_rooster',78,95]];
for(const [type,x,y]of placements)game.spawnEnemy(type,x,y);
s.enemies[2].gasPose=.5;s.enemies[2].gasDirX=-1;s.enemies[2].gasDirY=.3;s.enemies[5].windup=.6;s.enemies[7].windup=.45;s.enemies[7].swipeDirX=-.15;s.enemies[7].swipeDirY=1;
Object.assign(s,solveHeroAim(s,s.enemies[2]));const pose=computeHeroPose(s);
s.enemies[8].windup=.55;s.enemies[8].chargeDirX=1;s.enemies[8].chargeDirY=.2;s.enemies[9].crow=.5;
s.shockwaves=[{x:78,y:95,r:93,width:12,life:.6,maxlife:1,maxR:180}];
s.clouds=[{x:133,y:-49,r:28,life:2.4,maxlife:3.2,vx:0,vy:0}];s.chests=[{id:999,x:89,y:22,open:false}];s.drops=[{x:25,y:75,kind:'xp',value:2,life:20},{x:48,y:83,kind:'gem',value:1,life:20},{x:-55,y:130,kind:'coin',value:1,life:20}];s.shots=[{...pose.muzzle,vx:460*pose.aim.x,vy:460*pose.aim.y,kind:'bullet',life:1,damage:18},{x:-27,y:3,vx:50,vy:-90,kind:'heart',life:1,damage:10}];
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
assert.ok(['hero','girl','enemy','orangutan','rival_goat','rival_rooster'].every(k=>renderer.actors.available(k)),'all generated atlases must decode');
assert.ok(renderer.hero.image,'whole-body Toma atlas must decode');
const before=JSON.stringify(game.state);renderer.render(game,92);assert.equal(JSON.stringify(game.state),before,'renderer cannot change gameplay');writeFileSync(resolve(output,'in-game.png'),canvas.toBuffer('image/png'));
const first=canvas.toBuffer('image/png');s.walkDistance+=HERO_GAIT_STEP;renderer.render(game,92);assert.notEqual(computeHeroPose(s).art.frameIndex,pose.art.frameIndex,'walked distance selects a different complete painting');assert.notDeepEqual(canvas.toBuffer('image/png'),first,'a real walk phase changes while elapsed and world time stay fixed');
// Read the packed sheets, not thumbnails or generator output.
const atlasMeta=JSON.parse(readFileSync(resolve(root,'dist/assets/actors-v2.json'),'utf8'));
for(const name of ['toma','girl','gorilla','orangutan','rival_goat','rival_rooster']){const image=await loadImage(resolve(root,'dist/assets',atlasMeta[name].file));assert.equal(image.width,512);assert.equal(image.height,256);const c=createCanvas(512,256);c.getContext('2d').drawImage(image,0,0);for(let i=0;i<8;i++){const a=c.getContext('2d').getImageData(i%4*128,Math.floor(i/4)*128,128,128).data;let count=0;for(let k=3;k<a.length;k+=4)if(a[k]>128)count++;assert.ok(count>1500,`${name} frame${i} is visible`);}}
// Inspect the active full-body atlas itself, not the unused legacy Toma sheet.
const whole=renderer.hero.image,wholeCanvas=createCanvas(whole.width,whole.height),wholeCtx=wholeCanvas.getContext('2d');wholeCtx.drawImage(whole,0,0);
let wholeFrames=0;for(const [view,registration]of Object.entries(HERO_FRAMES.views)){
  assert.equal(registration.run.length,8,`${view} has eight complete run paintings`);assert.equal(registration.split.length,5,`${view} has five registered split frame slots`);
  let run0Hash;
  for(const [sequence,frames]of [['run',registration.run],['split',registration.split]]){
    const hashes=[];for(const [index,frame]of frames.entries()){
      assert.ok(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=whole.width&&frame.y+frame.h<=whole.height,'registered source rectangle stays in its atlas');
      const pixels=wholeCtx.getImageData(frame.x,frame.y,frame.w,frame.h).data;let paint=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>64)paint++;
      assert.ok(paint>450,`${view} ${sequence} ${index} contains a visible whole figure`);hashes.push(createHash('sha256').update(pixels).digest('hex'));wholeFrames++;
    }
    if(sequence==='run'){assert.equal(new Set(hashes).size,8,`${view} run paintings must be distinct`);run0Hash=hashes[0];}
    else assert.equal(new Set([run0Hash,...hashes.slice(2)]).size,4,`${view} active run0 / split2 / split3 / split4 paintings must be distinct`);
  }
}
for(let i=0;i<30;i++){s.x=i*811;s.y=-i*413;s.walkDistance+=811;renderer.render(game,92+i*.1);}assert.ok(renderer.city.tiles.size<=48,'terrain memory stays bounded');
s.x=0;s.y=0;s.elapsed=92;const start=performance.now();for(let i=0;i<100;i++){s.walkDistance=i*2;renderer.render(game,92+i/60);}const frameMs=(performance.now()-start)/100;
s.walkDistance=HERO_GAIT_STEP*2.1;Object.assign(s,solveHeroAim(s,s.enemies[2]));const finalPose=computeHeroPose(s);s.shots[0]={...s.shots[0],...finalPose.muzzle,vx:460*finalPose.aim.x,vy:460*finalPose.aim.y};renderer.render(game,92);writeFileSync(resolve(output,'in-game.png'),canvas.toBuffer('image/png'));
// Consistent diagnostic sheet for sprites at actual in-game scale.
const sheet=createCanvas(1000,390),c=sheet.getContext('2d');c.fillStyle='#252238';c.fillRect(0,0,1000,390);for(let col=0;col<10;col++){
  const a=col%8*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a),hero={...s,x:45+col*100,y:95,elapsed:92,walkDistance:col%8*HERO_GAIT_STEP,walkMoving:true,moveX:dx,moveY:dy,faceX:dx,faceY:dy,shots:[],shotClock:0,stunt:{active:col>=8,kind:'split',progress:.5,faceX:1,faceY:0}};
  Object.assign(hero,solveHeroAim(hero,{x:hero.x+dx*200,y:hero.y-40+dy*200}));renderer.hero.draw(c,hero,92,true);
  renderer.actors.draw(c,{x:45+col*100,y:180,faceX:1,faceY:0},'girl',col,s,92);renderer.actors.draw(c,{x:45+col*100,y:310,faceX:1,faceY:0,type:placements[col][0],gasPose:col===2?.4:0},'enemy',col,s,92);
}writeFileSync(resolve(output,'actors.png'),sheet.toBuffer('image/png'));
const heroQA=await inspectHero(output,{renderer});
// Real renderer, four attack phases; warnings and hit bands are drawn from simulation fields.
const contact=createCanvas(780,844),cc=contact.getContext('2d');renderer.resize(390,422);
for(const [i,type,phase]of [[0,'rival_goat','windup'],[1,'rival_goat','charge'],[2,'rival_rooster','windup'],[3,'rival_rooster','crow']]){
  const g=new Game({seed:42}),a=g.state;g.world.getVisible=()=>[];a.x=0;a.y=0;a.elapsed=106;a.chests=[];a.drops=[];const e=g.spawnEnemy(type,-75,-90);e.faceX=1;e.faceY=.4;e.chargeDirX=.93;e.chargeDirY=.37;e.windup=phase==='windup'?.55:0;e.charge=phase==='charge'?.4:0;e.crow=phase==='crow'?.5:0;
  if(phase==='crow')a.shockwaves=[{x:e.x,y:e.y,r:115,width:12,life:.6,maxlife:1,maxR:180}];
  const before=JSON.stringify(a);renderer.render(g,106);assert.equal(JSON.stringify(a),before,'attack rendering stays read-only');cc.drawImage(canvas,i%2*390,Math.floor(i/2)*422);cc.fillStyle='#f8d99a';cc.font='bold 13px monospace';cc.fillText(`${type==='rival_goat'?'BOUC':'COQ'} : ${phase.toUpperCase()}`,i%2*390+15,Math.floor(i/2)*422+397);
}
writeFileSync(resolve(output,'rival-attacks.png'),contact.toBuffer('image/png'));
console.log(JSON.stringify({atlases:`6 supporting atlases decoded + ${wholeFrames} complete Toma frame entries`,animation:'walked distance, not elapsed time',heroQA,simulationUnchanged:true,terrainTiles:renderer.city.tiles.size,actorCache:renderer.actors.cache.size,nativeCanvasFrameMs:Number(frameMs.toFixed(2)),output}));
