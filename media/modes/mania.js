function columnColor(idx, total) {
  if (total<=10) return window.gameplayConstants.mania.colors[[
    [],
    ['yellow'],
    ['green','cyan'],
    ['green','special','cyan'],
    ['yellow','orange','pink','purple'],
    ['pink','orange','yellow','green','cyan'],
    ['pink','orange','green','cyan','orange','pink'],
    ['pink','orange','pink','special','pink','orange','pink'],
    ['purple','pink','orange','green','cyan','orange','pink','purple'],
    ['purple','pink','orange','yellow','special','yellow','orange','pink','purple'],
    ['purple','pink','orange','yellow','green','cyan','yellow','orange','pink','purple']
  ][total][idx]];
  if (total%2===1&&idx===Math.floor(total/2)) return window.gameplayConstants.mania.colors.special;
  return window.gameplayConstants.mania.colors[['yellow','orange','pink','purple','cyan','green'][idx%6]];
}

window.modeHandelers[3] = (ctx, osu, time, delta)=>{
  let track = window.gameplayConstants.mania.trackWidth;
  let left = window.innerWidth/2-Math.ceil(osu.CS/2)*track;

  // Tracks
  for (let i=0; i<osu.CS; i++) {
    ctx.fillStyle = darkenRGB(columnColor(i, osu.CS), 0.8)+'cc'; // TODO: darken(3), how much is that? alpha is correct
    ctx.fillRect(left+track*i+(osu.CS%2===1&&i>Math.floor(osu.CS/2)?track:0), 0, track*(osu.CS%2===1&&i===Math.floor(osu.CS/2)?2:1), window.innerHeight);
  }

  // Notes
  osu.objects.forEach(obj=>{
    if (obj.time-time>100) return;
    if (time-obj.time>window.innerHeight) return;

    let i = Math.floor(obj.x*osu.CS/512);
    ctx.fillStyle = columnColor(i, osu.CS);
    ctx.fillRect(left+track*i+(osu.CS%2===1&&i>Math.floor(osu.CS/2)?track:0), time-obj.time, track*(osu.CS%2===1&&i===Math.floor(osu.CS/2)?2:1), 20);
  });
};

window.modeInputHandelers[3] = (press, key)=>{};