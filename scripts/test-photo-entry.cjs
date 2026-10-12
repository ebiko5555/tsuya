const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const shared=fs.readFileSync(path.join(root,'experience-prototype/navigation-hands.css'),'utf8');
function runtime(html){
 const nodes={},observers=[],classes=new Set(['custom-mode']);
 const node=id=>nodes[id]||(nodes[id]={textContent:'',dataset:{},style:{},setAttribute(){},addEventListener(type,fn){this[type]=fn;},click(){this.clicks=(this.clicks||0)+1;}});
 const document={body:{classList:{contains:x=>classes.has(x)}},documentElement:{lang:'ja',dataset:{}},getElementById:node,querySelector:s=>s==='.source-entry-sub'?node('entry'):null,querySelectorAll:s=>s==='.bigbtn'?[node('startBtn')]:[],addEventListener(){}};
 const context={document,localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame:fn=>fn(),WeakMap,MutationObserver:class{constructor(fn){observers.push(fn)}observe(){}},$:node,startCamera(){context.cameraStarts++},cameraStarts:0};
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
 vm.createContext(context);vm.runInContext(scripts.find(m=>m[1].includes('/* mobile107:'))[1],context);
 const begin=html.indexOf("$('startBtn').onclick = ()=>{");const end=html.indexOf("$('flipBtn').onclick",begin);vm.runInContext(html.slice(begin,end),context);
 return {node,classes,observers,context};
}
// Resolve the relevant CSS cascade, including mobile rules, specificity and !important.
function declarations(css,width,target){
 const values={};let order=0;
 function scan(source,enabled=true){let offset=0;while(offset<source.length){
  const start=source.indexOf('{',offset);if(start<0)break;const header=source.slice(offset,start).trim();let end=start+1,depth=1;
  for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  const body=source.slice(start+1,end-1);offset=end;
  if(header.startsWith('@media')){const dims=[...header.matchAll(/(min|max)-(width|height)\s*:\s*(\d+)px/g)];scan(body,enabled&&dims.length>0&&dims.every(([,bound,axis,n])=>bound==='min'?(axis==='width'?width:844)>=+n:(axis==='width'?width:844)<=+n));continue;}
  if(!enabled||header.startsWith('@'))continue;
  for(const selector of header.split(',').map(x=>x.trim())){
   if(!selector.endsWith(target)||selector.includes('hub-mode')||selector.includes('work-tryon')||selector.includes('source-planning')||selector.includes('source-tryon'))continue;
   const spec=(selector.match(/#/g)||[]).length*100+(selector.match(/\./g)||[]).length*10;order++;
   for(const item of body.split(';')){const i=item.indexOf(':');if(i<0)continue;const key=item.slice(0,i).trim(),value=item.slice(i+1).trim(),rank=(value.includes('!important')?10000:0)+spec;
    if(!values[key]||rank>=values[key].rank)values[key]={rank,value:value.replace(/!important/g,'').trim()};
   }
  }
 }}
 scan(css.replace(/\/\*[\s\S]*?\*\//g,''));return Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.value]));
}
for(const file of ['experience-prototype/index.html','series01/experience-prototype/index.html']){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n')+(file.startsWith('series01')?fs.readFileSync(path.join(root,'series01/experience-prototype/series01.css'),'utf8'):'')+shared;
 test(file+' SOURCE label survives language changes and mutation refresh',()=>{
  const r=runtime(html);assert.equal(r.node('startBtn').textContent,'イメージを写真から選ぶ');
  r.node('languageSwitch').click();assert.equal(r.node('startBtn').textContent,'CHOOSE AN IMAGE FROM PHOTOS');
  r.observers.forEach(fn=>fn());assert.equal(r.node('startBtn').textContent,'CHOOSE AN IMAGE FROM PHOTOS');
  if(file.startsWith('series01')){vm.runInContext(fs.readFileSync(path.join(root,'series01/experience-prototype/series01-ui.js'),'utf8'),r.context);r.observers.forEach(fn=>fn());assert.equal(r.node('startBtn').textContent,'CHOOSE AN IMAGE FROM PHOTOS');}
  r.node('languageSwitch').click();assert.equal(r.node('startBtn').textContent,'イメージを写真から選ぶ');
  assert.ok(html.includes("document.getElementById('startBtn').textContent='イメージを写真から選ぶ'"));
  assert.ok(!html.includes('<p class="source-sequence-flow"'));
 });
 test(file+' initial SOURCE action opens photos while AR camera paths stay intact',()=>{
  const r=runtime(html);r.node('startBtn').onclick();assert.equal(r.node('sourceInput').clicks,1);assert.equal(r.context.cameraStarts,0);
  r.classes.add('source-selected');r.node('startBtn').onclick();assert.equal(r.context.cameraStarts,1);
  r.classes.clear();r.classes.add('work-tryon');r.node('startBtn').onclick();assert.equal(r.context.cameraStarts,2);
 });
 for(const width of [320,390,819,820,1180])test(file+` at ${width}px has one unframed SOURCE picker`,()=>{
  assert.equal(declarations(css,width,'.make-link').display,'none');
  const button=declarations(css,width,'#startBtn');
  for(const key of ['box-shadow','backdrop-filter','-webkit-backdrop-filter'])assert.equal(button[key],'none',key);
  assert.equal(button.border,'0');assert.equal(button['border-radius'],'0');assert.equal(button.background,'transparent');
  assert.ok(parseFloat(button['font-size'])>=22);assert.ok(parseFloat(button['min-height'])>=44);assert.equal(button['text-align'],'center');assert.equal(button['white-space'],'normal');
  assert.match(shared,/#startBtn:focus-visible\{outline:2px solid #fff;outline-offset:4px\}/);
 });
}
