import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {app} from './helpers/focus-controller.js';
import {OPENING} from '../dist/opening.js';

const portrait='assets/portrait-toma-current.webp';
// Parse the shipped HTML, not the adapter's synthetic elements. These are the
// actual resources requested before the controller changes a portrait.
function compactSources(){
 return JSON.parse(execFileSync('python3',['-c',`
import json,sys
from html.parser import HTMLParser
class Images(HTMLParser):
 def __init__(self): super().__init__(); self.images=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and (a.get('id') in ['portrait','banter-portrait','result-portrait'] or a.get('src','').startswith('assets/portrait-toma-')): self.images.append(a.get('src'))
p=Images();p.feed(sys.stdin.read());print(json.dumps(p.images))
 `],{input:readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),encoding:'utf8'}));
}
test('the shipped HUD, dialogue, banter and result portraits use the same current face',()=>{
 const sources=compactSources();assert.equal(sources.length,4);assert.deepEqual(sources,[portrait,portrait,portrait,portrait]);
});
test('a returning player starts directly with the current Toma face in the compact reply',async()=>{
 const a=app();await a.click('play');assert.equal(a.controller.screen,'hud');assert.equal(a.get('banter-portrait').src,portrait);
 a.controller.showBanter({who:'BLONDE IA',text:'Réplique.'});assert.equal(a.get('banter-portrait').src,'assets/portrait-blonde-ia.webp');
 a.controller.showBanter({who:'TOMA',text:'Réponse.'});assert.equal(a.get('banter-portrait').src,portrait);
 assert.equal(JSON.parse(a.values.get('toma-popescu-v1')).introSeen,true);
});
test('opening keeps the large portrait of each speaking character',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const a=app(new Map());await a.click('play');
 for(let index=0;index<OPENING.length;index++){
  const root=a.get('dialogue');
  assert.equal(root.classList.contains('encounter-dialogue'),true);
  assert.equal(a.get('encounter-portrait').src,OPENING[index].who==='TOMA'?'assets/dialogue-toma.png':'assets/dialogue-companion-1.png');
  assert.equal(a.get('next-dialogue').textContent,OPENING[index].action);
  assert.equal(a.get('opening-reply-text').textContent,OPENING[index].reply);
  assert.equal(a.get('auto-dialogue').classList.contains('hidden'),true);
  t.mock.timers.tick(60000);assert.equal(a.get('dialogue-progress').textContent,`${index+1} / ${OPENING.length}`);
  a.click('next-dialogue');
 }
 assert.equal(a.controller.screen,'hud');assert.equal(a.get('dialogue').classList.contains('encounter-dialogue'),false);
});
test('resuming the companion opening card preserves its exact progress and portrait',async()=>{
 const a=app(new Map());await a.click('play');a.click('next-dialogue');assert.equal((await a.controller.persistRun()).ok,true);
 const saved=a.values.get('toma-popescu-run-v1'),b=app(a.values);await b.click('resume-saved');assert.equal(b.controller.screen,'pause-screen');b.click('resume');
 assert.equal(b.get('dialogue-progress').textContent,'2 / 5');assert.equal(b.get('encounter-portrait').src,'assets/dialogue-companion-1.png');
 assert.equal(b.get('encounter-name').textContent,'BLONDE IA');assert.equal(b.values.get('toma-popescu-run-v1'),saved);
 b.click('next-dialogue');assert.equal(b.get('encounter-portrait').src,'assets/dialogue-toma.png');assert.equal(b.get('encounter-visual').getAttribute('hidden'),null);
 b.click('skip-dialogue');assert.equal(b.controller.screen,'hud');assert.equal(b.game.s.opening.phase,'shoot');
});
test('ordinary system messages also keep their own name without a portrait',async()=>{
 const a=app();await a.click('play');a.game.startDialogue([{who:'SYSTÈME',text:'Message ordinaire.'}]);
 assert.equal(a.get('encounter-name').textContent,'SYSTÈME');assert.equal(a.get('encounter-framed-image').getAttribute('href'),null);
 assert.equal(a.get('encounter-art-status').textContent,'MESSAGE SYSTÈME');
});

test('a late Toma image load cannot replace the companion opening portrait',async()=>{
 const a=app(new Map());await a.click('play');const portrait=a.get('encounter-portrait'),oldLoad=portrait.onload;
 a.click('next-dialogue');oldLoad();
 assert.equal(a.get('encounter-name').textContent,'BLONDE IA');
 assert.equal(a.get('encounter-framed-portrait').getAttribute('hidden'),'');
 assert.equal(a.get('encounter-portrait').src,'assets/dialogue-companion-1.png');
 a.click('next-dialogue');portrait.onload();
 assert.equal(a.get('encounter-name').textContent,'TOMA POPESCU');
 assert.equal(a.get('encounter-framed-image').getAttribute('href'),'assets/dialogue-toma.png');
});
