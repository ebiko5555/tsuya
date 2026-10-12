const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require.resolve('../series01/experience-prototype/index.html'),'utf8');
const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n')+'\n'+fs.readFileSync(require.resolve('../series01/experience-prototype/series01.css'),'utf8');
// Resolve the actual matching navigation rules in stylesheet order at each viewport.
function styles(width,height){
 const result={'body.art-page .work-index':{},'body.art-page .work-index button':{}};
 function read(source,enabled=true){
  let offset=0;
  while(offset<source.length){
   const start=source.indexOf('{',offset);if(start<0)break;
   const header=source.slice(offset,start).trim();let end=start+1,depth=1;
   for(;end<source.length&&depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
   const body=source.slice(start+1,end-1);offset=end;
   if(header.startsWith('@media')){
    const dimensions=[...header.matchAll(/(min|max)-(width|height)\s*:\s*(\d+)px/g)];
    const matches=dimensions.length&&dimensions.every(([,bound,axis,n])=>bound==='min'?(axis==='width'?width:height)>=+n:(axis==='width'?width:height)<=+n);
    read(body,enabled&&matches);
   }else if(enabled&&!header.startsWith('@')){
    for(const selector of header.split(',').map(x=>x.trim()))if(result[selector]){
     for(const declaration of body.split(';')){const at=declaration.indexOf(':');if(at>0)result[selector][declaration.slice(0,at).trim()]=declaration.slice(at+1).trim();}
    }
   }
  }
 }
 read(css.replace(/\/\*[\s\S]*?\*\//g,''));return Object.values(result);
}
for(const width of [320,390,819,820,1180,1440])test(`navigation boxes fit without overlap or vertical clipping at ${width}px`,()=>{
 const [nav,button]=styles(width,757),minimum=parseFloat(button['min-width'])||0;
 if(width>=820){
  assert.equal(nav.display,'grid');const track=+nav['grid-template-columns'].match(/repeat\(5,(\d+)px\)/)[1];
  const buttonWidth=Math.max(parseFloat(button.width),minimum);
  assert.ok(buttonWidth<=track,`${buttonWidth}px button exceeds ${track}px column`);
  const gap=parseFloat(nav.gap);assert.ok(buttonWidth<track+gap,'adjacent click areas overlap');
 }else{
  assert.equal(nav.display,'flex');assert.equal(nav['overflow-x'],'auto');
  const basis=parseFloat(button['flex-basis']),buttonWidth=Math.max(basis,minimum);
  assert.equal(buttonWidth,100);assert.ok(buttonWidth<width-32,'button cannot fit into the scroll viewport');
  const padding=nav.padding.split(' ').map(parseFloat),verticalPadding=padding[0]+padding[2];
  assert.ok(parseFloat(nav.height)-verticalPadding>=Math.max(parseFloat(button.height),parseFloat(button['min-height'])),'button is clipped vertically');
 }
});
