const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync(__dirname+'/study.js','utf8');
test('committed selection survives focus and hover previews until activation',()=>{
 const make=i=>({dataset:{pair:String(i)},attrs:{},events:{},selected:false,
  classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},
  addEventListener(k,fn){this.events[k]=fn}});
 const tips=Array.from({length:5},(_,i)=>make(i)),markers=Array.from({length:5},(_,i)=>make(i));
 const s={pairing:p=>p.colors.map(color=>({color})),api:{getWork:()=>({preset:{colors:Array(5).fill('#123456')}})},
  stage:{style:{setProperty(){}},classList:{toggle(){}}},nails:{querySelectorAll:()=>tips},markerBox:{querySelectorAll:()=>markers}};
 vm.createContext(s);
 vm.runInContext('let active=-1,locked=-1,preview=false;'+script.slice(script.indexOf(' function choose('),script.indexOf(' function drawHand(')),s);
 tips.forEach((b,i)=>s.bind(b,i));markers.forEach((b,i)=>s.bind(b,i));
 const pressed=()=>tips.map(b=>b.attrs['aria-pressed']);
 const activate=b=>b.events.click({stopPropagation(){}});
 activate(tips[1]);assert.deepEqual(pressed(),['false','true','false','false','false']);
 tips[2].events.focus();assert.equal(vm.runInContext('active',s),2);
 assert.deepEqual(pressed(),['false','true','false','false','false']);
 tips[2].events.blur();assert.equal(vm.runInContext('active',s),1);
 markers[2].events.pointerenter({pointerType:'mouse'});
 assert.deepEqual(pressed(),['false','true','false','false','false']);
 markers[2].events.pointerleave({pointerType:'mouse'});
 assert.equal(vm.runInContext('active',s),1);
 tips[2].events.focus();activate(tips[2]);
 assert.deepEqual(pressed(),['false','false','true','false','false']);
 assert.deepEqual(markers.map(b=>b.attrs['aria-pressed']),pressed());
 activate(tips[2]);assert.deepEqual(pressed(),Array(5).fill('false'));
});
