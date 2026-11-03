// Opening cards reuse the existing serializable dialogue surface.
export const OPENING = [
 {who:'TOMA',opening:'fantasy',text:'Ma villa. Mon char. Une autre journée ben normale.',reply:'Belle photo. Rien là-dedans est à toi.',action:'AMÉLIORER MA VIE'},
 {who:'SYSTÈME',opening:'offline',text:'IA HORS LIGNE.',reply:'Toma : « Attends. Même mon char ? »',action:'REVENIR À LA RÉALITÉ'},
 {who:'TOMA',opening:'street',text:'C’est temporaire. Comme ma modestie.',reply:'Survis 20 minutes. Bouge : le tir est automatique.',action:'C’EST PARTI'},
];
export function openingStage(lines,index){const stage=lines?.[index]?.opening;return ['fantasy','offline','street'].includes(stage)?stage:null;}
export function beginTutorial(game){
 const s=game.s;if(s.opening||s.elapsed>0||s.enemies.length)return;
 // Keep the real enemy, physics and full hero sprite. Only stage its first entrance.
 let spot=null;const radius=Math.min(170,game.viewport.width*.43);
 for(let i=0;i<16;i++){const a=-Math.PI/2+i*Math.PI/8,x=s.x+Math.cos(a)*radius,y=s.y+Math.sin(a)*radius;if(!game.world.collides(x,y,25)){spot={x,y};break;}}
 if(spot)game.spawnEnemy('normal',spot.x,spot.y);else game.spawnEnemy('normal');
 game.timers.spawn=6;s.opening={phase:'move',startedAt:0};
}
export function updateTutorial(game,input){
 const t=game.s.opening;if(!t)return true;
 if(t.phase==='move'){if(Math.hypot(input.x,input.y)<.15)return false;t.phase='shoot';t.startedAt=game.s.elapsed;}
 if(t.phase==='shoot'&&game.s.elapsed-t.startedAt>=8)t.phase='done';
 return true;
}
export function tutorialText(game){
 const phase=game.s.opening?.phase;
 return phase==='move'?'Glisse le pouce ou utilise les flèches / WASD / ZQSD.':phase==='shoot'?'Le tir est automatique. Garde tes distances.':'';
}
