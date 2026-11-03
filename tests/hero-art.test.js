import test from 'node:test';
import assert from 'node:assert/strict';
import {HeroArt} from '../dist/hero-art.js';
import {HERO_FRAMES} from '../dist/hero-frames.js';

function recordingContext(){
  const images=[],rectangles=[],transforms=[];
  return {images,rectangles,transforms,globalAlpha:1,fillStyle:'',save(){},restore(){},translate(){},rotate(){},scale(){},transform(...args){transforms.push(args)},drawImage(...args){images.push(args)},fillRect(...args){rectangles.push({color:this.fillStyle,args})}};
}

test('every running and split phase draws exactly one complete head-to-boots painting',async()=>{
  const art=new HeroArt({loadImage:async src=>({src})});assert.equal(await art.ready,true);
  for(let direction=0;direction<8;direction++)for(const progress of [0,.08,.18,.4,.68,.85,.98])for(let phase=0;phase<8;phase++){
    const a=direction*Math.PI/4,c=recordingContext(),s={x:40,y:70,moveX:1,moveY:0,walkDistance:phase*10,aimX:Math.cos(a),aimY:Math.sin(a),stunt:{active:progress>0,kind:'split',progress}},before=JSON.stringify(s);
    assert.equal(art.draw(c,s,1,true),true);assert.equal(JSON.stringify(s),before);
    assert.equal(c.images.length,1,'no detached torso, leg, hand, boot or extra rifle');
    assert.equal(c.images[0][0],art.image);assert.deepEqual(c.images[0].slice(7),[HERO_FRAMES.width,HERO_FRAMES.height]);
    assert.deepEqual(c.transforms,[[1,0,0,1,0,0]],'native proportions stay intact while aiming');assert.equal(c.rectangles.length,0);
  }
});

test('load failure paints a complete approved frame from its exact decoded pixel runs',async()=>{
  for(const loadImage of [async()=>null,async()=>{throw Error('offline')}]){
    const art=new HeroArt({loadImage});assert.equal(await art.ready,false);
    for(const progress of [0,.5]){
      const c=recordingContext();assert.equal(art.draw(c,{x:0,y:0,aimX:1,aimY:0,stunt:{active:progress>0,kind:'split',progress}},0,true),true);
      assert.equal(c.images.length,0);const frame=progress?HERO_FRAMES.fallback.split:HERO_FRAMES.fallback.run;
      assert.equal(c.rectangles.length,frame.rows.length);assert.ok(frame.rows.length>500);
      assert.deepEqual(c.rectangles[0].args,[frame.rows[0][1]-65,frame.rows[0][0]-111,frame.rows[0][2],1]);
    }
  }
});
