import {EXPLOSIVE_BLAST} from './engine.js';
import {enemyGaitFrame} from './enemy-gait.js';
import {EGO_BEASTS,egoCamoRatio,egoHeight} from './ego-beasts.js';
import {drawEgoGround,drawEgoForeground} from './ego-art.js';
import {drawLamborghini} from './lamborghini-art.js';
import {pickupAttraction} from './drops.js';
import {CompanionArt} from './companion-art.js';
import {charlesArrival} from './charles.js';
import {CharlesArt} from './charles-art.js';
import {charlesProp,drawCharlesGround,drawCharlesForeground} from './charles-effects.js';
import {drawTrophyIcon,drawTrophyGround,drawTrophyForeground} from './trophy-art.js';
import {BOSS_TROPHIES,chestTrophyEligible} from './boss-trophies.js';
import {drawAnimalWarning} from './animals.js';
import {TAIL_DASH,DASH_DIRECTIONS} from './travestia-dash.js';
import {propDepth} from './prop-geometry.js';
import {presentSceneryProp} from './scenery-presentation.js';
import {drawDiscovery} from './discovery-art.js';
import {TRAVESTIA} from './travestia.js';
import {drawPelicanGround,drawPelicanCards} from './pelican-art.js';
import {HeroArt} from './hero-art.js';
import {computeHeroPose} from './hero-pose.js';
import {CombatArt,drawTelegraph,TELEGRAPH_STYLES} from './combat-art.js';
import {PowerArt} from './power-art.js';
import {ActorArt} from './actor-art.js';
import {CityArt} from './city-art.js';
/* Original hand-pixelled city and actors. Simulation remains entirely in engine.js. */
const C = {
  ink: '#100e20', asphalt: '#28223b', asphaltHi: '#3b304d', lilac: '#78637b',
  gold: '#ffd634', goldLight: '#fff3a6', pink: '#ff43aa', blue: '#71ddff',
  skin: '#dc8b56', skinLight: '#ffc17c', skinDark: '#914c3f',
  fur: '#272137', furMid: '#44344f', furLight: '#66516e',
  lime: '#b9f430', green: '#719c17', orange: '#ff9b37'
};
const WALK = [0, 2, 3, 1, 0, -2, -3, -1];
const BOB = [0, -1, -2, -1, 1, -1, -2, -1];
const TAU = Math.PI * 2;
const PICKUP_GLOWS = new Map();
const hash = (x, y, seed = 0) => {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const rect = (ctx, color, x, y, w, h) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const poly = (ctx, color, points) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
  ctx.closePath();
  ctx.fill();
};
// Scanline ellipses have crisp, deliberate stair-step edges at every pixel size.
function oval(ctx, color, x, y, w, h, step = 1) {
  const rx = w / 2, ry = h / 2;
  ctx.fillStyle = color;
  for (let row = 0; row < h; row += step) {
    const dy = (row + step / 2 - ry) / ry;
    const span = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const left = Math.round(x + rx - span);
    ctx.fillRect(left, Math.round(y + row), Math.max(step, Math.round(span * 2)), step);
  }
}
function line(ctx, color, x0, y0, x1, y1, width = 1) {
  let x = Math.round(x0), y = Math.round(y0);
  const tx = Math.round(x1), ty = Math.round(y1), dx = Math.abs(tx - x), dy = Math.abs(ty - y);
  const sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
  let error = dx - dy;
  ctx.fillStyle = color;
  for (let safety = 0; safety < 1500; safety++) {
    ctx.fillRect(x - Math.floor(width / 2), y - Math.floor(width / 2), width, width);
    if (x === tx && y === ty) break;
    const twice = error * 2;
    if (twice > -dy) { error -= dy; x += sx; }
    if (twice < dx) { error += dx; y += sy; }
  }
}
function ring(ctx, color, x, y, r, step = 0.22, size = 2, phase = 0, aspect = .58) {
  for (let a = phase; a < TAU + phase; a += step) {
    rect(ctx, color, x + Math.cos(a) * r - size / 2, y + Math.sin(a) * r * aspect - size / 2, size, size);
  }
}
function sparkle(ctx, x, y, color = C.goldLight, size = 3) {
  rect(ctx, color, x - size, y, size * 2 + 1, 1);
  rect(ctx, color, x, y - size, 1, size * 2 + 1);
  rect(ctx, '#ffffff', x, y, 1, 1);
}
function heart(ctx, x, y, color = C.pink, scale = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
  poly(ctx, C.ink, [[0, 2], [2, 0], [5, 0], [7, 2], [9, 0], [12, 0], [14, 2], [14, 6], [7, 13], [0, 6]]);
  poly(ctx, color, [[1, 2], [3, 1], [5, 1], [7, 4], [9, 1], [11, 1], [13, 3], [13, 6], [7, 11], [1, 6]]);
  rect(ctx, '#ffc2ee', 3, 2, 2, 2);
  ctx.restore();
}
function bow(ctx, x, y, color = C.pink) {
  poly(ctx, C.ink, [[-7, -4], [-2, -3], [0, -1], [3, -4], [7, -4], [7, 3], [2, 3], [0, 1], [-6, 3]] .map(([a,b]) => [a+x,b+y]));
  poly(ctx, color, [[-6, -3], [-2, -2], [0, 0], [3, -3], [6, -3], [6, 2], [2, 2], [0, 0], [-5, 2]].map(([a,b]) => [a+x,b+y]));
  rect(ctx, '#ff9cde', x - 5, y - 2, 2, 2); rect(ctx, '#b41d7c', x - 1, y - 1, 3, 3);
}
function makeCanvas(w, h) {
  let canvas;
  if (typeof OffscreenCanvas !== 'undefined') canvas = new OffscreenCanvas(w, h);
  else if (typeof document !== 'undefined') { canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; }
  else return null;
  return canvas;
}

function heroFrame(ctx, phase, back) {
  const step = WALK[phase], bob = BOB[phase];
  // Boots and separate, swinging trouser legs.
  rect(ctx, C.ink, 19 - step / 2, 44, 11, 15 + step);
  rect(ctx, C.ink, 33 + step / 2, 44, 11, 15 - step);
  rect(ctx, '#302d42', 22 - step / 2, 44, 7, 11 + step);
  rect(ctx, '#40354e', 34 + step / 2, 44, 6, 11 - step);
  rect(ctx, '#61516a', 23 - step / 2, 45, 2, 7);
  rect(ctx, '#151725', 18 - step / 2, 55 + step, 13, 5);
  rect(ctx, '#ece1cd', 18 - step / 2, 59 + step, 13, 2);
  rect(ctx, '#151725', 33 + step / 2, 55 - step, 13, 5);
  rect(ctx, '#ece1cd', 33 + step / 2, 59 - step, 13, 2);
  ctx.save(); ctx.translate(0, bob);
  poly(ctx, C.ink, [[21,24],[42,24],[48,30],[47,45],[41,49],[21,49],[15,44],[15,31]]);
  poly(ctx, '#242234', [[21,26],[40,25],[45,30],[44,43],[40,46],[22,46],[18,42],[18,31]]);
  poly(ctx, '#443652', [[20,27],[25,26],[25,41],[22,43],[19,40]]);
  rect(ctx, '#6c5474', 19, 30, 2, 10);
  rect(ctx, '#141620', 28, 27, 12, 20);
  rect(ctx, '#5b495f', 31, 28, 1, 16);
  // Heavy upper arm, sleeve seam, and a warm bare hand.
  poly(ctx, C.ink, [[17,28],[23,29],[24,36-step],[19,43-step],[13,41-step],[12,35-step]]);
  poly(ctx, '#363049', [[17,30],[21,31],[21,36-step],[17,40-step],[15,38-step],[15,34-step]]);
  rect(ctx, '#78607c', 16, 31, 2, 3);
  oval(ctx, C.ink, 12, 38-step, 10, 8); oval(ctx, C.skin, 13, 39-step, 8, 6);
  rect(ctx, C.skinLight, 14, 40-step, 3, 2);
  rect(ctx, C.ink, 25, 19, 13, 10); rect(ctx, C.skin, 27, 19, 10, 9);
  // Shaved head with a blue reflection on the sunglasses worn on the forehead.
  oval(ctx, C.ink, 21, 3, 24, 26);
  oval(ctx, C.skinDark, 23, 4, 21, 23);
  oval(ctx, C.skin, 23, 4, 19, 21);
  oval(ctx, C.skinLight, 25, 5, 14, 12);
  rect(ctx, '#f9ae71', 25, 7, 10, 3);
  rect(ctx, C.ink, 22, 7, 20, 4);
  rect(ctx, '#23476a', 24, 7, 7, 3); rect(ctx, '#23476a', 34, 7, 7, 3);
  rect(ctx, '#9cecff', 25, 7, 4, 1); rect(ctx, '#73c8ee', 35, 7, 4, 1);
  rect(ctx, '#f7dfb6', 30, 7, 4, 1);
  oval(ctx, C.skin, 20, 15, 5, 8); rect(ctx, C.skinDark, 21, 17, 2, 3);
  if (back) {
    oval(ctx, '#a5644c', 24, 12, 18, 13);
    rect(ctx, '#efad76', 25, 12, 11, 8);
    rect(ctx, '#392c32', 24, 22, 18, 3);
    poly(ctx, '#49374f', [[21,26],[28,25],[34,28],[40,25],[44,28],[40,31],[25,31]]);
    rect(ctx, '#8c6b8e', 24, 29, 15, 1);
    rect(ctx, '#1c1b2c', 28, 32, 10, 9);
    rect(ctx, '#50415f', 29, 33, 8, 1);
  } else {
    // Brows, nose, and a square, jagged beard give Toma his portrait silhouette.
    poly(ctx, '#292028', [[26,13],[31,12],[32,14],[26,15]]);
    poly(ctx, '#292028', [[35,12],[40,13],[40,15],[35,14]]);
    rect(ctx, '#fff2d8', 27, 15, 4, 2); rect(ctx, '#fff2d8', 35, 15, 4, 2);
    rect(ctx, '#2b2022', 29, 15, 2, 2); rect(ctx, '#2b2022', 37, 15, 2, 2);
    poly(ctx, '#ae6045', [[33,15],[32,20],[36,20],[36,18],[34,18]]);
    poly(ctx, '#251d27', [[23,18],[26,21],[30,22],[34,21],[39,20],[42,17],[42,25],[38,29],[28,29],[23,25]]);
    rect(ctx, '#46303b', 26, 23, 2, 3); rect(ctx, '#674349', 29, 25, 2, 2);
    rect(ctx, '#57404b', 36, 24, 3, 2); rect(ctx, '#170f1c', 30, 21, 9, 2);
    rect(ctx, '#d18a6c', 31, 22, 6, 1);
    // The gold chain is a small, continuous pixel U, with a square pendant.
    line(ctx, '#96650d', 26, 29, 29, 36, 3); line(ctx, C.gold, 26, 28, 30, 35, 2);
    line(ctx, C.gold, 30, 35, 36, 35, 2); line(ctx, C.gold, 36, 35, 40, 29, 2);
    rect(ctx, '#9c690b', 31, 35, 6, 6); rect(ctx, C.gold, 32, 35, 4, 5); rect(ctx, C.goldLight, 32, 35, 2, 2);
  }
  rect(ctx, C.gold, 42, 38, 3, 2);
  ctx.restore();
}

