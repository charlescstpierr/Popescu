// Native SVG raster diagnostic, not a browser layout screenshot.
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),out=resolve(process.argv[2]||'/tmp/popescu-control-symbols');mkdirSync(out,{recursive:true});
const sheet=createCanvas(760,280),c=sheet.getContext('2d');c.fillStyle='#0d1023';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='#fff0c4';c.font='bold 17px sans-serif';c.fillText('NATIVE SVG DIAGNOSTIC — NOT A BROWSER SCREENSHOT',18,29);
const rows=[['pause',20,'HUD pause — 20 px', '#eecf85'],['story',17,'Intro arrow — 17 px','#bfa36a'],['skip-dialogue',9,'Skip arrow — 9 px','#e8d4c9'],['skip-dialogue',8,'Short screen — 8 px','#e8d4c9']];
for(let n=0;n<rows.length;n++){
 const [id,size,label,color]=rows[n],control=html.match(new RegExp(`<button\\b[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))[0],source=control.match(/<svg\b[\s\S]*?<\/svg>/)[0];
 const svg=source.replace(/width="[^"]*"/,`width="${size}"`).replace(/height="[^"]*"/,`height="${size}"`).replace('<svg ',`<svg color="${color}" `),image=await loadImage(Buffer.from(svg));
 const x=20+n*185;c.fillStyle='#c9bed0';c.font='12px sans-serif';c.fillText(label,x,65);c.fillStyle='#12152a';c.fillRect(x,84,44,44);c.strokeStyle='#796449';c.strokeRect(x+.5,84.5,43,43);c.drawImage(image,x+(44-size)/2,84+(44-size)/2);
 c.imageSmoothingEnabled=false;c.drawImage(image,x,148,size*5,size*5);c.imageSmoothingEnabled=true;c.fillStyle='#8f889c';c.font='10px sans-serif';c.fillText('Actual size + 5x pixels',x,265);
 writeFileSync(resolve(out,`${id}-${size}.svg`),svg);
}
writeFileSync(resolve(out,'native-control-symbols.png'),sheet.toBuffer('image/png'));console.log(out);
