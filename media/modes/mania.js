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
  for (let idx=0; idx<osu.CS; idx++) {
    ctx.fillStyle = darkenRGB(columnColor(idx, osu.CS), 0.8)+'cc'; // TODO: darken(3), how much is that? alpha is correct
    ctx.fillRect(left+track*idx+(osu.CS%2===1&&idx>Math.floor(osu.CS/2)?track:0), 0, track*(osu.CS%2===1&&idx===Math.floor(osu.CS/2)?2:1), window.innerHeight);
  }

  // Notes
  for (let i=window.gameplayData.note; i<osu.objects.length; i++) {
    let obj = osu.objects[i];

    if (time-obj.time<-50) break;
    if (time-obj.time>window.innerHeight) {
      window.gameplayData.note++;
      window.gameplayData.combo = 0;
      continue;
    }

    let idx = Math.floor(obj.x*osu.CS/512);
    ctx.fillStyle = columnColor(idx, osu.CS);
    ctx.fillRect(left+track*idx+(osu.CS%2===1&&idx>Math.floor(osu.CS/2)?track:0), time-obj.time, track*(osu.CS%2===1&&idx===Math.floor(osu.CS/2)?2:1), 20);
  }
};

window.modeInputHandelers[3] = (press, key)=>{};