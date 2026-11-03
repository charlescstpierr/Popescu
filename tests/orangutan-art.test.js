import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {ActorArt} from '../dist/actor-art.js';

// Read the shipped RGBA PNG using only Node, so art checks keep npm test dependency-free.
function readPixels(file){
  const png=readFileSync(new URL(file,import.meta.url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(png[24],8);assert.equal(png[25],6);assert.equal(png[28],0);
  const chunks=[];for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
  const packed=inflateSync(Buffer.concat(chunks)),stride=width*4,data=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=packed[y*(stride+1)];assert.ok(filter<=4);
    for(let x=0;x<stride;x++){
      const a=x>=4?data[y*stride+x-4]:0,b=y?data[(y-1)*stride+x]:0,c=y&&x>=4?data[(y-1)*stride+x-4]:0;
      let predictor=0;
      if(filter===1)predictor=a;
      if(filter===2)predictor=b;
      if(filter===3)predictor=Math.floor((a+b)/2);
      if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
      data[y*stride+x]=(packed[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  return {width,height,data};
}

test('all eight orangutan views retain their registered cells and pink torso clothing',()=>{
  const {width,height,data}=readPixels('../dist/assets/orangutan-walk-v3.png');
  assert.deepEqual([width,height],[512,256]);
  for(let i=0;i<8;i++){
    let pink=0,body=0,bottom=-1,edge=0;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const p=((Math.floor(i/4)*128+y)*width+i%4*128+x)*4,[r,g,b,a]=data.subarray(p,p+4);
      if(a>32){body++;bottom=Math.max(bottom,y);if(x===0||x===127||y===0||y===127)edge++;}
      // Exclude the existing bow/scarf. Check cups/band on front, back straps/band behind.
      if(x>=33&&x<=90&&y>=48&&y<=80&&a>100&&r>g*1.45&&b>g*1.3&&b>r*.35)pink++;
    }
    assert.ok(body>4000,`frame ${i} is a complete visible orangutan`);
    assert.equal(edge,0,`frame ${i} does not clip or bleed into a neighbor`);
    assert.ok(bottom>=119&&bottom<=121,`frame ${i} keeps the original floor baseline`);
    assert.ok(pink>=100,`frame ${i} has a visible pink bra, rather than only the pre-existing bow/scarf (${pink})`);
  }
});

test('orangutan clothing uses only its existing species atlas and leaves gorilla routing separate',async()=>{
  const art=new ActorArt({loadImage:async path=>({path})});await art.ready;
  assert.equal(art.images.orangutan.path,'assets/orangutan-walk-v3.png');
  assert.equal(art.images.enemy.path,'assets/gorilla-walk-v2.png');
  assert.notEqual(art.images.orangutan,art.images.enemy);
  assert.equal(art.availableFor({type:'orangutan'},'enemy'),true);
});
