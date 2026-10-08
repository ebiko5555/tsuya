/* Original screen-space refraction study. No Liquid Handz source or assets. */
'use strict';
class LiquidRenderer {
  constructor(canvas) {
    this.canvas=canvas; this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    if(!this.gl) throw Error('WebGL');
    const gl=this.gl;
    const vs='attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
    const fs=`precision highp float;
    varying vec2 uv; uniform sampler2D scene; uniform sampler2D field; uniform vec2 texel; uniform vec2 aspect; uniform float strength;
    float h(vec2 p){return texture2D(field,clamp(p,0.001,0.999)).r;}
    void main(){
      float height=h(uv); vec2 d=texel*2.;
      vec2 grad=vec2(h(uv+vec2(d.x,0.))-h(uv-vec2(d.x,0.)),h(uv+vec2(0.,d.y))-h(uv-vec2(0.,d.y)));
      vec2 normal=grad*aspect;
      // Strong convex shoulder, gentler core: clear thick glass, never opaque paint.
      vec2 bend=grad*(0.25+height*.37)*strength;
      vec2 p=clamp(uv+bend,vec2(.002),vec2(.998));
      vec3 col=texture2D(scene,p).rgb;
      float edge=smoothstep(.012,.14,length(normal));
      float sheen=pow(max(0.,dot(normalize(vec3(-normal*5.,.28)),normalize(vec3(-.55,.7,.8)))),16.);
      col += vec3(.92,.98,.88)*sheen*edge*.17;
      col *= 1.-edge*.045;
      gl_FragColor=vec4(col,1.);
    }`;
    const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const pr=gl.createProgram(); gl.attachShader(pr,shader(gl.VERTEX_SHADER,vs));gl.attachShader(pr,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);this.program=pr;
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    this.textures=[0,1].map(i=>{gl.activeTexture(gl.TEXTURE0+i);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);return t;});
    gl.uniform1i(gl.getUniformLocation(pr,'scene'),0);gl.uniform1i(gl.getUniformLocation(pr,'field'),1);
    this.source=document.createElement('canvas');this.ctx=this.source.getContext('2d',{alpha:false});
    this.field=document.createElement('canvas');this.fc=this.field.getContext('2d',{alpha:false});
    this.forest=document.createElement('canvas');this.forest.width=900;this.forest.height=1400;this.makeForest();this.trails=[];
  }
  resize(w,h){
    const scale=Math.min(1.6,devicePixelRatio||1,1100/Math.max(w,h));
    this.canvas.width=Math.round(w*scale);this.canvas.height=Math.round(h*scale);this.source.width=this.canvas.width;this.source.height=this.canvas.height;
    this.field.width=384;this.field.height=Math.round(384*h/w);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.trails=[];
  }
  makeForest(){
    const c=this.forest.getContext('2d'),w=900,h=1400;
    let seed=412;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b8c7b8');g.addColorStop(.4,'#567362');g.addColorStop(1,'#163d2d');c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<100;i++){const x=rand()*w,depth=rand(),y=rand()*700;c.fillStyle=`rgba(24,48,36,${.08+depth*.22})`;c.beginPath();c.moveTo(x,0);c.lineTo(x+8+depth*30,0);c.lineTo(x+60+depth*35,h);c.lineTo(x+25,h);c.fill();}
    for(let i=0;i<2700;i++){const x=rand()*w,y=rand()*h,r=2+rand()*22;c.fillStyle=`hsla(${74+rand()*65},${12+rand()*30}%,${15+rand()*55}%,${.1+rand()*.36})`;c.beginPath();c.ellipse(x,y,r,r*.5,rand()*5,0,7);c.fill();}
    for(let i=0;i<8;i++){const x=rand()*w,bw=18+rand()*48;c.fillStyle=i%2?'#22382d':'#34463a';c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-45,400,x+80,800,x+20,h);c.lineTo(x+bw+60,h);c.bezierCurveTo(x+bw,800,x+bw-20,300,x+bw,0);c.fill();for(let j=0;j<18;j++){c.strokeStyle='#b3b5a01b';c.lineWidth=1+rand()*3;c.beginPath();c.moveTo(x+rand()*bw,j*90);c.bezierCurveTo(x+30,j*90+20,x+20,j*90+55,x+15,j*90+95);c.stroke();}}
    const light=c.createRadialGradient(650,180,10,650,180,700);light.addColorStop(0,'#f5f6de85');light.addColorStop(1,'#eff8cb00');c.fillStyle=light;c.fillRect(0,0,w,h);
  }
  cover(source,mirror=false){const c=this.ctx,w=this.source.width,h=this.source.height,sw=source.videoWidth||source.width,sh=source.videoHeight||source.height;const scale=Math.max(w/sw,h/sh);c.save();if(mirror){c.translate(w,0);c.scale(-1,1);}c.drawImage(source,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);c.restore();}
  mapLandmarks(lm,video,mirror){const w=this.source.width,h=this.source.height,sw=video.videoWidth,sh=video.videoHeight,s=Math.max(w/sw,h/sh);return lm.map(p=>({x:((mirror?1-p.x:p.x)*sw*s+(w-sw*s)/2)/w,y:(p.y*sh*s+(h-sh*s)/2)/h}));}
  stamp(points,opacity){
    const c=this.fc,w=this.field.width,h=this.field.height;
    const palm=Math.hypot((points[5].x-points[17].x)*w,(points[5].y-points[17].y)*h);
    const radius=Math.max(4,Math.min(20,palm*.15));
    const blob=(x,y,r,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.32,`rgba(255,255,255,${a*.92})`);g.addColorStop(.7,`rgba(255,255,255,${a*.38})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);};
    // Five small lenses sit just beyond the fingers, leaving most skin untouched.
    for(const tip of [4,8,12,16,20]){
      const a=points[tip-1],b=points[tip],dx=(b.x-a.x)*w,dy=(b.y-a.y)*h,d=Math.max(1,Math.hypot(dx,dy));
      for(let j=0;j<3;j++)blob(b.x*w+dx/d*radius*(.35+j*.34),b.y*h+dy/d*radius*(.35+j*.34),radius*(1-j*.12),opacity*.6);
    }
  }
  ribbon(a,b,opacity){
    const c=this.fc,w=this.field.width,h=this.field.height;
    const palm=Math.hypot((b[5].x-b[17].x)*w,(b[5].y-b[17].y)*h),r=Math.max(3,Math.min(13,palm*.095));
    for(const tip of [4,8,12,16,20]){
      const dx=(b[tip].x-a[tip].x)*w,dy=(b[tip].y-a[tip].y)*h,d=Math.hypot(dx,dy);
      if(d<1||d>w*.3)continue;
      // Gradient tubes connect only neighbouring samples, avoiding teleport streaks.
      for(let k=5;k>=1;k--){c.strokeStyle=`rgba(255,255,255,${opacity*.10})`;c.lineWidth=r*k*.45;c.lineCap='round';c.beginPath();c.moveTo(a[tip].x*w,a[tip].y*h);c.lineTo(b[tip].x*w,b[tip].y*h);c.stroke();}
    }
  }

  draw(now,points,video,mirror=false){
    if(video&&video.readyState>=2)this.cover(video,mirror);else this.cover(this.forest);
    if(points&&(!this.lastStamp||now-this.lastStamp>45)){this.trails.push({time:now,p:points.map(p=>({...p}))});this.lastStamp=now;}
    this.trails=this.trails.filter(t=>now-t.time<800);
    const c=this.fc;c.fillStyle='#000';c.fillRect(0,0,this.field.width,this.field.height);
    // Reconstruct from finite history, not feedback: always fades completely.
    for(let i=0;i<this.trails.length;i++){const tr=this.trails[i],age=(now-tr.time)/800,fade=Math.pow(1-age,1.8);if(i>0)this.ribbon(this.trails[i-1].p,tr.p,fade);if(i%2===0)this.stamp(tr.p,fade*.24);}
    if(points)this.stamp(points,.8);
    const gl=this.gl;gl.useProgram(this.program);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    [this.source,this.field].forEach((src,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,this.textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);});
    gl.uniform2f(gl.getUniformLocation(this.program,'texel'),1/this.field.width,1/this.field.height);gl.uniform2f(gl.getUniformLocation(this.program,'aspect'),1,this.field.height/this.field.width);gl.uniform1f(gl.getUniformLocation(this.program,'strength'),1.2);gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
window.LiquidRenderer=LiquidRenderer;
