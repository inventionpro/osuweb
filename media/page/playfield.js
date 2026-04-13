const PlayfieldPage = document.getElementById('page-playfield');
const PFCanvas = PlayfieldPage.querySelector('canvas');
let PFCTX;
let PFRun = false;

window.modeHandelers = [];
window.gameplayConstants = {
  // Osu
  osu: {},
  // Taiko
  taiko: {},
  // Catch
  catch: {
    keybinds: {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      shift: 'dash'
    }
  },
  // Mania
  mania: {}
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
      if (window.PFMapFileCache[evt.extra.file]&&!window.PFMapFileCache['-'+evt.extra.file]) window.PFMapFileCache['-'+evt.extra.file] = await createImageBitmap(new Blob([window.PFMapFileCache[evt.extra.file]]));
      PFCTX.drawImage(window.PFMapFileCache['-'+evt.extra.file], window.gameToScreenPixel(evt.extra.x), window.gameToScreenPixel(evt.extra.y), PFCanvas.width, PFCanvas.height);
    }
  });

  // Debug
  PFCTX.fillStyle = 'white';
  PFCTX.fillText((1000/delta).toFixed(0)+'FPS', 2, 10);
  PFCTX.fillText(PFCanvas.width+'x'+PFCanvas.height, 2, 20);
  PFCTX.strokeStyle = 'red';
  PFCTX.strokeRect(window.gameToScreenPixel(0, 'w'), window.gameToScreenPixel(0, 'h'),
window.gameToScreenPixel(512), window.gameToScreenPixel(384));

  window.modeHandelers[window.mode]?.(PFCTX, osu, time);
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
    // Input handeling (todo)
    const NumToMode = ['osu','taiko','catch','mania'];
    window.onkeydown = (evt)=>{
      let keybind = window.gameplayConstants[NumToMode[window.mode]].keybinds;
      if (!keybind[evt.key] && !(evt.shiftKey&&keybind.shift)) return;
    };
    window.onkeyup = (evt)=>{
      let keybind = window.gameplayConstants[NumToMode[window.mode]].keybinds;
      if (!keybind[evt.key] && !(evt.shiftKey&&keybind.shift)) return;
    };
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