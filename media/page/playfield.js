const PlayfieldPage = document.getElementById('page-playfield');
const PFCanvas = PlayfieldPage.querySelector('canvas');
let PFCTX;
let PFRun = false;

window.modeHandelers = [];
window.modeInputHandelers = [];
window.gamplayData = {
  score: 0,
  combo: 0
};
window.gameplayConstants = {
  // Osu
  osu: {
    keybinds: {}
  },
  // Taiko
  taiko: {
    keybinds: {}
  },
  // Catch
  catch: {
    keybinds: {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      Shift: 'dash'
    }
  },
  // Mania
  mania: {
    keybinds: {}
  }
};
window.gameToScreenPixel = (p,_)=>p;

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
      // BG Image
      if (window.PFMapFileCache[evt.extra.file]&&!window.PFMapFileCache['-'+evt.extra.file]) window.PFMapFileCache['-'+evt.extra.file] = await createImageBitmap(new Blob([window.PFMapFileCache[evt.extra.file]]));
      PFCTX.drawImage(window.PFMapFileCache['-'+evt.extra.file], window.gameToScreenPixel(evt.extra.x), window.gameToScreenPixel(evt.extra.y), PFCanvas.width, PFCanvas.height);
    } else if (evt.type===2) {
      // Break
      if (time<evt.start||time>evt.extra.end) return;
      let remain = evt.extra.end-time;
      let size = 150*remain/(evt.extra.end-evt.start);
      PFCTX.fillStyle = 'white';
      PFCTX.beginPath();
      PFCTX.roundRect(window.gameToScreenPixel(256, 'w')-size, window.gameToScreenPixel(192, 'h')-5, size*2, 10, 5);
      PFCTX.fill();
      PFCTX.font = 'bold 40px Comfortaa, Arial, sans-serif';
      let txtmetric = PFCTX.measureText(Math.ceil(remain/1000));
      PFCTX.fillText(Math.ceil(remain/1000), window.gameToScreenPixel(256, 'w')-txtmetric.width/2, window.gameToScreenPixel(192, 'h')-30);
    }
  });

  // Debug
  PFCTX.fillStyle = 'black';
  PFCTX.fillRect(0, 0, 60, 22);
  PFCTX.fillStyle = 'white';
  PFCTX.font = '12px monospace';
  PFCTX.fillText((1000/delta).toFixed(0).padStart(2, '0')+'FPS', 2, 10);
  PFCTX.fillText(PFCanvas.width+'x'+PFCanvas.height, 2, 20);
  PFCTX.strokeStyle = 'red';
  PFCTX.strokeRect(window.gameToScreenPixel(0, 'w'), window.gameToScreenPixel(0, 'h'),
window.gameToScreenPixel(512), window.gameToScreenPixel(384));

  // Mode specific code & Schedule next frame
  window.modeHandelers[window.mode]?.(PFCTX, osu, time, delta);
  if (PFRun) requestAnimationFrame(()=>{PFUpdate(osu)});
}

function PFResize() {
  PFCanvas.width = window.innerWidth;
  PFCanvas.height = window.innerHeight;
  let lazymargin = 80;
  let w = window.innerWidth-lazymargin*2;
  let h = window.innerHeight-lazymargin*2;
  let pixel = Math.min(w/512, h/384);
  let wmargin = (window.innerWidth-512*pixel)/2;
  let hmargin = (window.innerHeight-384*pixel)/2;
  window.gameToScreenPixel = (p,type='')=>{
    if (type==='w') return p*pixel+wmargin;
    if (type==='h') return p*pixel+hmargin;
    return p*pixel;
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
    // Init game data
    if (window.mode===2) {
      window.gamplayData.x = 0;
      window.gamplayData.pressed = {};
      window.gamplayData.dashframes = 4;
    }
    // Input handeling
    if (window.modeInputHandelers[window.mode]) {
      const NumToMode = ['osu','taiko','catch','mania'];
      let keybind = window.gameplayConstants[NumToMode[window.mode]].keybinds;
      window.onkeydown = (evt)=>{
        if (!keybind[evt.key]) return;
        window.modeInputHandelers[window.mode](true, keybind[evt.key]);
      };
      window.onkeyup = (evt)=>{
        if (!keybind[evt.key]) return;
        window.modeInputHandelers[window.mode](false, keybind[evt.key]);
      };
    }
    // Start audio
    PFGetMapFile(osu.audioFile, osu.setid)
      .then(audioFile=>{
        let audio = new Audio(URL.createObjectURL(new Blob([audioFile], { type: 'audio/webm' })));
        document.body.appendChild(audio);
        audio.currentTime = osu.audioDelay;
        audio.oncanplay = ()=>{
          audio.play();
          if ('mediaSession' in navigator) {
            // Rich data for browsers
            navigator.mediaSession.metadata = new MediaMetadata({
              title: osu.title,
              artist: osu.artist,
              artwork: [
                {
                  src: `https://assets.ppy.sh/beatmaps/${osu.setid}/covers/list.jpg`,
                  sizes: '150x150',
                  type: 'image/jpeg',
                },
                {
                  src: `https://assets.ppy.sh/beatmaps/${osu.setid}/covers/list@2x.jpg`,
                  sizes: '300x300',
                  type: 'image/jpeg',
                }
              ]
            });
          }
          // Start notes
          PFStart = Date.now();
          PFLastTime = PFStart;
          PFUpdate(osu);
        };
      });
  };
}