function girlFrame(ctx, phase, back) {
  const step = WALK[phase], bob = BOB[phase];
  // Broad hair silhouette flows through all eight frames, rather than moving as a box.
  const hair = [1,2,3,4,3,2,0,-1][phase];
  poly(ctx, C.ink, [[20,6],[28,2],[38,3],[45,9],[46,23],[50+hair,35],[43,40],[18,37],[13-hair,29],[17,19]]);
  poly(ctx, '#3b2535', [[20,9],[28,4],[37,5],[42,10],[42,24],[47+hair,33],[41,36],[21,34],[17-hair,28],[21,18]]);
  line(ctx, '#a05c4e', 22, 11, 17-hair, 29, 2);
  line(ctx, '#7a4141', 38, 8, 45+hair, 31, 2);
  rect(ctx, C.ink, 23-step/2, 42, 8, 16+step); rect(ctx, C.ink, 34+step/2, 42, 8, 16-step);
  rect(ctx, '#252535', 25-step/2, 43, 5, 12+step); rect(ctx, '#383043', 35+step/2, 44, 5, 11-step);
  rect(ctx, '#777080', 25-step/2, 48, 4, 1); rect(ctx, '#5e536c', 36+step/2, 48, 3, 1);
  rect(ctx, C.ink, 20-step/2, 56+step, 12, 6); rect(ctx, '#e7edf1', 21-step/2, 56+step, 10, 4);
  rect(ctx, C.ink, 34+step/2, 56-step, 12, 6); rect(ctx, '#e7edf1', 35+step/2, 56-step, 10, 4);
  rect(ctx, '#8f84a0', 22-step/2, 60+step, 10, 1); rect(ctx, '#8f84a0', 35+step/2, 60-step, 10, 1);
  ctx.save(); ctx.translate(0,bob);
  poly(ctx,C.ink,[[25,26],[38,26],[43,31],[42,45],[22,45],[19,34]]);
  rect(ctx,'#f7e9d8',28,28,10,15);
  poly(ctx,'#d72c54',[[24,27],[28,28],[28,43],[23,43],[21,35]]);
  poly(ctx,'#b51c47',[[38,27],[41,29],[43,37],[40,44],[36,43],[37,30]]);
  rect(ctx,'#ff6478',23,30,2,9); rect(ctx,'#fff0dc',23,41,5,2); rect(ctx,'#fff0dc',37,41,4,2);
  // Swinging varsity sleeves with white stripes and little hands.
  poly(ctx,C.ink,[[22,28],[26,30],[23,38-step],[17,41-step],[14,37-step],[18,30]]);
  poly(ctx,'#db3358',[[22,30],[24,31],[21,37-step],[18,39-step],[16,36-step],[19,31]]);
  line(ctx,'#f6e9db',18,33-step/2,21,35-step/2,2);
  oval(ctx,C.ink,14,38-step,8,7); oval(ctx,C.skinLight,15,39-step,6,5);
  poly(ctx,C.ink,[[40,28],[44,31],[48,36+step],[46,40+step],[41,38+step],[38,32]]);
  poly(ctx,'#bd244c',[[41,30],[43,32],[46,36+step],[44,38+step],[41,36+step],[40,32]]);
  rect(ctx,'#fff0dc',43,35+step,3,2); oval(ctx,C.skinLight,44,39+step,6,5);
  rect(ctx,'#a85a48',28,22,9,7); rect(ctx,C.skinLight,29,23,7,5);
  oval(ctx,C.ink,23,6,20,22); oval(ctx,C.skin,24,7,18,19); oval(ctx,C.skinLight,25,8,15,15);
  poly(ctx,'#372232',[[23,8],[27,5],[37,6],[42,11],[43,22],[39,24],[39,14],[33,10],[29,13],[24,16],[22,23]]);
  line(ctx,'#9e584b',26,8,33,7,2); line(ctx,'#693b3c',40,13,42,24,2);
  if(back) {
    oval(ctx,'#312033',23,7,20,23);
    line(ctx,'#7a4446',28,9,25,27,2); line(ctx,'#a45d50',36,9,39,27,1);
    rect(ctx,'#771e42',27,31,11,10); rect(ctx,'#ffc7d2',30,33,5,2); rect(ctx,'#ffc7d2',31,35,3,4);
  } else {
    line(ctx,'#48242b',27,15,30,14,1); line(ctx,'#48242b',35,14,38,15,1);
    rect(ctx,'#f4f2cf',27,16,4,2); rect(ctx,'#f4f2cf',35,16,4,2);
    rect(ctx,'#369956',29,16,2,2); rect(ctx,'#369956',36,16,2,2);
    rect(ctx,'#152933',30,16,1,2); rect(ctx,'#152933',37,16,1,2);
    rect(ctx,'#ef7c6f',25,19,3,2); rect(ctx,'#ef7c6f',38,19,2,2);
    rect(ctx,'#a44d42',32,18,2,2); rect(ctx,'#b91f50',30,22,6,1); rect(ctx,'#f86485',31,23,4,1);
    rect(ctx,C.gold,23,21,2,3); rect(ctx,C.gold,41,21,2,3);
  }
  ctx.restore();
}

function gorillaFrame(ctx, phase, back, type) {
  const step = WALK[phase], bob = BOB[phase];
  const angry = type === 'jealous', gas = type === 'gas', explosive = type === 'explosive';
  const mid = type==='orangutan' ? '#b45228' : explosive ? '#553345' : angry ? '#39364e' : C.furMid;
  const light = type==='orangutan' ? '#ed963e' : explosive ? '#89515d' : angry ? '#666077' : C.furLight;
  const ribbon = angry ? '#ff5373' : type === 'sprinter' ? '#cf6aff' : C.pink;
  // Offset feet and heavily articulated knuckles carry the gorilla gait.
  oval(ctx,C.ink,16-step/2,47,15,13+step); oval(ctx,C.ink,36+step/2,47,15,13-step);
  oval(ctx,mid,18-step/2,48,11,9+step); oval(ctx,mid,38+step/2,48,11,9-step);
  rect(ctx,light,19-step/2,55+step,3,2); rect(ctx,'#82718b',39+step/2,54-step,3,2);
  ctx.save(); ctx.translate(0,bob);
  oval(ctx,C.ink,13,18,40,36); oval(ctx,mid,16,20,34,31);
  oval(ctx,light,20,24,24,25); oval(ctx,gas ? '#6d7550' : '#7b5a73',23,29,19,19);
  oval(ctx,gas ? '#8d9461' : '#9c7386',26,31,12,12);
  oval(ctx,C.ink,3,24-step/2,20,31+step/2); oval(ctx,mid,5,25-step/2,16,26+step/2);
  oval(ctx,light,7,26-step/2,10,15); oval(ctx,'#352b43',7,42,15,14);
  oval(ctx,C.ink,44,23+step/2,19,32-step/2); oval(ctx,mid,46,25+step/2,15,27-step/2);
  oval(ctx,light,48,27+step/2,10,14); oval(ctx,'#352b43',44,42,16,14);
  // Fur is drawn as sparse lit clumps, not a flat fill.
  [[7,30],[11,27],[17,24],[19,31],[47,27],[54,32],[45,36],[25,25],[40,26]].forEach(([x,y],i)=>{
    rect(ctx,i%2 ? '#7b627f' : '#51405b',x,y+(i<4?-step/2:step/2),2,3);
  });
  [10,14,18,47,51,55].forEach(x=>{rect(ctx,'#78617b',x,50,2,3);rect(ctx,'#1a162a',x+1,53,1,2);});
  oval(ctx,C.ink,20,4,27,29); oval(ctx,mid,22,6,23,25);
  oval(ctx,C.ink,17,15,8,11); oval(ctx,'#8e657c',19,17,5,7);
  oval(ctx,C.ink,43,15,8,11); oval(ctx,'#8e657c',44,17,5,7);
  bow(ctx,39,7,ribbon);
  if (back) {
    // Real rear view: no face; shoulder blades, crouched haunches and raised rump.
    oval(ctx,mid,22,7,23,24); rect(ctx,light,26,10,4,6); rect(ctx,'#1d1a2c',26,24,15,3);
    oval(ctx,'#2a2337',15,22,37,28);
    oval(ctx,light,17,33,19,20); oval(ctx,light,33,33,18,20);
    oval(ctx,'#8c697c',21,37,13,13); oval(ctx,'#816176',34,37,12,13);
    line(ctx,'#392539',33,39,33,49,2);
    rect(ctx,'#8a7188',20,28,7,2); rect(ctx,'#6e5a73',40,27,5,2);
    rect(ctx,'#181526',31,27,3,7);
  } else {
    oval(ctx,'#856378',25,13,19,17); oval(ctx,'#b08a95',26,19,19,13);
    rect(ctx,'#342034',25,15,8,3); rect(ctx,'#342034',35,15,8,3);
    rect(ctx,angry?'#b5ff4a':'#ffdf66',27,17,4,3); rect(ctx,angry?'#b5ff4a':'#ffdf66',36,17,4,3);
    rect(ctx,C.ink,29,17,2,3); rect(ctx,C.ink,36,17,2,3);
    // Long outer lashes and one heavy raised brow.
    rect(ctx,'#181222',25,16,2,1); rect(ctx,'#181222',42,15,2,2);
    rect(ctx,'#26192a',31,21,9,4); rect(ctx,'#e9a1ab',32,21,6,1);
    rect(ctx,'#160f22',31,22,2,2); rect(ctx,'#160f22',37,22,2,2);
    oval(ctx,'#2a1328',28,26,14,9); rect(ctx,'#f7e7d7',29,26,12,3);
    rect(ctx,'#a9316e',30,31,9,2); rect(ctx,'#e45e9d',31,32,7,2);
    rect(ctx,'#171223',30,26,1,3); rect(ctx,'#171223',35,26,1,3); rect(ctx,'#171223',39,26,1,3);
    ring(ctx,C.gold,18,24,3,.6,1); ring(ctx,C.gold,48,24,3,.6,1);
    rect(ctx,'#fff0a0',17,23,1,2); rect(ctx,'#fff0a0',47,23,1,2);
  }
  if(type==='tank') {
    rect(ctx,'#a57a21',6,41,14,5);rect(ctx,C.gold,7,41,12,2);
    rect(ctx,'#a57a21',46,41,14,5);rect(ctx,C.gold,47,41,12,2);
    poly(ctx,'#f04bba',[[29,38],[33,35],[37,38],[33,43]]); rect(ctx,'#ffd6fb',32,37,2,2);
  }
  if(type==='sprinter') { line(ctx,'#da82ff',23,10,18,20,2);rect(ctx,'#ec72c9',17-step/2,53+step,12,3);rect(ctx,'#ec72c9',38+step/2,53-step,12,3); }
  if(gas) {rect(ctx,'#a0be37',25,34,3,3);rect(ctx,'#a0be37',38,38,2,4);}
  if(angry&&!back) {heart(ctx,28,38,'#c9315f',.65); line(ctx,C.ink,33,38,31,45,2);}
  if(explosive) {
    rect(ctx,'#2c1728',21,44,26,6);[23,29,35,41].forEach(x=>{rect(ctx,'#a11c42',x,42,5,9);rect(ctx,'#ff7055',x,42,2,7);rect(ctx,'#e6b88c',x,41,3,1);});
    line(ctx,'#ffd759',44,42,48,37,1);sparkle(ctx,48,36,'#ff9f42',2);
  }
  if(type==='matriarch') {
    poly(ctx,C.ink,[[22,3],[20,-7],[28,-2],[33,-10],[38,-2],[46,-7],[44,3]]);
    poly(ctx,C.gold,[[24,1],[23,-4],[29,0],[33,-7],[37,0],[43,-4],[42,1]]);
    rect(ctx,'#fff3b2',25,0,16,2);rect(ctx,'#f84bc1',31,-2,4,3);
    if(!back){line(ctx,C.gold,23,34,32,39,2);line(ctx,C.gold,32,39,44,34,2);rect(ctx,'#e34fc8',31,39,4,5);}
  }
  ctx.restore();
}

