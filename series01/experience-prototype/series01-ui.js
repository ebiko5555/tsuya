/* Small, reversible presentation layer for Series 01. */
(()=>{
  const english=()=>document.documentElement.lang==='en';
  function wording(){
    const en=english(),photo=document.getElementById('seriesHubPhoto'),trial=document.getElementById('seriesWorkTry');
    if(photo)photo.textContent=en?'Make five nails from a photo':'写真の色から、5本をつくる';
    if(trial)trial.textContent=en?'Try this artwork on your hand':'この作品の5本を試す';
    const link=document.querySelector('.source-entry-sub');
    if(link)link.textContent=en?'Collect photo colours for another set':'写真の色で、別の5本をつくる';
    const repick=document.getElementById('sourcePhoto');
    if(repick&&document.body.classList.contains('source-selected'))repick.textContent=en?'Choose another photo':'別の写真を選ぶ';
    const flow=document.querySelector('.source-sequence-flow');
    if(flow)flow.textContent=en?'Photo colours → Five nails → Your hand':'写真 → 色 → ネイル → 手';
  }
  new MutationObserver(wording).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(wording).observe(document.body,{attributes:true,attributeFilter:['class']});
  wording();
  const previousFocus=new WeakMap();
  for(const dialog of document.querySelectorAll('#sourceConfirm,#nailSetViewer')){
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    new MutationObserver(()=>{
      if(dialog.classList.contains('open')){
        previousFocus.set(dialog,document.activeElement);
        dialog.querySelector('button,a')?.focus({preventScroll:true});
      }else{const p=previousFocus.get(dialog);if(p&&p.isConnected)p.focus({preventScroll:true});}
    }).observe(dialog,{attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('keydown',e=>{
    const dialog=document.querySelector('#sourceConfirm.open,#nailSetViewer.open');if(!dialog)return;
    if(e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();
      dialog.querySelector('#sourceConfirmBack,#nailSetClose')?.click();return;
    }
    if(e.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')].filter(el=>el.getClientRects().length);
    if(!controls.length)return;
    const first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}
  },true);
})();
