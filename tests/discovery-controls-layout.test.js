import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/focus-controller.js';
import {DISCOVERIES} from '../dist/discoveries.js';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// Explicit browser-boundary fixtures, not CSS layout or physical-device proof.
async function playing(width=390,height=844,insets={}){
 const rect={left:17,top:23,width,height},a=app(undefined,undefined,performance,rect);
 const safe={left:0,right:0,top:0,bottom:0,...insets};
 a.get('control-safe-area').getBoundingClientRect=()=>({left:rect.left+safe.left,top:rect.top+safe.top,width:rect.width-safe.left-safe.right,height:rect.height-safe.top-safe.bottom});
 const size=width<=355?100:110,offset=width<=355?27:32;
 Object.assign(a.get('joystick'),{offsetWidth:size,offsetHeight:size,clientLeft:1,clientTop:1});
 Object.assign(a.get('stick'),{offsetLeft:offset,offsetTop:offset,offsetWidth:45,offsetHeight:45});
 a.controller.resize();await a.click('play');return {a,rect,safe,size,offset};
}
function down(a,rect,x,y,id=1,target={closest:()=>null}){a.get('app').dispatch('pointerdown',{pointerId:id,clientX:rect.left+x,clientY:rect.top+y,target,preventDefault(){}});}
function move(a,rect,x,y,id=1){a.get('app').dispatch('pointermove',{pointerId:id,clientX:rect.left+x,clientY:rect.top+y,preventDefault(){}});}
function contained(box,safe,width,height){assert.ok(box.left>=safe.left-1e-9,`left ${box.left} < ${safe.left}`);assert.ok(box.top>=safe.top-1e-9,`top ${box.top} < ${safe.top}`);assert.ok(box.right<=width-safe.right+1e-9,`right ${box.right} > ${width-safe.right}`);assert.ok(box.bottom<=height-safe.bottom+1e-9,`bottom ${box.bottom} > ${height-safe.bottom}`);}

for(const [width,height] of [[320,568],[390,844],[460,320]])for(const insets of [{},{top:44,bottom:34,left:44,right:12}])test(`joystick base and full thumb travel stay safe at ${width}x${height} ${JSON.stringify(insets)}`,async()=>{
 const {a,rect,safe,size,offset}=await playing(width,height,insets);
 for(const x of [safe.left+1,width*.75-1])for(const y of [Math.max(height*.35,safe.top)+1,height-safe.bottom-1]){
  down(a,rect,x,y);assert.equal(a.controller.inputState.pointer,1);
  const left=parseFloat(a.get('joystick').style.left),top=parseFloat(a.get('joystick').style.top);
  contained({left,top,right:left+size,bottom:top+size},safe,width,height);
  for(const [dx,dy] of [[0,50],[50,0],[0,-50],[-50,0],[50,50],[-50,-50],[-50,50],[50,-50]]){
   move(a,rect,x+dx,y+dy);const input=a.controller.inputState.input;
   assert.ok(Math.abs(Math.hypot(input.x,input.y)-1)<1e-12);
   const thumbLeft=left+1+offset+input.x*33,thumbTop=top+1+offset+input.y*33;
   contained({left:thumbLeft,top:thumbTop,right:thumbLeft+45,bottom:thumbTop+45},safe,width,height);
  }
  a.get('app').dispatch('pointerup',{pointerId:1});
 }
});

for(const event of ['pointerup','pointercancel','lostpointercapture','resize','pause'])test(`${event} releases capture and resets movement and placement`,async()=>{
 const {a,rect}=await playing();down(a,rect,40,800);move(a,rect,80,820);
 if(event==='resize'){rect.width=320;rect.height=568;a.controller.resize();}
 else if(event==='pause')a.click('pause');else a.get('app').dispatch(event,{pointerId:1});
 assert.equal(a.controller.inputState.pointer,null);assert.equal(a.get('app').captured,null);
 assert.equal(a.controller.inputState.input.x,0);assert.equal(a.controller.inputState.input.y,0);
 assert.equal(a.get('stick').style.transform,'');assert.equal(a.get('joystick').classList.contains('active'),false);
 for(const key of ['left','top','bottom'])assert.equal(a.get('joystick').style[key],undefined);
});

test('safe-area edges, buttons and a second pointer cannot steal movement',async()=>{
 const {a,rect}=await playing(390,844,{left:44,right:12,bottom:34});
 down(a,rect,10,800);assert.equal(a.controller.inputState.pointer,null);
 down(a,rect,100,835);assert.equal(a.controller.inputState.pointer,null);
 down(a,rect,100,800,1,a.get('pause'));assert.equal(a.controller.inputState.pointer,null);
 down(a,rect,100,800,1);down(a,rect,200,700,2);move(a,rect,250,750,2);
 assert.equal(a.controller.inputState.pointer,1);assert.equal(a.controller.inputState.input.x,0);
});

