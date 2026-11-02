const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {pairing,nailLengthScale,fingerLayout,drawHandPreview}=require('./study.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),script=fs.readFileSync(__dirname+'/study.js','utf8'),css=fs.readFileSync(__dirname+'/study.css','utf8');
test('all inline scripts parse',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
test('pairing uses exact preset colours, not invented sampling positions',()=>{
 const p={colors:['#123456','#abcdef','#432100','#224433','#998811'],looks:['a','b','c','d','e']};
 const before=JSON.stringify(p),result=pairing(p);assert.equal(result.length,5);result.forEach((r,i)=>{assert.equal(r.color,p.colors[i]);assert.equal(r.look,p.looks[i]);assert.equal(r.number,String(i+1).padStart(2,'0'));assert.equal(r.x,undefined);assert.equal(r.y,undefined);});assert.equal(JSON.stringify(p),before);
});
test('preview uses the existing chip length scales and five dedicated nail paints',()=>{
 assert.equal(nailLengthScale('short'),.68);assert.equal(nailLengthScale('long'),1.16);assert.equal(fingerLayout.length,5);
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createRadialGradient(){return gradient},createLinearGradient(){return gradient}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const calls={};for(const length of ['short','long']){calls[length]=[];drawHandPreview(ctx,{length,colors:Array(5).fill('#bb6688'),active:2,paintNail(c,w,h,i){calls[length].push({w,h,i})}});assert.equal(calls[length].length,5);}
 calls.short.forEach((s,i)=>{assert.equal(s.i,i);assert.equal(s.w,calls.long[i].w);assert.ok(calls.long[i].h>s.h);assert.ok(Math.abs(calls.long[i].h/s.h-1.16/.68)<1e-10)});
});
test('individual touch controls do not nest in a parent button or trigger hidden video navigation',()=>{
 assert.match(html,/<div class="work-nails" id="workNails" role="group"/);assert.match(html,/id="studyExpand"/);assert.match(html,/\$\('studyExpand'\)\.addEventListener\('click',openSetViewer\)/);
 assert.doesNotMatch(html,/workFilm\.addEventListener\('click',startArtworkTryOn\)/);assert.match(script,/e\.stopPropagation\(\);choose\(i,true\)/);
});
test('preview remains explicit, reversible and does not alter artwork media or live tracking state',()=>{
 assert.match(script,/適用プレビュー（模式図）/);assert.match(script,/preview=false;hand.hidden=true;film.style.visibility=''/);assert.doesNotMatch(script,/(?:film\.src|tuneVals\.|nailState\.|smoothed\.)\s*=/);
 assert.match(script,/stage\.scrollIntoView\(\{block:'center',behavior:reduced\.matches\?'auto':'smooth'\}\)/);
 assert.match(html,/withVars\(p.vars,\(\)=>paintPhotographicSpecimen/);assert.match(script,/特定の部位を切り取った表示ではありません/);
});
test('palette motion is brief, once per visit, and disabled for reduced motion',()=>{
 assert.match(script,/if\(palettePlayed\|\|reduced.matches\)return;palettePlayed=true/);assert.match(script,/duration:520,delay:i\*35/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/study-palette-flight\{position:fixed;z-index:110;/);
});
test('production files are not changed and relative assets remain explicit',()=>{
 assert.match(html,/\.\.\/experience-prototype\/art-assets\/color-pattern.mp4/);assert.match(html,/href="study.css\?v=4"/);assert.match(html,/src="study.js\?v=4"/);assert.doesNotMatch(html,/<base\b/);
});
