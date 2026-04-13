window.modeHandelers[2] = (ctx, osu, time)=>{
  let line = window.gameToScreenPixel(384, 'h');

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
    let radius = window.gameToScreenPixel(osu.CS+2); // TODO: Figure sizing for catch

    ctx.beginPath();
    ctx.ellipse(window.gameToScreenPixel(obj.x, 'w')-radius, time-obj.time+line,
      radius, radius, 0, 0, Math.PI*2);
    ctx.fill();
  });
};