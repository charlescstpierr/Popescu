import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js';
import {animalLocked} from '../dist/animals.js';
import {egoBeastLocked} from '../dist/ego-beasts.js';

// Frozen reference from main 3d82215dd4908fc1485065c6e1a3ce46ea5af0f9.
// Compare ordered move calls, not only final positions: reordering contacts
// can otherwise hide behind the eight-push cap or later movements.
const length=Math.hypot;
function stringReference(dt){
    const buckets=new Map(),size=64;
    for(const e of this.s.enemies){const key=`${Math.floor(e.x/size)},${Math.floor(e.y/size)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);}
    for(const e of this.s.enemies){const cx=Math.floor(e.x/size),cy=Math.floor(e.y/size);let pushes=0;
      neighbors:for(let a=cx-1;a<=cx+1;a++)for(let b=cy-1;b<=cy+1;b++)for(const other of buckets.get(`${a},${b}`)||[]){
        if(other.id<=e.id)continue;let dx=e.x-other.x,dy=e.y-other.y;const gap=(e.r+other.r)*.8;
        // Most neighboring cells do not overlap. Keep the exact distance and
        // push for actual contacts, but reject separated bounds first.
        if(Math.abs(dx)>=gap||Math.abs(dy)>=gap)continue;let d=length(dx,dy);if(d>=gap)continue;
        if(d<.001){const angle=e.id*2.399963+other.id*.37;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}
        const push=Math.min((gap-d)*.5,35*dt);if(!animalLocked(e)&&!egoBeastLocked(e)&&!(e.type==='rival_rooster'&&(e.windup>0||e.crow>0)))this.move(e,dx/d*push,dy/d*push,e.r*.64);if(!animalLocked(other)&&!egoBeastLocked(other)&&!(other.type==='rival_rooster'&&(other.windup>0||other.crow>0)))this.move(other,-dx/d*push,-dy/d*push,other.r*.64);
        if(++pushes>=8)break neighbors;
      }
    }
  }
function compare(enemies,steps=1,dt=1/60){
 const actual={s:{enemies:structuredClone(enemies)},calls:[]};
 const expected={s:{enemies:structuredClone(enemies)},calls:[]};
 for(const state of [actual,expected])state.move=function(e,dx,dy,r){
  this.calls.push([e.id,dx,dy,r]);e.x+=dx;e.y+=dy;
 };
 for(let step=0;step<steps;step++){
  actual.calls=[];expected.calls=[];
  Game.prototype.separateEnemies.call(actual,dt);
  stringReference.call(expected,dt);
  assert.deepEqual(actual.calls,expected.calls,`ordered moves at step ${step}`);
  assert.deepEqual(actual.s.enemies,expected.s.enemies,`positions at step ${step}`);
 }
 return actual;
}
const enemy=(id,x,y,extra={})=>({id,x,y,r:20,type:'normal',...extra});

test('numeric grid matches string grid across signed boundaries and large cell indices',()=>{
 for(const origin of [-(2**40), -128, -64, 0, 64, 2**40]){
  const enemies=Array.from({length:35},(_,i)=>enemy(35-i,
   origin+(i%7-3)*12.7,origin+(Math.floor(i/7)-2)*13.1));
  compare(enemies,12,.1);
 }
 compare([enemy(1,-0,-0),enemy(2,0,0),enemy(3,-Number.MIN_VALUE,Number.MIN_VALUE)],8);
});

test('numeric grid preserves movement across a cell edge during separation',()=>{
 const enemies=[enemy(1,63.9,0),enemy(2,63.95,0),enemy(3,32,0),enemy(4,1000,0)];
 const result=compare(enemies,1,.1);
 assert.ok(result.s.enemies.some((e,i)=>Math.floor(e.x/64)!==Math.floor(enemies[i].x/64)),
  'fixture must actually move an enemy to a different cell');
 compare(enemies,24,.1);
});

test('numeric grid preserves insertion order and eight-contact limit for coincident crowds',()=>{
 const enemies=Array.from({length:24},(_,i)=>enemy(i===0?1:25-i,0,0));
 const result=compare(enemies,1,0);
 assert.equal(result.calls.filter(call=>call[0]===1).length,8);
 compare(enemies,15,.1);
});

test('numeric grid preserves locked actors and sparse missing columns',()=>{
 const enemies=[enemy(8,-500,300),enemy(2,64,64,{type:'rival_rooster',windup:1}),
  enemy(9,64,64),enemy(1,65,64,{type:'rival_rooster',crow:1}),
  enemy(3,63,63,{type:'ostrich',phase:'windup'}),enemy(4,63,64,{type:'ego_toad',phase:'ego_active'}),enemy(10,9000,-9000)];
 const result=compare(enemies,20,.1);
 for(const id of [1,2,3,4])assert.deepEqual(result.s.enemies.find(e=>e.id===id),enemies.find(e=>e.id===id));
 compare([]);compare([enemy(1,0,0)]);
});
