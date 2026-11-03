// Short-lived visual reactions are derived from simulation changes, never written back.
const COLORS={hit:'#ffe293',heart:'#ff8ebc',dust:'#a494a4'};
export class CombatArt {
  constructor(){this.previous=new Map();this.effects=[];this.appeared=new Map();this.seed=null;this.lastKills=0;this.lastLevel=1;this.lastHP=0;this.started=false;this.defeats=[];}
  prepare(state,seed,defeats=[]){
    this.defeats=defeats;
    if(this.seed!==seed||state.kills<this.lastKills){this.seed=seed;this.previous.clear();this.appeared.clear();this.effects=[];this.started=false;this.lastKills=state.kills;this.lastLevel=state.level;this.lastHP=state.hp;}
    const now=state.elapsed,next=new Map();
    for(const enemy of state.enemies){if(enemy.dead)continue;next.set(enemy.id,{hp:enemy.hp,x:enemy.x,y:enemy.y});const prev=this.previous.get(enemy.id);
      if(prev&&prev.hp-enemy.hp>.5)this.effects.push({kind:'hit',x:enemy.x,y:enemy.y-47,value:Math.round(prev.hp-enemy.hp),start:now,life:.65,color:enemy.charmed>0?COLORS.heart:COLORS.hit});
      if(!prev&&this.started)this.appeared.set(enemy.id,now);
    }
    if(state.hp<this.lastHP-.5)this.effects.push({kind:'ouch',x:state.x,y:state.y-40,start:now,life:.45,value:Math.round(this.lastHP-state.hp),color:'#ff7294'});
    if(state.level>this.lastLevel)this.effects.push({kind:'level',x:state.x,y:state.y,start:now,life:.8,color:'#f9d078'});
    this.effects=this.effects.filter(e=>now-e.start<e.life).slice(-48);for(const [id,start]of this.appeared)if(now-start>.45)this.appeared.delete(id);
    this.previous=next;this.lastKills=state.kills;this.lastLevel=state.level;this.lastHP=state.hp;this.started=true;
  }
  alpha(id,elapsed){const t=this.appeared.get(id);return t===undefined?1:Math.max(.2,Math.min(1,(elapsed-t)/.28));}
  drawDefeats(ctx,state,reduced){
    if(reduced)return;
    for(const e of this.defeats){
      const age=state.elapsed-e.start;if(age<0||age>=.26)continue;
      const radius=Math.max(16,Math.min(28,e.actor.r||17));
      ctx.save();ctx.translate(Math.round(e.actor.x),Math.round(e.actor.y-28));
      if(age<.07){
        ctx.globalAlpha=.9*(1-age/.09);ctx.fillStyle='#fff4d7';
        ctx.fillRect(-2,-8,4,16);ctx.fillRect(-8,-2,16,4);
      }else{
        const t=(age-.07)/.19,spread=1-Math.pow(1-t,2);
        ctx.globalAlpha=Math.min(1,(1-t)*2.2);
        // Eight deterministic chunks; no allocations, blur, RNG or screen shake.
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4+(e.actor.id%5)*.17,r=6+spread*radius;
          const x=Math.round(Math.cos(a)*r),y=Math.round(Math.sin(a)*r*.8-t*6),size=i%3===0?8:6;
          ctx.fillStyle='#382344';ctx.fillRect(x-1,y-1,size+2,size+2);
          ctx.fillStyle=i%2?'#9a5aa7':'#c387d4';ctx.fillRect(x,y,size,size);
          ctx.fillStyle='#61386f';ctx.fillRect(x+1,y+size-2,size-1,2);
          ctx.fillStyle='#e4b4e9';ctx.fillRect(x,y,size-2,2);
        }
      }
      ctx.restore();
    }
  }
  draw(ctx,state,reduced){
    const now=state.elapsed;
    this.drawDefeats(ctx,state,reduced);
    for(const e of this.effects){const t=Math.max(0,(now-e.start)/e.life);ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*1.5);ctx.translate(Math.round(e.x),Math.round(e.y));
      if(e.kind==='hit'||e.kind==='ouch'){
        const y=-t*25;ctx.font=`bold ${e.kind==='ouch'?12:10}px monospace`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#121024';ctx.strokeText(e.kind==='ouch'?`−${e.value}`:String(e.value),0,y);ctx.fillStyle=e.color;ctx.fillText(e.kind==='ouch'?`−${e.value}`:String(e.value),0,y);
        if(!reduced&&e.kind==='hit'){ctx.fillStyle='#fff2ac';for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.5;ctx.fillRect(Math.cos(a)*(7+t*12),20+Math.sin(a)*(7+t*12),2,2);}}
      }else if(!reduced){
        ctx.fillStyle=e.color;const count=e.kind==='level'?14:6;for(let i=0;i<count;i++){const a=i*Math.PI*2/count,r=6+t*(e.kind==='level'?45:19),x=Math.cos(a)*r,y=Math.sin(a)*r*.6-t*8;ctx.fillRect(Math.round(x),Math.round(y),e.kind==='level'?3:4,2);}
      }ctx.restore();
    }
    // Footfall dust follows movement; its fixed small footprint preserves gas readability.
    if(!reduced&&Math.hypot(state.moveX,state.moveY)>.1){ctx.save();ctx.globalAlpha=.2;ctx.fillStyle=COLORS.dust;for(let i=0;i<3;i++){const phase=(now*5+i*.31)%1;ctx.fillRect(Math.round(state.x-state.moveX*phase*16-5+i*4),Math.round(state.y+11-state.moveY*phase*13),2+phase*4,2);}ctx.restore();}
  }
}
