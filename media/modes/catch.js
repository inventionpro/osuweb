window.modeHandelers[2] = (ctx, osu, time)=>{
  let line = window.gameplayPixelToPos(0, 384)[1];

  PFCTX.fillStyle = `#fff4`;
  ctx.fillRect(0, line-3, window.innerWidth, 6);

  // Bumper 30x10
  // Padle 245x26

  let combo = 0;
  osu.objects.forEach(obj=>{
    if (obj.newCombo) combo = (combo+1+obj.comboSkip)%osu.colors.combo.length;

    if (obj.time-time>window.innerHeight) return;
    if (time-obj.time>window.innerHeight-line) return;

    PFCTX.fillStyle = `rgb(${osu.colors.combo[combo]})`;
    ctx.fillRect(window.gameplayPixelToPos(obj.x, 0)[0], time-obj.time+line, 20, 20);
  });
};