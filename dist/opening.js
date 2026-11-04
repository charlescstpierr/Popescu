// Opening cards reuse the existing serializable dialogue surface.
export const OPENING = [
  {
    "who": "TOMA",
    "opening": "fantasy",
    "text": "Chuck Norris a une légende. Moi, j'ai la preuve en photo.",
    "reply": "Photo générée : char, villa, abdos. Même les clés.",
    "action": "AMÉLIORER MA VIE"
  },
  {
    "who": "SYSTÈME",
    "opening": "offline",
    "text": "IA HORS LIGNE.",
    "reply": "Tes créations sortent de la photo. Elles n'attendent plus tes ordres.",
    "action": "SORTIR DE LA PHOTO"
  },
  {
    "who": "TOMA",
    "opening": "street",
    "text": "FUCKK ! Mes créations me poursuivent ! Mon char fait quoi ?!",
    "reply": "Survis 20 minutes. Bouge, Toma tire tout seul.",
    "action": "C'EST PARTI"
  }
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

// Only the new-run UI calls this. Restore uses the exact recorded position.
// The interior horizontal street lies in the guaranteed 2×2 starting city.
export function positionNewRun(game){
 const s=game.s;if(s.elapsed!==0||s.mode!=='playing'||s.enemies.length||s.opening||s.x!==0||s.y!==0)return false;
 const x=256,y=512,gx=s.girl.x+x,gy=s.girl.y+y;
 if(game.world.collides(x,y,13)||game.world.collides(gx,gy,13))return false;
 s.x=x;s.y=y;s.girl.x=gx;s.girl.y=gy;game.world.update(x,y);return true;
}
