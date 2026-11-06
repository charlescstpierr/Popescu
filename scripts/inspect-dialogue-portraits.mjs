import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
// Native decoding + production SVG framing. This is not a browser/CSS screenshot.
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {encounterPresentation,encounterPortraitFrame} from '../dist/dialogue-presentation.js';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(process.argv[2]||'/tmp/toma-dialogue-portraits');mkdirSync(out,{recursive:true});
const entries=[['PÉLI ZODIAQUE','pelican',1],['TOMA','pelican',1],['TRAVESTIA','travestia',1],['TOMA','travestia',1],['CHARLES','charles',1],['TOMA','charles',1],...Array.from({length:5},(_,i)=>['BLONDE IA','companion',i+1]),['TOMA','companion',5],['SYSTÈME',null,0]];
const tileW=260,tileH=390,atlas=createCanvas(tileW*4,tileH*4),actx=atlas.getContext('2d');actx.fillStyle='#12101f';actx.fillRect(0,0,atlas.width,atlas.height);
const report=[];
for(const [i,[who,actorType,rank]] of entries.entries()){
 const context={actorType,sceneId:actorType==='companion'?'companion:invocation':actorType==='charles'?'charles:0':actorType?`boss:${actorType}`:null,companionRank:rank};
 const model=encounterPresentation({line:{who,text:'Réplique'},context}),canvas=createCanvas(tileW,tileH),c=canvas.getContext('2d');c.fillStyle='#20162b';c.fillRect(0,0,tileW,tileH);
 let frame=null;
 if(model.portraits.length){const source=model.portraits[0],image=await loadImage(resolve(root,'dist',source));frame=encounterPortraitFrame(source);const [x,y,w,h]=frame.viewBox;
  assert.equal(image.width,frame.width);assert.equal(image.height,frame.height);
  const scale=Math.min((tileW-20)/w,310/h),dw=w*scale,dh=h*scale;c.imageSmoothingEnabled=source.endsWith('.png')&&!source.includes('companion-portrait');c.drawImage(image,x,y,w,h,(tileW-dw)/2,318-dh,dw,dh);
 }else{c.fillStyle='#ffe878';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('MESSAGE SYSTÈME',tileW/2,160);}
 c.fillStyle='#22102d';c.fillRect(0,320,tileW,70);c.strokeStyle='#f1bd3f';c.strokeRect(2,322,tileW-4,66);c.fillStyle='#ffe878';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText(model.name,tileW/2,345);c.font='12px sans-serif';c.fillText(`Scène ${actorType||'ordinaire'}${actorType==='companion'?' · niveau '+rank:''}`,tileW/2,369);
 const name=`${String(i+1).padStart(2,'0')}-${model.speakerType||'system'}-${actorType||'ordinary'}.png`;writeFileSync(resolve(out,name),canvas.toBuffer('image/png'));actx.drawImage(canvas,(i%4)*tileW,Math.floor(i/4)*tileH);report.push({name,who,context,portrait:model.portraits[0]||null,frame});
}
writeFileSync(resolve(out,'native-portrait-contact.png'),atlas.toBuffer('image/png'));writeFileSync(resolve(out,'native-portrait-report.json'),JSON.stringify({method:'Native asset decoding and production frame selection, not browser layout validation',entries:report},null,2)+'\n');console.log(out);
