// Native Canvas captures exercise the exact gameplay renderer; no CSS mockup.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};globalThis.Image=Image;
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{CAR_LEVELS}=await import('../dist/lamborghini.js'),{drawLamborghini}=await import('../dist/lamborghini-art.js');
const out=resolve(process.argv[2]||resolve(root,'proof/lamborghini'));mkdirSync(out,{recursive:true});
const canvas=createCanvas(390,844),renderer=new Renderer(canvas);await renderer.ready;
const report={size:[390,844],ranks:[],renderReadOnly:true,physicalMobile:false,browser:false};
const make=(w,h)=>{const c=createCanvas(w,h),x=c.getContext('2d');x.fillStyle='#141124';x.fillRect(0,0,w,h);return[c,x];};
const [sheet,ctx]=make(1950,932),[reduced,rc]=make(1950,932),[art,ac]=make(1400,390);
ac.fillStyle='#fff0c0';ac.font='bold 25px sans-serif';ac.fillText('LAMBORGHINI · 5 RANGS · RENDU DU JEU',30,37);
for(let rank=1;rank<=5;rank++){
 const game=new Game({seed:42}),s=game.s;s.upg.car=rank;s.shotClock=999;for(const key in game.timers)game.timers[key]=999;game.timers.car=0;game.weapons(0);
 game.updateVehicles((480+45)/CAR_LEVELS[rank-1].speed);
 Object.assign(s,{elapsed:150,faceX:1,faceY:0,walkDistance:12,walkMoving:true});game.powerEffects=[];
 for(const [type,x,y]of [['normal',-88,-150],['sprinter',120,-215],['gas',-100,155],['jealous',100,180]])game.spawnEnemy(type,x,y);
 const warning=game.spawnEnemy('explosive',45,40);warning.windup=.7;
 s.drops=[{x:100,y:5,kind:'xp',value:1,life:20},{x:123,y:85,kind:'xp',value:1,life:20},{x:-40,y:93,kind:'coin',value:1,life:20}];
 const before=JSON.stringify(s);renderer.render(game,150);assert.equal(JSON.stringify(s),before);
 const bytes=canvas.toBuffer('image/png');writeFileSync(resolve(out,`in-game-rank-${rank}.png`),bytes);ctx.putImageData(canvas.getContext('2d').getImageData(0,0,390,844),(rank-1)*390,88);
 renderer.reducedEffects=true;renderer.render(game,150);assert.equal(JSON.stringify(s),before);rc.putImageData(canvas.getContext('2d').getImageData(0,0,390,844),(rank-1)*390,88);writeFileSync(resolve(out,`reduced-rank-${rank}.png`),canvas.toBuffer('image/png'));renderer.reducedEffects=false;
 for(const c of [ctx,rc]){c.fillStyle='#ffe4a3';c.font='bold 17px sans-serif';c.fillText(`NIV. ${rank} · ${CAR_LEVELS[rank-1].name}`,(rank-1)*390+15,25);c.fillStyle='#e8d7eb';c.font='13px sans-serif';c.fillText(['Un passage droit','Repousse au contact','Couloir réellement élargi','Pause, puis retour','Deux voitures, décalées'][rank-1],(rank-1)*390+15,49);c.fillText('Alerte orange dessinée au-dessus du véhicule',(rank-1)*390+15,69);}
 ac.fillStyle='#ffe4a3';ac.font='bold 17px sans-serif';ac.fillText(`${rank} · ${CAR_LEVELS[rank-1].name}`,rank*280-265,76);ac.save();ac.translate(rank*280-140,174);ac.scale(2.2,2.2);drawLamborghini(ac,{carRank:rank,carPhase:'out',carDelay:0,x:0,y:0,vx:595},false);ac.restore();
 if(rank===5){ac.save();ac.translate(rank*280-140,300);ac.scale(1.05,1.05);drawLamborghini(ac,{carRank:rank,carPhase:'out',carDelay:0,x:-40,y:0,vx:595},false);drawLamborghini(ac,{carRank:rank,carPhase:'out',carDelay:0,x:70,y:13,vx:595},false);ac.restore();}
 if(rank===4){ac.save();ac.translate(rank*280-140,310);ac.scale(1.4,1.4);drawLamborghini(ac,{carRank:rank,carPhase:'back',carDelay:0,x:0,y:0,vx:-560},false);ac.restore();}
 const t=performance.now();for(let i=0;i<60;i++)renderer.render(game,150+i/60);report.ranks.push({rank,file:`in-game-rank-${rank}.png`,sha256:createHash('sha256').update(bytes).digest('hex'),nativeCanvasMs:Number(((performance.now()-t)/60).toFixed(2))});
}
assert.equal(new Set(report.ranks.map(r=>r.sha256)).size,5);
writeFileSync(resolve(out,'five-ranks-in-game.png'),sheet.toBuffer('image/png'));writeFileSync(resolve(out,'five-ranks-reduced.png'),reduced.toBuffer('image/png'));writeFileSync(resolve(out,'five-ranks-art.png'),art.toBuffer('image/png'));
// Actual reverse journey and a crowded scene, without changing car coordinates.
const g=new Game({seed:42});g.s.upg.car=4;g.timers.car=0;g.weapons(0);g.updateVehicles(960/560+.32+435/560);g.s.elapsed=151;renderer.render(g,151);writeFileSync(resolve(out,'return-rank-4.png'),canvas.toBuffer('image/png'));assert.equal(g.s.vehicles[0].carPhase,'back');
const dense=new Game({seed:42});dense.s.upg.car=5;dense.timers.car=0;dense.weapons(0);dense.updateVehicles(525/595);for(let i=0;i<300;i++)dense.spawnEnemy('normal',(i%20-10)*20,(Math.floor(i/20)-7)*25);dense.s.elapsed=150;const t=performance.now();for(let i=0;i<60;i++)renderer.render(dense,150+i/60);report.dense300EnemiesNativeCanvasMs=Number(((performance.now()-t)/60).toFixed(2));report.denseActiveCars=dense.s.vehicles.length;
writeFileSync(resolve(out,'render-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
