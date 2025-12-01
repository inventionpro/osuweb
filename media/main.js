// Beatmaps
let BMirror = Mino;
Mino.health()
  .catch(_=>{
    BMirror = Nerinyan;
  });

// Pages
const MainPage = document.getElementById('page-main');

function changePage(page) {}

window.mmodalopen = false;
function openMModal(id) {
  window.mmodalopen = true;
  document.getElementById(id).style.height = '';
  document.getElementById(id).show();
  document.getElementById(id).onclose = ()=>{
    window.mmodalopen = false;
    document.getElementById(id).style.height = '';
  };
  setTimeout(()=>{
    document.getElementById(id).style.height = 'calc(100dvh - var(--nav-size))';
  }, 50);
  switch(id) {
    case 'explore':
      let textin = document.getElementById('explore-search');
      let search = ()=>{
        BMirror.search(textin.value, 3*17, 0, {
          mode: document.querySelector('input[name="mode"]:checked').value,
          cat: document.querySelector('input[name="cat"]:checked').value
        })
          .then(res=>{
            let rankedOpts = {year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'};
            document.getElementById('explore-res').innerHTML = res
              .map(b=>`<div>
  <img src="${b.cover}" width="100" height="100" loading="lazy">
  <div class="info" style="--cover:url(${b.cover})">
    <b>${b.title}</b>
    <span>by ${b.artist}</span>
    <span style="flex:1"></span>
    <div class="stats">
      <span>H ${b.favs} P ${b.plays} D ${(new Date(b.ranked)).toLocaleDateString(navigator,rankedOpts)}</span>
    </div>
    <div>
      <span>${b.status}</span>
    </div>
  </div>
  <div class="down">
    <button>DV</button>
    ${b.video?`<button>DN</button>`:''}
  </div>
</div>`)
              .join('');
          });
      };
      textin.onchange = search;
      search();
      break;
  }
}
window.openMModal = openMModal;

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
    changePage('play');
    return;
  }
  document.querySelector('#page-main .menu').classList.remove('hidden');
  document.querySelector('#page-main .menu').removeAttribute('inert');
  document.getElementById('topbar').classList.remove('hidden');
  document.getElementById('topbar').removeAttribute('inert');
  (new Audio('assets/sounds/osu-logo-select.wav')).play();
}
function closesubmenu() {
  if (document.querySelector('#page-main .menu').classList.contains('hidden')) return;
  if (window.mmodalopen) {
    if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
    SBGunfocustimeout = setTimeout(closesubmenu, BGMainUnfocusTimeout);
    return;
  }
  document.querySelector('#page-main .menu').classList.add('hidden');
  document.querySelector('#page-main .menu').setAttribute('inert','');
  document.getElementById('topbar').classList.add('hidden');
  document.getElementById('topbar').setAttribute('inert','');
  (new Audio('assets/sounds/back-to-logo.wav')).play();
}
document.querySelector('#page-main .logo').onclick = opensubmenu;
document.body.onkeydown = (evt)=>{
  if (evt.key===' '||evt.key==='Enter'){ opensubmenu() }
  else if (evt.key==='Escape'){ closesubmenu() }
};