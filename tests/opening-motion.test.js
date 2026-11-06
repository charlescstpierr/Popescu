import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
const start=css.indexOf('/* Opening theatre:');
const motion=start<0?'':css.slice(start);
// Source contracts complement browser computed-style and first-frame checks.
test('opening has finite decorative entries for its three acts',()=>{
 assert.match(motion,/opening-fantasy #encounter-framed-portrait\{animation:opening-pose \.38s/);
 assert.match(motion,/opening-offline::after\{[^}]*animation:opening-outage \.24s/);
 assert.match(motion,/opening-street #encounter-framed-portrait\{animation:opening-return \.32s/);
 assert.doesNotMatch(motion,/infinite|filter:|scale\(/);
});
test('opening text and controls have no animated delay or input lock',()=>{
 assert.ok(motion,'the opening motion rules must exist');
 for(const block of motion.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(/animation:|transition:|opacity:|transform:/.test(block[2])&&/dialogue-text|dialogue-box|dialogue-footer|button/.test(block[1]))assert.fail(`Reading surface animated: ${block[1]}`);
 }
 assert.match(motion,/pointer-events:none/);
 assert.doesNotMatch(motion,/animation-delay:|visibility:hidden|display:none/);
});
test('both reduced-motion paths stop root pseudo-elements and portrait transitions',()=>{
 assert.match(motion,/\.reduced-fx \.encounter-dialogue\.opening::after/);
 assert.match(motion,/@media\(prefers-reduced-motion:reduce\)/);
 assert.equal((motion.match(/animation:none!important;transition:none!important/g)||[]).length,2);
 assert.match(motion,/\.encounter-dialogue\.opening::before/);
});
test('street lighting stays clear after its finite animation ends',()=>{
 assert.match(motion,/\.encounter-dialogue\.opening-street::after\{opacity:0;/);
 assert.match(motion,/@keyframes opening-clear\{from\{opacity:1\}to\{opacity:0\}\}/);
});
