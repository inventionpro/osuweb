// Beatmaps
let BMirror = Mino;
Mino.health()
  .catch(_=>{
    BMirror = Nerinyan;
  });

// Indexed DB
let dbRequest = indexedDB.open('data', 1);
dbRequest.onupgradeneeded = (evt)=>{
  let db = evt.target.result;
  if (!db.objectStoreNames.contains('mapset')) db.createObjectStore('mapset');
  if (!db.objectStoreNames.contains('map')) db.createObjectStore('map');
  if (!db.objectStoreNames.contains('mapsetfiles')) db.createObjectStore('mapsetfiles');
};
dbRequest.onsuccess = (evt)=>{
  window.db = evt.target.result;
};

// Pages & Modals
let currentPage = 'main';
function changePage(page) {
  document.querySelectorAll('[data-page]').forEach(p=>p.style.display='none');
  document.getElementById('page-'+page).style.display = '';
  showTopBar(true);
  currentPage = page;
}

window.mmodalopen = false;
function openMModal(mid) {
  window.mmodalopen = true;
  let modal = document.getElementById(mid);
  modal.style.height = '';
  modal.show();
  modal.onclose = ()=>{
    window.mmodalopen = false;
    modal.style.height = '';
  };
  setTimeout(()=>{
    modal.style.height = 'calc(100dvh - var(--nav-size))';
  }, 50);
  switch(mid) {
    case 'explore':
      let textin = document.getElementById('explore-search');
      let BDownload = async(id, _this=null, video=true)=>{
        let file = await BMirror.download(id, video);
        file = new Uint8Array(file);
        fflate.unzip(file, (err, files) => {
          if (err) {
            alert('Could not load beatmap');
            return;
          }
          let tx = db.transaction(['mapset','map','mapsetfiles'], 'readwrite');
          let setstore = tx.objectStore('mapset');
          let mapstore = tx.objectStore('map');
          let filestore = tx.objectStore('mapsetfiles');
          setstore.put(BMSCache.get(Number(id)), id);
          Object.entries(files)
            .forEach((file)=>{
              if (file[0].endsWith('.osu')) {
                let decode = new TextDecoder().decode(file[1].buffer);
                mapstore.put(decode, parseOsuID(decode));
              } else {
                filestore.put(file[1], id+'-'+file[0]);
              }
            });
          tx.oncomplete = ()=>{
            if (!_this) return;
            _this.parentElement.setAttribute('downloaded','');
          };
        });
      }
      window.BDownload = BDownload;
      let audio;
      let last;
      let timr;
      const playicon = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M29 26.263C29 14.6537 41.6216 7.44498 51.6209 13.3432L224.097 115.08C233.936 120.884 233.936 135.116 224.097 140.92L51.6209 242.657C41.6216 248.555 29 241.346 29 229.737V26.263Z"></path></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" data-stop><rect width="256" height="256" rx="20"/></svg>'
      ];
      let BPreview = (id,_this)=>{
        let destroy = ()=>{
          clearInterval(timr);
          modal.removeEventListener('close', destroy);
          audio.remove();
          audio = null;
          last.innerHTML = playicon[0];
          last = null;
        };
        if (audio) {
          let stop = _this===last;
          destroy();
          if (stop) return;
        }
        last = _this;
        last.innerHTML = playicon[1];
        last.style.setProperty('--perc', 0);
        audio = document.createElement('audio');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audio.src = `https://b.ppy.sh/preview/${id}.mp3`;
        audio.onended = destroy;
        modal.addEventListener('close', destroy);
        audio.play();
        timr = setInterval(()=>{
          last.style.setProperty('--perc', audio.currentTime/audio.duration);
        }, 10);
      };
      window.BPreview = BPreview;
      let showResults = (res,has)=>{
        let rankedOpts = {year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'};
        document.getElementById('explore-res').innerHTML = res
          .map(b=>`<div>
  <img src="${b.cover}" width="108" height="100" onerror="this.style.opacity=0" loading="lazy">
  <div class="preview" role="button" onclick="window.BPreview('${b.id}',this)">${playicon[0]}</div>
  <div class="info" style="--cover:url(${b.cover})">
    <b>${b.title}</b>
    <span style="font-size:85%">by ${b.artist}</span>
    <span style="font-size:75%;color:#dae8ef;">mapped by ${b.mappers.join(', ')}</span>
    <span style="flex:1"></span>
    <div class="stats">
      <span>H ${b.favs} P ${b.plays} D ${(new Date(b.ranked)).toLocaleDateString(navigator,rankedOpts)}</span>
    </div>
    <div class="binfo">
      <span class="badge" style="--color:${statusColors[b.status]}">${b.status}</span>
      ${b.beatmaps.map(t=>{
        if (t.length<1) return '';
        return `<img src="assets/icons/ruleset-${['osu','taiko','catch','mania'][t[0].mode]}.svg">
${t.map(bb=>`<span class="diff" style="--color:${difficultySpectrum(bb.difficulty).hex()}"></span>`).join('')}`;
      }).join('')}
    </div>
  </div>
  <div class="down"${has.includes(b.id.toString())?' downloaded':''}>
    <button onclick="window.BDownload('${b.id}', this)" aria-label="Download"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M128 190V20" stroke-width="40" stroke-linecap="round" fill="none"/><path d="M127.861 212.999C131.746 213.035 135.642 211.571 138.606 208.607L209.317 137.896C212.291 134.922 213.753 131.011 213.708 127.114C213.708 127.076 213.71 127.038 213.71 127C213.71 118.716 206.994 112 198.71 112H57C48.7157 112 42 118.716 42 127C42 127.045 42.0006 127.089 42.001 127.134C41.961 131.024 43.4252 134.927 46.3936 137.896L117.104 208.607L117.381 208.876C120.312 211.662 124.092 213.037 127.861 212.999Z"/><rect y="226" width="256" height="30" rx="15"/></svg></button>
    ${b.video?`<button onclick="window.BDownload('${b.id}', this, false)" aria-label="Download without video"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M170 43.002C181.046 43.002 190 51.9563 190 63.002V81.4864C190 82.782 191.213 83.7357 192.472 83.4299L246.112 70.4033C251.148 69.1805 256 72.9955 256 78.1777V177.656C256 182.892 251.054 186.716 245.987 185.398L192.503 171.492C191.237 171.162 190 172.118 190 173.427V193.002C190 204.048 181.046 213.002 170 213.002H20C8.95431 213.002 4.02687e-08 204.048 0 193.002V63.002C0 51.9563 8.95431 43.002 20 43.002H170Z"/><path d="M58 235.002L198 20.002" stroke-width="40" stroke-linecap="round" fill="none"/></svg></button>`:''}
  </div>
</div>`)
          .join('');
      };
      let search = ()=>{
        let tx = db.transaction(['mapset'], 'readonly');
        let setstore = tx.objectStore('mapset');
        let setreq = setstore.getAllKeys();
        setreq.onsuccess = ()=>{
          BMirror.search(textin.value, 3*4*5, 0, {
            mode: document.querySelector('input[name="mode"]:checked').value,
            cat: document.querySelector('input[name="cat"]:checked').value
          })
            .then(res=>{showResults(res, setreq.result)});
        };
      };
      textin.onchange = search;
      textin.onkeyup = (evt)=>{if(evt.key==='Enter')search()};
      search();
      break;
  }
}
window.openMModal = openMModal;

// Mode select
window.mode = 0;
document.querySelectorAll('.modes button')
  .forEach(btn=>{
    btn.onclick = ()=>{
      let mode = Number(btn.getAttribute('data-mode'));
      if (window.mode===mode) return;
      window.mode = mode;
      document.querySelector('.modes button[selected]').removeAttribute('selected');
      btn.setAttribute('selected', true);
      (new Audio(`assets/sounds/select-${btn.getAttribute('data-name')}.wav`)).play();
    };
  });

function showTopBar(show) {
  document.getElementById('topbar').classList[show?'remove':'add']('hidden');
  document.getElementById('topbar')[show?'removeAttribute':'setAttribute']('inert','');
}

/* -- Main Page -- */
const MainPage = document.getElementById('page-main');

// Seasonal main backgrounds
const BGMainChangeInterval = 3 * 60 * 1000; // 3 Minutes
const BGMainUnfocusTimeout = 6 * 1000; // 6 Seconds
window.sbgs = [];
let LastBgIndex = 0;
let SBGcache = new Map();
function newSeasonalBg() {
  if (window.sbgs.length<1) return;
  let rand = LastBgIndex;
  while (rand===LastBgIndex&&window.sbgs.length>1) {
    rand = Math.floor(Math.random()*window.sbgs.length);
  }
  let url = window.sbgs[rand].url;
  if (SBGcache.has(url)) {
    MainPage.style.backgroundImage = `url(${SBGcache.get(url)})`;
  } else {
    proxyfetch(url, undefined, true, 'blob')
      .then(res=>{
        SBGcache.set(url, URL.createObjectURL(res));
        MainPage.style.backgroundImage = `url(${SBGcache.get(url)})`;
      })
  }
}
proxyfetch('https://osu.ppy.sh/api/v2/seasonal-backgrounds')
  .then(res=>{
    window.sbgs = res.backgrounds;
    newSeasonalBg();
    setInterval(()=>{
      newSeasonalBg();
    }, BGMainChangeInterval);
  });
let SBGunfocustimeout = null;
MainPage.onpointermove = (evt)=>{
  if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
  let x = (evt.clientX/window.innerWidth)*10;
  let y = (evt.clientY/window.innerHeight)*10;
  MainPage.style.backgroundPosition = `calc(50% + ${x.toFixed(2)}px) calc(50% + ${y.toFixed(2)}px)`;
  SBGunfocustimeout = setTimeout(closesubmenu, BGMainUnfocusTimeout);
};

// Click logo
function opensubmenu() {
  if (!document.querySelector('#page-main .menu').classList.contains('hidden')) {
    changePage('bmselect');
    return;
  }
  document.querySelector('#page-main .menu').classList.remove('hidden');
  document.querySelector('#page-main .menu').removeAttribute('inert');
  showTopBar(true);
  (new Audio('assets/sounds/osu-logo-select.wav')).play();
}
function closesubmenu() {
  if (document.querySelector('#page-main .menu').classList.contains('hidden')) return;
  if (changePage!=='main') {
    if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
    return;
  }
  if (window.mmodalopen) {
    if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
    SBGunfocustimeout = setTimeout(closesubmenu, BGMainUnfocusTimeout);
    return;
  }
  document.querySelector('#page-main .menu').classList.add('hidden');
  document.querySelector('#page-main .menu').setAttribute('inert','');
  showTopBar(false);
  (new Audio('assets/sounds/back-to-logo.wav')).play();
}
document.querySelector('#page-main .logo').onclick = opensubmenu;
document.body.addEventListener('keydown', (evt)=>{
  if (currentPage!=='main'||window.mmodalopen) return;
  if (evt.key===' '||evt.key==='Enter'){ opensubmenu() }
  else if (evt.key==='Escape'){ closesubmenu() }
});