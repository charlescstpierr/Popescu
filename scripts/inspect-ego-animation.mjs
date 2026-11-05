// Actual runtime painting, not an illustrated mockup. Optional native Canvas QA.
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.POPESCU_CANVAS_MODULE||'@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(process.argv[2]||'/tmp/ego-animation-qa');mkdirSync(output,{recursive:true});process.chdir(resolve(root,'dist'));
globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};globalThis.Image=Image;
const {ActorArt}=await import('../dist/actor-art.js'),{drawEgoGround,drawEgoForeground,egoFrame}=await import('../dist/ego-art.js'),{EGO_BEASTS,initEgoBeast,beginEgoAttack,updateEgoBeast}=await import('../dist/ego-beasts.js');
const art=new ActorArt();await art.ready;assert.ok(art.available('ego'));
const {Renderer}=await import('../dist/renderer.js');
const types=Object.keys(EGO_BEASTS),labels=['Repos','Appui gauche','Appui droit','Préparation','Action','Reprise'];
const traits=['Bleu royal, roue verte et caméra dorée. Il cadre avant de flasher.','Trapu, gorge rose, bandeau et sifflet. Il ramasse son poids avant le saut.','Gilet turquoise, sac et reçus. Trois émissions, trois gestes synchronisés.','Lunettes, gilet violet, chaîne et queue dorées. La bouche précède la langue.'];
function painting(ctx,e,step,reduced=false){const before=JSON.stringify(e);drawEgoGround(ctx,e,reduced);art.draw(ctx,e,'enemy',step,{},0,reduced);drawEgoForeground(ctx,e,reduced);assert.equal(JSON.stringify(e),before);}
function actor(type,x,y){return initEgoBeast({id:1,type,x,y,r:EGO_BEASTS[type].r,phase:'chase',faceX:1,faceY:0,hp:100,maxhp:100});}
const cards=createCanvas(960,800),c=cards.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#211e33';c.fillRect(0,0,960,800);
for(const [row,type]of types.entries()){
 const y=row*200;c.fillStyle=EGO_BEASTS[type].color;c.font='bold 21px sans-serif';c.fillText(EGO_BEASTS[type].name,20,y+28);c.font='13px sans-serif';c.fillStyle='#d5cedc';c.fillText(traits[row],20,y+49);
 for(let col=0;col<6;col++){const e=actor(type,80+col*160,y+164);if(col>=3){beginEgoAttack(e,{x:e.x+35,y:e.y+40});e.phase=['ego_warning','ego_active','ego_recover'][col-3];e.egoTime=col===4?(type==='ego_toad'?.995:EGO_BEASTS[type].duration-.05):.7;}art.draw(c,e,'enemy',col===2?3:col,{},0,true);c.fillStyle='#e7dfea';c.font='12px sans-serif';c.textAlign='center';c.fillText(labels[col],e.x,y+193);c.textAlign='left';}
}
writeFileSync(resolve(output,'character-cards.png'),cards.toBuffer('image/png'));
const sheet=createCanvas(960,600),sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#28223b';sc.fillRect(0,0,960,600);
for(const [row,type]of types.entries())for(let step=0;step<8;step++){const e=actor(type,60+step*120,row*150+125);art.draw(sc,e,'enemy',step,{},0);sc.font='12px sans-serif';sc.fillStyle='#fff';sc.fillText(`${step}: pose ${egoFrame(e,step)}`,step*120+20,row*150+146);}
writeFileSync(resolve(output,'walk-contacts.png'),sheet.toBuffer('image/png'));
const status=createCanvas(800,600),st=status.getContext('2d');st.fillStyle='#28223b';st.fillRect(0,0,800,600);st.imageSmoothingEnabled=false;
const statusRenderer=Object.create(Renderer.prototype);Object.assign(statusRenderer,{ctx:st,actors:art,time:1,reducedEffects:false,_shadow(){}});
for(const [row,type]of types.entries())for(let col=0;col<4;col++){const e=actor(type,100+col*200,row*150+125);if(col>0)e.hp=40;if(col===2)e.charmed=2;if(col===3){e.hitFlash=.12;e.egoReveal=0;}const before=JSON.stringify(e);statusRenderer._actor(e,'enemy',0,{});assert.equal(JSON.stringify(e),before);st.font='12px sans-serif';st.fillStyle='#fff';st.fillText(['Intact','Vie endommagée','Charmé','Impact / camouflage'][col],col*200+25,row*150+146);}
writeFileSync(resolve(output,'status-feedback.png'),status.toBuffer('image/png'));
// Use real simulation phase transitions and clocks. The scene is an isolated
// four-cell motion study, not a physical-device performance claim.
const frames=resolve(output,'frames');mkdirSync(frames,{recursive:true});const canvas=createCanvas(780,600),ctx=canvas.getContext('2d'),fps=30,seconds=7;
const actors=types.map(type=>actor(type,130,180)),sim={world:{collides:()=>false},s:{x:240,y:240},difficulty:{damage:1},damage(){}};
for(let frame=0;frame<fps*seconds;frame++){
 ctx.fillStyle='#28223b';ctx.fillRect(0,0,780,600);ctx.imageSmoothingEnabled=false;
 for(const [index,e]of actors.entries()){
  const ox=index%2*390,oy=Math.floor(index/2)*300;ctx.save();ctx.beginPath();ctx.rect(ox,oy,390,300);ctx.clip();ctx.translate(ox,oy);
  ctx.strokeStyle='#484258';ctx.beginPath();ctx.moveTo(0,205);ctx.lineTo(390,205);ctx.stroke();ctx.font='bold 17px sans-serif';ctx.fillStyle=EGO_BEASTS[e.type].color;ctx.fillText(EGO_BEASTS[e.type].name,14,25);
  if(frame===fps){beginEgoAttack(e,{x:220,y:215});}
  if(frame>=fps&&e.phase!=='chase')updateEgoBeast(sim,e,1/fps);
  painting(ctx,e,Math.floor(frame/fps*10));ctx.font='13px sans-serif';ctx.fillStyle='#e7dfea';ctx.fillText(`${e.phase} · pose ${egoFrame(e,Math.floor(frame/fps*10))}`,14,280);ctx.restore();
 }
 writeFileSync(resolve(frames,`${String(frame).padStart(4,'0')}.png`),canvas.toBuffer('image/png'));
 if([0,30,58,65,75,85,100,120,160,205].includes(frame))writeFileSync(resolve(output,`motion-${String(frame).padStart(3,'0')}.png`),canvas.toBuffer('image/png'));
}
assert.ok(art.cache.size<=144);writeFileSync(resolve(output,'proof.json'),JSON.stringify({ok:true,frames:fps*seconds,fps,renderer:'native Canvas',simulationMutationByRender:false,cacheSize:art.cache.size,output},null,2)+'\n');console.log(output);
