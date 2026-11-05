// Deterministic UI thumbnail of the approved dialogue portrait, not new artwork.
// No source pixels are repainted. The small derivative avoids loading a 2.4 MB
// full-size portrait just to display the HUD during a returning player's run.
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=fileURLToPath(new URL('..',import.meta.url));
const source=await loadImage(resolve(root,'dist/assets/dialogue-toma.png'));
const canvas=createCanvas(160,200),c=canvas.getContext('2d');
c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
c.drawImage(source,255,40,520,650,0,0,160,200);
writeFileSync(resolve(root,'dist/assets/portrait-toma-current.webp'),canvas.toBuffer('image/webp',92));
