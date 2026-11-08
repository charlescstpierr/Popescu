export const SURVIVAL_SECONDS=600;
export const LEGACY_SURVIVAL_SECONDS=1200;

export const survivalDuration=s=>s.survivalDuration??SURVIVAL_SECONDS;
export function progressionTime(s){
 const duration=survivalDuration(s);
 return Math.min(s.elapsed,duration)*LEGACY_SURVIVAL_SECONDS/duration+Math.max(0,s.elapsed-duration);
}
export const finaleAt=s=>survivalDuration(s)-60;
export function finaleBeats(s){
 const duration=survivalDuration(s);
 return {warning:duration-70,boss:duration-60,rivalWarning:duration-46,rival:duration-40,hordeWarning:duration-26,horde:duration-20};
}
