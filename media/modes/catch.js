window.modeHandelers[2] = (ctx, osu, time, delta)=>{
  let line = window.gameToScreenPixel(365, 'h');
  let radius = window.gameToScreenPixel(45-4.48*osu.CS); // TODO: Figure sizing for catch

  // Track
  window.gameplayData.dashframes = Math.min(Math.max(
    window.gameplayData.dashframes+(window.gameplayData.pressed.dash||0)*2-1,
  4), 16);
  ctx.fillStyle = '#fff'+window.gameplayData.dashframes.toString(16);
  ctx.fillRect(0, line-3, window.innerWidth, 6);

  // paddle & bumpers
  let paddleWidth = 150; // TODO: paddle width
  // TODO: paddle speed
  let paddleSpeed = (window.gameplayData.pressed.dash?2:1)*window.gameToScreenPixel(0.035)*delta;
  window.gameplayData.x = Math.min(Math.max(
    window.gameplayData.x + paddleSpeed *
    ((window.gameplayData.pressed?.right||0)-(window.gameplayData.pressed?.left||0))*
    delta,
  0), window.gameToScreenPixel(512)-paddleWidth);

  let paddlePad = window.gameToScreenPixel(0, 'w');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(paddlePad+window.gameplayData.x-32, line-5, 30, 10, 5);
  ctx.roundRect(paddlePad+window.gameplayData.x, line-12.5, paddleWidth, 25, 12.5);
  ctx.roundRect(paddlePad+window.gameplayData.x+paddleWidth+2, line-5, 30, 10, 5);
  ctx.fill();

  // Notes
  let comboColor = window.gameplayData.comboColor;
  for (let i=window.gameplayData.note; i<osu.objects.length; i++) {
    let obj = osu.objects[i];

    if (obj.newCombo) comboColor = (comboColor+1+obj.comboSkip)%osu.colors.combo.length;

    if (obj.time-time>line+radius) break;
    if (obj.time-time<line-window.innerHeight-radius) {
      window.gameplayData.note++;
      window.gameplayData.comboColor = comboColor;
      window.gameplayData.combo = 0;
      continue;
    }

    let x = window.gameToScreenPixel(obj.x, 'w')-radius;
    ctx.fillStyle = `rgb(${osu.colors.combo[comboColor]})`;
    ctx.beginPath();
    ctx.ellipse(x, time-obj.time+line, radius, radius, 0, 0, Math.PI*2);
    ctx.fill();

    if (Math.abs(obj.time-time)<10&&x>window.gameplayData.x+paddlePad&&x<window.gameplayData.x+paddlePad+paddleWidth) {
      window.gameplayData.note++;
      window.gameplayData.comboColor = comboColor;
      window.gameplayData.combo += 1;
    }
  }
};

window.modeInputHandelers[2] = (press, key)=>{
  window.gameplayData.pressed[key] = press;
};