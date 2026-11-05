/** Register three intact generated Charles paintings. Only uniform scaling and translation. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,'../../..');
const require=createRequire(path.join(repo,'package.json'));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const sourcePath=path.join(root,'poses-transparent-source.png');
const source=await loadImage(sourcePath);
if(source.width!==2172||source.height!==724)throw new Error('Source must be 2172 x 724');
const cell=176,scale=.185,anchor=[88,160],sourceCell=724;
const definitions=[
 {name:'fly',sourceAnchor:[300,710],eyes:[[473,93],[494,93]],snap:null},
 {name:'snap_ready',sourceAnchor:[1097,708],eyes:[[1104,93],[1126,93]],snap:[982,134]},
 {name:'snap_release',sourceAnchor:[1780,708],eyes:[[1785,93],[1805,93]],snap:[1665,137]},
];
const atlas=createCanvas(cell*3,cell),ctx=atlas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
const frames=[];
for(let i=0;i<definitions.length;i++){
 const f=definitions[i],sx=i*sourceCell,sy=0,dx=anchor[0]-(f.sourceAnchor[0]-sx)*scale,dy=anchor[1]-f.sourceAnchor[1]*scale;
 ctx.save();ctx.beginPath();ctx.rect(i*cell,0,cell,cell);ctx.clip();
 ctx.drawImage(source,sx,sy,sourceCell,sourceCell,i*cell+dx,dy,sourceCell*scale,sourceCell*scale);ctx.restore();
 const local=([x,y])=>[+(anchor[0]+(x-f.sourceAnchor[0])*scale).toFixed(3),+(anchor[1]+(y-f.sourceAnchor[1])*scale).toFixed(3)];
 frames.push({index:i,name:f.name,sourceRect:[sx,sy,sourceCell,sourceCell],sourceAnchor:f.sourceAnchor,scale,translation:[dx,dy],eyes:f.eyes.map(local),sourceEyes:f.eyes,sourceSnapPoint:f.snap,snapPoint:f.snap?local(f.snap):null});
}
fs.mkdirSync(path.join(repo,'dist/assets'),{recursive:true});
const output=path.join(repo,'dist/assets/charles-arrival-v1.png');
fs.writeFileSync(output,atlas.toBuffer('image/png'));
const oldPath=path.join(repo,'dist/assets/charles-whole-v1.png'),old=await loadImage(oldPath);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const data=ctx.getImageData(0,0,atlas.width,atlas.height).data;
const checks=frames.map(f=>{
 let left=cell,top=cell,right=-1,bottom=-1,edgeNonzero=0,solid=0,nonzero=0;
 for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
  const alpha=data[(y*atlas.width+f.index*cell+x)*4+3];
  if(alpha){nonzero++;if(x===0||y===0||x===cell-1||y===cell-1)edgeNonzero++;}
  if(alpha>=16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(alpha>=240)solid++;
 }
 return {frame:f.name,boundsAlpha16:[left,top,right,bottom],transparentCellBorders:edgeNonzero===0,nonzeroPixels:nonzero,mostlyOpaquePixels:solid};
});
const proof=createCanvas(1120,740),p=proof.getContext('2d');
p.fillStyle='#20172e';p.fillRect(0,0,1120,740);p.font='16px sans-serif';p.fillStyle='#efddaf';
p.fillText('Charles arrival artwork | native-size registration proof, not gameplay',24,26);
const entries=[{name:'approved hover',image:old,index:0},{name:'approved planted',image:old,index:1},...frames.map(f=>({name:f.name,image:atlas,index:f.index}))];
for(let i=0;i<entries.length;i++){
 const e=entries[i],x=8+i*222;
 p.imageSmoothingEnabled=false;p.drawImage(e.image,e.index*cell,0,cell,cell,x+22,44,cell,cell);
 p.strokeStyle='#5d4b70';p.beginPath();p.moveTo(x+9,204);p.lineTo(x+209,204);p.stroke();
 p.fillStyle='#efddaf';p.fillText(e.name,x+20,240);
 if(i>=2){const f=frames[i-2];if(f.snapPoint){p.fillStyle='#84ddd8';p.fillRect(x+22+f.snapPoint[0]-1,44+f.snapPoint[1]-1,2,2);}}
}
p.fillStyle='#efddaf';p.fillText('Same registered cells at 2x nearest-neighbor; no new drawing or effects',24,279);
for(let i=0;i<3;i++){
 const x=20+i*366;p.fillStyle=i%2?'#b9b2a8':'#3a3148';p.fillRect(x,300,352,352);p.imageSmoothingEnabled=false;
 p.drawImage(atlas,i*cell,0,cell,cell,x,300,352,352);
 p.fillStyle='#efddaf';p.fillText(frames[i].name,x+12,679);
}
p.fillStyle='#b9aeca';p.font='13px sans-serif';p.fillText('Cyan dot on native snap poses identifies the measured effect origin. Atlas itself has no dot or effects.',24,716);
fs.writeFileSync(path.join(root,'native-pose-review.png'),proof.toBuffer('image/png'));
const metadata={image:'dist/assets/charles-arrival-v1.png',width:cell*3,height:cell,columns:3,rows:1,cell,anchor,source:'art/source/charles-arrival/poses-transparent-source.png',sourceSha256:sha(sourcePath),atlasSha256:sha(output),approvedAtlasPath:'dist/assets/charles-whole-v1.png',approvedAtlasSha256:sha(oldPath),registration:'Three intact paintings, common uniform 0.185 scale, translation to foot anchor [88,160]. No cut-out anatomy, rotation, warping or artwork redraw.',frames,checks,limits:['Native Canvas registration contact sheet only, not a gameplay or phone capture.','Finger gesture is tiny at native size; the measured local effect point and animation timing should carry the snap beat.','Flight changes the drawn body lean; blend its world translation when settling, do not rotate or deform the source painting.','Independent review of integrated animation remains required.']};
fs.writeFileSync(path.join(root,'atlas-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({output,source:sourcePath,checks,frames:frames.map(({name,eyes,snapPoint})=>({name,eyes,snapPoint}))},null,2));
