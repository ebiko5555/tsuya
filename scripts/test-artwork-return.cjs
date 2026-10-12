const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const paths=['experience-prototype/index.html','series01/experience-prototype/index.html'];
function harness(html,search){
 const nodes={};
 function el(){const classes=new Set();return {style:{setProperty(){}},dataset:{},classList:{add:x=>classes.add(x),contains:x=>classes.has(x)},setAttribute(){},getAttribute(){return ''},querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(type,fn){this[type]=fn},load(){},pause(){}};}
 const node=id=>nodes[id]||(nodes[id]=el());
 const s={URLSearchParams,location:{search},history:{replaceState(a,b,url){s.url=url}},document:{body:el(),getElementById:node,querySelector:node},$:node,layer:el(),index:el(),workFilm:el(),signalFilm:el(),nailSetViewer:el(),matchMedia:()=>({matches:false}),setTimeout(){},playWorkFilmWhenReady(){},playSilently(){},renderNailPreview(key,id,length){s.preview={key,id,length}},renderLengthChoice(box,length){s.length=length},applyArtworkPreset(key){s.applied=key},applyTryLength(length){s.appliedLength=length},nodes};
 vm.createContext(s);
 const section=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,a);return html.slice(i,j)};
 vm.runInContext(section('function normalizeTryLength(', 'function applyTryLength('),s);
 vm.runInContext(section('  const works={','  const order=Object.keys(works);')+'\nthis.works=works;',s);
 vm.runInContext(section('  const params=new URLSearchParams(location.search);',"  document.querySelectorAll('a[href="),s);
 vm.runInContext('function setCurrent(key){current=key;} function updateSeriesTryLink(){document.getElementById("seriesWorkTry").href=tryRoute(current,artworkTryLength);}',s);
 vm.runInContext(section('  function openWork(', '  function closeWork('),s);
 vm.runInContext(section('  function showArtworkPage(', '  function prepareCustomPage('),s);
 vm.runInContext(section("  $('workLengthChoice').addEventListener", "  $('workNails').addEventListener"),s);
 // The real expanded-set viewer uses these same current selection values.
 vm.runInContext('this.tryHref=()=>tryRoute(current,artworkTryLength);',s);
 return s;
}
for(const path of paths){
 const html=fs.readFileSync(require.resolve('../'+path),'utf8');
 test(path+' inline JavaScript parses',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
 for(const key of ['COLOR','SURFACE'])for(const length of ['short','long'])for(const access of ['', '&access=large']){
 test(`${path} ${key} ${length} ${access||'normal'} round trip`,()=>{
  const art=harness(html,`?work=${key}${access}&v=old-entry`);art.showArtworkPage(key);
  art.nodes.workLengthChoice.click({target:{closest:()=>({dataset:{length}})}});
  const forward=art.tryHref();assert.equal(new URLSearchParams(forward).get('v'),'navigation-hands-large-20261012');assert.equal(new URLSearchParams(art.url).get('length'),length);
  const trial=harness(html,forward);trial.prepareFixedTryOn(key);
  assert.equal(trial.applied,key);assert.equal(trial.appliedLength,length);
  for(const back of ['globalBack','tryWorkBack']){
   const href=trial.nodes[back].href,query=new URLSearchParams(href);
   assert.equal(query.get('v'),'navigation-hands-large-20261012');assert.equal(query.get('work'),key);assert.equal(query.get('length'),length);assert.equal(query.get('access'),access?'large':null);
   const returned=harness(html,href);returned.showArtworkPage(key);
   assert.equal(returned.length,length);assert.equal(returned.preview.key,key);assert.equal(returned.tryHref(),forward);
   assert.equal(JSON.stringify(returned.works[key].preset),JSON.stringify(art.works[key].preset));
   const reloaded=harness(html,returned.url);reloaded.showArtworkPage(key);assert.equal(reloaded.length,length);
  }
 });}
 test(path+' defaults, invalid length, and switching works use their own presets',()=>{
  for(const length of ['', '&length=invalid']){const s=harness(html,'?work=LIGHT'+length);s.showArtworkPage('LIGHT');assert.equal(s.length,'long');s.openWork('COLOR');assert.equal(s.length,'short');}
 });
}
