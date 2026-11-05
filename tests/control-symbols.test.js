import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {app} from './helpers/focus-controller.js';
import {EVENTS} from '../dist/content.js';
const require=createRequire(import.meta.url);
let canvas;try{canvas=require('@napi-rs/canvas');}catch{}
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
function button(id){return html.match(new RegExp(`<button\\b[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0]||'';}
async function pixels(id){
 const control=button(id),source=control.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
 assert.ok(source,`${id} must paint its symbol without relying on missing font glyphs`);
 assert.match(source,/aria-hidden="true"/,'decorative image must not replace or duplicate its button label');
 assert.match(source,/focusable="false"/,'symbol must not become another keyboard target');
 const svg=source.replace(/width="[^"]*"/,'width="64"').replace(/height="[^"]*"/,'height="64"').replace('<svg ','<svg color="#efc86c" ');
 const image=await canvas.loadImage(Buffer.from(svg)),surface=canvas.createCanvas(64,64),ctx=surface.getContext('2d');ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,64,64).data;
 return {control,data,alpha:(x,y)=>data[(y*64+x)*4+3]};
}
test('HUD pause paints two separate bars without any font support', {skip:canvas?false:'@napi-rs/canvas is not installed'},async()=>{
 const {control,alpha}=await pixels('pause');assert.match(control,/aria-label="Mettre en pause"/);
 for(const x of [22,41])for(const y of [14,32,49])assert.ok(alpha(x,y)>200,'pause bar remains visible');
 for(const [x,y] of [[32,14],[32,32],[32,49],[22,5],[22,58]])assert.equal(alpha(x,y),0,'not a hollow missing-glyph rectangle');
});
test('intro and skip arrows paint matching northeast strokes without font support', {skip:canvas?false:'@napi-rs/canvas is not installed'},async()=>{
 const first=await pixels('story'),second=await pixels('skip-dialogue');
 assert.deepEqual(first.data,second.data,'both affected arrows use the same geometry');
 for(const [x,y] of [[12,52],[32,32],[52,12],[32,12],[52,32]])assert.ok(first.alpha(x,y)>128,'arrow shaft and head remain visible');
 for(const [x,y] of [[12,12],[12,32],[32,52],[52,52]])assert.equal(first.alpha(x,y),0,'arrow is not a missing-glyph box');
 assert.match(first.control,/REVOIR L’INTRO/);assert.match(second.control,/TOUT PASSER/);
});
test('decorative symbols preserve pause, intro and skip controller behavior',async()=>{
 const a=app();await a.click('play');a.click('pause');assert.equal(a.controller.screen,'pause-screen');assert.equal(a.game.s.mode,'paused');
 a.click('resume');assert.equal(a.controller.screen,'hud');a.game.startDialogue(EVENTS.companion);a.click('skip-dialogue');assert.equal(a.controller.screen,'hud');assert.equal(a.game.encounters.outcomes['companion:invocation'],'skipped');
 a.click('pause');await a.click('pause-menu');a.click('story');assert.equal(a.controller.screen,'dialogue');a.click('skip-dialogue');assert.equal(a.controller.screen,'menu');
});
