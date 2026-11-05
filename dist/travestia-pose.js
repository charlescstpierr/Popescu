import {travestiaFrame} from './travestia.js';
import {TAIL_DASH} from './travestia-dash.js';

// Render-only choreography. Timers come from the simulation, never wall time.
// The eight directional paintings describe tail/travel direction, not body facing.
export function travestiaPose(e,time=0){
  const dash=e.phase==='tail_dash'||e.phase==='tail_dash_windup'||e.phase==='tail_dash_recover';
  let index=travestiaFrame(e,time),directional=false;
  if(e.phase==='tail_dash_windup'){
    const elapsed=TAIL_DASH.warning-e.tailTime;
    if(elapsed<.3)index=5; // turn the complete body
    else if(elapsed<.7)index=6; // plant the feet and arm the tail
    else directional=true; // show the exact locked corridor before launch
  }else if(e.phase==='tail_dash')directional=true;
  else if(e.phase==='tail_dash_recover'){
    if(TAIL_DASH.recovery-e.tailTime<.2)directional=true;
    else index=e.tailTime>.55?10:4; // brake, then stand, even if a walk flag is stale
  }
  // Side-view transitions face away from the charge. Vertical views have no
  // horizontal facing; use the same stable right-facing transition on N/S.
  const flip=dash?[0,1,7].includes(e.tailDashDir):(e.tailTime>0?e.tailFaceX:e.faceX)<0;
  return {directional,index:directional?e.tailDashDir:index,flip};
}