const ENEMY_SCALE = {normal: .84, sprinter: .74, gas: .87, tank: 1.04, jealous: .85, explosive: .88, matriarch: 1.25};

/** Draw a bespoke pixel icon, with no fonts, emoji, network or external images. */
export function drawIcon(ctx, id, x, y, size = 32) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size/32,size/32);
  const r=(color,a,b,w,h)=>rect(ctx,color,a,b,w,h);
  if(id==='muscle') {
    poly(ctx,C.ink,[[4,26],[2,20],[5,13],[10,13],[12,17],[16,18],[18,13],[15,10],[16,5],[21,3],[26,6],[27,12],[24,15],[26,21],[23,27],[15,29]]);
    poly(ctx,C.skin,[[5,25],[4,20],[7,15],[10,15],[11,20],[17,21],[20,17],[20,12],[18,10],[18,6],[21,5],[24,7],[25,11],[22,14],[24,21],[21,25],[15,27]]);
    oval(ctx,C.skinLight,6,16,8,10);oval(ctx,'#eea36c',13,19,10,7);r('#a95a45',15,24,7,2);r('#ffcf8c',19,6,4,2);
  } else if(id==='car') {
    oval(ctx,C.ink,3,22,9,8);oval(ctx,C.ink,22,22,8,8);r('#66546a',5,24,4,3);r('#66546a',24,24,4,3);
    poly(ctx,C.ink,[[1,19],[6,15],[10,9],[22,8],[29,15],[31,18],[30,25],[2,26]]);
    poly(ctx,C.gold,[[3,19],[8,16],[11,11],[21,10],[27,16],[29,19],[28,23],[3,24]]);
    poly(ctx,'#34546c',[[10,15],[13,11],[20,11],[24,15]]);line(ctx,C.goldLight,5,18,26,18,1);r('#fff4b3',4,20,5,2);r('#fff4b3',24,19,4,2);r('#746022',12,22,9,2);
  } else if(id==='followers') {
    heart(ctx,1,4,'#ae226d',1.05);heart(ctx,15,4,'#ae226d',1.05);heart(ctx,5,10,C.pink,1.6);sparkle(ctx,28,5,C.goldLight,2);
  } else if(id==='ego') {
    poly(ctx,C.ink,[[3,9],[10,14],[16,3],[22,14],[29,9],[26,27],[6,27]]);
    poly(ctx,C.gold,[[5,12],[11,17],[16,6],[21,17],[27,12],[24,25],[8,25]]);
    r('#d18b17',8,22,17,3);r(C.goldLight,9,24,15,1);r('#ff41b4',14,17,5,5);
    [4,16,28].forEach((n,i)=>{oval(ctx,C.goldLight,n-2,i===1?2:7,5,5);});
  } else if(id==='money') {
    poly(ctx,C.ink,[[2,11],[21,3],[30,9],[30,24],[11,30],[2,24]]);
    poly(ctx,'#2d8b4d',[[4,12],[21,5],[28,10],[11,18]]);poly(ctx,'#75d578',[[4,14],[11,20],[28,12],[28,23],[11,28],[4,23]]);
    for(let yy=16;yy<25;yy+=3)line(ctx,'#205d40',12,yy+3,27,yy-3,1);
    poly(ctx,'#e0e8a9',[[11,9],[17,7],[24,12],[18,15]]);r('#316e42',17,9,3,3);line(ctx,'#b4ef9d',5,13,11,17,1);
  } else if(id==='airplane') {
    poly(ctx,C.ink,[[15,1],[19,5],[19,12],[30,18],[30,23],[19,20],[20,27],[24,29],[24,31],[16,29],[8,31],[8,29],[12,27],[13,20],[2,23],[2,18],[13,12],[13,5]]);
    poly(ctx,'#d4e9fa',[[16,3],[17,6],[17,14],[28,19],[28,21],[17,18],[18,28],[22,29],[16,27],[10,29],[14,28],[15,18],[4,21],[4,19],[15,14],[15,6]]);
    r('#6bc8ed',15,7,2,8);r('#6487b4',15,20,2,6);sparkle(ctx,27,7,C.goldLight,2);
  } else if(id==='girlfriend') {
    oval(ctx,C.ink,5,1,23,29);oval(ctx,'#3b2334',7,2,19,28);
    poly(ctx,'#b5254e',[[7,27],[12,22],[21,22],[27,28],[27,32],[5,32]]);r('#f0e0d3',14,25,6,7);
    oval(ctx,C.skin,10,5,14,19);oval(ctx,C.skinLight,11,6,11,15);
    poly(ctx,'#352331',[[9,7],[14,2],[22,5],[25,16],[21,18],[20,9],[16,7],[12,11],[10,23],[7,25]]);
    r('#254c3b',12,13,3,2);r('#254c3b',19,13,3,2);r('#72db80',13,13,2,1);r('#72db80',20,13,1,1);r('#c72c60',15,19,5,1);r('#9d5c4d',9,7,2,12);
  } else if(id==='charisma') {
    heart(ctx,1,8,'#e646a5',1.5);sparkle(ctx,25,6,C.goldLight,4);sparkle(ctx,28,24,C.gold,2);
    r('#ffe9c8',7,17,4,2);r('#ffe9c8',15,17,4,2);line(ctx,'#992358',10,22,17,22,1);
  } else if(id==='chopper') {
    [7,25].forEach(n=>{oval(ctx,C.ink,n-6,18,13,13);oval(ctx,'#786182',n-4,20,9,9);oval(ctx,C.ink,n-2,22,5,5);});
    line(ctx,'#94dbef',7,25,14,15,3);line(ctx,'#94dbef',14,15,22,24,3);line(ctx,'#94dbef',7,25,22,24,2);line(ctx,'#94dbef',24,24,21,9,3);
    r('#171c2e',10,12,10,4);r('#ff4da4',13,16,8,5);line(ctx,'#e5effb',20,9,26,8,2);r(C.goldLight,24,11,5,3);r('#d6e5ec',12,24,10,3);
  } else if(id==='truth') {
    poly(ctx,C.ink,[[15,0],[28,7],[27,22],[16,31],[4,23],[3,7]]);
    poly(ctx,'#77d7ee',[[15,3],[25,9],[24,21],[16,27],[7,21],[6,9]]);
    poly(ctx,'#d8f7ff',[[15,5],[22,9],[21,19],[16,24],[10,20],[9,10]]);
    poly(ctx,'#494d7c',[[19,6],[14,14],[18,14],[12,24],[14,16],[10,16]]);sparkle(ctx,26,4,C.goldLight,3);
  } else if(id==='filter') {
    r(C.ink,9,7,14,24);r('#6c47ac',11,8,10,21);r('#ad7aea',12,10,3,17);r('#ee42bd',15,14,5,9);
    r('#e7d8ef',10,5,12,5);r('#9093ad',12,3,8,3);r('#fff2e0',16,1,5,3);r('#292c46',19,2,3,2);
    [23,26,29].forEach((n,i)=>r('#f9b5eb',n,2-i%2,2,2));sparkle(ctx,26,10,'#f7a7ef',2);
  } else if(id==='validation') {
    r(C.ink,7,1,19,31);r('#8d6d9a',9,2,15,28);r('#14273e',10,5,13,21);r('#3d6591',11,6,11,18);r('#e6d1dd',14,28,5,1);
    heart(ctx,11,9,C.pink,.8);line(ctx,C.goldLight,13,21,16,24,2);line(ctx,C.goldLight,16,24,22,17,2);
    r('#c4efff',14,3,5,1);sparkle(ctx,27,7,C.goldLight,2);
  } else if(id==='speed') {
    poly(ctx,C.gold,[[18,1],[6,18],[14,18],[10,31],[28,12],[19,12],[24,1]]);line(ctx,C.goldLight,19,4,12,15,2);
  } else if(id==='magnet') {
    oval(ctx,C.ink,4,2,25,28);oval(ctx,'#ed3b75',6,4,21,24);r('#17152c',11,3,11,15);r('#e6e4ed',6,1,6,9);r('#e6e4ed',22,1,5,9);r('#ff91b4',8,13,3,9);
  } else if(id==='detox') {
    r(C.ink,10,2,13,29);r('#a7d9cf',12,4,9,25);r('#7bdd8a',12,17,9,12);r('#d4f3dd',10,7,13,4);r('#fff5e4',14,14,5,11);r('#fff5e4',11,17,11,4);
  } else {
    poly(ctx,C.ink,[[16,1],[30,16],[16,31],[2,16]]);poly(ctx,C.gold,[[16,4],[27,16],[16,28],[5,16]]);sparkle(ctx,16,16,'#fff3b2',6);
  }
  ctx.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    this.width=390;this.height=844;this.dpr=1;this.sprites=new Map();
    this.seed=null;this.time=0;this.actors=new ActorArt();this.companion=new CompanionArt();this.charles=new CharlesArt();this.hero=new HeroArt();this.city=new CityArt();this.ready=Promise.all([this.actors.ready,this.hero.ready,this.charles.ready,this.companion.ready]);this.combat=new CombatArt();this.powers=new PowerArt();this.defeatStamps=new Map();this.heroPowerStamps=new Map();this.reducedEffects=false;
    this.resize(canvas.clientWidth||390,canvas.clientHeight||844);
  }
  resize(w,h) {
    this.width=Math.max(1,w);this.height=Math.max(1,h);
    this.dpr=Math.min(2,typeof devicePixelRatio==='number'?devicePixelRatio:1);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    this.ctx.imageSmoothingEnabled=false;
  }
  drawIcon(ctx,id,x,y,size=32) {drawIcon(ctx,id,x,y,size);}
  _sprite(kind,phase,back,type='normal') {
    const key=`${kind}:${phase}:${back?1:0}:${type}`;
    if(this.sprites.has(key))return this.sprites.get(key);
    const canvas=makeCanvas(68,76);if(!canvas)return null;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.translate(1,10);
    if(kind==='hero')heroFrame(ctx,phase,back);
    else if(kind==='girl')girlFrame(ctx,phase,back);
    else gorillaFrame(ctx,phase,back,type);
    this.sprites.set(key,canvas);return canvas;
  }
  _drawGround(camera,seed) {
    this.city.drawGround(this.ctx,camera,this.width,this.height,seed,this.time,this.reducedEffects);
  }

  _shadow(x,y,w=25,h=8,alpha=.48) {
    const ctx=this.ctx;ctx.save();ctx.globalAlpha*=alpha;oval(ctx,'#0b0b1d',x-w/2,y-h/2,w,h,2);ctx.restore();
  }
  _car(p,moving=false) {
    if(moving&&p.carRank!==undefined){drawLamborghini(this.ctx,p,this.reducedEffects);return;}
    const ctx=this.ctx,x=p.x,y=p.y;
    if(moving&&!this.reducedEffects){
      // Speed marks stay attached to the actual car, never a second hitbox.
      ctx.save();ctx.globalAlpha=.75;
      for(let i=0;i<3;i++)line(ctx,C.gold,x-34-i*4,y-9+i*6,x-51-i*5,y-9+i*6,2);
      ctx.restore();
    }
    if(!moving&&(p.h||0)>(p.w||0)*1.3) {
      // Parked cars use their full, vertical world footprint so collisions are visible.
      const w=p.w||34,h=p.h||66,left=x-w/2,top=y-h/2;
      this._shadow(x,y+4,w+8,h+5,.5);
      rect(ctx,C.ink,left-2,top+8,w+4,h-13);rect(ctx,'#8d568c',left+1,top+2,w-2,h-4);
      rect(ctx,'#c782b4',left+3,top+5,3,h-12);rect(ctx,'#5e3b65',left+w-6,top+5,4,h-12);
      rect(ctx,'#ad6c9f',left+5,top+4,w-12,13);rect(ctx,'#d194ba',left+6,top+5,w-15,1);
      poly(ctx,'#1d2a43',[[left+5,top+19],[left+w-5,top+19],[left+w-7,top+29],[left+7,top+29]]);
      line(ctx,'#7e9db7',left+7,top+20,left+10,top+27,2);rect(ctx,'#765482',left+7,top+31,w-14,14);
      rect(ctx,'#ae7bab',left+8,top+32,w-17,2);rect(ctx,'#28364b',left+6,top+47,w-12,9);
      rect(ctx,'#48677e',left+8,top+48,4,6);rect(ctx,'#d695c0',left+5,top+h-9,w-10,2);
      rect(ctx,'#efcead',left+3,top+2,7,4);rect(ctx,'#efcead',left+w-10,top+2,7,4);
      rect(ctx,'#db5a78',left+3,top+h-5,6,3);rect(ctx,'#db5a78',left+w-9,top+h-5,6,3);
      rect(ctx,'#34253c',left-3,top+21,4,7);rect(ctx,'#34253c',left+w-1,top+21,4,7);
      line(ctx,'#453047',left+14,top+8,left+20,top+15,1);return;
    }
    const w=Math.max(34,Math.min(61,p.w||47)),h=Math.max(22,Math.min(38,p.h||29));
    const yellow=moving||hash(Math.round(x),Math.round(y),this.seed)>.7;
    const body=yellow?'#d6a619':'#825086',hi=yellow?'#ffe35d':'#bd80b5';
    this._shadow(x,y+8,w+8,14,.55);
    oval(ctx,C.ink,x-w/2+4,y+2,10,14);oval(ctx,C.ink,x+w/2-14,y+2,10,14);
    poly(ctx,C.ink,[[x-w/2,y-2],[x-w/2+5,y-11],[x-10,y-h/2-8],[x+13,y-h/2-8],[x+w/2-3,y-9],[x+w/2,y],[x+w/2-2,y+12],[x-w/2+2,y+12]]);
    poly(ctx,body,[[x-w/2+2,y-2],[x-w/2+7,y-10],[x-8,y-h/2-6],[x+11,y-h/2-6],[x+w/2-5,y-8],[x+w/2-2,y],[x+w/2-4,y+9],[x-w/2+4,y+9]]);
    poly(ctx,'#25314b',[[x-8,y-h/2-4],[x+10,y-h/2-4],[x+17,y-7],[x-15,y-7]]);line(ctx,'#7392a7',x-6,y-h/2-3,x-11,y-9,2);line(ctx,hi,x-w/2+5,y-3,x+w/2-5,y-3,2);
    rect(ctx,yellow?'#fff2aa':'#f0b8b8',x-w/2+5,y+2,8,3);rect(ctx,yellow?'#fff2aa':'#f0b8b8',x+w/2-13,y+2,8,3);rect(ctx,'#252037',x-8,y+3,16,4);rect(ctx,'#b9b2a2',x-4,y+9,8,2);
    if(!moving){line(ctx,'#383145',x-6,y-15,x+5,y-7,1);line(ctx,'#41354b',x+1,y-18,x-1,y-10,1);rect(ctx,'#66576c',x+7,y-2,7,1);}
  }
  _bike(p,chopper=false) {
    const ctx=this.ctx,x=p.x,y=p.y;
    if(chopper){
      const vx=p.vx??640,vy=p.vy??0,len=Math.max(1,Math.hypot(vx,vy)),dx=vx/len,dy=vy/len;
      this._shadow(x,y+8,54,9,.25);ctx.save();ctx.globalAlpha=.9;
      if(!this.reducedEffects)for(let i=0;i<3;i++){const side=(i-1)*7;line(ctx,'#71eeff',x-dx*31-dy*side,y-dy*31+dx*side-8,x-dx*52-dy*side,y-dy*52+dx*side-8,2);}
      ctx.translate(Math.round(x),Math.round(y));if(dx<0)ctx.scale(-1,1);
      for(const wheel of [-19,20]){ring(ctx,'#71eeff',wheel,3,10,.22,2,0,1);ring(ctx,'#285a79',wheel,3,6,.35,1,0,1);}
      for(const [a,b,c,d]of [[-19,3,-7,-13],[-7,-13,9,3],[9,3,-19,3],[20,3,11,-23],[11,-23,18,-23],[-5,-12,9,-12],[-12,-17,-2,-17],[-14,9,9,9]])line(ctx,'#71eeff',a,b,c,d,2);
      rect(ctx,'#376c7e',-10,-6,18,13);for(let n=0;n<3;n++)line(ctx,'#94eaf0',-9,-4+n*4,6,-4+n*4,1);line(ctx,'#71eeff',-15,10,10,10,3);line(ctx,'#c5fcff',-17,-16,-5,-16,4);line(ctx,'#71eeff',18,1,11,-23,3);poly(ctx,'#337f91',[[-8,-17],[-2,-22],[9,-21],[15,-14],[9,-9],[-5,-10]]);line(ctx,'#c5fcff',-2,-16,8,-16,2);rect(ctx,'#c5fcff',12,-20,5,3);
      if(!this.reducedEffects)for(let y=-21;y<11;y+=7)line(ctx,'#3b8eac',-7,y,9,y,1);
      ctx.restore();return;
    }
this._shadow(x,y+7,40,8);
    [-14,14].forEach(v=>{oval(ctx,C.ink,x+v-7,y-3,15,17);oval(ctx,'#726078',x+v-5,y-1,11,13);oval(ctx,'#252237',x+v-4,y,9,11);line(ctx,'#9b8b9d',x+v,y+5,x+v+4,y+1,1);});
    line(ctx,C.ink,x-14,y+5,x-3,y-12,4);line(ctx,C.ink,x-3,y-12,x+10,y+5,4);line(ctx,'#5fbbcf',x-14,y+5,x-3,y-12,2);line(ctx,'#5fbbcf',x-3,y-12,x+10,y+5,2);line(ctx,'#6ed7df',x-14,y+5,x+10,y+5,2);line(ctx,'#6ed7df',x-3,y-12,x+10,y-12,2);line(ctx,'#798ead',x+14,y+5,x+8,y-18,2);
    rect(ctx,C.ink,x-7,y-15,11,4);line(ctx,'#d2c7d3',x+8,y-18,x+16,y-18,2);
    if(chopper){oval(ctx,'#d63a82',x-1,y-11,14,8);rect(ctx,'#c0bbc8',x-6,y+6,18,3);rect(ctx,C.goldLight,x+11,y-15,5,3);}
  }
  _prop(p,focus=null) { if(p.type==='discovery'){drawDiscovery(this.ctx,p,this.time,this.reducedEffects);return;}this.city.drawProp(this.ctx,p,this.seed,this.time,this.reducedEffects,focus); }

  _chest(p) {
    const ctx=this.ctx,x=Math.round(p.x),y=Math.round(p.y),open=p.open;
    this._shadow(x,y+8,33,10);
    if(!open){ctx.save();ctx.globalAlpha=.13+.06*Math.sin(this.time*4);oval(ctx,C.gold,x-25,y-18,50,40,2);ctx.restore();}
    rect(ctx,C.ink,x-15,y-10,31,23);rect(ctx,'#8b4b0f',x-13,y-8,27,19);rect(ctx,'#c37d12',x-11,y-7,23,16);rect(ctx,'#f6bf31',x-13,y-8,27,3);rect(ctx,'#f6bf31',x-13,y+8,27,3);
    [-9,7].forEach(n=>{rect(ctx,'#553317',x+n-1,y-8,4,19);rect(ctx,C.gold,x+n,y-8,2,18);});
    if(open){rect(ctx,'#201b2b',x-11,y-11,23,7);poly(ctx,'#b77914',[[x-15,y-13],[x-12,y-24],[x+11,y-24],[x+16,y-13]]);line(ctx,C.goldLight,x-13,y-14,x+13,y-14,2);}
    else {oval(ctx,C.ink,x-15,y-19,31,18);oval(ctx,'#c58a1d',x-13,y-17,27,14);rect(ctx,'#f8c83a',x-12,y-15,25,2);rect(ctx,'#87540c',x-12,y-9,25,2);rect(ctx,'#ffdd4b',x-10,y-17,3,13);rect(ctx,'#ffdd4b',x+7,y-17,3,13);rect(ctx,C.ink,x-3,y-8,7,9);rect(ctx,C.goldLight,x-2,y-7,5,6);rect(ctx,'#86541b',x,y-5,1,3);sparkle(ctx,x+17,y-17,C.goldLight,3);}
  }
  _cloud(cloud,foreground=false) {
    const ctx=this.ctx,r=cloud.r||35,t=this.reducedEffects?0:this.time,life=Math.max(0,Math.min(1,(cloud.life||0)/(cloud.maxlife||4)));
    const alpha=(.45+Math.min(.55,life*1.7))*(foreground?.23:1);
    ctx.save();
    ctx.globalAlpha=alpha*.22;ctx.fillStyle='#89e51c';ctx.beginPath();ctx.arc(cloud.x,cloud.y,r,0,TAU);ctx.fill();
    ctx.globalAlpha=alpha*.9;ctx.strokeStyle='#baff3c';ctx.lineWidth=2;ctx.stroke();
    const puffs=[[-.38,.02,.88],[.1,-.38,.96],[.4,.09,.86],[.04,.35,1.02]];
    for(let i=0;i<(this.reducedEffects?3:puffs.length);i++){
      const [a,b,c]=puffs[i],x=cloud.x+a*r+Math.sin(t*.65+i)*r*.045,y=cloud.y+b*r+Math.cos(t*.55+i)*r*.035,w=r*c,h=w*.82;
      ctx.globalAlpha=alpha*.45;ctx.fillStyle=i%2?'#8fdc1b':'#a5ed24';ctx.beginPath();ctx.ellipse(x,y,w/2,h/2,0,0,TAU);ctx.fill();
      ctx.globalAlpha=alpha*.5;ctx.strokeStyle='#79b612';ctx.lineWidth=1;ctx.stroke();
      ctx.globalAlpha=alpha*.35;ctx.fillStyle='#c0fa3c';ctx.beginPath();ctx.ellipse(x-w*.08,y-h*.2,w*.3,h*.19,0,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  _drop(p,state,trail=true) {
    const ctx=this.ctx,x=Math.round(p.x),y=Math.round(p.y+(this.reducedEffects?0:Math.sin(this.time*3+p.x)*2));
    if(!this.reducedEffects){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.38;
      const color=p.kind==='coin'?'#f5cd76':p.kind==='xp'?'#75e7f2':'#e68ff2';let stamp=PICKUP_GLOWS.get(color);
      if(!stamp){
        stamp=makeCanvas(24,24);
        if(stamp){const c=stamp.getContext('2d'),glow=c.createRadialGradient(12,12,2,12,12,12);glow.addColorStop(0,color);glow.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=glow;c.fillRect(0,0,24,24);PICKUP_GLOWS.set(color,stamp);}
      }
      if(stamp)ctx.drawImage(stamp,x-12,y-12);
      else{const glow=ctx.createRadialGradient(x,y,2,x,y,12);glow.addColorStop(0,color);glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(x-12,y-12,24,24);}
      ctx.restore();
    }
    if(p.kind==='xp'){
      let drewTrail=false;
      if(trail&&!this.reducedEffects&&state){
        const {target,reach,distance}=pickupAttraction(state,p),dx=p.x-target.x,dy=p.y-target.y;
        if(distance>22&&distance<reach){
          drewTrail=true;ctx.save();ctx.globalAlpha=.8;ctx.fillStyle='#75e7f2';
          for(let i=1;i<=4;i++)ctx.fillRect(Math.round(x+dx/distance*i*6),Math.round(y+dy/distance*i*6),3,2);
          ctx.restore();
        }
      }
      // A hollow cyan diamond stays distinct from coins, gems and purple debris.
      this._shadow(x,p.y+5,9,4,.3);
      poly(ctx,'#172239',[[x,y-8],[x+7,y],[x,y+8],[x-7,y]]);
      poly(ctx,'#75e7f2',[[x,y-6],[x+5,y],[x,y+6],[x-5,y]]);
      poly(ctx,'#23536a',[[x,y-3],[x+2,y],[x,y+3],[x-2,y]]);
      rect(ctx,'#e0ffff',x-1,y-5,2,2);
      return drewTrail;
    }
    this._shadow(x,p.y+5,9,4,.3);
    if(p.kind==='coin') {oval(ctx,'#50331c',x-6,y-6,12,13);oval(ctx,'#ffe09a',x-5,y-6,10,12);oval(ctx,'#dc9c32',x-3,y-4,7,9);rect(ctx,'#fff3c8',x-3,y-4,2,6);rect(ctx,'#ffe09a',x,y-3,1,5);}
    else if(p.kind==='heal') {rect(ctx,C.ink,x-6,y-6,13,13);rect(ctx,'#eee9d5',x-5,y-5,11,11);rect(ctx,'#e83967',x-2,y-4,4,9);rect(ctx,'#e83967',x-4,y-2,9,4);}
    else if(p.kind==='gem'){
      poly(ctx,C.ink,[[x-3,y-8],[x+3,y-8],[x+8,y-2],[x,y+8],[x-8,y-2]]);
      poly(ctx,'#e68ff2',[[x-3,y-6],[x+3,y-6],[x+6,y-2],[x,y+6],[x-6,y-2]]);
      poly(ctx,'#ffe2ff',[[x-3,y-6],[x+2,y-6],[x,y-2],[x-5,y-2]]);
      poly(ctx,'#a950c3',[[x,y-2],[x+6,y-2],[x,y+6]]);line(ctx,'#f8bcff',x,y-2,x,y+5,1);
    }else {poly(ctx,C.ink,[[x,y-7],[x+6,y-2],[x+3,y+6],[x-3,y+6],[x-6,y-2]]);poly(ctx,'#71d3fd',[[x,y-6],[x+5,y-2],[x+2,y+5],[x-2,y+5],[x-5,y-2]]);poly(ctx,'#c0f8ff',[[x,y-5],[x+1,y-2],[x-2,y+3],[x-4,y-2]]);line(ctx,'#3575bb',x+1,y-2,x+2,y+4,1);}
  }
  _defeatImpact(effect,s){
    const age=s.elapsed-effect.start,duration=this.reducedEffects?.16:.07;
    if(age<0||age>=duration)return;
    if(this.reducedEffects){
      // Low-effects mode never allocates outlines or offscreen defeat canvases.
      const ctx=this.ctx;ctx.save();ctx.globalAlpha=1-age/duration;
      this.actors.draw(ctx,{...effect.actor,hitFlash:0},'enemy',effect.phase,s,effect.start,true);ctx.restore();return;
    }
    let stamp=this.defeatStamps.get(effect);
    if(!stamp){
      const original=makeCanvas(224,224),ivory=makeCanvas(224,224);if(!original||!ivory)return;
      const c=original.getContext('2d');c.imageSmoothingEnabled=false;c.translate(112,184);
      const actor={...effect.actor,x:0,y:0,hitFlash:0};
      if(!this.actors.draw(c,actor,'enemy',effect.phase,s,effect.start,true)&&!EGO_BEASTS[actor.type]){
        const scale=ENEMY_SCALE[actor.type]||.84,sprite=this._sprite('gorilla',effect.phase,actor.faceY<-.45,actor.type);
        if(sprite)c.drawImage(sprite,-34*scale,10-71*scale,68*scale,76*scale);
      }
      const tint=ivory.getContext('2d');tint.drawImage(original,0,0);tint.globalCompositeOperation='source-in';tint.fillStyle='#fff4d7';tint.fillRect(0,0,224,224);
      stamp={original,ivory};this.defeatStamps.set(effect,stamp);
    }
    const ctx=this.ctx,x=Math.round(effect.actor.x)-112,y=Math.round(effect.actor.y)-184;ctx.save();
    {
      ctx.globalAlpha=.95;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])ctx.drawImage(stamp.ivory,x+dx,y+dy);
      ctx.globalAlpha=1;ctx.drawImage(stamp.original,x,y);ctx.globalAlpha=.3*(1-age/duration);ctx.drawImage(stamp.ivory,x,y);
    }
    ctx.restore();
  }
  _heroPowerStamp(s,color){
    if(!this.hero.image)return null;
    const pose=computeHeroPose(s),art=pose.art,f=art.frame,anchor=art.anchor||[65,111],t=art.transform,key=`${f.x}:${f.y}:${art.mirror}:${t.a}:${t.b}:${t.c}:${t.d}:${color}`;
    if(this.heroPowerStamps.has(key))return this.heroPowerStamps.get(key);
    const canvas=makeCanvas(144,128);if(!canvas)return null;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    c.save();c.translate(72,111);c.transform(t.a,t.b,t.c,t.d,0,0);if(art.mirror)c.scale(-1,1);c.drawImage(this.hero.image,f.x,f.y,f.w,f.h,-anchor[0],-anchor[1],f.w,f.h);c.restore();
    c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,144,128);
    if(this.heroPowerStamps.size>=24)this.heroPowerStamps.delete(this.heroPowerStamps.keys().next().value);
    this.heroPowerStamps.set(key,canvas);return canvas;
  }
  _heroPowerUnderlay(s){
    if(this.reducedEffects||s.mode==='gameover')return;
    const ctx=this.ctx,ground=computeHeroPose(s).art.ground;
    if(s.upg?.speed>0&&s.walkMoving&&!s.stunt?.active){
      const d=Math.hypot(s.moveX,s.moveY)||1,dx=s.moveX/d,dy=s.moveY/d,stamp=this._heroPowerStamp(s,C.gold);
      ctx.save();
      if(stamp)for(let n=2;n>=1;n--){ctx.globalAlpha=n===2?.09:.18;ctx.drawImage(stamp,Math.round(ground.x-dx*n*13)-72,Math.round(ground.y-dy*n*13)-111);}
      ctx.globalAlpha=.7;for(let n=1;n<=2;n++){const x=s.x-dx*n*16,y=s.y-dy*n*16+7;line(ctx,C.gold,x-dx*5-dy*3,y-dy*5+dx*3,x,y,2);line(ctx,C.gold,x-dx*5+dy*3,y-dy*5-dx*3,x,y,2);}ctx.restore();
    }
    if(s.upg?.filter>0){
      const gas=(s.clouds||[]).some(p=>(p.arm||0)<=0&&Math.hypot(p.x-s.x,p.y-s.y)<(p.r||0)+16);
      if(gas){const stamp=this._heroPowerStamp(s,'#c4ffc8');if(stamp){ctx.save();ctx.globalAlpha=.6;for(const[dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])ctx.drawImage(stamp,Math.round(ground.x)-72+dx,Math.round(ground.y)-111+dy);ctx.restore();}}
      if(s.walkMoving){ctx.save();ctx.globalAlpha=.4;const d=Math.hypot(s.moveX,s.moveY)||1,dx=s.moveX/d,dy=s.moveY/d;for(let n=1;n<=2;n++)line(ctx,'#c4ffc8',s.x-dx*n*13-2,s.y-dy*n*13+8,s.x-dx*n*13+2,s.y-dy*n*13+8,2);ctx.restore();}
    }
  }
  _shield(s){
    if(!(s.shield>0))return;const ctx=this.ctx;
    ctx.save();ctx.globalAlpha=this.reducedEffects?.65:.48;
    if(this.reducedEffects){for(let n=0;n<3;n++)rect(ctx,'#84eaff',s.x-8+n*6,s.y+15,4,2);}
    else{const ratio=Math.min(1,s.shield/Math.max(s.shield,s.stats?.shieldMax||0,1));for(let n=0;n<3;n++)for(let a=n*TAU/3+.18;a<n*TAU/3+.18+1.72*ratio;a+=.13)rect(ctx,'#84eaff',s.x+Math.cos(a)*35,s.y-35+Math.sin(a)*38,2,3);}
    ctx.restore();
  }
  _actor(actor,kind,phase,s) {
    if(kind==='hero'){
      const ctx=this.ctx,x=actor.x,y=actor.y;
      if(!this.reducedEffects){
        ctx.save();const pool=ctx.createRadialGradient(x,y-19,4,x,y-19,59);pool.addColorStop(0,'rgba(244,192,113,.13)');pool.addColorStop(.5,'rgba(235,173,98,.06)');pool.addColorStop(1,'rgba(235,173,98,0)');ctx.fillStyle=pool;ctx.fillRect(x-59,y-78,118,118);ctx.restore();
        this._shadow(x,y+10,44,14,.17);this._shadow(x,y+10,36,10,.28);
      }
      this._heroPowerUnderlay(s);this._shadow(x,y+10,27,6,.56);if(this.hero.draw(this.ctx,s,this.time,this.reducedEffects))return;
    }
    const ctx=this.ctx,isEnemy=kind==='enemy',isGirl=kind==='girl';
    const type=actor.type||'normal',gas=isEnemy&&(actor.gasPose||0)>0;
    const fx=actor.faceX??s.faceX??1,fy=actor.faceY??s.faceY??0,back=gas||fy<-.45;
    const scale=isEnemy?(ENEMY_SCALE[type]||.84):(isGirl?.82:.88);
    if(['travestia','pelican'].includes(type)&&!this.actors.availableFor(actor,kind)){ctx.save();ctx.fillStyle='#ffbd6b';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(type==='pelican'?'PÉLI ZODIAQUE':'TRAVESTIA',actor.x,actor.y-35);ctx.restore();return;}
    if(EGO_BEASTS[type]){ctx.save();if(egoCamoRatio(actor)===0)this._shadow(Math.round(actor.x),Math.round(actor.y)+8,36,9);this.actors.draw(ctx,actor,kind,phase,s,this.time,this.reducedEffects);if(!charlesArrival(s.charles)?.locked)drawEgoForeground(ctx,actor,this.reducedEffects);ctx.restore();this._enemyStatus(actor,scale);return;}
    const sprite=this.actors.availableFor(actor,kind)?null:this._sprite(kind==='enemy'?'gorilla':kind,phase,back,type);
    if(!sprite&&!this.actors.availableFor(actor,kind))return;
    const x=Math.round(actor.x),y=Math.round(actor.y),flip=fx<-.1&&!gas;
    this._shadow(x,y+11,isEnemy?49*scale:isGirl?28:33,isEnemy?13:9);
    ctx.save();if(isEnemy)ctx.globalAlpha*=s.opening&&(s.opening.phase==='move'||s.elapsed<.3)?1:this.combat.alpha(actor.id,s.elapsed);
    const raster=kind==='girl'&&this.companion.draw(ctx,actor,s,this.time,this.reducedEffects)||this.actors.draw(ctx,actor,kind,phase,s,this.time,this.reducedEffects);ctx.restore();
    ctx.save();ctx.translate(x,y+10);if(flip)ctx.scale(-1,1);
    if(!raster&&actor.down){ctx.rotate(-Math.PI/2);ctx.globalAlpha=.6;ctx.drawImage(sprite,-34*scale,-45*scale,68*scale,76*scale);}
    else if(!raster){
      if(!isEnemy&&!isGirl&&(s.invulnerable||0)>0&&Math.floor(this.time*14)%2)ctx.globalAlpha=.58;
      const dest=ActorArt.snap(ctx,-34*scale,-71*scale);
      if(isEnemy&&!this.reducedEffects)this.actors._rim(ctx,sprite,0,0,68,76,dest.x,dest.y,Math.round(68*scale),Math.round(76*scale),type,`fallback:${type}:${phase}:${back}`);
      ctx.drawImage(sprite,dest.x,dest.y,68*scale,76*scale);
    }
    ctx.restore();
    if(!raster&&isEnemy&&(actor.hitFlash||0)>0){ctx.save();ctx.globalAlpha*=.35;oval(ctx,'#ffe8bf',x-12,y-22,24,31,2);ctx.restore();}
    if(isEnemy)this._enemyStatus(actor,scale);
    if(isGirl&&!actor.down){rect(ctx,C.ink,x-14,y+15,29,5);rect(ctx,'#58d68e',x-13,y+16,Math.max(0,27*(actor.hp/(actor.maxhp||100))),3);}
    if(type==='travestia'){ctx.save();ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0cb';ctx.fillText('TRAVESTIA',x,y-135);rect(ctx,C.ink,x-31,y-130,62,6);rect(ctx,'#f65f9f',x-30,y-129,60*Math.max(0,actor.hp/actor.maxhp),4);ctx.restore();}
    if(type==='pelican'){ctx.save();ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.strokeText('PÉLI ZODIAQUE',x,y-142);ctx.fillStyle='#ffe5a3';ctx.fillText('PÉLI ZODIAQUE',x,y-142);rect(ctx,C.ink,x-36,y-137,72,6);rect(ctx,'#d58af5',x-35,y-136,70*Math.max(0,actor.hp/actor.maxhp),4);ctx.restore();}
    if(gas){const a=this.time*7;for(let i=0;i<3;i++){const px=x-7+i*8+Math.sin(a+i)*3,py=y+3+(this.time*19+i*8)%21;oval(ctx,i%2?'#c2fa34':'#8dbb20',px-5,py-3,11,8,2);}}
  }
  _enemyStatus(actor,scale){
    const type=actor.type,ego=Boolean(EGO_BEASTS[type]);if(ego&&egoCamoRatio(actor)>0)return;
    const ctx=this.ctx,x=Math.round(actor.x),y=Math.round(actor.y)+(ego?11-egoHeight(actor):0),head=ego?({ego_peacock:93,ego_toad:62,ego_rat:66,ego_chameleon:55}[type]):72*scale;
    if((actor.charmed||0)>0){heart(ctx,x-4,y-(ego?head+9:45*scale)+(ego&&this.reducedEffects?0:Math.sin(this.time*5)*2),C.pink,.7);ring(ctx,'#ed70ca',x,Math.round(actor.y)+(ego?20:9),24*scale,.45,1,ego&&this.reducedEffects?0:this.time*.5);}
    if(!['travestia','pelican'].includes(type)&&actor.hp<actor.maxhp){const w=type==='matriarch'?39:24;rect(ctx,C.ink,x-w/2,y-head,w,4);rect(ctx,type==='matriarch'?'#ff579f':'#d14b83',x-w/2+1,y-head+1,Math.max(0,(w-2)*actor.hp/actor.maxhp),2);}
  }
  _travestiaDash(e,pass='edge'){
    if(e.phase==='tail_dash_recover')return;
    const ctx=this.ctx,d=DASH_DIRECTIONS[e.tailDashDir],r=TAIL_DASH.halfWidth,end=TAIL_DASH.speed*TAIL_DASH.duration+TAIL_DASH.reach,warning=e.phase==='tail_dash_windup';
    ctx.save();ctx.translate(e.tailDashX,e.tailDashY);ctx.rotate(Math.atan2(d.y,d.x));
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(end,-r);ctx.arc(end,0,r,-Math.PI/2,Math.PI/2);ctx.lineTo(0,r);ctx.arc(0,0,r,Math.PI/2,Math.PI*1.5);ctx.closePath();
    drawTelegraph(ctx,'tailDash',e.tailTime,this.time,this.reducedEffects,!warning,pass);
    if(pass==='ground'){ctx.restore();return;}
    ctx.strokeStyle=TELEGRAPH_STYLES.tailDash.edge;
    ctx.fillStyle=ctx.strokeStyle;for(let x=35;x<end;x+=45){ctx.beginPath();ctx.moveTo(x-6,-6);ctx.lineTo(x+4,0);ctx.lineTo(x-6,6);ctx.lineTo(x-1,0);ctx.closePath();ctx.fill();}
    ctx.restore();ctx.save();ctx.fillStyle='#fff0cb';ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillText(warning?'CHARGE ARRIÈRE !':'QUEUE RAIDIE !',e.x,e.y-145);ctx.restore();
  }
  _travestiaAttack(e,pass='edge'){
    if(e.type==='travestia'&&e.phase.startsWith('tail_dash')){this._travestiaDash(e,pass);return;}
    if(e.type!=='travestia'||!['tail_windup','tail_spin'].includes(e.phase))return;
    const ctx=this.ctx,warning=e.phase==='tail_windup',r=TRAVESTIA.radius;
    ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,r,0,TAU);
    drawTelegraph(ctx,'tail',e.tailTime,this.time,this.reducedEffects,!warning,pass);
    if(pass==='ground'){ctx.restore();return;}
    ctx.strokeStyle=TELEGRAPH_STYLES.tail.edge;
    if(warning){ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,r,-Math.PI/2,-Math.PI/2+TAU*(1-e.tailTime/(e.tailWarning||TRAVESTIA.warning)));ctx.stroke();}
    ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0cb';ctx.fillText(warning?'QUEUE HÉLICOPTÈRE !':'GARE À LA QUEUE !',e.x,e.y+r+17);
    ctx.restore();
  }
  _orangutanAttack(e,pass='edge') {
    if(e.type!=='orangutan'||(!(e.windup>0)&&!(e.swipe>0)))return;
    const ctx=this.ctx,dx=e.swipeDirX??e.faceX??1,dy=e.swipeDirY??e.faceY??0,aim=Math.atan2(dy,dx),half=Math.acos(.55),reach=73;
    ctx.save();
    if(e.windup>0){
      ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,reach,aim-half,aim+half);ctx.closePath();
      drawTelegraph(ctx,'swipe',e.windup,this.time,this.reducedEffects,false,pass);
      if(pass==='ground'){ctx.restore();return;}
      rect(ctx,C.ink,e.x-5,e.y-82,11,17);rect(ctx,'#ffce90',e.x-1,e.y-79,3,8);rect(ctx,'#ff8d55',e.x-1,e.y-68,3,3);
    }else if(pass==='edge'){
      const progress=1-Math.max(0,Math.min(1,e.swipe/.28)),angle=aim-half+progress*half*2;
      if(!this.reducedEffects){ctx.globalAlpha=.65;for(let a=angle-.35;a<angle;a+=.05)rect(ctx,'#ffe1a2',e.x+Math.cos(a)*67,e.y+Math.sin(a)*67,3,2);}
    }ctx.restore();
  }

  _rivalAttack(e,foreground=false,pass='edge') {
    const goat=e.type==='rival_goat',rooster=e.type==='rival_rooster';
    if(!goat&&!rooster)return;
    const ctx=this.ctx,dx=e.chargeDirX??e.faceX??1,dy=e.chargeDirY??e.faceY??0;
    ctx.save();
    if(goat&&!foreground&&(e.windup>0||e.charge>0)){
      // The goat locks his direction before charging: the whole warning is avoidable.
      const active=e.charge>0,reach=285*(active?Math.min(.55,e.charge):.55),half=(e.r||23)*.64+11,px=-dy*half,py=dx*half;
      ctx.beginPath();
      [[e.x+px,e.y+py],[e.x+dx*reach+px,e.y+dy*reach+py],[e.x+dx*reach-px,e.y+dy*reach-py],[e.x-px,e.y-py]].forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();
      drawTelegraph(ctx,'charge',e.windup||0,this.time,this.reducedEffects,active,pass);
      if(pass==='ground'){ctx.restore();return;}
      ctx.globalAlpha=active?1:.75;for(let d=44;d<reach;d+=38){const x=e.x+dx*d,y=e.y+dy*d;line(ctx,'#ffb45b',x-dx*9-dy*7,y-dy*9+dx*7,x,y,2);line(ctx,'#ffb45b',x-dx*9+dy*7,y-dy*9-dx*7,x,y,2);}
    }
    if(rooster&&!foreground&&e.windup>0){
      ctx.beginPath();ctx.arc(e.x,e.y,180,0,TAU);drawTelegraph(ctx,'crow',e.windup,this.time,this.reducedEffects,false,pass);
      if(pass==='ground'){ctx.restore();return;}
      const progress=Math.max(0,Math.min(1,1-e.windup/.85));
      ctx.globalAlpha=.35+progress*.3;ctx.strokeStyle=TELEGRAPH_STYLES.crow.edge;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,24+progress*14,0,TAU);ctx.stroke();
    }
    if(foreground&&(e.windup>0||e.crow>0||e.charge>0)){
      const crow=rooster&&e.crow>0;
      if(crow){
        ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle=C.ink;ctx.strokeText('COCORICO!',e.x,e.y-94);ctx.fillStyle='#ffe1a2';ctx.fillText('COCORICO!',e.x,e.y-94);
        ctx.strokeStyle=TELEGRAPH_STYLES.crow.edge;ctx.lineWidth=2;for(const side of [-1,1])for(let n=0;n<(this.reducedEffects?1:2);n++){ctx.beginPath();const a=side<0?Math.PI:0;ctx.arc(e.x,e.y-59,29+n*7,a-.45,a+.45);ctx.stroke();}
      }else if(rooster&&e.windup>0){
        rect(ctx,C.ink,e.x-5,e.y-97,11,19);rect(ctx,'#ffd470',e.x-1,e.y-94,3,9);rect(ctx,'#ff9855',e.x-1,e.y-82,3,3);
      }else if(e.windup>0){
        rect(ctx,C.ink,e.x-5,e.y-91,11,19);rect(ctx,goat?'#ffd470':'#ffb4cc',e.x-1,e.y-88,3,9);rect(ctx,'#ff9855',e.x-1,e.y-76,3,3);
      }
      if(goat&&e.charge>0&&!this.reducedEffects){
        for(let n=0;n<4;n++){const x=e.x-dx*(22+n*8),y=e.y-dy*(22+n*8)-10;line(ctx,'#ff8951',x,y,x-dx*12,y-dy*12,2);}
        sparkle(ctx,e.x+dx*26,e.y+dy*26-25,'#fff0b0',4);
      }
    }
    ctx.restore();
  }

  _shockwave(p,pass='edge') {
    const ctx=this.ctx,r=p.r||0,half=(p.width||12)/2;
    ctx.save();ctx.globalAlpha=.65+.35*Math.min(1,(p.life||0)/.25);
    // Only this expanding annulus deals damage; its hollow centre stays clear.
    ctx.beginPath();ctx.arc(p.x,p.y,r+half,0,TAU);ctx.closePath();ctx.moveTo(p.x+Math.max(0,r-half),p.y);ctx.arc(p.x,p.y,Math.max(0,r-half),TAU,0,true);ctx.closePath();
    if(pass==='ground'){ctx.fillStyle=TELEGRAPH_STYLES.crow.fill;ctx.globalAlpha*=this.reducedEffects?.45:.55;ctx.fill();}
    else{ctx.strokeStyle=TELEGRAPH_STYLES.crow.edge;ctx.lineWidth=2;ctx.stroke();}
    ctx.restore();
  }

  _shot(p,s) {
    const ctx=this.ctx;
    if(p.kind==='heart'){if(p.viral&&p.hitIds?.size&&!this.reducedEffects){const dx=p.x-p.linkX,dy=p.y-p.linkY,d=Math.hypot(dx,dy)||1;for(let n=0;n<Math.min(d,260);n+=10)line(ctx,'#f58cbe',p.linkX+dx*n/d,p.linkY+dy*n/d,p.linkX+dx*Math.min(n+4,d)/d,p.linkY+dy*Math.min(n+4,d)/d,2);}heart(ctx,p.x-(p.drone?3:5),p.y-(p.drone?3:5),p.drone?'#7be9ff':C.pink,p.drone?.45:.75);return;}
    if(p.kind==='bill'){ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate(Math.floor(this.time*8)%4*.18-.3);rect(ctx,C.ink,-7,-4,14,9);rect(ctx,'#65c66a',-6,-3,12,7);rect(ctx,'#d5eda1',-1,-2,3,5);rect(ctx,'#2f7945',-5,-2,2,4);ctx.restore();return;}
    const len=Math.hypot(p.vx||1,p.vy||0)||1,dx=(p.vx||1)/len,dy=(p.vy||0)/len;
    if(!this.reducedEffects&&s?.upg?.muscle>0&&p.damage>18)line(ctx,C.pink,p.x-dx*14,p.y-dy*14,p.x,p.y,4);
    if(!this.reducedEffects)line(ctx,'#b28349',p.x-dx*17,p.y-dy*17,p.x,p.y,3);
    line(ctx,'#ffe4a0',p.x-dx*10,p.y-dy*10,p.x,p.y,2);line(ctx,'#fffdeb',p.x-dx*5,p.y-dy*5,p.x,p.y,1);rect(ctx,'#ffffff',p.x-1,p.y-1,2,2);
  }

  _dangerWarnings(enemies,shockwaves,pass='edge'){
    const ctx=this.ctx;
    for(const e of enemies)if((e.windup||0)>0&&!e.dead&&!['orangutan','rival_rooster','rival_goat'].includes(e.type)){
      if(e.type==='explosive'){
        // This boundary marks safe player-center positions, including the same
        // contact margin as Game.explode. Never pulse it into damaging space.
        const radius=EXPLOSIVE_BLAST.radius+EXPLOSIVE_BLAST.playerPadding;
        ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);
        drawTelegraph(ctx,'blast',e.windup,this.time,this.reducedEffects,false,pass);ctx.restore();
      }else{
        const radius=(e.r||19)+17+Math.sin(this.time*12)*2;
        ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,radius,0,TAU);
        drawTelegraph(ctx,e.type==='gas'?'gas':'blast',e.windup,this.time,this.reducedEffects,false,pass);ctx.restore();
      }
      if(pass==='ground')continue;
      rect(ctx,C.ink,e.x-4,e.y-55,9,15);rect(ctx,'#ffe1a2',e.x-1,e.y-53,3,8);rect(ctx,C.orange,e.x-1,e.y-43,3,3);
    }
    for(const e of enemies)if(!e.dead){if(pass==='edge'){drawAnimalWarning(ctx,e);drawEgoGround(ctx,e,this.reducedEffects);drawPelicanGround(ctx,e,this.reducedEffects);}this._travestiaAttack(e,pass);this._orangutanAttack(e,pass);this._rivalAttack(e,false,pass);}
    for(const p of shockwaves||[])this._shockwave(p,pass);
  }
  render(game,time=0) {
    const state=game.state||game.s;if(!state)return;const arrival=charlesArrival(state.charles);const s=state.charles&&state.charles.phase!=='complete'?{...state,elapsed:state.elapsed+state.charles.elapsed}:state;
    // Time is seconds, so long sessions and the first ten seconds behave alike.
    this.time=Number.isFinite(time)?time:0;
    const seed=game.world?.seed??42;this.combat.prepare(s,seed,game.defeatEffects,state);const activeDefeats=new Set(game.defeatEffects||[]);for(const effect of this.defeatStamps.keys())if(!activeDefeats.has(effect))this.defeatStamps.delete(effect);if(this.seed!==seed)this.seed=seed;
    const ctx=this.ctx,w=this.width,h=this.height;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
    rect(ctx,'#191b31',0,0,w,h);
    // Reserve room below Charles's permanent banner, up to 48 px on short
    // screens. Shift the shared view, never actors or attack geometry.
    const charlesInset=s.charles&&s.charles.phase!=='complete'&&!s.endless?Math.max(0,Math.min(48,430-h*.48)):0;
    const camera={x:s.x||0,y:(s.y||0)-charlesInset},ox=Math.round(w/2-camera.x),oy=Math.round(h*.48-camera.y);
    ctx.save();ctx.translate(ox,oy);
    this._drawGround(camera,seed);
    const destroyed=game.world?.destroyed;const props=(game.world?.getVisible?.(camera.x,camera.y,w+210,h+240)||[]).map(p=>presentSceneryProp(charlesProp(p,destroyed))).filter(p=>p&&this.city.isPropVisible(p,camera,w,h));
    this.city.drawRiverLandings(ctx,props);
    const enemies=s.enemies||[],shots=s.shots||[],clouds=s.clouds||[],drops=s.drops||[],particles=s.particles||[];
    // Lamps cast local pools on pavement before any object or actor is painted.
    for(const p of props)if(p.type==='lamp'){
      ctx.save();
      if(!this.reducedEffects){const light=ctx.createRadialGradient(p.x+4,p.y+5,3,p.x+4,p.y+5,88);light.addColorStop(0,'rgba(255,211,141,.16)');light.addColorStop(.45,'rgba(240,187,111,.075)');light.addColorStop(1,'rgba(240,187,111,0)');ctx.fillStyle=light;ctx.fillRect(p.x-84,p.y-83,176,176);}
      ctx.globalAlpha=this.reducedEffects?.09:.11;oval(ctx,'#f3ce92',p.x-51,p.y-10,116,45,2);ctx.globalAlpha=.075;oval(ctx,'#ffe0a4',p.x-32,p.y-3,76,28,2);ctx.restore();
    }
    let xpTrails=16;for(const p of drops)if(this._drop(p,s,xpTrails>0))xpTrails--;
    for(const p of clouds)this._cloud(p);
    // Old checkpoints can contain legacy power rings. Do not replay them as
    // travelling attacks: truth damages at once and airplane is defensive.
    for(const p of s.pulses||[]){if(p.color==='#c9a8ff'||p.color==='#8adce6')continue;const alpha=Math.min(1,(p.life||0)/(p.maxlife||1));ctx.save();ctx.globalAlpha=alpha*.7;ring(ctx,p.color||'#fdd447',p.x,p.y,p.r||1,.055,3,0,1);if(!this.reducedEffects)ring(ctx,'#fff6c2',p.x,p.y,Math.max(0,(p.r||1)-4),.09,1,0,1);ctx.restore();}
    const charlesBodyPose=s.charles?this.charles.pose(s.charles,s.charles.elapsed,this.reducedEffects):null;
    drawCharlesGround(ctx,s.charles,this.reducedEffects,charlesBodyPose);
    drawTrophyGround(ctx,s,this.reducedEffects);
    this.powers.drawGround(ctx,s,game.powerEffects||[],this.reducedEffects);
    if(s.airplane?.active) {
      const a=s.airplane,r=a.r||95,x=a.x??s.x,y=a.y??s.y;
      ctx.save();ctx.globalAlpha=.35;ring(ctx,'#75dff6',x,y,r,.09,2,this.reducedEffects?0:s.elapsed*.12,1);
      if(!this.reducedEffects){ctx.globalAlpha=.12;ring(ctx,'#a5f6ff',x,y,r-4,.12,1,-s.elapsed*.08,1);}ctx.restore();
    }
    if(!arrival?.locked)this._dangerWarnings(enemies,s.shockwaves,'ground');
    const items=[];if(s.charles&&s.charles.phase!=='complete'&&!arrival)items.push({y:s.charles.y+10,kind:'charles',data:s.charles});const inView=(x,y,pad=135)=>Math.abs(x-camera.x)<w/2+pad&&y>camera.y-h*.48-pad&&y<camera.y+h*.52+pad;
    for(const p of props)items.push({y:propDepth(p),kind:'prop',data:p});
    for(const c of s.chests||[])items.push({y:c.y+11,kind:'chest',data:c});
    for(const v of s.vehicles||[])items.push({y:v.y+13,kind:'vehicle',data:v});
    for(const e of enemies)if(!e.dead&&e.hp>0&&inView(e.x,e.y))items.push({y:e.y+10,kind:'enemy',data:e});
    for(const effect of game.defeatEffects||[])if(s.elapsed-effect.start<(this.reducedEffects?.16:.07)&&inView(effect.actor.x,effect.actor.y))items.push({y:effect.actor.y+10,kind:'defeat',data:effect});
    if(s.companion&&s.girl)items.push({y:s.girl.y+10,kind:'girl',data:s.girl});
    items.push({y:s.y+10,kind:'hero',data:s});items.sort((a,b)=>a.y-b.y);
    const phase=Math.floor((s.elapsed||this.time)*12)%8;
    for(const item of items){
      if(item.kind==='charles')this.charles.draw(ctx,item.data,item.data.elapsed,this.reducedEffects);
      else if(item.kind==='defeat')this._defeatImpact(item.data,s);
      else if(item.kind==='prop')this._prop(item.data,s);
      else if(item.kind==='chest'){this._chest(item.data);if(chestTrophyEligible(s,item.data)){const group=BOSS_TROPHIES[item.data.bossType];drawTrophyIcon(ctx,group.choices[0],item.data.x,item.data.y-47,.56,group.color);}}
      else if(item.kind==='vehicle'){if(item.data.kind==='bike')this._bike(item.data,true);else this._car(item.data,true);}
      else {
        const a=item.data,moving=arrival?.locked?false:item.kind==='hero'?Math.hypot(s.moveX||0,s.moveY||0)>.05:item.kind==='girl'?Math.hypot(a.x-s.x,a.y-s.y)>32:true;
        // The simulation records only actual chase travel in a transient cache.
        // Repeated/paused renders cannot advance it, and blocked feet stay planted.
        // Preserve the gait input of creatures owned by another animation system.
        const gaitOffset=typeof a.phase==='number'&&Number.isFinite(a.phase)?a.phase*3:0;
        const legacyPhase=Math.floor((s.elapsed||this.time)*10+gaitOffset+(Number(a.id)||0))%8;
        const actorPhase=arrival?.locked?0:item.kind==='enemy'?enemyGaitFrame(a,game.enemyGait?.get(a),legacyPhase):moving?phase:0;
        if(item.kind==='enemy'&&arrival){ctx.save();ctx.globalAlpha*=arrival.enemyOpacity;this._actor(a,item.kind,(actorPhase+8)%8,s);ctx.restore();}
        else this._actor(a,item.kind,(actorPhase+8)%8,s);
      }
    }
    for(const p of shots)this._shot(p,s);
    for(const e of enemies)if(!arrival?.locked&&!e.dead&&e.type==='pelican')drawPelicanCards(ctx,e,this.reducedEffects);
    for(const e of enemies)if(!arrival?.locked&&!e.dead)this._rivalAttack(e,true);
    // Gas stays on the ground: its decorative foreground puffs hide actor poses.
    for(let i=0;i<particles.length;i++){if(this.reducedEffects&&i%3)continue;const p=particles[i];ctx.save();ctx.globalAlpha=Math.min(1,(p.life||0)/(p.maxlife||.6));if(p.kind==='heart')heart(ctx,p.x-3,p.y-3,p.color||C.pink,.45);else{const size=p.kind==='spark'?2:3;rect(ctx,p.color||C.gold,p.x,p.y,size,size);if(p.kind==='spark')rect(ctx,'#fff0ba',p.x-1,p.y+1,4,1);}ctx.restore();}
    this.combat.draw(ctx,s,this.reducedEffects);
    this.powers.drawForeground(ctx,s,game.powerEffects||[],this.reducedEffects);
    drawTrophyForeground(ctx,s,this.reducedEffects);
    // Airborne arrival paints above scenery; later combat retains ordinary depth.
    if(arrival)this.charles.draw(ctx,s.charles,s.charles.elapsed,this.reducedEffects);
    drawCharlesForeground(ctx,s.charles,this.reducedEffects,charlesBodyPose);
    this._shield(s);
    // Damage edges stay above allied effects; the matching fills lie under actors.
    if(!arrival?.locked)this._dangerWarnings(enemies,s.shockwaves);
    ctx.restore();
    // Subtle film grain is deterministic and far lighter than the playfield art.
    if(!this.reducedEffects){ctx.save();ctx.globalAlpha=.045;for(let y=0;y<h;y+=4)rect(ctx,'#080a21',0,y,w,1);ctx.restore();}
    const vignette=ctx.createRadialGradient(w/2,h*.48,Math.min(w,h)*.28,w/2,h*.48,Math.max(w,h)*.7);
    vignette.addColorStop(0,'rgba(10,8,25,0)');vignette.addColorStop(.55,'rgba(8,7,25,.07)');vignette.addColorStop(1,'rgba(8,7,25,.34)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
}
