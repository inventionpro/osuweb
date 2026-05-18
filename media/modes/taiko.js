window.modeHandelers[1] = (ctx, osu, time, delta)=>{
  let section = window.gameToScreenPixel(384/3);

  // Track
  ctx.fillStyle = '#000c';
  ctx.fillRect(0, section, window.innerWidth, section);

  // Notes
  osu.objects.forEach(obj=>{

    if (obj.time-time>2000) return;
    if (time-obj.time>100) return;

    let radius = section/(obj.hitsound.finish?3:4);
    let color = obj.hitsound.whistle||obj.hitsound.clap?'#009fee':'#ee0000';
    let y = section*1.5;

    ctx.strokeStyle = color;
    ctx.lineWidth = 7*(obj.hitsound.finish+1);
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.PI*2);
    ctx.stroke();

    ctx.fillStyle = color+'cc';
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.PI*2);
    ctx.fill();

    radius = radius/2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(obj.time-time, y, radius, radius, 0, 0, Math.PI*2);
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
  });
};

window.modeInputHandelers[1] = (press, key)=>{};