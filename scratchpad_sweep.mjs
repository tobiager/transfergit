import { getFormationOptions, isSmallSided } from "./lib/squad/formations.ts";

const PITCH_NUDGE_X=-2, PITCH_NUDGE_Y=-2;
function toVis(v,inset,nudge){ return inset+(v/100)*(100-2*inset)+nudge; }
function pitchPos(x,y,insetX,insetY){ return {left:toVis(x,insetX,PITCH_NUDGE_X), top:toVis(100-y,insetY,PITCH_NUDGE_Y)}; }

const FULL_W=576, FULL_H=576*118/68, SMALL_W=640, SMALL_H=640*3/4;
const CHIP_W=48, CHIP_H=60;
const MIN_DIST=96*1.5;

function evalInsets(insetXSmall, insetYSmall, insetXFull=10, insetYFull=11){
  let minDist=Infinity, minDistInfo="";
  let maxOverflow=-Infinity, overflowInfo="";
  for(let count=3;count<=11;count++){
    const small=isSmallSided(count);
    const W=small?SMALL_W:FULL_W, H=small?SMALL_H:FULL_H;
    const insetX=small?insetXSmall:insetXFull, insetY=small?insetYSmall:insetYFull;
    for(const option of getFormationOptions(count)){
      const pts = option.slots.map(s=>{
        const p=pitchPos(s.x,s.y,insetX,insetY);
        return {id:s.id, x:(p.left/100)*W, y:(p.top/100)*H};
      });
      for(let i=0;i<pts.length;i++){
        for(let j=i+1;j<pts.length;j++){
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<minDist){minDist=d; minDistInfo=`${option.name}(${count}) ${pts[i].id}-${pts[j].id}`;}
        }
        const halfW=CHIP_W, halfH=CHIP_H;
        const overflows=[pts[i].x-halfW, W-(pts[i].x+halfW), pts[i].y-halfH, H-(pts[i].y+halfH)].map(v=>-v);
        const worst=Math.max(...overflows);
        if(worst>maxOverflow){maxOverflow=worst; overflowInfo=`${option.name}(${count}) ${pts[i].id}`;}
      }
    }
  }
  console.log(`insetXSmall=${insetXSmall} insetYSmall=${insetYSmall}: minDist=${minDist.toFixed(1)} (need>=${MIN_DIST}) [${minDistInfo}]  maxOverflow=${maxOverflow.toFixed(1)} (need<=0) [${overflowInfo}]`);
}

for(const y of [8,9,10,11,12,13,14,15,16]){
  evalInsets(9,y);
}
