import {registerInspectionFonts} from './canvas-fonts.mjs';
registerInspectionFonts();
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{createCanvas,Image}=require('@napi-rs/canvas');
const root=resolve(import.meta.dirname,'..'),out=resolve(process.argv[2]||root+'/proof/trophies');mkdirSync(out,{recursive:true});process.chdir(root+'/dist');globalThis.Image=Image;globalThis.OffscreenCanvas=class{constructor(w,h){return createCanvas(w,h)}};
const {Game}=await import('../dist/engine.js'),{Renderer}=await import('../dist/renderer.js'),{drawTrophyIcon,drawTrophyPortrait}=await import('../dist/trophy-art.js');
for(const [w,h] of [[390,844],[320,568]])for(const reduced of [false,true]){const game=new Game({seed:42}),canvas=createCanvas(w,h),renderer=new Renderer(canvas);await renderer.ready;renderer.resize(w,h);renderer.reducedEffects=reduced;game.setViewport(w,h);Object.assign(game.s,{x:0,y:0,elapsed:214,level:8,faceX:1,faceY:0,mode:'trophy'});game.s.enemies=[];const e=game.spawnEnemy('normal',-80,55);e.trophyCharmLife=2.5;game.s.trophies.chosen={pelican:'tarot',travestia:'panache',matriarch:'fanclub'};game.s.trophies.tarot={x:95,y:-65,originX:0,originY:-65,dx:1,dy:0,age:.35,hitOut:[],hitBack:[]};game.s.trophies.panache={x:0,y:0,dx:1,dy:0,life:.3,hitIds:[]};const before=JSON.stringify(game.s);renderer.render(game,214);assert.equal(JSON.stringify(game.s),before);writeFileSync(`${out}/effects-${w}${reduced?'-reduced':''}.png`,canvas.toBuffer('image/png'));
 if(w===390&&!reduced){for(const type of ['pelican','travestia','matriarch']){const portrait=createCanvas(320,140);drawTrophyPortrait(portrait.getContext('2d'),renderer.actors,type);writeFileSync(`${out}/portrait-${type}.png`,portrait.toBuffer('image/png'));}const icons=createCanvas(360,60),c=icons.getContext('2d');c.fillStyle='#17182e';c.fillRect(0,0,360,60);for(const [i,id] of ['tarot','ascendant','panache','star','fanclub','badge'].entries())drawTrophyIcon(c,id,30+i*60,30,1.2,i<2?'#cc9cf6':i<4?'#f68dbb':'#f0ca70');writeFileSync(`${out}/icons.png`,icons.toBuffer('image/png'));}}
console.log('Actual native renderer images and read-only verification, both sizes and effects settings: '+out);
