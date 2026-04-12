window.modeHandelers[0] = (ctx, osu, time)=>{
  let combo = 0;
  osu.objects.forEach(obj=>{
    if (obj.newCombo) combo = (combo+1+obj.comboSkip)%osu.colors.combo.length;

    if (obj.time-time>1000) return;
    if (time-obj.time>200) return;

    PFCTX.fillStyle = `rgb(${osu.colors.combo[combo]})`;
    ctx.fillRect(...window.gameplayPixelToPos(obj.x, obj.y), 20, 20);
  });
};