/* Series 01: lifecycle guards. No network or image upload. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SeriesSafety=api;})(typeof window==='object'?window:this,()=>{
  function validHands(hands){
    return Array.isArray(hands)&&hands.length<=1&&hands.every(hand=>Array.isArray(hand)&&hand.length===21&&hand.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<10&&Math.abs(p.y)<10));
  }
  function latestLoader({load,apply,state}){
    let version=0;
    return {
      async run(file){
        const ticket=++version;
        state('loading');
        try{
          const image=await load(file);
          if(ticket!==version)return false;
          apply(image,file);
          state('ready');return true;
        }catch(error){
          if(ticket===version)state('error',error);
          return false;
        }
      },
      cancel(){version++;state('idle');}
    };
  }
  return {validHands,latestLoader};
});
