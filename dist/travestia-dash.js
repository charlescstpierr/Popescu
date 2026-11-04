// The warning, swept collision and art all share the same locked eight-way aim.
export const TAIL_DASH={warning:1.3,duration:.6,recovery:1.4,speed:400,reach:80,halfWidth:22,damage:26};
export const DASH_DIRECTIONS=Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}));
export function beginTailDash(e,target){
  const a=Math.atan2(target.y-e.y,target.x-e.x);e.tailDashDir=(Math.round(a/(Math.PI/4))+8)%8;
  e.tailDashX=e.x;e.tailDashY=e.y;e.tailDashDistance=0;e.tailHitPlayer=false;e.tailHitGirl=false;
  e.phase='tail_dash_windup';e.tailTime=TAIL_DASH.warning;
}
function segmentDistance(p,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/l)):0;return Math.hypot(p.x-ax-t*dx,p.y-ay-t*dy);}
function clearLine(world,x,y,target){const d=Math.hypot(target.x-x,target.y-y),steps=Math.max(1,Math.ceil(d/8));for(let i=1;i<=steps;i++)if(world.collides(x+(target.x-x)*i/steps,y+(target.y-y)*i/steps,3))return false;return true;}
export function advanceTailDash(game,e,dt){
  const d=DASH_DIRECTIONS[e.tailDashDir],oldX=e.x,oldY=e.y,travel=Math.min(TAIL_DASH.speed*dt,TAIL_DASH.speed*TAIL_DASH.duration-e.tailDashDistance);
  const steps=Math.max(1,Math.ceil(travel/6));
  for(let i=1;i<=steps;i++)if(game.world.collides(e.x+d.x*travel*i/steps,e.y+d.y*travel*i/steps,e.r*.64)){e.phase='tail_dash_recover';e.tailTime=TAIL_DASH.recovery;return;}
  // One atomic move preserves the announced line; normal movement slides on axes.
  e.x+=d.x*travel;e.y+=d.y*travel;e.tailDashDistance+=travel;e.tailWalkDistance=(e.tailWalkDistance||0)+travel;e.tailMoving=travel>0;
  const tipX=e.x+d.x*TAIL_DASH.reach,tipY=e.y+d.y*TAIL_DASH.reach;
  const hits=target=>segmentDistance(target,oldX,oldY,tipX,tipY)<=TAIL_DASH.halfWidth&&clearLine(game.world,e.x,e.y,target);
  if(!e.tailHitPlayer&&hits(game.s)){e.tailHitPlayer=true;game.damage(TAIL_DASH.damage*(game.difficulty.damage||1),'tail',{actorType:e.type,actorId:e.id});}
  if(game.s.companion&&game.s.girl.down<=0&&!e.tailHitGirl&&hits(game.s.girl)){e.tailHitGirl=true;game.s.girl.hp-=TAIL_DASH.damage*(game.difficulty.damage||1);}
}
