/* Exhibition UI only. Artwork presets, photo analysis and hand tracking stay in index.html. */
(()=>{
  const $=id=>document.getElementById(id);
  const body=document.body;
  const english=()=>document.documentElement.lang==='en';
  const layer=$('workLayer');
  const film=$('workFilm');
  const paper=document.querySelector('.work-copy');
  const make=(tag,cls)=>{const el=document.createElement(tag);el.className=cls;return el;};
  const top=make('div','jack-masthead');
  top.innerHTML='<a href="./" class="jack-wordmark" aria-label="TSUYA トップ">TSUYA<span>じゃっくオリジナル 01</span></a>';
  body.appendChild(top);
  $('siteHome').textContent='TSUYA';
  if(body.classList.contains('art-page')){
    const frame=make('div','jack-art');
    const meta=document.querySelector('.work-film-mark');
    layer.prepend(frame);
    frame.append(film);
    const pause=make('button','jack-pause');pause.type='button';frame.append(pause);
    pause.onclick=()=>{if(film.paused)film.play().catch(()=>{});else film.pause();};
    const pauseLabel=()=>{pause.textContent=film.paused?(english()?'Play':'再生'):(english()?'Pause':'一時停止');pause.setAttribute('aria-label',pause.textContent);};
    film.addEventListener('play',pauseLabel);film.addEventListener('pause',pauseLabel);pauseLabel();
    const caption=make('div','jack-caption');
    caption.append(meta);
    const closer=make('button','jack-closer');closer.type='button';caption.append(closer);
    closer.onclick=()=>paper.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    frame.append(caption,$('workIndex'));
    const heading=make('div','jack-nail-heading');heading.innerHTML='<span class="jack-section-no">TSUYA / 01</span><h1></h1>';
    paper.prepend(heading);
    const hint=make('p','jack-detail-hint');$('workNails').after(hint);
    const tryLink=make('a','jack-wear');tryLink.dataset.navDirection='forward';
    $('workLengthChoice').after(tryLink);
    const photo=document.querySelector('.source-entry');photo.classList.add('jack-photo-link');
    const update=()=>{
      const key=body.dataset.workKey||'COLOR';
      const query=new URLSearchParams(location.search);
      tryLink.href='?try='+key+'&length='+(query.get('length')||'short')+'&v=jack-original-01';
      heading.querySelector('h1').textContent=$('workFilmTitle').textContent;
      heading.querySelector('span').textContent='TSUYA / '+$('workFilmCode').textContent.split(' / ')[0];
      closer.textContent=english()?'See the nails':'指先へ';
      tryLink.textContent=english()?'Wear this work':'この作品をまとう';
      hint.textContent=english()?'Touch the nails to look closer':'爪に触れて、近くで見る';
      $('workIndex').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workKey===key)));
      photo.setAttribute('aria-label',english()?'Choose an image from photos':'イメージを写真から選ぶ');
      pauseLabel();
    };
    new MutationObserver(update).observe($('workFilmTitle'),{childList:true,characterData:true,subtree:true});
    new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    $('workLengthChoice').addEventListener('click',()=>requestAnimationFrame(update));
    update();
  }
  // The same language preference belongs only to this edition.
  const updateEdition=()=>{
    top.querySelector('span').textContent=english()?'JACK ORIGINAL 01':'じゃっくオリジナル 01';
    if(body.classList.contains('custom-mode'))$('openingGuide').textContent=english()?'FROM YOUR IMAGE':'あなたの写真から';
  };
  new MutationObserver(updateEdition).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});updateEdition();
})();
