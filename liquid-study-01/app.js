'use strict';
const $=id=>document.getElementById(id),video=$('camera');
let renderer,mode='idle',stream=null,hands=null,modelPromise=null,epoch=0,busy=false,lastInfer=0,lastVideo=-1,lastSeen=0,landmarks=null,smoothed=null,face='environment',auto=false,pointer=null,started=0,drawCount=0,inferCount=0;
function status(s){if($('status').textContent!==s)$('status').textContent=s;}
function ui(){const active=mode!=='idle';$('intro').hidden=active;$('controls').hidden=!active;$('switch').hidden=mode!=='live';$('motion').hidden=mode!=='demo';$('start').disabled=false;$('mode').textContent=mode==='live'?'カメラ · 手を探しています':mode==='demo'?'デモ · 手追跡なし':mode==='starting'?'準備中':'待機';$('hint').textContent=mode==='demo'?'指でなぞる · 背景は生成した検証用の森':mode==='live'?'映像は端末内だけで処理':'独立したWeb試作';}
function halt(message=''){epoch++;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}video.pause();video.srcObject=null;landmarks=smoothed=null;pointer=null;auto=false;mode='idle';if(renderer)renderer.trails=[];ui();status(message);}
function loadScript(){return new Promise((resolve,reject)=>{if(window.Hands)return resolve();const s=document.createElement('script');s.src='vendor/hands/hands.js';s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('model'));};document.head.append(s);});}
async function ensureHands(){
 if(!modelPromise){modelPromise=(async()=>{await loadScript();const h=new Hands({locateFile:f=>'vendor/hands/'+f});h.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.55,minTrackingConfidence:.5});await h.initialize();hands=h;return h;})().catch(e=>{modelPromise=null;throw e;});}return modelPromise;
}
function timeout(p,ms,label){let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]).finally(()=>clearTimeout(timer));}
async function start(){
 halt();const token=epoch;mode='starting';ui();status('カメラの使用を許可してください');
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){halt('カメラにはHTTPS接続が必要です。質感デモはこのまま試せます。');return;}
 let local;
 try{
  local=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:face},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}}});
  if(token!==epoch){local.getTracks().forEach(t=>t.stop());return;}stream=local;video.srcObject=stream;
  await timeout(video.play(),12000,'play');if(token!==epoch)return;
  status('手を見つける準備をしています');await timeout(ensureHands(),25000,'model');if(token!==epoch)return;
  stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(token===epoch)halt('カメラが終了しました。もう一度はじめてください。');}));
  lastVideo=-1;lastInfer=0;lastSeen=0;mode='live';started=performance.now();ui();status('片手をカメラに向けて、ゆっくり動かしてください');
 }catch(e){if(token!==epoch)return;const text=e.name==='NotAllowedError'?'カメラが許可されていません。Safariのサイト設定で許可して、もう一度お試しください。':e.name==='NotFoundError'?'カメラが見つかりません。質感デモを試せます。':e.message==='model'?'手追跡を準備できませんでした。読み込みを確認し、もう一度お試しください。':'カメラまたは手追跡を開始できませんでした。もう一度お試しください。';halt(text);}
}
function demoHand(x,y,t){
 const ratio=innerWidth/innerHeight,spread=.8+.2*Math.sin(t*1.3),curl=.5+.5*Math.sin(t*.83);const raw=[[0,.17],[-.085,.1],[-.15,.035],[-.205,-.015],[-.245,-.065],[-.09,0],[-.095,-.12],[-.10,-.20],[-.105,-.27],[0,-.015],[0,-.16],[0,-.25],[0,-.32],[.08,.005],[.09,-.13],[.10,-.21],[.11,-.27],[.145,.055],[.175,-.045],[.195,-.11],[.21,-.17]];
 return raw.map(([px,py],i)=>{if([7,8,11,12,15,16,19,20].includes(i))py+=(i%4===0?.12:.05)*curl;return{x:x+px*spread,y:y+py*ratio};});
}
function demo(){halt();mode='demo';ui();status('指でなぞると、透明な歪みが残ります');started=performance.now();}
$('start').onclick=start;$('stop').onclick=()=>halt('停止しました');$('demo').onclick=demo;$('switch').onclick=()=>{face=face==='environment'?'user':'environment';start();};$('motion').onclick=()=>{auto=!auto;$('motion').textContent=auto?'動きを止める':'自動の動き';status(auto?'自動デモ · 実際の手は追跡していません':'指でなぞると、透明な歪みが残ります');};
$('view').addEventListener('pointerdown',e=>{if(mode==='demo'){auto=false;$('motion').textContent='自動の動き';pointer={x:e.clientX/innerWidth,y:e.clientY/innerHeight};$('view').setPointerCapture(e.pointerId);status('ポインターデモ · 実際の手は追跡していません');}});
$('view').addEventListener('pointermove',e=>{if(pointer)pointer={x:e.clientX/innerWidth,y:e.clientY/innerHeight};});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('view').addEventListener(event,()=>pointer=null);
addEventListener('pagehide',()=>halt());document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode!=='idle')halt('画面を離れたため停止しました');});
try{renderer=new LiquidRenderer($('view'));renderer.resize(innerWidth,innerHeight);}catch(e){$('start').disabled=true;$('demo').disabled=true;status('このブラウザではWebGLを使えません。Safariなどで開いてください。');}
addEventListener('resize',()=>{if(renderer)renderer.resize(innerWidth,innerHeight);smoothed=null;});
$('view').addEventListener('webglcontextlost',e=>{e.preventDefault();halt('描画が中断されました。ページを再読み込みしてください。');$('start').disabled=true;$('demo').disabled=true;renderer=null;});
async function infer(now){
 if(mode!=='live'||busy||!hands||video.readyState<2||now-lastInfer<66||video.currentTime===lastVideo)return;
 const token=epoch;busy=true;lastInfer=now;lastVideo=video.currentTime;
 hands.onResults(res=>{if(token!==epoch||mode!=='live')return;inferCount++;const found=res.multiHandLandmarks?.[0];if(found){landmarks=found;lastSeen=performance.now();}else landmarks=null;});
 try{await timeout(hands.send({image:video}),5000,'tracking');}catch(e){if(token===epoch){halt('手追跡が中断しました。もう一度はじめてください。');modelPromise=null;hands=null;}}finally{busy=false;}
}
function frame(now){
 if(renderer){let points=null;if(mode==='live'){
  infer(now);if(landmarks&&now-lastSeen<180){const p=renderer.mapLandmarks(landmarks,video,face==='user');smoothed=smoothed?p.map((q,i)=>({x:smoothed[i].x+(q.x-smoothed[i].x)*.48,y:smoothed[i].y+(q.y-smoothed[i].y)*.48})):p;points=smoothed;$('mode').textContent='カメラ · 手を検出';status('');}
  else{smoothed=null;$('mode').textContent='カメラ · 手を探しています';if(now-started>900)status('手をカメラに向けてください');}
 }else if(mode==='demo'){
  const t=(now-started)/1000;if(pointer)points=demoHand(pointer.x,pointer.y,t);else if(auto&&t%8<6.3)points=demoHand(.5+Math.sin(t*.9)*.18,.60+Math.cos(t*.7)*.055,t);
 }
 renderer.draw(now,points,mode==='live'?video:null,face==='user');drawCount++;}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for reproducible QA; no fabricated detection hook.
window.liquidDiagnostics=()=>({mode,drawCount,inferCount,tracking:!!landmarks&&performance.now()-lastSeen<180,trailCount:renderer?.trails.length||0,streamActive:!!stream?.active,busy,canvas:[ $('view').width,$('view').height]});
