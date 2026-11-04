import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRiverTile} from '../dist/river-art.js';

test('natural river groups include large faceted boulders and small shoreline pebbles',()=>{
 let color,points=[];const widths=[];
 const c=new Proxy({}, {set:(_,key,value)=>{if(key==='fillStyle')color=value;return true;},get:(_,key)=>(...args)=>{
  if(key==='beginPath')points=[];
  if(key==='moveTo'||key==='lineTo')points.push(args);
  if(key==='fill'&&color==='#746d78')widths.push(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])));
 }});
 for(let ty=-2;ty<3;ty++)drawRiverTile(c,4,ty,42);
 assert.ok(widths.some(w=>w>=25),'boulder groups break up the continuous small-stone canal edging');
 assert.ok(widths.some(w=>w<=10),'small pebbles contrast with the larger bank rocks');
});
