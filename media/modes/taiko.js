window.modeHandelers[1] = (ctx, osu, time, delta)=>{
  let section = window.gameToScreenPixel(384/3);

  if (!window.gameplayData.swellGradient) {
    window.gameplayData.swellGradient = ctx.createLinearGradient(0, 0, 0, 100);
    window.gameplayData.swellGradient.addColorStop(0, '#f0c900');
    window.gameplayData.swellGradient.addColorStop(1, '#a78b00');
    window.gameplayData.sliderGradient = ctx.createLinearGradient(0, 0, 0, 100);
    window.gameplayData.sliderGradient.addColorStop(0, '#f1a100');
    window.gameplayData.sliderGradient.addColorStop(1, '#a76f00');
  }

  // Track
  ctx.fillStyle = '#000c';
  ctx.fillRect(0, section, window.innerWidth, section);

  // Notes
  for (let i=window.gameplayData.note; i<osu.objects.length; i++) {
    let obj = osu.objects[i];

    if (obj.time-time>window.innerWidth+section/3) break;
    if (obj.time-time<section/-3) {
      window.gameplayData.note++;
      window.gameplayData.combo = 0;
      continue;
    }

    let radius = section/(obj.hitsound.finish?3:4);
    let color = obj.type==='spinner'?window.gameplayData.swellGradient:(obj.hitsound.whistle||obj.hitsound.clap?'#009fee':'#ee0000');
    let y = section*1.5;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 7*(obj.hitsound.finish+1);
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.TAU);
    ctx.stroke();

    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    radius = radius/2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.TAU);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'butt';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(obj.time-time+radius/4, y-radius/2);
    ctx.lineTo(obj.time-time-radius/4, y);
    ctx.lineTo(obj.time-time+radius/4, y+radius/2);
    ctx.stroke();
  }
};

window.modeInputHandelers[1] = (press, key)=>{};