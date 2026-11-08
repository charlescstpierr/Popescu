import {survivalDuration} from './run-rules.js';
// Fixed rewards. No random draws, ranks or repeat rewards for the same species.
export const TROPHIES={
 tarot:{id:'tarot',bossType:'pelican',name:'Tarot flatteur',tag:'ATTAQUE · TOUTES LES 8 S',desc:'Une carte aller-retour : 18 dégâts par passage, jusqu’à 3 cibles.',detail:'Retour au point de lancement.',color:'#cc9cf6',icon:'tarot'},
 ascendant:{id:'ascendant',bossType:'pelican',name:'Ascendant protégé',tag:'DÉFENSE · RECHARGE 12 S',desc:'Absorbe 12 dégâts du prochain coup. Se recharge après utilisation.',detail:'Aucune invincibilité ajoutée.',color:'#cc9cf6',icon:'ascendant'},
 panache:{id:'panache',bossType:'travestia',name:'Coup de panache',tag:'ZONE · TOUTES LES 10 S',desc:'Balayage devant toi : 20 dégâts. Repousse les ennemis ordinaires.',detail:'Ne repousse pas les boss.',color:'#f68dbb',icon:'panache'},
 star:{id:'star',bossType:'travestia',name:'Sortie de star',tag:'MOBILITÉ · RECHARGE 8 S',desc:'Après un coup reçu : vitesse +25 % pendant 2 s.',detail:'Tu restes vulnérable.',color:'#f68dbb',icon:'star'},
 fanclub:{id:'fanclub',bossType:'matriarch',name:'Fan-club forcé',tag:'CONTRÔLE · TOUTES LES 18 S',desc:'2 gorilles ordinaires proches combattent pour toi pendant 2,5 s.',detail:'Aucun boss ni rival.',color:'#f0ca70',icon:'fanclub'},
 badge:{id:'badge',bossType:'matriarch',name:'Badge de modération',tag:'DÉFENSE · PASSIF',desc:'−2 dégâts des contacts ordinaires. Aucun effet sur les boss ou les attaques spéciales.',detail:'Les dégâts restent au minimum à 1.',color:'#f0ca70',icon:'badge'}
};
export const BOSS_TROPHIES={
 pelican:{name:'PÉLI ZODIAQUE',color:'#cc9cf6',quote:'« Les astres ont voté pour moi. »',choices:['tarot','ascendant']},
 travestia:{name:'TRAVESTIA',color:'#f68dbb',quote:'« Le panache, ça vient de moi. »',choices:['panache','star']},
 matriarch:{name:'LA MATRIARCHE',color:'#f0ca70',quote:'« Même la meute veut me suivre. »',choices:['fanclub','badge']}
};
export function createTrophyState(){return {chosen:{},pending:[],cooldowns:{tarot:0,ascendant:0,panache:0,star:0,fanclub:0},tarot:null,panache:null,starLife:0,feedback:null};}
export function hasTrophy(state,id){const def=TROPHIES[id];return !!def&&state.trophies?.chosen[def.bossType]===id;}
export function trophyChoices(type){return (BOSS_TROPHIES[type]?.choices||[]).map(id=>TROPHIES[id]);}
function available(state,type){const t=state.trophies;return !!t&&Object.hasOwn(BOSS_TROPHIES,type)&&!t.chosen[type]&&!t.pending.some(p=>p.bossType===type)&&Object.keys(t.chosen).length+t.pending.length<3;}
export function chestTrophyEligible(state,chest){return !chest.open&&Number.isSafeInteger(chest.bossId)&&chest.bossId>0&&available(state,chest.bossType);}
export function queueBossTrophy(game,chest){
 const s=game.s;if(!chest.open||!Number.isSafeInteger(chest.bossId)||chest.bossId<=0||!available(s,chest.bossType))return false;
 s.trophies.pending.push({bossType:chest.bossType,chestId:chest.id,bossId:chest.bossId});return true;
}
export function openPendingTrophy(game){
 const s=game.s;if(s.mode!=='playing'||s.options.length||s.hp<=0||s.elapsed>=survivalDuration(s)&&!s.endless||!s.trophies.pending.length)return false;
 s.mode='trophy';s.moveX=0;s.moveY=0;game.emit('trophy',s.trophies.pending[0].bossType);return true;
}
export function chooseBossTrophy(game,id){
 const s=game.s,t=s.trophies,p=t.pending[0],def=TROPHIES[id];
 if(s.mode!=='trophy'||!p||!def||def.bossType!==p.bossType||t.chosen[p.bossType]||Object.keys(t.chosen).length>=3)return false;
 t.chosen[p.bossType]=id;t.pending.shift();if(id==='tarot')t.cooldowns.tarot=8;if(id==='panache')t.cooldowns.panache=10;if(id==='fanclub')t.cooldowns.fanclub=18;
 s.mode='playing';s.moveX=0;s.moveY=0;s.invulnerable=Math.max(s.invulnerable,.6);game.sound('level');game.emit('trophy-acquired',def);
 if(!openPendingTrophy(game))game.gainXP(0);return true;
}
export function trimTrophyChests(state,cap=12){
 const protectedIds=new Set(state.trophies.pending.map(p=>p.chestId)),ordinary=state.chests.filter(c=>!protectedIds.has(c.id));
 const slots=Math.max(0,cap-protectedIds.size),retained=new Set((slots?ordinary.slice(-slots):[]).map(c=>c.id));
 return state.chests.filter(c=>protectedIds.has(c.id)||retained.has(c.id));
}
