window.modeHandelers[0] = (ctx, osu, time)=>{
  let comboColor = 0;
  let comboNum = 0;
  osu.objects.forEach(obj=>{
    comboNum++;
    if (obj.newCombo) {
      comboNum = 1;
      comboColor = (comboColor+1+obj.comboSkip)%osu.colors.combo.length;
    }

    if (obj.time-time>1000) return;
    if (time-obj.time>200) return;

    let radius = window.gameToScreenPixel((54.4 - 4.48 * osu.CS) * 1.00041);
    let w = window.gameToScreenPixel(obj.x, 'w');
    let h = window.gameToScreenPixel(obj.y, 'h');
    let ellipse = ()=>{
      ctx.ellipse(w, h, radius, radius, 0, 0, Math.PI*2);
    };

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ellipse();
    ctx.fill();
    radius -= 5;
    ctx.fillStyle = `rgb(${darkenRGB(osu.colors.combo[comboColor], 0.15)})`;
    ctx.beginPath();
    ellipse();
    ctx.fill();
    radius -= 5;
    ctx.fillStyle = `rgb(${osu.colors.combo[comboColor]})`;
    ctx.beginPath();
    ellipse();
    ctx.fill();
    radius -= 12;
    ctx.fillStyle = `rgb(${darkenRGB(osu.colors.combo[comboColor], 0.5)})`;
    ctx.beginPath();
    ellipse();
    ctx.fill();
    radius -= 12;
    ctx.fillStyle = `rgb(${darkenRGB(osu.colors.combo[comboColor], 0.15)})`;
    ctx.beginPath();
    ellipse();
    ctx.fill();
    ctx.fillStyle = '#fff';
    PFCTX.font = 'bolder 40px Comfortaa, Arial, sans-serif';
    let txtmetric = PFCTX.measureText(comboNum.toString());
    PFCTX.fillText(comboNum.toString(), w-txtmetric.width/2, h+15);

    // TODO: Actual aproach circle speed
    radius += 31.5 + Math.max((obj.time-time)/25, 0);
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(${osu.colors.combo[comboColor]},${1-((obj.time-time)/1000)})`;
    ctx.beginPath();
    ellipse();
    ctx.stroke();
  });
};