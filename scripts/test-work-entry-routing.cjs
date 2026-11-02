const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../experience-prototype/index.html'),'utf8');
test('artwork try-on and photo creation are separate named native links',()=>{
 const artwork=html.match(/<a\b[^>]*id="workArtworkTry"[^>]*>([^<]*)<\/a>/);
 assert.ok(artwork);assert.match(artwork[0],/data-nav-direction="forward"/);assert.equal(artwork[1],'この作品を試着');
 assert.match(artwork[0],/aria-label="この作品を試着"/);
 assert.match(html,/<a class="source-entry"[^>]*aria-label="写真からつくる"/);
 assert.match(html,/<span class="source-entry-sub">写真からつくる<\/span>/);
 assert.ok(html.indexOf('id="workLengthChoice"')<artwork.index);
 assert.ok(artwork.index<html.indexOf('<a class="source-entry"'));
 assert.equal((html.match(/getElementById\('workArtworkTry'\)\.href=tryRoute\(current,artworkTryLength\)/g)||[]).length,2,'link updates on work and length changes');
 assert.match(html,/const customHref=customRoute\(key\); customLink\.href=customHref/);
 assert.match(html,/location\.href=customHref/,'photo link retains its own route');
});
test('entry labels and accessible names stay distinct through language refreshes',()=>{
 const nodes={},observers=[],classes=new Set(['art-page']);
 const node=id=>nodes[id]||(nodes[id]={textContent:'',dataset:{},style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this[k]=fn}});
 const document={body:{classList:{contains:x=>classes.has(x)}},documentElement:{lang:'ja',dataset:{}},getElementById:node,querySelector:s=>node(s),querySelectorAll:s=>[node(s)],addEventListener(){}};
 const context={document,localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame:fn=>fn(),WeakMap,MutationObserver:class{constructor(fn){observers.push(fn)}observe(){}}};
 vm.createContext(context);
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('/* mobile107:'))[1];
 vm.runInContext(script,context);
 function check(tryLabel,photoLabel){
  assert.equal(node('#workArtworkTry').textContent,tryLabel);
  assert.equal(node('.source-entry-sub').textContent,photoLabel);
  assert.equal(node('#workArtworkTry').attrs['aria-label'],tryLabel);
  assert.equal(node('.source-entry').attrs['aria-label'],photoLabel);
 }
 check('この作品を試着','写真からつくる');
 node('languageSwitch').click();check('TRY THIS WORK ON','CREATE FROM A PHOTO');
 observers.forEach(fn=>fn());check('TRY THIS WORK ON','CREATE FROM A PHOTO');
 node('languageSwitch').click();check('この作品を試着','写真からつくる');
});
