/* TSUYA | approved photo pigment. Only artwork try-on uses these materials. */
(() => {
  'use strict';
  // Each rect describes an individual photo chip, tip first; in thumb-to-pinky order.
  // The final value is the horizontal tip bias of the original photographed chip.
  const s670=1536/670;
  const small=(x,y,w,h,b)=>[x*s670,y*s670,w*s670,h*s670,b];
  const sets = {
    UNDERWATER: {file:'water.webp', names:['桜色','淡い紫','クリーム色','薄緑','水色'],
      opacity:[.66,.65,.64,.63,.65], chips:[
        small(42,108,117,208,.02),small(175,116,109,198,.018),small(296,117,108,197,.005),small(420,118,109,196,.01),small(542,136,85,177,-.01)]},
    COLOR: {file:'color.webp', names:['桃とオレンジの薄片','深緑の薄膜','透ける黄色','赤と偏光の筆跡','オレンジの薄片'],
      opacity:[.72,.85,.73,.81,.81], chips:[
        small(34,97,131,215,.04),small(186,118,105,192,.005),small(309,118,99,190,.01),small(431,119,111,192,.02),small(555,148,85,165,.01)]},
    SURFACE: {file:'surface.webp', names:['淡い紫','細い金粒と小さな石','翠色の石と金粒','光が走る紫','紫の微粒子'],
      opacity:[.83,.86,.87,.91,.83], detail:[false,true,true,true,false], chips:[
        small(41,92,125,243,.019),small(177,106,112,229,.021),small(302,102,114,235,.008),small(428,113,104,225,-.015),small(549,148,78,186,-.006)]},
    SCULPT: {file:'form.webp', names:['深緑のスモーク','濃紺と細い金','深緑と光沢リム','深緑と銀色の石','濃紺'],
      opacity:[.88,.996,.90,.90,.996], chips:[
        small(27,93,147,216,-.015),small(186,110,111,200,.014),small(307,113,119,198,.003),small(437,114,109,196,.015),small(557,145,84,160,.008)]},
    LIGHT: {file:'light.webp', names:['深い藍と紫','微粒子の薄膜','淡い紫の層','奥の偏光薄片','薄紫の微粒子'],
      opacity:[.85,.81,.81,.86,.78], chips:[
        small(36,100,122,233,.04),small(169,101,113,230,.02),small(294,103,108,229,-.024),small(415,105,107,226,-.045),small(534,114,99,215,-.03)]},
    SPACE: {file:'space.webp', names:['赤のグリッター','先端の赤い粒','赤の微粒子','赤い石','小さな赤のグラデーション'],
      opacity:[.99,.985,.99,.995,.975], chips:[
        small(44,107,123,233,.04),small(184,119,106,219,.02),small(303,126,105,213,.02),small(427,137,98,201,.005),small(538,164,77,171,.04)]},
    THINKING: {file:'thinking.webp', names:['乳白の薄膜','グレージュの層','くすみローズの筆跡','淡いピンクの重なり','落ち着いたトープ'],
      opacity:[.72,.82,.84,.74,.95], chips:[
        small(28,101,129,228,.01),small(169,113,119,215,.02),small(300,111,119,217,.04),small(427,120,116,207,.026),small(553,158,81,168,.024)]},
    ORB: {file:'orb.webp', names:['透明感のある赤','パールを添えた赤','つやのある赤','濃い赤','細めの赤'],
      opacity:[.93,.975,.94,.992,.95], chips:[
        small(29,90,124,251,.02),small(162,94,117,248,.02),small(286,95,116,247,.01),small(411,97,114,245,-.033),small(535,112,101,227,-.055)]},
    FRAME: {file:'frame.webp', names:['乳白の曲線','淡いピンク','金の細い縁','乳白とピンクの重なり','薄紫の微粒子'],
      opacity:[.85,.68,.77,.86,.77], chips:[
      [87,235,282,506,.05],[388,236,262,501,.02],[672,251,260,485,-.02],[948,231,283,506,-.03],[1255,332,206,411,-.01]
    ]}
  };
  const assets = new Map();
  const WIDTH=128, HEIGHT=208;
  // Map the interior of each visible chip, not its shadows or backdrop.
  // At the first and last rows stay slightly inside the curved nail. The tracked
  // silhouette is applied separately, so no rectangular crop can touch the hand.
  const profile = [[0,.27],[.04,.43],[.10,.57],[.20,.72],[.33,.82],[.48,.87],[.65,.89],[.78,.89],[.88,.85],[.95,.71],[1,.49]];
  function insideWidth(t){
    for(let i=1;i<profile.length;i++){
      const [right,w2]=profile[i], [left,w1]=profile[i-1];
      if(t<=right) return w1+(w2-w1)*(t-left)/(right-left);
    }
    return profile[profile.length-1][1];
  }
  function makeNailSamples(image, [x,y,w,h,tipBias], materialOpacity, jewellery=false){
    const sprite=document.createElement('canvas');
    sprite.width=WIDTH; sprite.height=HEIGHT;
    const c=sprite.getContext('2d',{willReadFrequently:true}); c.imageSmoothingEnabled=true;
    for(let row=0;row<HEIGHT;row++){
      const t=(row+.5)/HEIGHT, v=.024+t*.951;
      const width=w*insideWidth(t);
      const cx=x+w/2 + w*tipBias*(1-v)*(1-v);
      c.drawImage(image,cx-width/2,y+h*v,width,Math.max(1,h*.951/HEIGHT),0,row,WIDTH,1);
    }
    // Photographed gel has color and depth but a photo does not contain an
    // intrinsic transmission channel. For live display derive a restrained one
    // inside the chip only. Preserve opaque decor, dark pigment, metallic gold
    // and the most intense narrow reflections. Never apply a global fade.
    const live=document.createElement('canvas'); live.width=WIDTH; live.height=HEIGHT;
    const lc=live.getContext('2d'); const rgba=c.getImageData(0,0,WIDTH,HEIGHT);
    for(let i=0;i<rgba.data.length;i+=4){
      const r=rgba.data[i]/255, g=rgba.data[i+1]/255, b=rgba.data[i+2]/255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b), sat=max-min;
      const spec=Math.max(0,Math.min(1,(min-.86)*6.8))*(materialOpacity<=.70?.25:.64);
      // Gold and emerald retention are limited to the corresponding accent
      // material; it cannot turn a pale yellow pastel gel into blotches.
      const step=(a,b)=>Math.max(0,Math.min(1,(a-b)*6));
      const metal=jewellery?step(r-b,.18)*step(g-b,.05)*step(r,.48)*.85:0;
      const gem=jewellery?step(g-r,.08)*step(g,.27)*step(sat,.17):0;
      const dark=Math.max(0,(.55-max)*.70);
      let retain=Math.min(.997,spec+metal+gem+dark);
      if(materialOpacity>=.98) retain=1;
      rgba.data[i+3]=Math.round(rgba.data[i+3]*(materialOpacity+(1-materialOpacity)*retain));
    }
    lc.putImageData(rgba,0,0);
    return {preview:sprite, live};
  }
  function setFile(key){
    return sets[key] && 'nail-photo-preview-assets/'+sets[key].file;
  }
  function load(key){
    if(!sets[key]) return Promise.resolve(null);
    let entry=assets.get(key);
    if(entry) return entry.promise;
    entry={textures:null};
    assets.set(key,entry);
    entry.promise=new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        try {
          if(image.naturalWidth!==1536 || image.naturalHeight!==1024) throw new Error('Unexpected approved-nails photo resolution.');
          entry.textures=sets[key].chips.map((chip,i)=>makeNailSamples(image,chip,sets[key].opacity[i],sets[key].detail?.[i] || (key==="FRAME" && (i===2||i===3)) || (key==="SCULPT" && i===3)));
          resolve(entry.textures);
        } catch(e){assets.delete(key);reject(e);}
      };
      image.onerror=()=>{assets.delete(key);reject(new Error('Approved nail photo did not load.'));};
      image.src=setFile(key);
    });
    return entry.promise;
  }
  function draw(c,key,i,x,y,w,h,view='live'){
    const texture=assets.get(key)?.textures?.[i]?.[view];
    if(!texture) return false;
    c.drawImage(texture,x,y,w,h);
    return true;
  }
  function paintPreview(c,key,i,x,y,w,h){
    c.save();
    c.translate(x,y);
    c.scale(w,h);
    c.beginPath();
    c.moveTo(.5,0);
    c.bezierCurveTo(.86,0,1,.28,1,.62);
    c.bezierCurveTo(1,.91,.89,1,.5,1);
    c.bezierCurveTo(.11,1,0,.91,0,.62);
    c.bezierCurveTo(0,.28,.14,0,.5,0);
    c.closePath(); c.clip();
    const painted=draw(c,key,i,0,0,1,1,'preview');
    c.restore();
    return painted;
  }
  globalThis.TSUYAPhotoNails = Object.freeze({has:key=>Object.hasOwn(sets,key), names:key=>sets[key]?.names.slice() || [], load, draw, paintPreview, setFile});
})();
