const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'experience-prototype/navigation-hands.css'),'utf8');
const backIds=['globalBack','workClose','tryWorkBack','sourceTryonBackPill','sourceConfirmBack','nailSetClose','nailSetBack','saveHintClose','saveHintDone','exhibitClose'];
for(const file of ['experience-prototype/index.html','series01/experience-prototype/index.html']){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const baseline=cp.execFileSync('git',['show','fd313bb:'+file],{cwd:root,encoding:'utf8'});
 const tag=id=>html.match(new RegExp('<(?:a|button)\\b[^>]*\\bid="'+id+'"[^>]*>'))?.[0];
 test(file+' back controls keep semantic names in both languages',()=>{
  for(const id of backIds){assert.match(tag(id),/data-nav-direction="back"/);assert.match(tag(id),/aria-label="[^☜☞"]+"/);assert.ok(html.includes("attr('#"+id+"','aria-label',isEnglish?"));}
 });
 test(file+' forward actions keep their destination text and native controls',()=>{
  for(const id of ['sourceTry','sourceConfirmTry','setViewerTry'])assert.match(tag(id),/data-nav-direction="forward"/);
  assert.match(html, /id="setViewerTry"[^>]*>このセットを試着する<\/a>/);
  if(file.startsWith('series01'))assert.match(tag('seriesWorkTry'),/data-nav-direction="forward"/);
 });
 test(file+' HOME, length choices, presets, camera and drawing remain unchanged',()=>{
  assert.equal(tag('siteHome'),baseline.match(/<a\b[^>]*id="siteHome"[^>]*>/)[0]);
  for(const [a,b] of [['const TRY_LENGTHS=','/* 肌を'],['function ensureLive(){','/* ================= カメラ'],['const FINGERS =','function flatLook('],['  const works={','  const order=Object.keys(works);']]){
   const section=s=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert.ok(i>=0&&j>i);return s.slice(i,j);};assert.equal(section(html),section(baseline),a);
  }
  for(const m of html.matchAll(/<button[^>]*data-length="[^"]+"[^>]*>/g))assert.ok(!m[0].includes('data-nav-direction'));
 });
 test(file+' shared style resolves locally and does not force hidden controls visible',()=>{
  const href=html.match(/href="([^"]*navigation-hands\.css[^\"]*)"/)[1];
  assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),href.split('?')[0])));
  assert.match(css,/\[data-nav-direction="back"\]\s*\{[^}]*min-width:44px!important; min-height:44px!important/);
  assert.doesNotMatch(css.match(/\[data-nav-direction="back"\]\s*\{([^}]*)\}/)[1],/display\s*:/);
  assert.match(css,/content:"☜"/);assert.match(css,/content:"☞"/);
  assert.match(css,/#sourceTry::after,#sourceConfirmTry::after,#setViewerTry::after,#seriesWorkTry::after\{color:#111\}/);
 });
}
