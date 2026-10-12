const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Series presentation script preserves the shared entry label on load, state and language changes',()=>{
 const label={textContent:'試着'},observers=[];
 const document={documentElement:{lang:'ja'},body:{classList:{contains:()=>false}},getElementById:()=>null,querySelector:s=>s==='.source-entry-sub'?label:null,querySelectorAll:()=>[],addEventListener(){}};
 const context={document,WeakMap,MutationObserver:class{constructor(callback){this.callback=callback;}observe(target){observers.push({target,callback:this.callback});}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../series01/experience-prototype/series01-ui.js'),'utf8'),context);
 assert.equal(label.textContent,'試着');
 observers.find(o=>o.target===document.body).callback();assert.equal(label.textContent,'試着');
 document.documentElement.lang='en';label.textContent='TRY ON';
 observers.find(o=>o.target===document.documentElement).callback();assert.equal(label.textContent,'TRY ON');
 document.documentElement.lang='ja';label.textContent='試着';
 observers.find(o=>o.target===document.documentElement).callback();assert.equal(label.textContent,'試着');
});
