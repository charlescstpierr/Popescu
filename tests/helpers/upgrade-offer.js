// Dialogue tests need a real offered card, not a permanent dependency on the
// draft algorithm mapping one magic RNG value to the companion. Probe only
// the real draft, then reset its RNG so gainXP opens that exact offer normally.
export function seedUpgradeOffer(game,id){
 const original=game.rng;
 for(let i=1;i<=256;i++){
  const seed=Math.imul(i,0x9e3779b9);game.rng=seed;
  if(game.rollUpgradeOptions().some(o=>o.id===id)){game.rng=seed;return seed;}
 }
 game.rng=original;throw new Error(`No real upgrade offer contains ${id}`);
}
