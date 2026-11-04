// Native diagnostic compositor, NOT a browser or mobile screenshot.
// The world is the real Renderer. UI geometry follows the encounter CSS contract,
// but Canvas does not resolve CSS, accessibility trees, scrolling or touch input.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {encounterLines} from '../dist/encounter-dialogue.js';
import {captureRun,restoreRun} from '../dist/run-save.js';
import {encounterPresentation,encounterPortraitFrame} from '../dist/dialogue-presentation.js';
const require=createRequire(import.meta.url),{createCanvas,loadImage,Image,GlobalFonts}=require('@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','QA Sans');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','QA Sans');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf','QA Serif');
const root=resolve(import.meta.dirname,'..'),out=resolve(process.argv[2]||root+'/proof/dialogue-presentation');
mkdirSync(out,{recursive:true});process.chdir(root+'/dist');
globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h);}};
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js');
const sourceHashes=Object.fromEntries(['dist/styles.css','dist/index.html','dist/dialogue-presentation.js'].map(p=>[p,createHash('sha256').update(readFileSync(root+'/'+p)).digest('hex')]));
const cases=[
 {id:'charles-390',actor:'charles',width:390,height:844,index:1},
 {id:'pelican-390',actor:'pelican',width:390,height:844,text:'Approche, Toma. Mononcle a sorti ses cartes juste pour toi.',who:'PÉLI ZODIAQUE'},
 {id:'travestia-390',actor:'travestia',width:390,height:844,text:'Toma, arrête de regarder ma queue. Ou viens la voir de proche !',who:'TRAVESTIA'},
 {id:'companion-390',actor:'companion',rank:1,width:390,height:844,text:'Toma ! Par ici !',who:'BLONDE IA'},
 {id:'toma-reply-320',actor:'pelican',index:1,width:320,height:568,text:'C’est pas ma faute si même les étoiles parlent de moi.',who:'TOMA'},
 {id:'charles-safe-390',actor:'charles',width:390,height:844,safeTop:44,safeBottom:34,index:1},
 {id:'stress-long-short-safe-320',stress:true,actor:'travestia',width:320,height:320,safeTop:24,safeBottom:20,text:'Une longue réplique reste lisible. '.repeat(20),who:'TOMA'},
 {id:'stress-failed-art-390',stress:true,actor:'charles',width:390,height:844,noArt:true,text:'Le dialogue et les commandes restent disponibles sans portrait.',who:'TOMA'},
 ...[2,3,4,5].map(rank=>({id:`companion-rank-${rank}-restored`,actor:'companion',rank,restored:true,width:390,height:844,text:'Toma ! Par ici !',who:'BLONDE IA'}))
];
cases.push({id:'charles-430x932',actor:'charles',width:430,height:932,index:1},{id:'travestia-landscape-app-460x390',actor:'travestia',width:460,height:390,safeLeft:44,safeRight:44},{id:'companion-toma-reply',actor:'companion',rank:1,width:390,height:844,index:1});
function wrap(c,text,width){
 const lines=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(c.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;
}
function frame(c,x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#38113f');g.addColorStop(1,'#200a2e');c.fillStyle=g;c.fillRect(x,y,w,h);c.lineWidth=3;c.strokeStyle='#f1bd3f';c.strokeRect(x+1.5,y+1.5,w-3,h-3);c.lineWidth=1;c.strokeStyle='#fff0a2';c.strokeRect(x+6,y+6,w-12,h-12);}
const reports=[];const images=[];
for(const item of cases){
 const {width:w,height:h,actor,rank=1,safeTop=0,safeBottom=0,safeLeft=0,safeRight=0}=item;
 let game=new Game({seed:42});game.setViewport(w,h);game.setPausedEncountersEnabled(true);Object.assign(game.s,{elapsed:132,x:0,y:0});
 const id=actor==='charles'?'charles:0':actor==='companion'?'companion:invocation':`boss:${actor}`,sceneLines=encounterLines(id),cursor=item.index??(item.who==='TOMA'?1:0),line=sceneLines[cursor];if(!item.stress){item.who=line.who;item.text=line.text;}
 if(actor==='charles'){game.s.elapsed=1200;game.s.mode='victory';game.startCharlesEpilogue();}
 else if(actor==='companion'){game.s.upg.girlfriend=rank;game.s.companion=true;Object.assign(game.s.girl,{x:65,y:-135,hp:95,maxhp:95,down:0,faceX:-1,faceY:0,walkMoving:false});game.recalculate();}
 else game.spawnEnemy(actor,65,-130);
 const actorId=actor==='companion'?null:actor==='charles'?game.s.charles.id:game.s.enemies.at(-1).id;
 assert.equal(game.queueEncounterDialogue({id,actorId,actorType:actor,scope:actor==='charles'?'charles':'survival'}),true);assert.equal(game.openEncounterDialogue(),true);for(let n=0;n<cursor;n++)game.advanceEncounterDialogue(id,n);
 if(item.restored){game=restoreRun(captureRun(game));game.setViewport(w,h);assert.equal(game.encounters.active.index,cursor);}
 const world=createCanvas(w,h),renderer=new Renderer(world);renderer.resize(w,h);await renderer.ready;
 const before=JSON.stringify(game.s);renderer.render(game,game.s.elapsed);assert.equal(JSON.stringify(game.s),before,'actual world render must not mutate simulation');
 const first=world.toBuffer('image/png');renderer.render(game,game.s.elapsed);assert.deepEqual(world.toBuffer('image/png'),first,'frozen real world stable at same scene time');
 const canvas=createCanvas(w,h+38),c=canvas.getContext('2d');c.fillStyle='#111827';c.fillRect(0,0,w,h+38);c.fillStyle='#fde68a';c.font='bold 10px "QA Sans"';c.fillText('QA CANVAS NATIVE · PAS UNE CAPTURE NAVIGATEUR',8,14);c.fillStyle='#cbd5e1';c.font='9px "QA Sans"';c.fillText('Décor réel gelé · composition UI indicative',8,29);c.save();c.translate(0,38);c.drawImage(world,0,0);
 const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#170d260d');shade.addColorStop(.6,'#200b2929');shade.addColorStop(1,'#14071f99');c.fillStyle=shade;c.fillRect(0,0,w,h);
 const context=game.dialoguePresentation(line);assert.equal(context.actorType,actor);if(actor==='companion')assert.equal(context.companionRank,rank);
 const model=encounterPresentation({line:{who:item.who,text:item.text},context});
 const short=h<=440,compact=h<=620,padTop=8+safeTop,padBottom=(short?8:compact?10:14)+safeBottom,innerH=h-padTop-padBottom,padLeft=Math.max(w<355&&!short?8:10,safeLeft),padRight=Math.max(w<355&&!short?8:10,safeRight),innerW=w-padLeft-padRight;
 const firstColumn=Math.max(60,innerW*.28),x=padLeft+2,boxW=short?innerW-firstColumn-10-4:innerW-4,boxX=short?padLeft+firstColumn+10+2:x;
 const boxH=short?innerH-44-20:Math.max(compact?204:236,innerH*(compact?.43:.34));
 const boxY=h-padBottom-boxH,visualTop=padTop+44+8,visualHeight=boxY-visualTop+17;
 c.font='bold 12px "QA Serif"';c.fillStyle='#ffe476';c.fillText('TOMA POPESCU',padLeft+2,padTop+27);frame(c,w-padRight-149,padTop+8,147,28);c.font='bold 11px "QA Serif"';c.fillStyle='#fff1bd';c.fillText('Ⅱ  SCÈNE EN PAUSE',w-padRight-140,padTop+26);
 const artPath=model.portraits.find(p=>existsSync(root+'/dist/'+p));let image=null;
 if(!item.noArt&&artPath)image=await loadImage(root+'/dist/'+artPath);
 if(image){const area=short?{x:padLeft-6,y:padTop+88,w:firstColumn+12,h:h-padBottom-(padTop+88)}:{x:0,y:visualTop,w,h:visualHeight};const old=artPath.includes('companion-portrait');if(old){area.x+=area.w*.125;area.w*=.75;}const [sx,sy,sw,sh]=encounterPortraitFrame(artPath).viewBox;const scale=Math.min(area.w/sw,area.h/sh);c.imageSmoothingEnabled=!old;if(short){const layer=createCanvas(Math.ceil(area.w),Math.ceil(area.h)),lc=layer.getContext('2d');lc.drawImage(image,sx,sy,sw,sh,(area.w-sw*scale)/2,area.h-sh*scale,sw*scale,sh*scale);lc.globalCompositeOperation='destination-in';const fade=lc.createLinearGradient(0,0,0,area.h);fade.addColorStop(0,'#000');fade.addColorStop(.83,'#000');fade.addColorStop(.99,'#0000');fade.addColorStop(1,'#0000');lc.fillStyle=fade;lc.fillRect(0,0,area.w,area.h);c.drawImage(layer,area.x,area.y);}else c.drawImage(image,sx,sy,sw,sh,area.x+(area.w-sw*scale)/2,area.y+area.h-sh*scale,sw*scale,sh*scale);}
 else{c.font='11px "QA Sans"';c.fillStyle='#e1d2c1';c.textAlign='center';c.fillText('Portrait indisponible',w/2,boxY-35);c.textAlign='left';}
 const skipX=short?Math.max(10,safeLeft):w-Math.max(12,safeRight)-98;c.fillStyle='#170e28e6';c.fillRect(skipX,58+safeTop,98,44);c.strokeStyle='#b79b78';c.lineWidth=1;c.strokeRect(skipX+.5,58.5+safeTop,97,43);c.font='9px "QA Sans"';c.fillStyle='#e8d4c9';c.fillText('TOUT PASSER ↗',skipX+10,85+safeTop);
 frame(c,boxX,boxY,boxW,boxH);
 const nameFont=short?14:compact||w<355?19:Math.min(25,w*.053),nameH=model.subtitle?(compact?43:51):(compact?34:39);c.font=`bold ${nameFont}px "QA Serif"`;const nameW=Math.min(boxW*.94,Math.max(boxW*.58,c.measureText(model.name).width+34));frame(c,boxX+(boxW-nameW)/2,boxY-nameH*.55,nameW,nameH);c.fillStyle='#ffe878';c.textAlign='center';c.fillText(model.name,boxX+boxW/2,boxY-nameH*.55+nameFont+6);if(model.subtitle){c.font=`bold ${short?8:compact?9:10}px "QA Serif"`;c.fillText(model.subtitle,boxX+boxW/2,boxY-nameH*.55+nameH-8);}c.textAlign='left';
 const padding=short?10:compact||w<355?12:15,bodyX=boxX+3+padding,bodyW=boxW-6-padding*2,personY=boxY+(short?22:compact?24:29)+3;
 c.font=`bold ${short?9:11}px "QA Sans"`;c.fillStyle=model.reply?'#ffeab0':'#ddc7df';c.fillText(model.reply?'TOMA POPESCU · RÉPOND':model.name,bodyX,personY+11);c.font=`bold ${short?10:12}px monospace`;c.textAlign='right';c.fillText(`${cursor+1} / ${sceneLines.length}`,boxX+boxW-padding-3,personY+11);c.textAlign='left';
 const footerH=compact?44:48,footerY=boxY+boxH-3-(short?7:compact?9:11)-footerH,textY=personY+18+(compact?4:6),textH=footerY-textY-(compact?4:6),fontSize=short?16:compact||w<355?19:Math.min(30,w*.067),lineH=fontSize*(compact?1.23:1.24);
 c.font=`bold ${fontSize}px "QA Sans"`;const lines=wrap(c,item.text,bodyW-2),visibleLines=Math.floor((textH-12)/lineH),needsScroll=lines.length>visibleLines;
 c.save();c.beginPath();c.rect(bodyX,textY,bodyW,textH);c.clip();c.fillStyle='#fff4d8';lines.slice(0,Math.max(1,visibleLines)).forEach((text,n)=>c.fillText(text,bodyX+1,textY+6+fontSize+n*lineH));c.restore();
 if(needsScroll){c.fillStyle='#d4a65a';c.fillRect(bodyX+bodyW-2,textY+5,2,Math.max(16,textH*.3));}
 const nextW=short?100:w<355?141:156,nextX=bodyX+bodyW-nextW;c.font=`bold ${short?8:9}px "QA Sans"`;c.fillStyle='#d2bed9';c.fillText('AUTO : NON',bodyX,footerY+27);frame(c,nextX,footerY+2,nextW,44);c.fillStyle='#ffe67b';c.font=`bold ${short?12:w<355?15:16}px "QA Serif"`;c.textAlign='center';c.fillText('CONTINUER ›',nextX+nextW/2,footerY+30);c.textAlign='left';
 assert.ok(boxY>=padTop+44,'box does not collide with top controls');assert.ok(footerY+46<=h-safeBottom,'controls remain above bottom safe area');assert.ok(textH>=20,'scroll surface remains visible');assert.ok(nextX>=bodyX+44,'AUTO and Continue targets do not overlap');
 c.restore();const file=out+'/'+item.id+'.png';writeFileSync(file,canvas.toBuffer('image/png'));images.push({canvas,id:item.id});reports.push({id:item.id,sourceScene:id,sourceCursor:cursor,sourceText:item.text,syntheticStress:Boolean(item.stress),restored:Boolean(item.restored),width:w,height:h,safeTop,safeBottom,safeLeft,safeRight,asset:artPath??null,artShown:!!image,box:{x:boxX,y:boxY,width:boxW,height:boxH},textHeight:textH,lines:lines.length,visibleLines,needsScroll,nextTarget:{x:nextX,y:footerY+2,width:nextW,height:44},frozenWorld:true,file});
}
const sheet=createCanvas(4*390,2*882),cc=sheet.getContext('2d');cc.fillStyle='#0b1020';cc.fillRect(0,0,sheet.width,sheet.height);for(let i=0;i<8;i++){const {canvas}=images[i];cc.drawImage(canvas,(i%4)*390,Math.floor(i/4)*882);}
writeFileSync(out+'/native-contact-sheet.png',sheet.toBuffer('image/png'));
writeFileSync(out+'/native-layout-report.json',JSON.stringify({method:'Native Canvas diagnostic. Actual game world rendered and frozen. UI is an indicative composition matching CSS values, not browser CSS output. No mobile/browser verification.',sourceHashes,cases:reports},null,2));
console.log(JSON.stringify({nativeDiagnosticCases:reports.length,frozenWorld:true,output:out,missingApprovedArt:reports.filter(r=>!r.artShown&&!r.id.includes('failed-art')).map(r=>r.id),limitation:'No browser CSS compositor, screen reader or physical mobile verification.'},null,2));
