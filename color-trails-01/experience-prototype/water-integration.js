/* Read-only connection to native five-nail selection; no camera or model creation. */
'use strict';
window.tsuyaWater=(()=>{
 let enabled=false,renderer=null,button=null,frames=0,error=null,painted=false,palette=[];
 const clean=document.createElement('canvas'),cc=clean.getContext('2d',{alpha:false});
 function update(){if(!button)return;button.innerHTML='雫<span>'+(enabled?'ON':'OFF')+'</span>';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'色の雫をオフにする':'色の雫をオンにする');}
 function reset(){renderer?.reset();painted=false;}
 function fail(){enabled=false;error='雫を描画できません。試着は続けられます。';reset();update();const n=document.createElement('div');n.className='water-message';n.setAttribute('role','status');n.textContent=error;document.body.append(n);setTimeout(()=>n.remove(),5000);}
 document.addEventListener('DOMContentLoaded',()=>{button=document.getElementById('waterToggle');update();button.addEventListener('click',()=>{enabled=!enabled;error=null;reset();update();});});
 function apply(ctx,hands,mirror,now,colors){
  painted=false;if(!enabled||document.body.classList.contains('source-planning'))return;
  try{if(!renderer){renderer=new TsuyaWaterRenderer(document.createElement('canvas'));renderer.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();renderer=null;});}
   const source=ctx.canvas;if(renderer.inputWidth!==source.width||renderer.inputHeight!==source.height){renderer.resize(source.width,source.height);renderer.inputWidth=source.width;renderer.inputHeight=source.height;clean.width=source.width;clean.height=source.height;}
   cc.drawImage(source,0,0);palette=colors.slice(0,5);const points=hands[0]?.map(p=>({x:mirror?1-p.x:p.x,y:p.y}))||null;renderer.draw(now,points,clean,palette);
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(renderer.canvas,0,0,source.width,source.height);ctx.restore();painted=true;frames++;
  }catch(e){fail();}
 }
 function restoreNail(ctx){if(!painted)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(clean,0,0);ctx.restore();}
 return {apply,restoreNail,reset,diagnostics:()=>({enabled,frames,error,palette:palette.slice(),...(renderer?.diagnostics()||{segments:0,perFinger:[0,0,0,0,0]})})};
})();
