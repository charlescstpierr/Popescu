import {createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve,dirname}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{spawn}from'node:child_process';import{once}from'node:events';import assert from'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(process.argv[2]||root+'/proof/motion'),base=process.argv[3]?resolve(process.argv[3]):null;if(!base)throw Error('Usage: node scripts/inspect-hero-motion.mjs OUTPUT BASELINE_CHECKOUT');mkdirSync(out,{recursive:true});
const{createCanvas,Image}=createRequire(import.meta.url)('@napi-rs/canvas');globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
async function setup(path){const [{Game},{Renderer},{computeHeroPose}]=await Promise.all(['engine','renderer','hero-pose'].map(n=>import(pathToFileURL(path+'/dist/'+n+'.js'))));const canvas=createCanvas(390,500),r=new Renderer(canvas);await r.ready;const g=new Game({seed:42});g.setViewport(390,500);for(const k of Object.keys(g.timers))g.timers[k]=100000;g.nextEvent=100000;g.s.shotClock=.3;const target=g.spawnEnemy('tank',180,-40);target.speed=0;target.hp=target.maxhp=10000;return{g,r,canvas,target,computeHeroPose};}
const old=await setup(base),next=await setup(root),video=createCanvas(780,500),vc=video.getContext('2d'),contact=createCanvas(1560,1500),cc=contact.getContext('2d'),records=[];
const ff=spawn('ffmpeg',['-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s','780x500','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',out+'/before-after.mp4'],{stdio:['pipe','ignore','pipe']});let stderr='';ff.stderr.on('data',d=>stderr+=d);const completed=once(ff,'close');
for(let f=0;f<240;f++){
 const time=f/30,angle=time<4?time/4*Math.PI*2:(Math.floor((time-4)*2)%2?Math.PI:0),frame={time};
 for(const [index,name,o]of [[0,'before',old],[1,'after',next]]){
  const{g,r,canvas,target,computeHeroPose}=o;target.x=g.s.x+Math.cos(angle)*180;target.y=g.s.y-40+Math.sin(angle)*180;
  g.s.shotClock=.3;const input=time<4?{x:.65,y:0}:{x:Math.floor((time-4)*2)%2?-.65:.65,y:0};g.update(1/30,input);g.s.shots=[];g.s.shotClock=.3;
  const pose=computeHeroPose(g.s);frame[name]={view:pose.art.id,phase:pose.art.frameIndex,muzzle:pose.muzzle,position:{x:g.s.x,y:g.s.y}};
  const before=JSON.stringify(g.s);const start=performance.now();r.render(g,time);frame[name].renderMs=performance.now()-start;assert.equal(JSON.stringify(g.s),before);vc.drawImage(canvas,index*390,0);
  vc.fillStyle='#171525';vc.fillRect(index*390,0,390,33);vc.fillStyle='#f8d99a';vc.font='bold 14px sans-serif';vc.fillText((index?'APRÈS · 14 vues, virages liés':'AVANT · 8 vues, sauts directs'),index*390+12,22);
  if(f%20===0){const k=f/20,x=(k%4)*390,y=Math.floor(k/4)*500; if(index===1){cc.drawImage(canvas,x,y);cc.fillStyle='#171525';cc.fillRect(x,y,390,30);cc.fillStyle='#f8d99a';cc.font='bold 12px sans-serif';cc.fillText(`${time.toFixed(2)} s · ${pose.art.id} · pas ${pose.art.frameIndex}`,x+12,y+20);}}
 }
 if(!ff.stdin.write(Buffer.from(vc.getImageData(0,0,780,500).data)))await once(ff.stdin,'drain');if([0,30,60,90,120,123,126,150,180,210].includes(f))writeFileSync(out+`/frame-${String(f).padStart(3,'0')}.png`,video.toBuffer('image/png'));records.push(frame);
}
ff.stdin.end();const[code]=await completed;assert.equal(code,0,stderr);writeFileSync(out+'/motion-contact.png',contact.toBuffer('image/png'));writeFileSync(out+'/frames.json',JSON.stringify({evidence:'Controlled native Canvas full renderer with real Game.update inputs and a scripted orbiting target, not browser or phone.',fps:30,seconds:8,records},null,2));console.log(out);
