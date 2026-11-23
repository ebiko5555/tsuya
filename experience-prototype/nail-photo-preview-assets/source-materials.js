/* SOURCE material studies. Canvas-only, offline deterministic render. */
(() => {
  'use strict';
  const styles=Object.freeze([
    Object.freeze({key:'sourceGelClear',label:'透けるジェル',en:'Sheer gel',detail:'色が透ける層'}),
    Object.freeze({key:'sourceGelMagnet',label:'マグネット',en:'Magnetic',detail:'斜めに走る艶'}),
    Object.freeze({key:'sourceGelGlitter',label:'ラメ',en:'Glitter',detail:'粒を控えめに'})
  ]);
  const keys=new Set(styles.map(s=>s.key)), cache=new Map();
  const W=112,H=180;
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  const hex=(s)=>/^#[a-f0-9]{6}$/i.test(s||'')?s.toLowerCase():'#926971';
  const rgba=(a,alpha)=>'rgba('+a.map(Math.round).join(',')+','+clamp(alpha)+')';
  const mix=(a,b,t)=>a.map((x,i)=>x*(1-t)+b[i]*t);
  const smooth=(a,b,t)=>{const f=clamp((t-a)/(b-a));return f*f*(3-2*f)};
  function rndFrom(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  const paintAll=(c,stops,values)=>{
    const g=c.createLinearGradient(...values);stops.forEach(([n,v])=>g.addColorStop(n,v));c.fillStyle=g;c.fillRect(0,0,W,H);
  };
  function chooseColors(palette){
    const p=Array.from(new Set(palette.filter(x=>/^#[a-f0-9]{6}$/i.test(x)).map(hex)));
    if(!p.length)p.push('#926971');
    return Array.from({length:5},(_,i)=>p[i%p.length]);
  }
  function texture(key,color,index){
    color=hex(color);
    const salt=Number(index)||0, id=key+':'+color+':'+salt;
    if(cache.has(id))return cache.get(id);
    const pigment=color.slice(1).match(/../g).map(x=>parseInt(x,16));
    const computedL=(pigment[0]*.2126+pigment[1]*.7152+pigment[2]*.0722)/255;
    const sheer=key==='sourceGelClear', magnet=key==='sourceGelMagnet';
    const r=rndFrom((parseInt(color.slice(1),16)+7919*(salt+1)+37)>>>0);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;
    const c=cv.getContext('2d');
    const pixels=c.createImageData(W,H), data=pixels.data;
    const angle=(r()-.5)*.39 + (salt%2?.36:-.34);
    const vein=r()*6.283, bend=.12+r()*.20;
    const near=[253,244,240], dim=[16,19,26];
    // Cross section: tinted clear base, pigment at different depths, rounded edge.
    // Stacked spatial functions are evaluated once per color, not per camera frame.
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const u=(x+.5)/W, v=(y+.5)/H, xx=(u-.5)*2;
        const cap=smooth(.10,1,Math.abs(xx))*.21;
        const root=smooth(.65,1,v)*.23, free=1-smooth(0,.16,v);
        const wave=.5+.5*Math.sin(4.9*u+7.3*v+1.28*Math.sin(3.4*v+vein)+vein);
        const glow=Math.max(0,1-(xx*.83)**2)*(.57+.22*(1-v));
        const stripe=u-.54+(v-.52)*angle+bend*(v-.54)**2;
        const beam=Math.exp(-(stripe*stripe)/(.024+(salt%3)*.003));
        const soft=magnet ? .056+glow*.12+beam*.35 : sheer ? .075+glow*.13+wave*.06 : .077+glow*.12+wave*.09;
        let a=mix(pigment,near,soft);
        a=mix(a,dim,cap+root*.43+(magnet?.07:0));
        if(v<.10)a=mix(a,near,free*.13);
        const alpha=sheer ? .60+.13*wave+.10*glow+.06*cap : magnet ? .85+.10*beam+cap*.12 : .78+.10*wave+cap*.15;
        const i=(y*W+x)*4;
        data[i]=a[0];data[i+1]=a[1];data[i+2]=a[2];data[i+3]=255*clamp(alpha);
      }
    }
    c.putImageData(pixels,0,0);
    if(magnet){
      // Microscopic particles remain inside the lit magnetic ribbon.
      for(let i=0;i<21;i++){
        const v=.09+r()*.82, u=.54-(v-.52)*angle+(r()-.5)*.20, size=.24+r()*.56;
        c.beginPath();c.ellipse(u*W,v*H,size*1.4,size,.5,0,6.283);
        c.fillStyle=rgba(mix(pigment,near,.71),.10+r()*.26);c.fill();
      }
    }else if(!sheer){
      // Rare irregular pieces at separate depths; no repeated dot grid or star icons.
      const pinch=salt===1||salt===4?.62:.38, spread=salt===2?14:9;
      for(let i=0;i<spread;i++){
        const v=.17+r()*.63, u=clamp(pinch+.12*Math.sin(v*7+vein)+(r()-.5)*.34);
        const size=(.35+r()*1.6)*(i%5===0?1.25:1), rot=r()*6.283;
        const poly=3+Math.floor(r()*3);
        c.beginPath();
        for(let q=0;q<poly;q++){
          const t=rot+q*6.283/poly, rr=size*(.40+r()*.59);
          const x=u*W+Math.cos(t)*rr, y=v*H+Math.sin(t)*rr;
          if(q)c.lineTo(x,y);else c.moveTo(x,y);
        }
        c.closePath();c.fillStyle=rgba(mix(pigment,i%3===0?[245,213,153]:near,.66+.23*r()),.28+r()*.54);c.fill();
      }
    }
    // A broad soft window with a shorter sharper edge. The sculpted wall
    // shades down into the cuticle, but never hides the chosen palette.
    const halo=c.createLinearGradient(0,H*.09,0,H*.93);
    halo.addColorStop(0,'rgba(255,255,255,0)');
    halo.addColorStop(.24,'rgba(255,255,255,.30)');
    halo.addColorStop(.63,'rgba(255,255,255,.085)');
    halo.addColorStop(1,'rgba(255,255,255,0)');
    c.beginPath();c.moveTo(W*.20,H*.14); c.bezierCurveTo(W*.15,H*.27,W*.14,H*.62,W*.22,H*.78);
    c.bezierCurveTo(W*.18,H*.52,W*.24,H*.26,W*.29,H*.13);
    c.closePath(); c.fillStyle=halo;c.fill();
    paintAll(c,[[0,'rgba(255,255,255,.095)'],[.07,'rgba(255,255,255,0)'],[.94,'rgba(255,255,255,0)'],[1,'rgba(245,236,224,.12)']],[0,0,W,0]);
    if(cache.size>=120)cache.delete(cache.keys().next().value);
    cache.set(id,cv);
    return cv;
  }
  function draw(c,key,color,index,w,h){
    if(!keys.has(key))return false;
    c.drawImage(texture(key,color,index),-w/2,-h*.59,w,h*1.16);
    return true;
  }
  globalThis.TSUYASourceMaterials=Object.freeze({styles,has:key=>keys.has(key),chooseColors,draw});
})();
