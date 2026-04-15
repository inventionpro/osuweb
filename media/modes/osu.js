window.modeHandelers[0] = (ctx, osu, time)=>{
  let comboColor = 0;
  osu.objects.forEach(obj=>{
    if (obj.newCombo) comboColor = (comboColor+1+obj.comboSkip)%osu.colors.combo.length;

    if (obj.time-time>1000) return;
    if (time-obj.time>200) return;

    ctx.fillStyle = `rgb(${osu.colors.combo[comboColor]})`;
    let radius = window.gameToScreenPixel((54.4 - 4.48 * osu.CS) * 1.00041);

    ctx.beginPath();
    ctx.ellipse(window.gameToScreenPixel(obj.x, 'w')-radius, window.gameToScreenPixel(obj.y, 'h')-radius,
      radius, radius, 0, 0, Math.PI*2);
    ctx.fill();
  });
};