test('the app border is not counted twice when placing the captured joystick',async()=>{
 const {a,rect}=await playing();Object.assign(a.get('app'),{clientLeft:1,clientTop:1});
 a.get('control-safe-area').getBoundingClientRect=()=>({left:rect.left+1,top:rect.top+1,width:388,height:842});
 down(a,rect,291,842);move(a,rect,341,892);
 const left=parseFloat(a.get('joystick').style.left)+1,top=parseFloat(a.get('joystick').style.top)+1;
 // The maximal full thumb envelope is 111px, irrespective of current direction.
 contained({left,top,right:left+111,bottom:top+111},{left:1,top:1,right:1,bottom:1},390,844);
});

test('discovery details are outside the live HUD and the summary reuses its timer slot',()=>{
 const tree=JSON.parse(execFileSync('python3',['-c',`
import json,sys
from html.parser import HTMLParser
class Structure(HTMLParser):
 def __init__(self): super().__init__(); self.stack=[]; self.nodes={}
 def handle_starttag(self,tag,attrs):
  node=dict(attrs); node['tag']=tag
  if node.get('id'): self.nodes[node['id']]=self.stack[:]
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','path'}: self.stack.append(node)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i]['tag']==tag: self.stack=self.stack[:i]; break
p=Structure(); p.feed(sys.stdin.read()); print(json.dumps(p.nodes))
`],{input:readFileSync(new URL('../dist/index.html',import.meta.url)),encoding:'utf8'}));
 assert.ok(tree['discovery-status'].some(node=>node.id==='pause-screen'));
 assert.ok(!tree['discovery-status'].some(node=>node.id==='hud'));
 assert.ok(tree['discovery-summary'].some(node=>node.class==='hud-head'));
 assert.deepEqual(tree['discovery-summary'],tree['time-goal']);
 assert.ok(tree['control-safe-area'].some(node=>node.id==='hud'));
});

test('discovery summary replaces only the existing timer subtitle through its lifecycle',async()=>{
 const {a}=await playing(),d=a.game.s.discovery;
 for(const [kind,def] of Object.entries(DISCOVERIES)){
  d.nearby={...def,discoveryType:kind,cooldown:0};d.active=null;a.controller.updateHud();
  assert.equal(a.get('discovery-summary').classList.contains('hidden'),false);
  assert.match(a.get('discovery-summary').textContent,/PROCHE/);
  assert.equal(a.get('time-goal').classList.contains('hidden'),true);
  assert.match(a.get('discovery-summary').getAttribute('aria-label'),/Approche-toi/);
  d.active={...def,kind,remaining:15.2};d.nearby=null;const before=structuredClone(a.game.s);a.controller.updateHud();
  assert.match(a.get('discovery-summary').textContent,/16 s$/);
  assert.ok(a.get('discovery-summary').textContent.length<=15);
  assert.equal(a.get('discovery-name').textContent,def.name);
  assert.equal(a.get('discovery-description').textContent,def.description);
  assert.deepEqual(a.game.s,before);
  d.active=null;d.nearby={...def,discoveryType:kind,cooldown:119};a.controller.updateHud();
  assert.match(a.get('discovery-summary').textContent,/ÉPUISÉ/);
  assert.match(a.get('discovery-description').textContent,/épuisé/);
 }
 d.nearby=null;a.controller.updateHud();assert.equal(a.get('discovery-summary').classList.contains('hidden'),true);assert.equal(a.get('time-goal').classList.contains('hidden'),false);
 d.active={...DISCOVERIES.cabin,kind:'cabin',remaining:12};a.game.s.charles={active:true,phase:'intro'};a.controller.updateHud();
 assert.equal(a.get('discovery-summary').classList.contains('hidden'),true);assert.equal(a.get('time-goal').classList.contains('hidden'),false);
});

test('pause exposes full discovery explanation without advancing healing or duration',async()=>{
 const {a}=await playing();a.game.s.discovery.active={...DISCOVERIES.cabin,kind:'cabin',remaining:12};a.game.s.hp=50;a.controller.updateHud();
 a.click('pause');a.controller.frame(performance.now()+500);
 assert.equal(a.game.s.hp,50);assert.equal(a.game.s.discovery.active.remaining,12);
 assert.equal(a.get('discovery-status').classList.contains('hidden'),false);
 assert.equal(a.get('discovery-name').textContent,'Cabane de répit');assert.equal(a.get('discovery-time').textContent,'12 s');
 a.click('resume');a.game.updateDiscoveryEffect(1);
 assert.equal(a.game.s.hp,52);assert.equal(a.game.s.discovery.active.remaining,11);
});
