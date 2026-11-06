import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image,loadImage}=require('@napi-rs/canvas');
const root=resolve(import.meta.dirname,'..'),out=resolve(process.argv[2]||root+'/proof/charles');mkdirSync(out,{recursive:true});process.chdir(root+'/dist');globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{CHARLES}=await import('../dist/charles.js'),{captureRun,restoreRun}=await import('../dist/run-save.js');
const reports=[];
function movement(g){const c=g.s.charles,d=Math.hypot(g.s.x-c.x,g.s.y-c.y);return ['cape_warning','cape_spin'].includes(c.phase)&&d<c.capeRadius+38?{x:(g.s.x-c.x)/d,y:(g.s.y-c.y)/d}:{x:0,y:0};}
for(const difficulty of ['easy','normal','hard','nightmare']){const g=new Game({difficulty,seed:71});g.s.elapsed=1200;g.s.mode='victory';assert.ok(g.startCharlesEpilogue());let checkpoints=0,phases=new Set();for(let i=0;i<5400;i++){phases.add(g.s.charles.phase);g.update(1/30,movement(g));assert.equal(g.s.mode,'playing','warned attacks should be avoidable');if(i%90===0){assert.deepEqual(captureRun(restoreRun(captureRun(g))),captureRun(g));checkpoints++;}}assert.equal(g.s.charles.powered,true);assert.equal(g.s.elapsed,1200);assert.equal(g.s.hp,g.s.maxhp);reports.push({difficulty,seconds:g.s.charles.elapsed,checkpoints,attacks:g.s.charles.attackCount,phases:[...phases],destroyed:g.s.charles.destroyed.length});}
const game=new Game({seed:71});game.s.elapsed=1200;game.s.mode='victory';game.startCharlesEpilogue();const c=game.s.charles;game.s.shotClock=100;game.s.x=0;game.s.y=40;c.x=0;c.y=-70;
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;assert.ok(renderer.charles.image);renderer.resize(390,844);
const contact=createCanvas(390*3,422*2),cc=contact.getContext('2d');const phases=['hover','shock_warning','cape_spin','bend','scream','burst'];
for(const reduced of [false,true]){renderer.reducedEffects=reduced;for(const [i,name] of phases.entries()){c.phase=name;c.phaseTime=CHARLES.phases[name]*.5;c.phaseDuration=CHARLES.phases[name];c.elapsed=30;c.hits=18;c.attackCount=2;const before=JSON.stringify(game.s);renderer.render(game,c.elapsed);assert.equal(JSON.stringify(game.s),before);writeFileSync(out+'/'+name+(reduced?'-reduced':'')+'.png',canvas.toBuffer('image/png'));if(!reduced){cc.drawImage(await loadImage(canvas.toBuffer('image/png')),0,100,390,422,i%3*390,Math.floor(i/3)*422,390,422);cc.fillStyle='#171326';cc.fillRect(i%3*390,Math.floor(i/3)*422,390,27);cc.fillStyle='#ffe59c';cc.font='bold 14px sans-serif';cc.fillText(name.toUpperCase(),i%3*390+14,Math.floor(i/3)*422+19);}}}
writeFileSync(out+'/in-game-sequence.png',contact.toBuffer('image/png'));
// Actual state-machine frames in a real forest: four inner pines break on
// landing, then the wider ring breaks outer pines when Charles takes off.
mkdirSync(out+'/frames',{recursive:true});renderer.reducedEffects=false;
game.s.x=-151;game.s.y=-240;assert.equal(game.world.collides(game.s.x,game.s.y,13),false);
Object.assign(c,{x:-151,y:-384,phase:'descend',phaseTime:1.25,phaseDuration:1.25,powered:false,hits:18,attackCount:2,elapsed:30,destroyed:[]});game.world.setDestroyed([]);
renderer.render(game,c.elapsed);writeFileSync(out+'/lightning-before-landing.png',canvas.toBuffer('image/png'));
let frame=0,landed=false,takeoff=false,peak=false;const impacts=[];
for(let i=0;i<150;i++){
 game.update(1/24);renderer.render(game,c.elapsed);writeFileSync(`${out}/frames/frame-${String(frame++).padStart(4,'0')}.png`,canvas.toBuffer('image/png'));
 if(c.phase==='bend'&&!landed){landed=true;impacts.push({phase:c.phase,destroyed:c.destroyed.length});writeFileSync(out+'/lightning-landing.png',canvas.toBuffer('image/png'));}
 if(c.phase==='burst'&&!takeoff){takeoff=true;impacts.push({phase:c.phase,destroyed:c.destroyed.length});}
 if(c.phase==='burst'&&c.phaseTime<c.phaseDuration*.5&&!peak){peak=true;writeFileSync(out+'/lightning-takeoff.png',canvas.toBuffer('image/png'));renderer.reducedEffects=true;renderer.render(game,c.elapsed);writeFileSync(out+'/lightning-takeoff-reduced.png',canvas.toBuffer('image/png'));renderer.reducedEffects=false;}
}
assert.equal(impacts.length,2);assert.ok(impacts[0].destroyed>0&&impacts[1].destroyed>impacts[0].destroyed);
writeFileSync(out+'/lightning-impact-proof.json',JSON.stringify({impacts,playerPositionClear:true,simulationTime:150/24},null,2));
const before=performance.now();for(let n=0;n<100;n++)renderer.render(game,c.elapsed);const nativeCanvasMs=(performance.now()-before)/100;
writeFileSync(out+'/report.json',JSON.stringify({renderer:'actual native Canvas',physicalDevice:false,simulationUnchanged:true,nativeCanvasMs,soak:reports,frames:frame,impacts},null,2));console.log(JSON.stringify({out,nativeCanvasMs,soak:reports,frames:frame,impacts},null,2));
