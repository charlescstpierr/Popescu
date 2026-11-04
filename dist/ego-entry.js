import {animalFitsViewport,findAnimalEntry} from './animals.js';
import {EGO_BEASTS} from './ego-beasts.js';
// Full-cell geometry is shared by entry checks and the future approved atlas.
// This module is not wired to the runtime until visual approval and art QA.
export const EGO_FRAMES=Object.freeze(Object.fromEntries(Object.entries({ego_peacock:112,ego_toad:96,ego_rat:84,ego_chameleon:104}).map(([type,size])=>[type,Object.freeze({size,left:-size/2,top:-size*.94,anchorY:10})])));
export function egoFitsViewport(game,e){return animalFitsViewport(game,e,EGO_FRAMES);}
export function findEgoEntry(game,type,preferred,introduction=false){return findAnimalEntry(game,type,preferred,introduction,EGO_BEASTS,EGO_FRAMES);}
