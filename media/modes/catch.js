window.modeHandelers[2] = (ctx, osu, time)=>{
  let combo = 0;
  let line = window.gameplayPixelToPos(0, 384)[1];
  osu.objects.forEach(obj=>{
    if (obj.newCombo) combo = (combo+1+obj.comboSkip)%osu.colors.combo.length;

    if (time-obj.time>10) return;

    PFCTX.fillStyle = `rgb(${osu.colors.combo[combo]})`;
    ctx.fillRect(window.gameplayPixelToPos(obj.x, 0)[0], time-obj.time+line, 20, 20);
  });
};