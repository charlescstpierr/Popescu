import test from 'node:test';
import assert from 'node:assert/strict';
import {CityArt} from '../dist/city-art.js';

test('a lamp whose light pool reaches the screen is never culled',()=>{
 const city=new CityArt(),camera={x:0,y:0},width=390,height=844;
 const left=-width/2,right=width/2,top=-height*.48,bottom=height*.52;
 for(const [x,y] of [[left-120,0],[right+120,0],[0,top-120],[0,bottom+118]])
  assert.equal(city.isPropVisible({type:'lamp',x,y},camera,width,height),true,`lamp at ${x},${y} lights the visible area`);
 assert.equal(city.isPropVisible({type:'lamp',x:right+200,y:0},camera,width,height),false,'a far lamp stays culled');
});
