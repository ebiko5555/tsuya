/* Screen-space glass trails, derived from the user's successful liquid-study-01. */
'use strict';
class ColorTrailRenderer {
 constructor(canvas){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL');
  const vs='attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const fs=`precision highp float;varying vec2 uv;uniform sampler2D scene;uniform sampler2D field;uniform sampler2D tint;uniform vec2 texel;uniform vec2 aspect;
  float h(vec2 p){return texture2D(field,clamp(p,.001,.999)).r;}
  void main(){float height=h(uv);vec2 d=texel*2.;vec2 grad=vec2(h(uv+vec2(d.x,0.))-h(uv-vec2(d.x,0.)),h(uv+vec2(0.,d.y))-h(uv-vec2(0.,d.y)));vec2 normal=grad*aspect;
   vec2 bend=grad*(.25+height*.37)*1.2;vec3 col=texture2D(scene,clamp(uv+bend,vec2(.002),vec2(.998))).rgb;
   vec4 dye=texture2D(tint,uv);float amount=min(.15,dye.a*.15);col=mix(col,col*(.55+.45*dye.rgb)+dye.rgb*.12,amount);
   float edge=smoothstep(.012,.14,length(normal));float sheen=pow(max(0.,dot(normalize(vec3(-normal*5.,.28)),normalize(vec3(-.55,.7,.8)))),16.);col+=vec3(.92,.98,.88)*sheen*edge*.17;col*=1.-edge*.045;gl_FragColor=vec4(col,1.);
  }`;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(o));return o;};const pr=this.program=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  this.textures=[0,1,2].map(i=>{gl.activeTexture(gl.TEXTURE0+i);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);return t;});['scene','field','tint'].forEach((n,i)=>gl.uniform1i(gl.getUniformLocation(pr,n),i));
  this.field=document.createElement('canvas');this.fc=this.field.getContext('2d',{alpha:false});this.tint=document.createElement('canvas');this.tc=this.tint.getContext('2d');this.activeFingers=[0,1,2,3,4];this.life=680;this.reset();
 }
 reset(){this.segments=[];this.last=null;this.paletteKey='';}
 resize(w,h){const s=Math.min(1,1100/Math.max(w,h));this.canvas.width=Math.round(w*s);this.canvas.height=Math.round(h*s);this.field.width=384;this.field.height=Math.round(384*h/w);this.tint.width=this.field.width;this.tint.height=this.field.height;this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.reset();}
 update(now,points,colors){
  const key=colors.join('|');if(key!==this.paletteKey){this.segments=[];this.last=null;this.paletteKey=key;}
  this.segments=this.segments.filter(s=>now-s.time<this.life);
  if(!points){this.last=null;return;}
  const w=this.field.width,h=this.field.height,palm=Math.hypot((points[5].x-points[17].x)*w,(points[5].y-points[17].y)*h),r=Math.max(3,Math.min(13,palm*.10));
  const tips=[4,8,12,16,20].map(i=>({x:points[i].x*w,y:points[i].y*h}));
  if(this.last&&now-this.last.time>=35){for(const finger of this.activeFingers){const a=this.last.tips[finger],b=tips[finger],distance=Math.hypot(b.x-a.x,b.y-a.y);if(distance>Math.max(1.4,palm*.018)&&distance<w*.22&&now-this.last.time<250)this.segments.push({a:{...a},b:{...b},time:now,r,color:colors[finger],finger});}this.last={tips,time:now};}
  else if(!this.last)this.last={tips,time:now};
  if(this.segments.length>100)this.segments=this.segments.slice(-100);
 }
 draw(now,points,source,colors){
  this.update(now,points,colors);const w=this.field.width,h=this.field.height,c=this.fc,t=this.tc;c.fillStyle='#000';c.fillRect(0,0,w,h);t.clearRect(0,0,w,h);
  for(const s of this.segments){const fade=Math.pow(Math.max(0,1-(now-s.time)/this.life),1.8);c.lineCap=t.lineCap='round';c.lineJoin=t.lineJoin='round';
   for(let k=7;k>=1;k--){c.lineWidth=s.r*k*.34;c.strokeStyle=`rgba(255,255,255,${fade*.135})`;c.beginPath();c.moveTo(s.a.x,s.a.y);c.lineTo(s.b.x,s.b.y);c.stroke();}
   t.globalAlpha=fade*.7;t.strokeStyle=s.color;t.lineWidth=s.r*1.5;t.beginPath();t.moveTo(s.a.x,s.a.y);t.lineTo(s.b.x,s.b.y);t.stroke();
  }t.globalAlpha=1;
  const gl=this.gl;gl.useProgram(this.program);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);[source,this.field,this.tint].forEach((s,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,this.textures[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s);});gl.uniform2f(gl.getUniformLocation(this.program,'texel'),1/w,1/h);gl.uniform2f(gl.getUniformLocation(this.program,'aspect'),1,h/w);gl.drawArrays(gl.TRIANGLES,0,6);
 }
 diagnostics(){return {segments:this.segments.length,perFinger:[0,1,2,3,4].map(i=>this.segments.filter(s=>s.finger===i).length),segmentColors:this.segments.map(s=>({finger:s.finger,color:s.color})),activeFingers:this.activeFingers.slice(),lifetimeMs:this.life};}
}
window.TsuyaWaterRenderer=ColorTrailRenderer;
