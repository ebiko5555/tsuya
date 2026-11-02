(function(root){
'use strict';
const nailLengthScale=length=>length==='long'?1.16:.68;
const fingerLayout=[
  {x:161,y:424,angle:-.62,width:46,base:73},
  {x:250,y:241,angle:-.10,width:39,base:78},
  {x:331,y:199,angle:.01,width:41,base:82},
  {x:410,y:242,angle:.11,width:39,base:78},
  {x:473,y:329,angle:.23,width:33,base:66}
];
function pairing(preset){return preset.colors.map((color,i)=>({index:i,number:String(i+1).padStart(2,'0'),color,look:preset.looks[i]}));}
function drawHandPreview(c,{length,colors,active,paintNail}){
  c.clearRect(0,0,640,800);
  const bg=c.createRadialGradient(325,400,40,320,400,390);bg.addColorStop(0,'#1b1c22');bg.addColorStop(1,'#090a0d');c.fillStyle=bg;c.fillRect(0,0,640,800);
  const skin=c.createLinearGradient(140,260,470,670);skin.addColorStop(0,'#d8c4b6');skin.addColorStop(.45,'#b9a99f');skin.addColorStop(1,'#776f6c');
  c.fillStyle=skin;c.strokeStyle='rgba(244,232,222,.2)';c.lineWidth=2;
  c.beginPath();c.moveTo(245,748);c.bezierCurveTo(245,682,217,646,204,585);c.bezierCurveTo(166,548,126,481,127,448);c.bezierCurveTo(126,416,156,397,180,424);c.lineTo(224,482);c.lineTo(224,282);c.quadraticCurveTo(222,219,250,218);c.quadraticCurveTo(278,217,279,273);c.lineTo(285,426);c.lineTo(302,236);c.quadraticCurveTo(302,173,331,174);c.quadraticCurveTo(360,174,359,239);c.lineTo(362,423);c.lineTo(383,280);c.quadraticCurveTo(386,216,412,219);c.quadraticCurveTo(440,223,437,281);c.lineTo(431,448);c.lineTo(451,363);c.quadraticCurveTo(459,302,483,309);c.quadraticCurveTo(509,316,498,372);c.lineTo(473,557);c.bezierCurveTo(463,640,422,663,419,748);c.closePath();c.fill();c.stroke();
  c.strokeStyle='rgba(65,51,49,.15)';c.lineWidth=3;c.lineCap='round';
  for(const path of [[[251,518],[312,540],[393,520]],[[275,585],[326,552],[407,583]],[[226,472],[273,496],[281,614]]]){c.beginPath();c.moveTo(...path[0]);c.quadraticCurveTo(...path[1],...path[2]);c.stroke();}
  const scale=nailLengthScale(length);
  fingerLayout.forEach((f,i)=>{const h=f.base*scale;c.save();c.translate(f.x,f.y+30-h*.38);c.rotate(f.angle);if(active===i){c.shadowColor=colors[i];c.shadowBlur=24;}paintNail(c,f.width,h,i);c.restore();});
 }

function install(api){
 const doc=root.document,layer=doc.getElementById('workLayer'),film=doc.getElementById('workFilm'),nails=doc.getElementById('workNails');
 if(!doc.body.classList.contains('art-page'))return;
 doc.body.classList.add('work-link-study');
 const stage=doc.createElement('section');stage.className='study-stage';stage.setAttribute('aria-label','配色の対応と長さプレビュー');
 stage.innerHTML='<div class="study-trial-mark">TSUYA / STUDY 01</div><div class="study-hand" hidden><canvas width="640" height="800" aria-label="選んだ5本と長さを載せた模式図"></canvas><div class="study-preview-title" role="status"></div><button type="button" class="study-return">作品映像へ戻る</button></div><div class="study-colors"><span class="study-colors-title">ネイルに使う5色</span><div class="study-markers" role="group" aria-label="ネイルの5色"></div></div>';
 layer.append(stage);
 const markerBox=stage.querySelector('.study-markers'),hand=stage.querySelector('.study-hand'),canvas=hand.querySelector('canvas'),returnBtn=hand.querySelector('.study-return'),status=hand.querySelector('.study-preview-title');
 const foot=doc.createElement('details');foot.className='study-explanation';foot.innerHTML='<summary>この試作について</summary><p>番号は、作品に着想を得た配色・質感と5本の対応です。作品の特定の部位を切り取った表示ではありません。長さは模式図で確認でき、作品映像そのものは変更しません。</p>';
 doc.querySelector('.work-copy').append(foot);
 const reduced=root.matchMedia('(prefers-reduced-motion: reduce)');
 let workKey='',active=-1,locked=-1,preview=false,palettePlayed=false,frame=0;
 const en=()=>doc.documentElement.lang==='en';
 function layout(){
  const f=film.getBoundingClientRect(),l=layer.getBoundingClientRect();
  stage.style.left=(f.left-l.left+layer.scrollLeft)+'px';stage.style.top=(f.top-l.top+layer.scrollTop)+'px';stage.style.width=f.width+'px';stage.style.height=f.height+'px';
 }
 function choose(index,persist=false){
  if(persist)locked=locked===index?-1:index;
  active=persist?locked:index;
  const items=pairing(api.getWork().preset);
  stage.style.setProperty('--selected-color',active<0?'transparent':items[active].color);
  stage.classList.toggle('has-selection',active>=0);
  for(const el of [...nails.querySelectorAll('[data-pair]'),...markerBox.querySelectorAll('[data-pair]')]){
   const on=+el.dataset.pair===active;el.classList.toggle('is-selected',on);el.setAttribute('aria-pressed',String(+el.dataset.pair===locked));
  }
  if(preview)drawHand();
 }
 function bind(button,i){
  button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')choose(i)});
  button.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')choose(locked)});
  button.addEventListener('focus',()=>choose(i));
  button.addEventListener('blur',()=>choose(locked));
  button.addEventListener('click',e=>{e.stopPropagation();choose(i,true)});
 }
 function drawHand(){drawHandPreview(canvas.getContext('2d'),{length:api.getLength(),colors:api.getWork().preset.colors,active,paintNail:api.paintNail})}
 function labels(){
  film.setAttribute("aria-label",en()?"Artwork film":"作品映像");
  for(const el of [...nails.querySelectorAll("[data-pair]"),...markerBox.querySelectorAll("[data-pair]")]){const i=+el.dataset.pair;el.setAttribute("aria-label",en()?`Nail ${i+1}: paired colour and texture`:`${i+1}本目：${api.lookName(i)}`);}
  stage.setAttribute("aria-label",en()?"Colour correspondence and length preview":"配色の対応と長さプレビュー");
  markerBox.setAttribute("aria-label",en()?"Five nail colours":"ネイルの5色");
  nails.setAttribute("aria-label",en()?"Five nails from this work":"この作品から作った5本");
  doc.querySelector('.study-set-caption').textContent=en()?'FIVE NAILS FROM THIS WORK':'この作品から作った5本';
  doc.getElementById('studyExpand').textContent=en()?'View the five nails larger':'5本を大きく見る';
  stage.querySelector('.study-colors-title').textContent=en()?'FIVE COLOURS USED IN THE NAILS':'ネイルに使う5色';
  returnBtn.textContent=en()?'Return to the artwork':'作品映像へ戻る';
  status.textContent=(en()?'APPLIED PREVIEW · ILLUSTRATION':'適用プレビュー（模式図）')+' / '+api.getLength().toUpperCase();
  canvas.setAttribute('aria-label',en()?'Illustrative hand with the selected five nails and length':'選んだ5本と長さを載せた模式図');
  foot.querySelector('summary').textContent=en()?'About this study':'この試作について';
  foot.querySelector('p').textContent=en()?'Numbers connect the artwork-inspired colours and textures to the five nails, not sampled locations in the film. Length is shown on an illustrative hand; the artwork film is unchanged.':'番号は、作品に着想を得た配色・質感と5本の対応です。作品の特定の部位を切り取った表示ではありません。長さは模式図で確認でき、作品映像そのものは変更しません。';
 }
 function showPreview(){preview=true;hand.hidden=false;film.style.visibility='hidden';labels();drawHand();layout();if(root.matchMedia('(max-width:819px)').matches)stage.scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});}
 function closePreview(){preview=false;hand.hidden=true;film.style.visibility='';}
 returnBtn.addEventListener('click',e=>{e.stopPropagation();closePreview()});
 function palette(){
  if(palettePlayed||reduced.matches)return;palettePlayed=true;
  root.requestAnimationFrame(()=>{
   const from=[...markerBox.children],to=[...nails.querySelectorAll('.study-tip')];
   from.forEach((b,i)=>{if(!to[i])return;const a=b.getBoundingClientRect(),z=to[i].getBoundingClientRect();if(!a.width||!z.width)return;
    const dot=doc.createElement('i');dot.className='study-palette-flight';dot.style.background=api.getWork().preset.colors[i];dot.style.left=(a.left+a.width/2)+'px';dot.style.top=(a.top+a.height/2)+'px';doc.body.append(dot);
    const anim=dot.animate([{transform:'translate(-50%,-50%) scale(.7)',opacity:0},{offset:.2,opacity:.55},{transform:`translate(${z.left+z.width/2-a.left-a.width/2}px,${z.top+z.height/2-a.top-a.height/2}px) scale(.3)`,opacity:0}],{duration:520,delay:i*35,easing:'ease-out'});anim.onfinish=()=>dot.remove();anim.oncancel=()=>dot.remove();
   });
  });
 }
 function refresh(){
  const newKey=api.getKey();if(newKey!==workKey){workKey=newKey;active=locked=-1;closePreview();}
  const raw=[...nails.children].filter(el=>el.tagName==='CANVAS');
  if(raw.length){
   const items=pairing(api.getWork().preset);markerBox.replaceChildren();
   raw.forEach((cv,i)=>{
    const b=doc.createElement('button');b.type='button';b.className='study-tip';b.dataset.pair=i;b.style.setProperty('--pair-color',items[i].color);b.setAttribute('aria-label',items[i].number+' · '+api.lookName(i));
    const n=doc.createElement('span');n.className='study-number';n.textContent=items[i].number;b.append(n,cv);nails.append(b);bind(b,i);
    const mark=doc.createElement('button');mark.type='button';mark.className='study-marker';mark.dataset.pair=i;mark.style.setProperty('--pair-color',items[i].color);mark.textContent=items[i].number;mark.setAttribute('aria-label',items[i].number+' · '+api.lookName(i));markerBox.append(mark);bind(mark,i);
   });choose(locked);
  }
  labels();layout();if(preview)drawHand();palette();
 }
 const observer=new MutationObserver(()=>{if(!frame)frame=root.requestAnimationFrame(()=>{frame=0;refresh()})});
 observer.observe(nails,{childList:true});
 new MutationObserver(labels).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 doc.getElementById('workLengthChoice').addEventListener('click',event=>{if(event.target.closest('[data-length]'))root.requestAnimationFrame(showPreview)});
 root.addEventListener('resize',layout);layer.addEventListener('scroll',layout,{passive:true});
 if(root.ResizeObserver)new ResizeObserver(layout).observe(film);
 refresh();
}
const api={install,nailLengthScale,fingerLayout,pairing,drawHandPreview};
if(typeof module==='object'&&module.exports)module.exports=api;else root.TsuyaWorkLinkStudy=api;
})(typeof window==='undefined'?globalThis:window);
