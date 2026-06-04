const PlayfieldPage = document.getElementById('page-playfield');
const PFCanvas = PlayfieldPage.querySelector('canvas');
let PFCTX;
let PFRun = false;

window.modeHandelers = [];
window.modeInputHandelers = [];
window.gameplayData = {};
window.gameplayConstants = {
  // Osu
  osu: {
    keybinds: {},
    comboManiaStyle: false
  },
  // Taiko
  taiko: {
    keybinds: {},
    comboManiaStyle: false
  },
  // Catch
  catch: {
    keybinds: {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      Shift: 'dash'
    },
    comboManiaStyle: false
  },
  // Mania
  mania: {
    keybinds: {
      '1k': {
        '1': ' '
      },
      '2k': {
        '1': 'f',
        '2': 'j'
      },
      '3k': {
        '1': 'f',
        '2': ' ',
        '3': 'j'
      },
      '4k': {
        '1': 'd',
        '2': 'f',
        '3': 'j',
        '4': 'k'
      },
      '5k': {
        '1': 'd',
        '2': 'f',
        '3': ' ',
        '4': 'j',
        '5': 'k'
      },
      '6k': {
        '1': 's',
        '2': 'd',
        '3': 'f',
        '4': 'j',
        '5': 'k',
        '6': 'l'
      },
      '7k': {
        '1': 's',
        '2': 'd',
        '3': 'f',
        '4': ' ',
        '5': 'j',
        '6': 'k',
        '7': 'l'
      },
      '8k': {
        '1': 'a',
        '2': 's',
        '3': 'd',
        '4': 'f',
        '5': 'j',
        '6': 'k',
        '7': 'l',
        '8': 'ñ'
      }
      // TODO: Handle oob keys ^, add 9k 10k and n+n
    },
    comboManiaStyle: true,
    trackWidth: 80,
    colors: {
      special: '#a96aff',
      yellow: '#ffc528',
      orange: '#fc6d01',
      pink: '#d5235a',
      purple: '#cb3cec',
      cyan: '#48c6ff',
      green: '#64c05c'
    }
  }
};
const NumToMode = ['osu','taiko','catch','mania'];
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
    filereq.onerror = reject;
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

  // Mode specific code
  window.modeHandelers[window.mode]?.(PFCTX, osu, time, delta);

  // Combo number
  if (window.gameplayConstants[NumToMode[window.mode]].comboManiaStyle) {
    PFCTX.fillStyle = '#fff';
    PFCTX.font = 'bold 32px Comfortaa, Arial, sans-serif';
    let txtmetric = PFCTX.measureText(window.gameplayData.combo);
    PFCTX.fillText(window.gameplayData.combo, window.innerWidth/2-txtmetric.width/2, window.innerHeight/4);
  } else {
    PFCTX.fillStyle = '#9ae5f8';
    PFCTX.font = 'bold 12px Comfortaa, Arial, sans-serif';
    PFCTX.fillText('COMBO', 40, window.innerHeight-110);
    PFCTX.fillStyle = '#fff';
    PFCTX.font = 'bold 32px Comfortaa, Arial, sans-serif';
    PFCTX.fillText(window.gameplayData.combo+'x', 40, window.innerHeight-80);
  }

  // Time bar
  PFCTX.fillStyle = '#fff4';
  PFCTX.beginPath();
  PFCTX.roundRect(60, window.innerHeight-20, window.innerWidth-120, 10, 5);
  PFCTX.fill();
  PFCTX.fillStyle = '#fff';
  PFCTX.beginPath();
  PFCTX.roundRect(60, window.innerHeight-20, time/osu.duration*(window.innerWidth-120), 10, 5);
  PFCTX.fill();
  PFCTX.font = 'bold 16px Comfortaa, Arial, sans-serif';
  let txtmetric = PFCTX.measureText(formatTimeS(Math.ceil(osu.duration/1000)));
  PFCTX.fillText(formatTimeS(Math.floor(time/1000)), 60, window.innerHeight-35);
  PFCTX.fillText(formatTimeS(Math.ceil(osu.duration/1000)), window.innerWidth-60-txtmetric.width, window.innerHeight-35);

  // Debug
  PFCTX.fillStyle = 'black';
  PFCTX.fillRect(0, 0, 45, 12);
  PFCTX.fillStyle = 'white';
  PFCTX.font = '12px monospace';
  PFCTX.fillText((1000/delta).toFixed(0).padStart(2, '0')+'FPS', 2, 10);

  // Schedule next frame
  if (time>osu.duration) {
    PFRun = false;
    // TODO: Results screen
    changePage('bmselect');
  }
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
    window.gameplayData = {
      note: 0,
      comboColor: 0,
      score: 0,
      combo: 0
    };
    if (window.mode===0) {
      window.gameplayData.comboNum = 0;
    } else if (window.mode===2) {
      window.gameplayData.x = 0;
      window.gameplayData.pressed = {};
      window.gameplayData.dashframes = 4;
    }
    // Input handeling
    if (window.modeInputHandelers[window.mode]) {
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
        audio.onended = ()=>{
          audio.remove();
        };
      });
  };
}