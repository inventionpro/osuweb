const PlayfieldPage = document.getElementById('page-playfield');
const PFCanvas = PlayfieldPage.querySelector('canvas');
let PFCTX;
let PFRun = false;

window.modeHandelers = [];
window.gameplayConstants = {
  keybinds: {
    catchLeft: 'ArrowLeft',
    catchRight: 'ArrowRight',
    catchDash: 'shift'
  },
  // Osu
  osu: {},
  // Taiko
  taiko: {},
  // Catch
  catch: {},
  // Mania
  mania: {}
};
window.gameplayPixelToPos = (x,y,_)=>[x, y];

window.PFMapFileCache = {};
async function PFGetMapFile(name, id) {
  return new Promise((resolve, reject)=>{
    if (window.PFMapFileCache[name]) resolve(window.PFMapFileCache[name]);
    let tx = db.transaction(['mapsetfiles'], 'readonly');
    let filestore = tx.objectStore('mapsetfiles');
    let filereq = filestore.get(id+'-'+name);
    filereq.onsuccess = ()=>{
      window.PFMapFileCache[name] = filereq.result;
      resolve(filereq.result);
    };
    filereq.onerror = ()=>{
      reject();
    };
  });
}

let PFStart;
let PFLastTime;
async function PFUpdate(osu) {
  // Clear
  PFCTX.clearRect(0, 0, PFCanvas.width, PFCanvas.height);
  // Time
  let now = Date.now();
  let time = now-PFStart;
  let delta = now-PFLastTime;
  PFLastTime = now;

  // Events
  let events = osu.events.filter(event=>time>event.start);
  events.forEach(async(evt)=>{
    if (evt.type===0) {
      if (window.PFMapFileCache[evt.extra.file]&&!window.PFMapFileCache['-'+evt.extra.file]) window.PFMapFileCache['-'+evt.extra.file] = await createImageBitmap(new Blob([window.PFMapFileCache[evt.extra.file]]));
      PFCTX.drawImage(window.PFMapFileCache['-'+evt.extra.file], ...window.gameplayPixelToPos(evt.extra.x, evt.extra.y, 'm'), PFCanvas.width, PFCanvas.height);
    }
  });

  // Debug
  PFCTX.fillStyle = 'white';
  PFCTX.fillText((1000/delta).toFixed(0)+'FPS', 2, 10);
  PFCTX.fillText(PFCanvas.width+'x'+PFCanvas.height, 2, 20);
  PFCTX.strokeStyle = 'red';
  PFCTX.strokeRect(...window.gameplayPixelToPos(0, 0), ...window.gameplayPixelToPos(512, 384, 'm'));

  window.modeHandelers[window.mode]?.(PFCTX, osu, time);
  if (PFRun) requestAnimationFrame(()=>{PFUpdate(osu)});
}

function PFResize() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  PFCanvas.width = w;
  PFCanvas.height = h;
  let margin = 100;
  let ws = (w-margin*2)/512;
  let hs = (h-margin*2)/384;
  window.gameplayPixelToPos = (x,y,type='')=>{
    if (type==='m') return [x*ws, y*hs];
    return [x*ws+margin, y*hs+margin];
  };
}

function playMap(id) {
  PFMapFileCache = {};
  PFRun = false;
  let tx = db.transaction(['map'], 'readonly');
  let mapstore = tx.objectStore('map');
  let mapreq = mapstore.get(id);
  mapreq.onsuccess = async()=>{
    let osu = parseOsu(mapreq.result);
    console.log(osu);
    for (let i=0; i<osu.events.length; i++) {
      // Preload bg and video files
      if ([0,1].includes(osu.events[i].type)) await PFGetMapFile(osu.events[i].extra.file, osu.setid);
    };
    PFCTX = PFCanvas.getContext('2d');
    PFRun = true;
    PFResize();
    window.onresize = PFResize;
    // Start audio
    PFGetMapFile(osu.audioFile, osu.setid)
      .then(audioFile=>{
        let audio = new Audio(URL.createObjectURL(new Blob([audioFile], { type: 'audio/webm' })));
        document.body.appendChild(audio);
        audio.currentTime = osu.audioDelay;
        audio.oncanplay = ()=>{
          audio.play();
          // Start notes
          PFStart = Date.now();
          PFLastTime = PFStart;
          PFUpdate(osu);
        };
      });
  };
}