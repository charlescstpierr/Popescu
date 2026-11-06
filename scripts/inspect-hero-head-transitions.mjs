/** Controlled native Canvas evidence. Not a browser or physical-phone benchmark. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {HERO_FRAMES} from '../dist/hero-frames.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'/tmp/toma-head-transitions');
const baseline=process.argv[3]?resolve(process.argv[3]):null;
mkdirSync(out,{recursive:true});
const {createCanvas,Image,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const [{Game},{Renderer},{computeHeroPose,solveHeroAim},{inspectHero}]=await Promise.all([
  import('../dist/engine.js'),import('../dist/renderer.js'),import('../dist/hero-pose.js'),import('./inspect-hero.mjs')]);
const canvas=createCanvas(390,500),renderer=new Renderer(canvas);await renderer.ready;
assert.ok(renderer.hero.image,'current complete atlas decoded');
let staticEvidence;
try { staticEvidence=await inspectHero(out,{renderer}); } catch(error) { staticEvidence={passed:false,error:error.message}; }
const directions=Object.entries(HERO_FRAMES.views).flatMap(([id,v])=>[{id,angle:v.angle},...(['N','S'].includes(id)?[]:[{id:v.mirrorId,angle:Math.PI-v.angle}])]).sort((a,b)=>(a.angle+2*Math.PI)%(2*Math.PI)-(b.angle+2*Math.PI)%(2*Math.PI));
const isolated=createCanvas(16*144,14*148),ic=isolated.getContext('2d'),measurements=[];
const progressSamples=[null,.09,.17,.23,.24,.5,.69,.83];
for(const [row,d]of directions.entries())for(let column=0;column<16;column++){
  const progress=column<8?null:progressSamples[column-8];
  const s={...new Game({seed:42}).s,x:65,y:97,walkMoving:true,walkDistance:(column%8+.1)*10,
    moveX:Math.cos(d.angle),moveY:Math.sin(d.angle),shots:[],shotClock:0,
    stunt:{kind:'split',active:progress!==null,progress:progress??0}};
  Object.assign(s,solveHeroAim(s,{x:65+200*Math.cos(d.angle),y:57+200*Math.sin(d.angle)}));
  const pose=computeHeroPose(s),c=createCanvas(144,128),cx=c.getContext('2d'),before=JSON.stringify(s);
  renderer.hero.draw(cx,s,0,true);assert.equal(JSON.stringify(s),before);
  const rgba=cx.getImageData(0,0,144,128).data;let top=128,bottom=-1,muzzlePaintDistance=Infinity;
  for(let y=0;y<128;y++)for(let x=0;x<144;x++)if(rgba[(y*144+x)*4+3]>64){top=Math.min(top,y);bottom=Math.max(bottom,y);muzzlePaintDistance=Math.min(muzzlePaintDistance,Math.hypot(x-pose.muzzle.x,y-pose.muzzle.y));}
  measurements.push({direction:d.id,column,phase:pose.art.frameIndex,progress,top,bottom,height:bottom-top+1,muzzle:pose.muzzle,muzzlePaintDistance});
  ic.drawImage(c,column*144,row*148);ic.fillStyle='#b7a6c9';ic.font='10px sans-serif';ic.fillText(`${d.id} ${column<8?'pas '+column:'split '+progress}`,column*144+14,row*148+141);
}
writeFileSync(out+'/all-directions-walk-split.png',isolated.toBuffer('image/png'));
const g=new Game({seed:42});g.setViewport(390,500);
for(const key of Object.keys(g.timers))g.timers[key]=100000;g.nextEvent=100000;
const target=g.spawnEnemy('tank',180,-40);target.speed=0;target.hp=target.maxhp=1e9;
const records=[],visited=new Set(),contact=createCanvas(1560,Math.ceil(directions.length/4)*500),cc=contact.getContext('2d');
for(let d=0;d<directions.length;d++){
  const direction=directions[d];
  for(let tick=0;tick<24;tick++){
    target.x=g.s.x+Math.cos(direction.angle)*180;target.y=g.s.y-40+Math.sin(direction.angle)*180;
    g.s.shotClock=100;g.update(1/60,{x:.6,y:0});g.s.shots=[];
    const before=JSON.stringify(g.s),pose=computeHeroPose(g.s);renderer.render(g,records.length/60);
    assert.equal(JSON.stringify(g.s),before,'full Renderer never mutates Game state');visited.add(pose.art.id);
    records.push({frame:records.length,target:direction.id,view:pose.art.id,phase:pose.art.frameIndex,walkDistance:g.s.walkDistance,position:[g.s.x,g.s.y],muzzle:pose.muzzle});
    if(tick===23){assert.equal(pose.art.id,direction.id);const x=d%4*390,y=Math.floor(d/4)*500;cc.drawImage(canvas,x,y);cc.fillStyle='#171525';cc.fillRect(x,y,390,30);cc.fillStyle='#f8d99a';cc.font='bold 14px sans-serif';cc.fillText(`${direction.id} · actual Game.update · step ${pose.art.frameIndex}`,x+10,y+21);}
  }
}
assert.equal(visited.size,14);writeFileSync(out+'/game-fourteen-directions.png',contact.toBuffer('image/png'));
// All intermediate turn frames are isolated to avoid city animation obscuring the actual figure.
const transitions=createCanvas(24*144,4*148),tc=transitions.getContext('2d');
for(let turn=0;turn<4;turn++)for(let tick=0;tick<24;tick++){
  const angle=turn%2?0:Math.PI;target.x=g.s.x+Math.cos(angle)*180;target.y=g.s.y-40;
  g.s.shotClock=100;g.update(1/60,{x:turn%2?.6:-.6,y:0});g.s.shots=[];
  const pose=computeHeroPose(g.s),before=JSON.stringify(g.s);
  tc.save();tc.translate(tick*144+65-g.s.x,turn*148+97-g.s.y);renderer.hero.draw(tc,g.s,0,true);tc.restore();
  renderer.render(g,turn+tick/60);assert.equal(JSON.stringify(g.s),before);
  tc.fillStyle='#b7a6c9';tc.font='10px sans-serif';tc.fillText(`${pose.art.id} / ${pose.art.frameIndex}`,tick*144+48,turn*148+140);
  records.push({turn,tick,view:pose.art.id,phase:pose.art.frameIndex});
}
writeFileSync(out+'/half-turns-all-frames.png',transitions.toBuffer('image/png'));
const splitProgress=[0,.17,.24,.5,.69,.83,.97];
const splitScenes=createCanvas(390*splitProgress.length,500),sp=splitScenes.getContext('2d');
for(const [index,progress] of splitProgress.entries()){
  g.s.stunt={...g.s.stunt,kind:'split',active:true,progress,time:progress*1.3,duration:1.3};
  const before=JSON.stringify(g.s),pose=computeHeroPose(g.s);renderer.render(g,index);
  assert.equal(JSON.stringify(g.s),before);sp.drawImage(canvas,index*390,0);
  sp.fillStyle='#171525';sp.fillRect(index*390,0,390,30);sp.fillStyle='#f8d99a';sp.font='14px sans-serif';
  sp.fillText(`Controlled split ${Math.round(progress*100)}% · ${pose.art.id}`,index*390+10,21);
}
writeFileSync(out+'/game-split-sequence.png',splitScenes.toBuffer('image/png'));

const comparison=[];
if(baseline){
  const oldFrames=(await import(pathToFileURL(baseline+'/baseline-v8-frames.mjs'))).HERO_FRAMES;
  const old=await loadImage(readFileSync(baseline+'/baseline-v8.png'));
  const sheet=createCanvas(16*144,8*150),ctx=sheet.getContext('2d');
  function sample(image,frame){const c=createCanvas(144,128),cctx=c.getContext('2d');cctx.drawImage(image,frame.x,frame.y,144,128,0,0,144,128);const pixels=cctx.getImageData(0,0,144,128).data;return{canvas:c,hash:createHash('sha256').update(pixels).digest('hex')};}
  for(const [row,[id,view]]of Object.entries(HERO_FRAMES.views).entries())for(let phase=0;phase<8;phase++){
    const before=sample(old,oldFrames.views[id].run[phase]),after=sample(renderer.hero.image,view.run[phase]);
    ctx.drawImage(before.canvas,phase*288,row*150);ctx.drawImage(after.canvas,phase*288+144,row*150);
    ctx.fillStyle='#b7a6c9';ctx.font='10px sans-serif';ctx.fillText(`${id} ${phase}: v8 | ${HERO_FRAMES.image}`,phase*288+8,row*150+142);
    comparison.push({id,phase,before:before.hash,after:after.hash,pixelsChanged:before.hash!==after.hash});
  }
  writeFileSync(out+'/baseline-v8-versus-current.png',sheet.toBuffer('image/png'));
}
const report={scope:'Native Canvas, actual Game.update and full Renderer, controlled targets. Not browser, physical phone, likeness certification, or an automatic head-size measurement.',atlas:HERO_FRAMES.image,revision:HERO_FRAMES.identityRevision,staticEvidence,measurements,actualGameDirections:[...visited],renderMutations:0,comparison,records,headMeasurement:'No verified anatomical head masks exist. Whole-frame differences prove replacement, not a 20% anatomical reduction. Human inspection of matched v8/current frames is required for head proportion and likeness.'};
writeFileSync(out+'/head-transitions.json',JSON.stringify(report,null,2));console.log(JSON.stringify({out,atlas:report.atlas,directions:visited.size,frames:records.length,renderMutations:0,legacyInspectionPassed:staticEvidence.passed!==false}));
if(staticEvidence.passed===false)process.exitCode=1;
