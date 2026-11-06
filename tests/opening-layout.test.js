import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
// Source contract only: the real browser QA measures the text's scrollHeight.
test('opening reserves space for both speech and its explanatory note',()=>{
 assert.match(css,/@media\(min-height:621px\)\{\.encounter-dialogue\.opening\{grid-template-rows:44px minmax\(0,1fr\) minmax\(300px,42%\)\}/);
});
test('short landscape keeps its two-column portrait and scrollable speech',()=>{
 assert.match(css,/@media\(max-height:440px\)\{\.encounter-dialogue\{grid-template-rows:44px minmax\(0,1fr\);column-gap:10px;grid-template-columns:/);
 assert.match(css,/\.encounter-dialogue #dialogue-text\{[^}]*overflow-y:auto/);
});
