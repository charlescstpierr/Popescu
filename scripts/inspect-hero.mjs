import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'];
const SPLIT_PROGRESS=[0,.09,.17,.23,.5,.73,.83,.97];
const hash=canvas=>createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');

function alphaBounds(canvas){
  const {width,height}=canvas,pixels=canvas.getContext('2d').getImageData(0,0,width,height).data;
  let left=width,top=height,right=-1,bottom=-1,count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  return {left,top,right,bottom,width:right-left+1,height:bottom-top+1,count};
}

/** Native Canvas only. The complete body and held weapon are drawn by HeroArt. */
export async function inspectHero(output='/tmp/toma-hero-qa',{renderer=null}={}){
  process.chdir(resolve(root,'dist'));
  globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
  globalThis.Image=Image;
  const [{Game},{Renderer},{computeHeroPose,solveHeroAim,HERO_GAIT_STEP}]=await Promise.all([
    import('../dist/engine.js'),import('../dist/renderer.js'),import('../dist/hero-pose.js'),
  ]);
  assert.ok(Number.isFinite(HERO_GAIT_STEP)&&HERO_GAIT_STEP>0,'pose must export its distance per walk frame');
  const r=renderer||new Renderer(createCanvas(390,844));await r.ready;
  assert.ok(r.hero.image,'the whole-body Toma atlas must decode');
  mkdirSync(output,{recursive:true});
  const template=new Game({seed:42}).state;
  const widths=[],heights=[],views=new Set();
  let measuredMuzzles=0;
  function stateFor(direction,phase=0,{x=128,y=132,progress=null,moving=true}={}){
    const angle=direction*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
    const s={...template,x,y,elapsed:92,walkDistance:(phase+.1)*HERO_GAIT_STEP,walkMoving:moving,
      moveX:moving?dx:0,moveY:moving?dy:0,faceX:dx,faceY:dy,aimSide:dx<-.1?-1:1,
      shots:[],shotClock:0,invulnerable:0,mode:'playing',stats:{fireInterval:.52},
      stunt:{kind:'split',active:progress!==null,progress:progress??0,time:(progress??0)*1.3,duration:1.3,faceX:dx,faceY:dy,count:1}};
    // Place actual world-space targets around the engine's fixed chest bearing.
    // A feet-centered horizontal target would correctly select SE/SW instead.
    const target={x:x+dx*200,y:y-40+dy*200};Object.assign(s,solveHeroAim(s,target));
    const pose=computeHeroPose(s),tx=target.x-pose.muzzle.x,ty=target.y-pose.muzzle.y;
    assert.ok(Math.abs(tx*pose.aim.y-ty*pose.aim.x)<.001,'the projectile from the painted muzzle must pass through its target');
    assert.ok(tx*pose.aim.x+ty*pose.aim.y>0,'the shot must point forward');
    assert.ok(pose.art.frame&&Number.isInteger(pose.art.frameIndex),'pose must choose a registered complete frame');
    views.add(pose.art.id);
    return {s,pose,target};
  }
  function isolate(s){const canvas=createCanvas(256,192),before=JSON.stringify(s);r.hero.draw(canvas.getContext('2d'),s,92,true);assert.equal(JSON.stringify(s),before,'HeroArt stays read-only');return canvas;}
  function verifyVisible(s,pose){
    const canvas=isolate(s),bounds=alphaBounds(canvas);assert.ok(bounds.count>450,'the complete illustrated figure is visible');
    assert.ok(bounds.height>=55&&bounds.height<=116,`Toma must remain readable near 80px at actual scale, got ${bounds.height}px`);
    widths.push(bounds.width);heights.push(bounds.height);
    const pixels=canvas.getContext('2d').getImageData(0,0,256,192).data,mx=Math.round(pose.muzzle.x),my=Math.round(pose.muzzle.y);
    let paint=0;for(let y=my-4;y<=my+4;y++)for(let x=mx-4;x<=mx+4;x++)if(x>=0&&x<256&&y>=0&&y<192&&pixels[(y*256+x)*4+3]>64)paint++;
    assert.ok(paint>0,'the muzzle anchor must lie beside the painted held weapon');measuredMuzzles++;
    return canvas;
  }
  function cell(ctx,direction,phase,x,y,{progress=null,label=''}={}){
    const {s}=stateFor(direction,phase,{x:x+70,y:y+113,progress});
    const before=JSON.stringify(s);r.hero.draw(ctx,s,92,true);assert.equal(JSON.stringify(s),before);
    ctx.fillStyle='#baaec8';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(label,x+70,y+133);
  }

  // No city, particles, labels or elapsed animation can make this check pass.
  // Only real distance-driven whole-body frames differ between these images.
  const frameHashes=[];
  for(let phase=0;phase<8;phase++){const {s,pose}=stateFor(0,phase);assert.equal(pose.art.frameIndex,phase);frameHashes.push(hash(verifyVisible(s,pose)));}
  assert.equal(new Set(frameHashes).size,8,'all eight walked-distance phases must visibly differ');
  const stationary=stateFor(0,6,{moving:false}).s,stillA=isolate(stationary);stationary.elapsed+=20;
  assert.equal(hash(isolate(stationary)),hash(stillA),'elapsed time alone cannot animate a stationary figure');
  const held=[.24,.5,.69].map(progress=>{const {s,pose}=stateFor(0,0,{progress}),image=isolate(s);return {image:hash(image),bounds:alphaBounds(image),pose};});
  assert.equal(new Set(held.map(item=>item.image)).size,1,'the full split holds one complete painting from 24% through 69%');
  const entry=stateFor(0,0,{progress:0}).s,headDrop=held[1].bounds.top-alphaBounds(isolate(entry)).top;
  assert.ok(headDrop>8,'the top of the actual painted head and torso descends with the split');

  const walk=createCanvas(1120,1170),wc=walk.getContext('2d');wc.fillStyle='#242237';wc.fillRect(0,0,1120,1170);
  wc.fillStyle='#f8d99a';wc.font='bold 15px monospace';wc.fillText('TOMA · 8 DIRECTIONS × 8 PAS · TAILLE RÉELLE',18,24);
  for(let direction=0;direction<8;direction++)for(let phase=0;phase<8;phase++){
    const sample=stateFor(direction,phase);verifyVisible(sample.s,sample.pose);
    cell(wc,direction,phase,phase*140,38+direction*140,{label:`${DIRECTIONS[direction]} · PAS ${phase+1}`});
  }
  assert.deepEqual([...views].sort(),[...DIRECTIONS].sort(),'actual target solving must exercise all eight illustrated directions');
  writeFileSync(resolve(output,'hero-walk-phases.png'),walk.toBuffer('image/png'));
  const splitSheet=createCanvas(1120,1170),sc=splitSheet.getContext('2d');sc.fillStyle='#242237';sc.fillRect(0,0,1120,1170);
  sc.fillStyle='#f8d99a';sc.font='bold 15px monospace';sc.fillText('TOMA · ENTRÉE, GRAND ÉCART, REPRISE · TAILLE RÉELLE',18,24);
  for(let direction=0;direction<8;direction++)for(let index=0;index<8;index++)cell(sc,direction,0,index*140,38+direction*140,{progress:SPLIT_PROGRESS[index],label:`${DIRECTIONS[direction]} · ${Math.round(SPLIT_PROGRESS[index]*100)} %`});
  writeFileSync(resolve(output,'hero-split-phases.png'),splitSheet.toBuffer('image/png'));
  const contact=createCanvas(640,510),cc=contact.getContext('2d');cc.fillStyle='#242237';cc.fillRect(0,0,640,510);
  for(let direction=0;direction<8;direction++)cell(cc,direction,2,direction%4*160+10,Math.floor(direction/4)*170+10,{label:`${DIRECTIONS[direction]} · CIBLE RÉELLE`});
  for(let index=0;index<4;index++)cell(cc,0,0,index*160+10,350,{progress:[0,.17,.5,.83][index],label:`SPLIT ${[0,17,50,83][index]} %`});
  writeFileSync(resolve(output,'hero-directions-split.png'),contact.toBuffer('image/png'));
  const rays=createCanvas(800,450),rc=rays.getContext('2d');rc.fillStyle='#242237';rc.fillRect(0,0,800,450);
  rc.fillStyle='#70d9ef';rc.font='12px monospace';rc.fillText('CYAN : TIR VERS LA CIBLE',16,20);rc.fillStyle='#f8d99a';rc.fillText('OR : AXE PEINT / FLASH',355,20);
  for(let direction=0;direction<8;direction++){
    const x=direction%4*200,y=42+Math.floor(direction/4)*200,{s,pose}=stateFor(direction,2,{x:x+100,y:y+145});r.hero.draw(rc,s,92,true);
    const m=pose.muzzle,b=pose.barrelAim||pose.aim;
    for(const [a,color,length]of [[b,'#f8d99a',18],[pose.aim,'#70d9ef',30]]){rc.strokeStyle=color;rc.lineWidth=1;rc.beginPath();rc.moveTo(m.x,m.y);rc.lineTo(m.x+a.x*length,m.y+a.y*length);rc.stroke();}
    rc.fillStyle='#baaec8';rc.font='11px monospace';rc.textAlign='center';rc.fillText(`${DIRECTIONS[direction]} · VUE ${pose.art.id}`,x+100,y+175);
  }
  writeFileSync(resolve(output,'hero-aim-rays.png'),rays.toBuffer('image/png'));
  return {walkFrames:64,splitFrames:64,distinctWalkPhases:8,stationaryStable:true,splitHoldStable:true,
    headDrop,muzzlesChecked:measuredMuzzles,
    views:[...views],heightRange:[Math.min(...heights),Math.max(...heights)],widthRange:[Math.min(...widths),Math.max(...widths)],output};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await inspectHero(process.argv[2]||'/tmp/toma-hero-qa')));
