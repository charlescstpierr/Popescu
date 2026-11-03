// Shared descriptions are the rules shown to the player, not separate UI copies.
export const DISCOVERIES = Object.freeze({
  ruin: {name:'Ruines du studio',description:'Fusil : dégâts +35 %',duration:24,color:'#e3b581',damage:1.35},
  cabin: {name:'Cabane de répit',description:'Récupère 2 PV/s',duration:16,color:'#9cddaa',healing:2},
  altar: {name:'Autel de validation',description:'Ramassage +150 px',duration:24,color:'#d3a5ff',magnet:150},
  wreck: {name:'Épave de luxe',description:'Vitesse +25 % · véhicule inutilisable',duration:20,color:'#ffc96c',speed:1.25},
  anomaly: {name:'Faille hors ligne',description:'Fusil : cadence +54 % · vitesse −10 %',duration:18,color:'#7ce1ef',fireInterval:.65,speed:.9}
});
export const DISCOVERY_KINDS = Object.freeze(Object.keys(DISCOVERIES));
export const DISCOVERY_COOLDOWN = 120;

export function discoveryPrompt(site){
  if(site.cooldown>0)return 'Lieu épuisé. Explore un autre secteur.';
  if(site.needsExit)return 'Éloigne-toi du lieu, puis reviens pour explorer.';
  return `Approche-toi pour explorer. ${site.description||''}`;
}
