window.modeHandelers[2] = (ctx, osu, time, delta)=>{
  let line = window.gameToScreenPixel(384, 'h');

  // Track
  window.gamplayData.dashframes = Math.min(Math.max(
    window.gamplayData.dashframes+(window.gamplayData.pressed.dash||0)*2-1,
  4), 16);
  ctx.fillStyle = '#fff'+window.gamplayData.dashframes.toString(16);
  ctx.fillRect(0, line-3, window.innerWidth, 6);

  // paddle & bumpers
  let paddleWidth = 150; // TODO: paddle width
  window.gamplayData.x = Math.min(Math.max(
    window.gamplayData.x + window.gameToScreenPixel(0.35)*
    ((window.gamplayData.pressed?.right||0)-(window.gamplayData.pressed?.left||0))*
    delta,
  0), window.gameToScreenPixel(512)-paddleWidth);

  let paddlePad = window.gameToScreenPixel(0, 'w');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(paddlePad+window.gamplayData.x-32, line-5, 30, 10, 5);
  ctx.roundRect(paddlePad+window.gamplayData.x, line-12.5, paddleWidth, 25, 12.5);
  ctx.roundRect(paddlePad+window.gamplayData.x+paddleWidth+2, line-5, 30, 10, 5);
  ctx.fill();

  // Notes
  let comboColor = 0;
  osu.objects.forEach(obj=>{
    if (obj.newCombo) comboColor = (comboColor+1+obj.comboSkip)%osu.colors.combo.length;

    if (obj.time-time>window.innerHeight) return;
    if (time-obj.time>window.innerHeight-line) return;

    ctx.fillStyle = `rgb(${osu.colors.combo[comboColor]})`;
    let radius = window.gameToScreenPixel(45-4.48*osu.CS); // TODO: Figure sizing for catch

    ctx.beginPath();
    ctx.ellipse(window.gameToScreenPixel(obj.x, 'w')-radius, time-obj.time+line,
      radius, radius, 0, 0, Math.PI*2);
    ctx.fill();
  });
};

window.modeInputHandelers[2] = (press, key)=>{
  window.gamplayData.pressed[key] = press;
};