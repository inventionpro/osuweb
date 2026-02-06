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
  // Taiko
  // Catch
  catch: {}
  // Mania
};

window.PFMapFileCache = {};
async function PFGetMapFile(name, id) {
  return new Promise((resolve, reject)=>{
    if (window.PFMapFileCache[name]) resolve(window.PFMapFileCache[name]);
    let tx = db.transaction(['mapsetfiles'], 'readonly');
    let filestore = tx.objectStore('mapsetfiles');
    let filereq = filestore.get(id+'-'+name);
    filereq.onsuccess = ()=>{
      window.PFMapFileCache[name] = filereq.result;
      resolve();
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
      PFCTX.drawImage(window.PFMapFileCache['-'+evt.extra.file], evt.extra.x, evt.extra.y, PFCanvas.width, PFCanvas.height);
    }
  });
  // Game pixels: 512x384

  // Debug
  PFCTX.fillStyle = 'white';
  PFCTX.fillText((1000/delta).toFixed(0)+'FPS', 2, 10);
  PFCTX.fillText(PFCanvas.width+'x'+PFCanvas.height, 2, 20);

  window.modeHandelers[window.mode]();
  if (PFRun) requestAnimationFrame(()=>{PFUpdate(osu)});
}

function PFResize() {
  PFCanvas.width = window.innerWidth;
  PFCanvas.height = window.innerHeight;
}

function playMap(id) {
  PFMapFileCache = {};
  PFRun = false;
  let tx = db.transaction(['map'], 'readonly');
  let mapstore = tx.objectStore('map');
  let mapreq = mapstore.get(id);
  mapreq.onsuccess = async()=>{
    let osu = parseOsu(mapreq.result);
    for (let i=0; i<osu.events.length; i++) {
      // Preload bg and video files
      if ([0,1].includes(osu.events[i].type)) await PFGetMapFile(osu.events[i].extra.file, osu.setid);
    };
    PFCTX = PFCanvas.getContext('2d');
    PFRun = true;
    PFStart = Date.now();
    PFLastTime = PFStart;
    PFResize();
    window.onresize = PFResize;
    PFUpdate(osu);
  };
}