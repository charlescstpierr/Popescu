import {carLevel} from './lamborghini.js';
const INK='#100e20',BODY='#bc572c',GOLD='#ffd634',LIGHT='#fff3a6';
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function poly(c,color,points){c.fillStyle=color;c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=points[i];if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();}
function tire(c,x,y,w=9,h=18){rect(c,INK,x,y,w,h);rect(c,'#353647',x+2,y+2,w-3,h-3);rect(c,'#969da9',x+4,y+3,3,h-6);rect(c,'#d4d8d8',x+4,y+4,1,h-8);}
// Native pixel geometry follows the approved three-quarter coupé: a broad front,
// darker side, exposed tires, reinforced bumper, wide fenders and rear spoiler.
// The simulation footprint grows at rank three, independently of projected roof.
export function drawLamborghini(c,v,reduced=false){
 if(v.carDelay>0||v.life===0)return;
 const rank=carLevel(v.carRank).rank,wide=rank>=3,w=wide?43:rank>=2?39:36,h=wide?25:18;
 c.save();c.translate(Math.round(v.x),Math.round(v.y));if(v.vx<0||v.carPhase==='back')c.scale(-1,1);
 c.save();c.globalAlpha=.35;rect(c,'#080913',-w+1,h+4,w*2+3,7);c.restore();
 if(v.vx&&!reduced){for(let n=0;n<3;n++)rect(c,n===1?LIGHT:GOLD,-w-14-n*3,-9+n*9,10+n*4,2);}
 // Low angular body, with a dark passenger side rather than a flat gold block.
 poly(c,INK,[[-w,-2],[-w+11,-15],[-w+27,-31],[w-21,-31],[w,-13],[w+2,h-12],[w-13,h+3],[-w+3,h+3],[-w,h-3]]);
 poly(c,BODY,[[-w+2,0],[w-14,0],[w-14,h],[ -w+5,h],[-w+2,h-4]]);
 poly(c,'#633044',[[w-13,-1],[w-1,-11],[w-1,h-12],[w-13,h]]);
 poly(c,'#a04330',[[w-12,1],[w-3,-6],[w-3,h-13],[w-12,h-3]]);
 poly(c,'#ffc279',[[-w+2,-2],[-w+13,-13],[w-2,-13],[w-14,-2]]);
 // Windshield and side window retain a visibly three-quarter orientation.
 poly(c,'#f39c50',[[-w+11,-13],[-w+28,-29],[w-22,-29],[w-2,-13],[w-14,-5]]);
 poly(c,'#24324d',[[-w+16,-14],[-w+30,-27],[w-23,-27],[w-17,-14]]);
 poly(c,'#8eacc0',[[-w+28,-26],[-w+23,-21],[-w+25,-21],[-w+31,-26]]);
 poly(c,'#7893a9',[[-w+23,-20],[-w+27,-20],[-w+22,-15],[-w+27,-15]]);
 poly(c,'#17263c',[[w-19,-26],[w-5,-14],[w-11,-9],[w-16,-14]]);
 // Faceted paint keeps the hood glossy and the lower fascia in deep shadow.
 poly(c,'#e88340',[[-w+3,0],[w-15,0],[w-15,5],[-w+6,6]]);
 poly(c,'#893b30',[[-w+4,10],[w-15,9],[w-15,h],[-w+5,h]]);
 rect(c,'#502b39',-w+5,h-4,w*2-23,3);
 poly(c,'#ffe1a7',[[-w+6,-4],[-w+15,-11],[w-11,-11],[w-17,-8],[-w+18,-8],[-w+11,-3]]);
 poly(c,'#d27639',[[-w+14,-3],[-w+21,-7],[w-19,-7],[w-15,-3]]);
 rect(c,LIGHT,-w+3,-2,w*2-19,2);
 rect(c,'#75372d',-w+14,-4,w*2-39,1);
 rect(c,'#e79957',-w+8,9,17,1);
 rect(c,'#3c2637',w-13,4,9,2);rect(c,'#f6ac62',w-12,-2,2,11);

 // Distinct lamps, dark grille and plate make the front legible at phone scale.
 rect(c,INK,-w+8,2,14,7);rect(c,INK,w-30,2,13,7);
 rect(c,LIGHT,-w+7,3,11,4);rect(c,LIGHT,w-29,3,10,4);
 rect(c,'#fffdf0',-w+7,3,11,2);rect(c,'#fffdf0',w-29,3,10,2);
 rect(c,INK,-13,6,16,5);rect(c,'#7b5260',-11,7,12,1);rect(c,'#c4bd8b',-9,h-2,10,3);
 rect(c,'#44283a',w-10,0,4,2);rect(c,'#ffc279',w-9,-6,3,4);
 // Tires are intentionally above body paint: do not hide them behind the fascia.
 tire(c,w-5,h-19,8,17);tire(c,w-23,h-9,10,18);rect(c,INK,-w+5,h-1,7,9);rect(c,'#444553',-w+7,h,3,7);
 if(rank>=2){
  rect(c,'#727883',-w+1,1,7,h-1);rect(c,'#c9cbd0',-w+1,2,4,h-3);
  rect(c,'#727883',w-23,0,8,h-4);rect(c,'#d6d8d6',w-22,1,4,h-6);
  rect(c,GOLD,-15,11,20,3);rect(c,'#673040',-13,14,16,3);
 }
 if(wide){rect(c,'#ef9954',-w+2,-9,9,8);rect(c,'#813e31',-w+2,0,5,h-1);poly(c,'#ffc279',[[w-29,-1],[w-24,-5],[w-17,-4],[w-14,1],[w-16,4],[w-23,1]]);}
 if(rank>=4){rect(c,INK,-4,-34,4,9);rect(c,INK,w-17,-32,4,10);rect(c,INK,-9,-38,w+11,7);rect(c,GOLD,-7,-37,w+7,3);rect(c,'#703547',-8,-33,w+9,3);}
 if(rank===5){rect(c,LIGHT,-8,-11,4,8);rect(c,LIGHT,0,-11,4,8);rect(c,'#fff7db',w-10,7,3,3);}
 if(v.carPhase==='turn'){
  // This static cue announces the return; no trail implies motion while parked.
  const y=h+14;rect(c,LIGHT,-13,y,21,2);rect(c,LIGHT,-13,y-3,3,8);rect(c,LIGHT,-17,y-1,5,4);
 }
 c.restore();
}
