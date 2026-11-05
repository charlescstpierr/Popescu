import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
// Read the shipped RGBA PNG using only Node, so art checks keep npm test dependency-free.
export function readPixels(file){
  const png=readFileSync(file);
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
