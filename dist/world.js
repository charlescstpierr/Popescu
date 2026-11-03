// Chunk-local randomness makes the city independent of exploration order.
const SIZE = 512;
function hash(x, y, seed) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ (seed | 0);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
function generator(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6d2b79f5; let z = n; z = Math.imul(z ^ z >>> 15, z | 1); z ^= z + Math.imul(z ^ z >>> 7, z | 61); return ((z ^ z >>> 14) >>> 0) / 4294967296; };
}

// Footprints describe the objects' feet, not the height of their pixel artwork.
const STREET_SIZE={foodcart:[58,38],vending:[30,28],planter:[36,24],tree:[34,28],table:[42,28],cone:[12,12],barricade:[46,16],crate:[24,22],pallet:[36,25],bags:[28,20],trophy:[34,28],hydrant:[16,18]};
const STREET_CLUSTERS=[
  ['foodcart','table','vending','planter','crate','bags','cone','cone','hydrant','table'],
  ['tree','planter','table','trophy','hydrant','planter','bags','cone','crate'],
  ['barricade','pallet','crate','crate','bags','bags','cone','cone','vending','hydrant'],
  ['trophy','vending','table','foodcart','planter','bags','cone','hydrant','crate']
];
const STREET_SLOTS=[[174,205],[177,279],[208,320],[218,148],[311,134],[362,137],[406,171],[412,246],[409,390],[366,410],[220,421],[104,382],[151,326],[215,209],[212,274],[155,171]];

export class World {
  constructor(seed = 42) { this.seed = seed | 0; this.chunks = new Map(); this.chunkSize = SIZE; }
  chunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (this.chunks.has(key)) return this.chunks.get(key);
    const rand = generator(hash(cx, cy, this.seed));
    const props = [];
    const add = (type, x, y, w, h, solid = false) => props.push({ id: `${key}:${props.length}`, type, x: cx * SIZE + x, y: cy * SIZE + y, w, h, r: Math.min(w, h) / 2, solid, variant: Math.floor(rand() * 5) });
    // Roads cross every 512 pixels. Their central 160 pixels remain clear.
    add('building', 301 + rand() * 24, 267 + rand() * 18, 134 + rand() * 40, 160 + rand() * 44, true);
    if (rand() < .6) add('building', 166, 380, 72, 76, true);
    add('car', 112, 190 + rand() * 55, 34, 66, true);
    add('lamp', 96, 103, 13, 58);
    add('bin', 119, 321, 24, 27);
    add('bench', 255, 111, 58, 24);
    add('bike', 394, 112, 43, 26);
    add('mirror', 174, 139, 26, 49);
    add('phone', 418, 334, 30, 51);
    add('billboard', 288, 411, 86, 52);
    // Different districts grow market, garden, delivery or ego-themed clusters.
    // Every placement is seed-local, bounded, and checked against all existing
    // furniture as well as the buildings and cars. Nothing new blocks movement.
    const cluster=STREET_CLUSTERS[Math.floor(rand()*STREET_CLUSTERS.length)],target=11+Math.floor(rand()*4);
    const place=type=>{
      const [w,h]=STREET_SIZE[type],tall=['foodcart','vending','tree','trophy'].includes(type);
      for(let trial=0;trial<88;trial++){
        const slot=STREET_SLOTS[Math.floor(rand()*STREET_SLOTS.length)];
        const x=Math.round(trial<48?slot[0]+(rand()-.5)*24:84+w/2+rand()*(344-w));
        const y=Math.round(trial<48?slot[1]+(rand()-.5)*22:84+h/2+rand()*(344-h));
        if(x-w/2<84||x+w/2>428||y-h/2<84||y+h/2>428||(tall&&y<164))continue;
        const wx=cx*SIZE+x,wy=cy*SIZE+y;
        if(props.some(p=>Math.abs(wx-p.x)<(w+p.w)/2+4&&Math.abs(wy-p.y)<(h+p.h)/2+4))continue;
        add(type,x,y,w,h);return true;
      }
      return false;
    };
    let dressed=0;
    for(const type of cluster)if(place(type))dressed++;
    const extras=['cone','bags','crate','planter','hydrant','pallet','barricade','table'];
    for(let i=0;i<30&&dressed<target;i++)if(place(extras[Math.floor(rand()*extras.length)]))dressed++;
    this.chunks.set(key, props);
    return props;
  }
  update(x, y) {
    const cx = Math.floor(x / SIZE), cy = Math.floor(y / SIZE);
    for (const key of this.chunks.keys()) { const [a,b] = key.split(',').map(Number); if (Math.abs(a-cx)>4 || Math.abs(b-cy)>4) this.chunks.delete(key); }
    for(let a=cx-2;a<=cx+2;a++) for(let b=cy-2;b<=cy+2;b++) this.chunk(a,b);
  }
  getVisible(x, y, w, h) {
    this.update(x, y);
    const cx=Math.floor(x/SIZE),cy=Math.floor(y/SIZE);
    const rx=Math.min(3,Math.ceil(Math.max(0,w)/2/SIZE)+1),ry=Math.min(3,Math.ceil(Math.max(0,h)/2/SIZE)+1);
    const result=[];
    for(let a=cx-rx;a<=cx+rx;a++) for(let b=cy-ry;b<=cy+ry;b++) for(const p of this.chunk(a,b)) {
      if (Math.abs(p.x-x) <= w/2+p.w/2+64 && Math.abs(p.y-y) <= h/2+p.h/2+64) result.push(p);
    }
    return result.sort((a,b)=>a.id.localeCompare(b.id));
  }
  collides(x,y,r=0) {
    const minx=Math.floor((x-r-110)/SIZE),maxx=Math.floor((x+r+110)/SIZE);
    const miny=Math.floor((y-r-110)/SIZE),maxy=Math.floor((y+r+110)/SIZE);
    for(let a=minx;a<=maxx;a++) for(let b=miny;b<=maxy;b++) for(const p of this.chunk(a,b)) {
      if (!p.solid) continue;
      const dx=Math.max(Math.abs(x-p.x)-p.w/2,0),dy=Math.max(Math.abs(y-p.y)-p.h/2,0);
      if (dx*dx+dy*dy<r*r || (dx===0 && dy===0)) return true;
    }
    return false;
  }
}
